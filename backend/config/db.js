const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
require("dotenv").config();

let poolConfig;

if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.DB_SSL === "true" ||
      process.env.DATABASE_URL.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : false,
  };
} else {
  poolConfig = {
    host: process.env.PG_HOST || process.env.PGHOST || process.env.DB_HOST || "localhost",
    port: parseInt(process.env.PG_PORT || process.env.PGPORT || process.env.DB_PORT || "5432", 10),
    user: process.env.PG_USER || process.env.PGUSER || "postgres",
    password: process.env.PG_PASSWORD || process.env.PGPASSWORD || "postgres",
    database:
      process.env.DB_NAME || process.env.PGDATABASE || "drops_appeals_db",
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  };
}

const pool = new Pool(poolConfig);

/**
 * Universal query function supporting both '?' and '$1, $2...' placeholders
 */
const query = async (text, params = []) => {
  let paramIndex = 1;
  const pgText = text.includes("?")
    ? text.replace(/\?/g, () => `$${paramIndex++}`)
    : text;

  return pool.query(pgText, params);
};

const queryOne = async (text, params = []) => {
  const result = await query(text, params);
  return result.rows[0] || null;
};

const queryAll = async (text, params = []) => {
  const result = await query(text, params);
  return result.rows;
};

// Initialize schema if not exists and seed default admin user
const initDb = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP::text
      );

      CREATE TABLE IF NOT EXISTS appeals (
        id SERIAL PRIMARY KEY,
        applicant_name TEXT NOT NULL,
        address TEXT,
        phone TEXT NOT NULL,
        source_org TEXT,
        source_system TEXT,
        subject TEXT,
        direction TEXT,
        client_code TEXT,
        card TEXT,
        appeal_date TEXT,
        damage_amount BIGINT DEFAULT 0,
        comment TEXT,
        created_by INTEGER REFERENCES users(id),
        updated_by INTEGER REFERENCES users(id),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP::text,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS drop_cards (
        id SERIAL PRIMARY KEY,
        card_number TEXT UNIQUE NOT NULL,
        blocked_at TEXT NOT NULL,
        balance BIGINT DEFAULT 0,
        blocked_by INTEGER REFERENCES users(id),
        updated_by INTEGER REFERENCES users(id),
        comment TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP::text,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS fraud_registry (
        id SERIAL PRIMARY KEY,
        fraud_type TEXT NOT NULL,
        description TEXT NOT NULL,
        victim_name TEXT NOT NULL,
        fraud_date TEXT NOT NULL,
        damage_amount BIGINT DEFAULT 0,
        measures_taken TEXT,
        comments TEXT,
        created_by INTEGER REFERENCES users(id),
        updated_by INTEGER REFERENCES users(id),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP::text,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS fraud_attachments (
        id SERIAL PRIMARY KEY,
        fraud_id INTEGER NOT NULL REFERENCES fraud_registry(id) ON DELETE CASCADE,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP::text
      );
    `);

    // Ensure default admin user exists
    let admin = await queryOne("SELECT * FROM users WHERE LOWER(username) = 'admin'");
    let adminId = admin ? admin.id : null;

    if (!admin) {
      const adminHash = bcrypt.hashSync("admin123", 10);
      const newAdmin = await queryOne(
        "INSERT INTO users (username, password_hash, is_admin, created_at) VALUES ($1, $2, 1, CURRENT_TIMESTAMP::text) ON CONFLICT (username) DO UPDATE SET is_admin = 1 RETURNING id",
        ["admin", adminHash]
      );
      adminId = newAdmin ? newAdmin.id : 1;
      console.log("Default admin foydalanuvchisi yaratildi: username='admin', parol='admin123'");
    } else {
      console.log("Default admin foydalanuvchisi mavjud (username='admin').");
    }

    // Seed Appeals if empty
    const appealsCount = await queryOne("SELECT COUNT(*) as count FROM appeals");
    if (parseInt(appealsCount?.count || 0, 10) === 0) {
      console.log("Appeals jadvaliga dastlabki ma'lumotlar qo'shilmoqda...");
      const dummyAppeals = [
        ["Abdullayev Anvar", "998901234567", "Toshkent sh., Yunusobod 14-4", 'ATB "Hamkorbank"', "MOBILE", "To'lov xatoligi", "Transaksiyalar", "CLI-90821", "8600123456784421", "2026-05-24", 1250000, "Pul yechildi, lekin tushmadi...", adminId],
        ["Sattorova Madina", "998934567890", "Samarqand sh., Registon k. 12", "MB Bosh ofisi", "WEB", "Kredit so'rovi", "Kreditlash", "CLI-45123", "9860054321001009", "2026-05-23", 0, "Kredit liniyasi ochilmadi", adminId],
        ['"Global Logistics" MCHJ', "998999990011", "Buxoro sh., S.Ayniy 45", "Xalq Banki", "ATM", "Naqdlashtirish xatosi", "Inkasatsiya", "CORP-001", "5614332211228877", "2026-05-22", 4000000, "ATM pulni bermadi, balansdan ayirildi", adminId],
        ["Olimov Jasur", "998912345678", "Farg'ona sh., Al-Farg'oniy 8", "Ipak Yo'li Banki", "POS", "Terminaldan ortiqcha yechildi", "E'tirozlar", "CLI-11294", "8600554433221100", "2026-05-21", 780000, "Hisobdan 2 marta yechildi", adminId]
      ];

      for (const a of dummyAppeals) {
        await query(`
          INSERT INTO appeals (applicant_name, phone, address, source_org, source_system, subject, direction, client_code, card, appeal_date, damage_amount, comment, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, a);
      }
    }

    // Seed Drop Cards if empty
    const dropCardsCount = await queryOne("SELECT COUNT(*) as count FROM drop_cards");
    if (parseInt(dropCardsCount?.count || 0, 10) === 0) {
      console.log("Drop cards jadvaliga dastlabki ma'lumotlar qo'shilmoqda...");
      const dummyDropCards = [
        ["8600112233444912", "2026-05-24 14:22:15", 12450000, "Shubhali P2P tranzaksiyalar oqimi aniqlandi", adminId],
        ["5614321098768821", "2026-05-23 09:10:04", 2100000, "Kredit firibgarligi gumoni", adminId],
        ["4263998877660032", "2026-05-22 18:45:30", 58000200, "Huquqni muhofaza qilish organlari so'rovi", adminId],
        ["8600990088771199", "2026-05-22 10:05:01", 0, "E'tirozli hisob-kitoblar", adminId],
        ["9860123499887711", "2026-05-21 16:30:12", 4500000, "Telegram bot fishing kartasi", adminId]
      ];

      for (const c of dummyDropCards) {
        await query(`
          INSERT INTO drop_cards (card_number, blocked_at, balance, comment, blocked_by)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (card_number) DO NOTHING
        `, c);
      }
    }

    // Seed Fraud Registry if empty
    const fraudCount = await queryOne("SELECT COUNT(*) as count FROM fraud_registry");
    if (parseInt(fraudCount?.count || 0, 10) === 0) {
      console.log("Fraud registry jadvaliga dastlabki ma'lumotlar qo'shilmoqda...");
      const f1 = await queryOne(`
        INSERT INTO fraud_registry (fraud_type, description, victim_name, fraud_date, damage_amount, measures_taken, comments, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, ["Karta fishingi", "Telegram orqali soxta aksiya havolasi yuborilgan", "Eshonov Qobil", "2026-06-01", 5500000, "Karta bloklandi, bank arizasi yozildi", "Fishing bot aniqlandi", adminId]);

      const f2 = await queryOne(`
        INSERT INTO fraud_registry (fraud_type, description, victim_name, fraud_date, damage_amount, measures_taken, comments, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, ["P2P o'tkazma firibgarligi", "Olx.uz saytida soxta chek yuborib tovar o'zlashtirilgan", "Karimova Zilola", "2026-06-02", 12000000, "Ichki ishlar organlariga ma'lumot yuborildi", "Shubhali karta tranzaksiyalari tahlil qilindi", adminId]);

      if (f1) {
        await query(`
          INSERT INTO fraud_attachments (fraud_id, original_name, file_path)
          VALUES ($1, $2, $3)
        `, [f1.id, "soxta_havola_skrinshot.png", "/upload_files/sample_fishing.png"]);
      }

      if (f2) {
        await query(`
          INSERT INTO fraud_attachments (fraud_id, original_name, file_path)
          VALUES ($1, $2, $3)
        `, [f2.id, "olx_yozishmalar.pdf", "/upload_files/sample_chat.pdf"]);
      }
    }
  } catch (err) {
    console.error("Database initialization / default user xatoligi:", err.message);
  }
};

// Test PostgreSQL connection and initialize schema
pool.connect((err, client, release) => {
  if (err) {
    console.error("PostgreSQL bazasiga ulanishda xatolik:", err.message || err);
  } else {
    console.log("PostgreSQL bazasiga muvaffaqiyatli ulandi.");
    release();
    initDb();
  }
});

module.exports = {
  pool,
  query,
  queryOne,
  queryAll,
};
