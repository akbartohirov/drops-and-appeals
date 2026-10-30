const zlib = require("zlib");
const { pool, query, queryOne, queryAll, initClearingDb } = require("../config/clearingDb");
const { oracledb, getOracleConnection } = require("../config/oracleDb");

// Sana formatini DD.MM.YYYY HH:mm:ss dan YYYY-MM-DD HH:mm:ss ga o'tkazish
function parseTranDate(str) {
  if (!str) return null;
  const trimmed = str.trim();
  const m = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/);
  if (m) {
    const [, day, month, year, hour = "00", min = "00", sec = "00"] = m;
    return `${year}-${month}-${day} ${hour}:${min}:${sec}`;
  }
  return trimmed;
}

// Oracle BLOB ni 2000-bayt RAW chunklar orqali tortib olish
async function fetchOracleBlobBuffer(oracleConn, fileId) {
  const plsql = `
    DECLARE
      l_blob      BLOB;
      l_len       INTEGER;
    BEGIN
      SELECT compressed_file INTO l_blob 
      FROM fi_input_files@riabs 
      WHERE id = :target_id;

      l_len := DBMS_LOB.GETLENGTH(l_blob);

      OPEN :cursor_out FOR
        WITH generator AS (
          SELECT LEVEL AS chunk_num
          FROM dual
          CONNECT BY LEVEL <= CEIL(l_len / 2000)
        )
        SELECT DBMS_LOB.SUBSTR(l_blob, 2000, (chunk_num - 1) * 2000 + 1) AS chunk_raw
        FROM generator
        ORDER BY chunk_num;
    END;
  `;

  const result = await oracleConn.execute(plsql, {
    target_id: fileId,
    cursor_out: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT },
  });

  const cursor = result.outBinds.cursor_out;
  const chunks = [];
  let row;
  while ((row = await cursor.getRow())) {
    if (row[0]) {
      chunks.push(Buffer.isBuffer(row[0]) ? row[0] : Buffer.from(row[0], "hex"));
    }
  }
  await cursor.close();

  if (chunks.length === 0) {
    throw new Error(`File ID ${fileId}: BLOB bo'sh yoki o'qilmadi.`);
  }

  return Buffer.concat(chunks);
}

// Zlib orqali ochish
function decompressBuffer(blobBuffer) {
  try {
    return zlib.unzipSync(blobBuffer).toString("utf-8");
  } catch (e1) {
    try {
      return zlib.inflateRawSync(blobBuffer).toString("utf-8");
    } catch (e2) {
      return blobBuffer.toString("utf-8");
    }
  }
}

// Humo2Humo qatorlarini Postgresga batch insert qilish
async function insertHumo2HumoBatch(pgClient, rows) {
  if (rows.length === 0) return 0;
  const BATCH_SIZE = 1000;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    const valuePlaceholders = [];
    const values = [];

    chunk.forEach((r, idx) => {
      const offset = idx * 7;
      valuePlaceholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`);
      values.push(r.pan1, r.person_code, r.card_acct, r.pan2, r.amount, r.tran_date, r.rrn);
    });

    const sql = `
      INSERT INTO humo2humo (pan1, person_code, card_acct, pan2, amount, tran_date, rrn)
      VALUES ${valuePlaceholders.join(", ")}
    `;
    await pgClient.query(sql, values);
    inserted += chunk.length;
  }
  return inserted;
}

// Uzcard2Humo qatorlarini Postgresga batch insert qilish
async function insertUzcard2HumoBatch(pgClient, rows) {
  if (rows.length === 0) return 0;
  const BATCH_SIZE = 1000;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    const valuePlaceholders = [];
    const values = [];

    chunk.forEach((r, idx) => {
      const offset = idx * 6;
      valuePlaceholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`);
      values.push(r.sender_pan, r.sender_rrn, r.receiver_pan, r.receiver_rrn, r.amount, r.tran_date);
    });

    const sql = `
      INSERT INTO uzcard2humo (sender_pan, sender_rrn, receiver_pan, receiver_rrn, amount, tran_date)
      VALUES ${valuePlaceholders.join(", ")}
    `;
    await pgClient.query(sql, values);
    inserted += chunk.length;
  }
  return inserted;
}

