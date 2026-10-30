const { pool, query, queryOne, queryAll } = require("../config/clearingDb");
const { oracledb, getOracleConnection } = require("../config/oracleDb");

/**
 * 1. Jadval mavjudligini ta'minlash (Natijalar jadvali)
 */
async function initAnalysisTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS suspect_cards_analysis (
      id SERIAL PRIMARY KEY,
      oper_day DATE NOT NULL,
      acc_id BIGINT NOT NULL,
      client_code VARCHAR(30),
      card_number VARCHAR(32),
      account_code VARCHAR(20),
      pinfl VARCHAR(14),
      age INT,
      total_transactions INT,
      debit_count INT,
      debit_sum NUMERIC(18, 2),
      credit_count INT,
      credit_sum NUMERIC(18, 2),
      analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_oper_card UNIQUE(oper_day, acc_id)
    );
  `);
}

/**
 * 2. Postgres'ga tranzaksiyalarni UNNEST orqali o'ta tez yuklash (5 000 tadan)
 */
async function bulkInsertTransactions(pgClient, rows) {
  if (!rows || rows.length === 0) return;

  const acc_ids = [];
  const lead_ids = [];
  const account_codes = [];
  const account_cos = [];
  const oper_days = [];
  const debits = [];
  const credits = [];
  const pay_purposes = [];

  for (const r of rows) {
    acc_ids.push(r[0]);
    lead_ids.push(r[1]);
    account_codes.push(r[2]);
    account_cos.push(r[3]);
    oper_days.push(r[4]);
    debits.push(r[5] || 0);
    credits.push(r[6] || 0);
    pay_purposes.push(r[7] || null);
  }

  const sql = `
    INSERT INTO staging_transactions (
      acc_id, lead_id, account_code, account_co, oper_day, debit, credit, pay_purpose
    )
    SELECT * FROM UNNEST(
      $1::bigint[],
      $2::bigint[],
      $3::varchar[],
      $4::varchar[],
      $5::date[],
      $6::numeric[],
      $7::numeric[],
      $8::text[]
    )
  `;

  await pgClient.query(sql, [
    acc_ids, lead_ids, account_codes, account_cos, oper_days, debits, credits, pay_purposes
  ]);
}

/**
 * 3. Asosiy Pipeline: Yuklash -> Tahlil -> Natijani saqlash -> Truncate
 */
async function runCardAnalysisPipeline() {
  const startTime = Date.now();
  let oracleConn;
  let pgClient;

  try {
    await initAnalysisTables();

    console.log("[CardAnalysis] Bazalarga ulanish o'rnatilmoqda...");
    oracleConn = await getOracleConnection();
    pgClient = await pool.connect();

    // 1. Oxirgi operatsion kunni aniqlash (Timezone xatoligini oldini olish uchun TO_CHAR orqali olamiz)
    console.log("[CardAnalysis] Oxirgi oper_day aniqlanmoqda...");
    const dayRes = await oracleConn.execute(
      `SELECT TO_CHAR(MAX(oper_day), 'YYYY-MM-DD') FROM dwh_personal_accounts@riabs`
    );
    const formattedOperDay = dayRes.rows[0][0];
    if (!formattedOperDay) {
      throw new Error("Oracle'dan oper_day olinmadi!");
    }

    console.log(`[CardAnalysis] Oxirgi operatsion kun: ${formattedOperDay}`);

    // 2. TARGET_CLIENTS (Oxirgi 30/90 kunlik yangi kartalar/mijozlar)
    console.log("[CardAnalysis] Target kartalar va mijozlar yuklanmoqda...");
    await pgClient.query("TRUNCATE TABLE target_clients;");

    const targetClientsSql = `
      WITH cards AS (
        SELECT card_number, SUBSTR(offline_account, -20) AS account_code, date_registered
        FROM sv_cards@riabs
        WHERE date_registered >= TRUNC(SYSDATE - 30) AND card_number IS NOT NULL
        UNION ALL
        SELECT gc.card_number, SUBSTR(ga.account_code, -20), gc.date_registered
        FROM gl_cards@riabs gc
        LEFT JOIN gl_accounts@riabs ga ON gc.gl_card_acct = ga.gl_account
        WHERE gc.date_registered >= TRUNC(SYSDATE - 30) AND gc.card_number IS NOT NULL
        UNION ALL
        SELECT card_number, SUBSTR(tet_card_acct, -20), date_registered
        FROM tet_cards@riabs
        WHERE date_registered >= TRUNC(SYSDATE - 30) AND card_number IS NOT NULL
      ),
      card_accounts AS (
        SELECT a.id AS acc_id, a.client_code, c.card_number, c.account_code, c.date_registered
        FROM cards c
        LEFT JOIN accounts@riabs a ON c.account_code = a.acc_external
        WHERE a.client_code NOT LIKE '0%'
      ),
      filtered_card_accounts AS (
        SELECT * FROM card_accounts c
        WHERE NOT EXISTS (
          SELECT 1 FROM accounts@riabs a 
          WHERE c.client_code = a.client_code
            AND (a.acc_external LIKE '125%' OR a.acc_external LIKE '149%' 
                 OR a.acc_external LIKE '20206%' OR a.acc_external LIKE '20406%' 
                 OR a.acc_external LIKE '20606%')
        )
      )
      SELECT 
        c.acc_id,
        c.client_code,
        c.account_code,
        c.card_number,
        c.date_registered,
        cc.date_open,
        cpc.birthday,
        TRUNC((TRUNC(SYSDATE) - cpc.birthday) / 365) AS age,
        cpc.passport_serial,
        cpc.passport_number,
        cpc.passport_registration_place,
        cpc.pinfl
      FROM filtered_card_accounts c
      LEFT JOIN client_current@riabs cc ON c.client_code = cc.code
      LEFT JOIN client_physical_current@riabs cpc ON c.client_code = cpc.code
      WHERE cc.date_open > TRUNC(SYSDATE - 90)
    `;

    const tcResult = await oracleConn.execute(targetClientsSql, [], { fetchArraySize: 2000 });
    const targetCount = tcResult.rows ? tcResult.rows.length : 0;
    console.log(`[CardAnalysis] ${targetCount} ta target karta topildi. Postgres'ga yozilmoqda...`);

    // Target clients ni batch qilib yozish
    if (targetCount > 0) {
      for (const row of tcResult.rows) {
        await pgClient.query(`
          INSERT INTO target_clients (
            acc_id, client_code, account_code, card_number, date_registered,
            date_open, birthday, age, passport_serial, passport_number,
            passport_registration_place, pinfl
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, row);
      }
    }
    console.log("[CardAnalysis] Target clients muvaffaqiyatli saqlandi.");

    // 3. STAGING_TRANSACTIONS (O'sha oper_day bo'yicha 22618 tranzaksiyalari)
    console.log("[CardAnalysis] Kunlik tranzaksiyalar yuklanmoqda...");
    await pgClient.query("TRUNCATE TABLE staging_transactions;");

    const trxSql = `
      SELECT 
        dpa.acc_id,
        dpa.lead_id,
        dpa.account_code,
        dpa.account_co,
        dpa.oper_day,
        dpa.debit,
        dpa.credit,
        lh.pay_purpose
      FROM dwh_personal_accounts@riabs dpa
      LEFT JOIN leads_history@riabs lh ON dpa.lead_id = lh.id
      WHERE dpa.oper_day = TO_DATE(:target_day, 'YYYY-MM-DD')
        AND dpa.account_code LIKE '22618%'
    `;

    const resultSet = await oracleConn.execute(
      trxSql,
      { target_day: formattedOperDay },
      { resultSet: true, fetchArraySize: 5000 }
    );

    const cursor = resultSet.resultSet;
    let totalLoadedTrx = 0;
    let chunk;

    while ((chunk = await cursor.getRows(5000))) {
      if (chunk.length === 0) break;
      await bulkInsertTransactions(pgClient, chunk);
      totalLoadedTrx += chunk.length;
      if (totalLoadedTrx % 100000 === 0) {
        console.log(`[CardAnalysis] Yuklandi: ${totalLoadedTrx.toLocaleString()} tranzaksiya...`);
      }
    }
    await cursor.close();
    console.log(`[CardAnalysis] Jami tranzaksiyalar yuklandi: ${totalLoadedTrx.toLocaleString()} ta.`);

    // 4. TAHLIL: POSTGRESQL ICHIDA SHUBHALI KARTALARNI ANIQLASH
    console.log("[CardAnalysis] Shubhali operatsiyalar tahlil qilinmoqda...");

    const analysisSql = `
      WITH filtered_trx AS (
        SELECT 
          t.acc_id,
          t.account_code,
          t.debit,
          t.credit,
          t.oper_day
        FROM staging_transactions t
        INNER JOIN target_clients c ON t.acc_id = c.acc_id
        WHERE t.pay_purpose NOT ILIKE '%TRANSPORT%'
          AND t.pay_purpose NOT ILIKE '%TO''LOVI%'
          AND t.pay_purpose NOT ILIKE '%TO LOVI%'
          AND t.pay_purpose NOT ILIKE '%ATTO%'
          AND t.pay_purpose NOT ILIKE '%MCHJ%'
          AND t.pay_purpose NOT ILIKE '%QQS%'
      ),
      sus_trx AS (
        SELECT 
          acc_id,
          account_code,
          oper_day,
          COUNT(*) AS total_transactions,
          SUM(CASE WHEN debit > 0 THEN 1 ELSE 0 END) AS debit_count,
          SUM(debit) / 100.0 AS debit_sum,
          SUM(CASE WHEN credit > 0 THEN 1 ELSE 0 END) AS credit_count,
          SUM(credit) / 100.0 AS credit_sum
        FROM filtered_trx
        GROUP BY acc_id, account_code, oper_day
        HAVING (SUM(CASE WHEN debit > 0 THEN 1 ELSE 0 END) > 5 AND SUM(debit) / 100.0 >= 10000000)
            OR (SUM(CASE WHEN credit > 0 THEN 1 ELSE 0 END) > 5 AND SUM(credit) / 100.0 >= 10000000)
      )
      INSERT INTO suspect_cards_analysis (
        oper_day, acc_id, client_code, card_number, account_code, pinfl, age,
        total_transactions, debit_count, debit_sum, credit_count, credit_sum
      )
      SELECT 
        s.oper_day,
        s.acc_id,
        c.client_code,
        c.card_number,
        s.account_code,
        c.pinfl,
        c.age,
        s.total_transactions,
        s.debit_count,
        s.debit_sum,
        s.credit_count,
        s.credit_sum
      FROM sus_trx s
      JOIN target_clients c ON s.acc_id = c.acc_id
      ON CONFLICT (oper_day, acc_id) DO UPDATE SET
        total_transactions = EXCLUDED.total_transactions,
        debit_count = EXCLUDED.debit_count,
        debit_sum = EXCLUDED.debit_sum,
        credit_count = EXCLUDED.credit_count,
        credit_sum = EXCLUDED.credit_sum,
        analyzed_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const analysisResult = await pgClient.query(analysisSql);
    const suspectsFound = analysisResult.rows.length;
    console.log(`[CardAnalysis] Shubhali kartalar topildi: ${suspectsFound} ta.`);

    // 5. TOZALASH (Foydalanuvchi iltimosiga ko'ra o'chirilmaydi, jadvalda qoldiriladi)
    console.log("[CardAnalysis] ℹ️ Staging jadval tozalanmadi (ma'lumotlar ko'rish uchun saqlab qolindi).");
    // await pgClient.query("TRUNCATE TABLE staging_transactions;");

    const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[CardAnalysis] ✅ Jarayon yakunlandi! Sarflangan vaqt: ${durationSeconds} soniya.`);

    return {
      success: true,
      operDay: formattedOperDay,
      targetClientsCount: targetCount,
      totalLoadedTransactions: totalLoadedTrx,
      suspectsFound,
      durationSeconds,
      data: analysisResult.rows
    };

  } catch (err) {
    console.error("[CardAnalysis] ❌ Xatolik yuz berdi:", err);
    throw err;
  } finally {
    if (oracleConn) {
      try { await oracleConn.close(); } catch (e) {}
    }
    if (pgClient) {
      pgClient.release();
    }
  }
}

/**
 * Natijalarni ko'rish funksiyasi (Controller uchun)
 */
async function getSuspectCards(filters = {}) {
  const { operDay, search, limit = 50, page = 1 } = filters;
  const offset = (page - 1) * limit;

  let whereClauses = [];
  let params = [];

  if (operDay) {
    params.push(operDay);
    whereClauses.push(`oper_day = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    whereClauses.push(`(card_number LIKE $${params.length} OR pinfl LIKE $${params.length} OR client_code LIKE $${params.length})`);
  }

  const whereSql = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

  const dataSql = `
    SELECT * FROM suspect_cards_analysis
    ${whereSql}
    ORDER BY debit_sum DESC, credit_sum DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const countSql = `
    SELECT COUNT(*) as total FROM suspect_cards_analysis ${whereSql}
  `;

  const [rows, totalRes] = await Promise.all([
    queryAll(dataSql, [...params, limit, offset]),
    queryOne(countSql, params)
  ]);

  return {
    data: rows,
    pagination: {
      total: parseInt(totalRes?.total || 0, 10),
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    }
  };
}

module.exports = {
  runCardAnalysisPipeline,
  getSuspectCards
};