// Yagona faylni yuklash va qayta ishlash
async function processSingleFile(oracleConn, fileId, fileName) {
  const startTime = Date.now();
  const upperName = fileName.toUpperCase();
  const isHumo2Humo = upperName.includes("HUMO2HUMO");
  const isUzcard2Humo = upperName.includes("UZCARD2HUMO");
  const fileType = isHumo2Humo ? "HUMO2HUMO" : isUzcard2Humo ? "UZCARD2HUMO" : "UNKNOWN";

  if (fileType === "UNKNOWN") {
    console.log(`[ClearingSync] Noma'lum fayl turi o'tkazib yuborildi: ${fileName}`);
    return { fileId, fileName, status: "SKIPPED", reason: "Noma'lum fayl turi" };
  }

  console.log(`[ClearingSync] Fayl yuklanmoqda: ${fileName} (ID: ${fileId}, Tur: ${fileType})`);
  const blobBuffer = await fetchOracleBlobBuffer(oracleConn, fileId);
  const rawText = decompressBuffer(blobBuffer);

  const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) {
    console.log(`[ClearingSync] Fayl bo'sh: ${fileName}`);
    return { fileId, fileName, status: "EMPTY", rowsCount: 0 };
  }

  // Header va delimiterni aniqlash
  const headerLine = lines[0];
  const delimiter = headerLine.includes(";") ? ";" : ",";
  const dataLines = lines.slice(1);

  const pgClient = await pool.connect();
  try {
    await pgClient.query("BEGIN");

    let rowsCount = 0;
    if (fileType === "HUMO2HUMO") {
      // PAN1,PERSON_CODE,CARD_ACCT,PAN2,AMOUNT,TRAN_DATE,RRN
      const parsedRows = [];
      for (const line of dataLines) {
        const parts = line.split(delimiter).map((p) => p.replace(/"/g, "").trim());
        if (!parts[0]) continue; // agar bo'sh bo'lsa o'tkazib yuborish
        parsedRows.push({
          pan1: parts[0] || null,
          person_code: parts[1] || null,
          card_acct: parts[2] || null,
          pan2: parts[3] || null,
          amount: parts[4] ? parseFloat(parts[4]) : 0,
          tran_date: parseTranDate(parts[5]),
          rrn: parts[6] || null,
        });
      }
      rowsCount = await insertHumo2HumoBatch(pgClient, parsedRows);
    } else if (fileType === "UZCARD2HUMO") {
      // SENDER_PAN,SENDER_RRN,RECEIVER_PAN,RECEIVER_RRN,AMOUNT,TRAN_DATE
      const parsedRows = [];
      for (const line of dataLines) {
        const parts = line.split(delimiter).map((p) => p.replace(/"/g, "").trim());
        if (!parts[0]) continue;
        parsedRows.push({
          sender_pan: parts[0] || null,
          sender_rrn: parts[1] || null,
          receiver_pan: parts[2] || null,
          receiver_rrn: parts[3] || null,
          amount: parts[4] ? parseFloat(parts[4]) : 0,
          tran_date: parseTranDate(parts[5]),
        });
      }
      rowsCount = await insertUzcard2HumoBatch(pgClient, parsedRows);
    }

    const durationMs = Date.now() - startTime;

    // Log jadvaliga muvaffaqiyatli deb qayd etish
    await pgClient.query(
      `
      INSERT INTO clearing_sync_files (oracle_file_id, file_name, file_type, rows_count, status, duration_ms, processed_at)
      VALUES ($1, $2, $3, $4, 'SUCCESS', $5, CURRENT_TIMESTAMP)
      ON CONFLICT (oracle_file_id) DO UPDATE 
      SET rows_count = EXCLUDED.rows_count,
          status = 'SUCCESS',
          duration_ms = EXCLUDED.duration_ms,
          processed_at = CURRENT_TIMESTAMP
    `,
      [fileId, fileName, fileType, rowsCount, durationMs]
    );

    await pgClient.query("COMMIT");
    console.log(`[ClearingSync] Muvaffaqiyatli saqlandi: ${fileName} -> ${rowsCount} qator (${durationMs} ms)`);
    return { fileId, fileName, fileType, rowsCount, durationMs, status: "SUCCESS" };
  } catch (err) {
    await pgClient.query("ROLLBACK");
    console.error(`[ClearingSync] Xatolik ${fileName}:`, err.message);

    // Xatolikni qayd etish
    try {
      await query(
        `
        INSERT INTO clearing_sync_files (oracle_file_id, file_name, file_type, rows_count, status, error_message, duration_ms, processed_at)
        VALUES ($1, $2, $3, 0, 'FAILED', $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT (oracle_file_id) DO UPDATE 
        SET status = 'FAILED', error_message = EXCLUDED.error_message, processed_at = CURRENT_TIMESTAMP
      `,
        [fileId, fileName, fileType, err.message, Date.now() - startTime]
      );
    } catch {}

    throw err;
  } finally {
    pgClient.release();
  }
}

let isSyncRunning = false;

// Yangi fayllarni tekshirish va sinxronizatsiya qilishning asosiy funksiyasi
async function syncPendingClearingFiles() {
  if (isSyncRunning) {
    console.log("[ClearingSync] Sinxronizatsiya hozirda davom etmoqda, o'tkazib yuborildi.");
    return { status: "IN_PROGRESS", message: "Oldingi jarayon hali yakunlanmagan" };
  }

  isSyncRunning = true;
  const syncStartTime = Date.now();
  let oracleConn;

  try {
    // 1. Postgres bazasida jadvallar mavjudligini ta'minlash
    await initClearingDb();

    // 2. Allaqachon yuklangan fayllar ro'yxatini olish
    const existingLogs = await queryAll(`SELECT oracle_file_id FROM clearing_sync_files WHERE status = 'SUCCESS'`);
    const processedIds = new Set(existingLogs.map((l) => String(l.oracle_file_id)));

    // 3. Oracle DB ga ulanish
    oracleConn = await getOracleConnection();

    // 4. Oracle'dan P2P_HUMO va P2P_UZCARD fayllarini olish
    const oracleSql = `
      SELECT id, name
      FROM fi_input_files@riabs
      WHERE (UPPER(name) LIKE 'P2P_HUMO%' OR UPPER(name) LIKE 'P2P_UZCARD%')
      ORDER BY id ASC
    `;
    const oracleRes = await oracleConn.execute(oracleSql);
    const allFiles = oracleRes.rows || [];

    // Hali yuklanmagan yangi fayllarni filtrlash
    const pendingFiles = allFiles.filter((row) => !processedIds.has(String(row[0])));

    console.log(`[ClearingSync] Jami Oracle fayllar: ${allFiles.length} ta, yangi yuklanishi kerak: ${pendingFiles.length} ta`);

    const results = [];
    for (const [fId, fName] of pendingFiles) {
      try {
        const res = await processSingleFile(oracleConn, fId, fName);
        results.push(res);
      } catch (fileErr) {
        results.push({ fileId: fId, fileName: fName, status: "FAILED", error: fileErr.message });
      }
    }

    const totalDuration = Date.now() - syncStartTime;
    return {
      status: "COMPLETED",
      totalOracleFiles: allFiles.length,
      newFilesProcessed: pendingFiles.length,
      durationMs: totalDuration,
      results,
    };
  } catch (err) {
    console.error("[ClearingSync] Sinxronizatsiyada umumiy xatolik:", err.message);
    return {
      status: "ERROR",
      error: err.message,
    };
  } finally {
    isSyncRunning = false;
    if (oracleConn) {
      try {
        await oracleConn.close();
      } catch {}
    }
  }
}

// Holatni olish
async function getSyncStatus() {
  await initClearingDb();
  const humoCountRes = await queryOne(`SELECT COUNT(*) as count FROM humo2humo`);
  const uzcardCountRes = await queryOne(`SELECT COUNT(*) as count FROM uzcard2humo`);
  const recentFiles = await queryAll(`
    SELECT oracle_file_id, file_name, file_type, rows_count, status, duration_ms, processed_at
    FROM clearing_sync_files
    ORDER BY id DESC
    LIMIT 10
  `);

  return {
    isSyncRunning,
    totalHumo2HumoRows: parseInt(humoCountRes?.count || 0, 10),
    totalUzcard2HumoRows: parseInt(uzcardCountRes?.count || 0, 10),
    recentFiles,
  };
}

// 30 daqiqalik scheduler
let schedulerTimer = null;
function startClearingScheduler() {
  if (schedulerTimer) return;

  console.log("[ClearingSync] 30 daqiqalik Clearing Scheduler ishga tushirildi.");

  // Dastlabki sinxronizatsiyani 5 soniyadan so'ng ishga tushirish (server to'liq ochilgach)
  setTimeout(() => {
    syncPendingClearingFiles().catch((e) => console.error("[ClearingSync Initial Run Error]:", e.message));
  }, 5000);

  // Har 30 daqiqada (30 * 60 * 1000 ms) takrorlash
  schedulerTimer = setInterval(() => {
    console.log("[ClearingSync] Rejali 30 daqiqalik sinxronizatsiya boshlandi...");
    syncPendingClearingFiles().catch((e) => console.error("[ClearingSync Scheduler Error]:", e.message));
  }, 30 * 60 * 1000);
}

module.exports = {
  syncPendingClearingFiles,
  getSyncStatus,
  startClearingScheduler,
};

