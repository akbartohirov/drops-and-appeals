const Database = require("better-sqlite3");
const path = require("path");
const bcrypt = require("bcryptjs");
const fs = require("fs");

const dbDir = path.join(__dirname, "../data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "app.db");

// Check if database needs a reset/migration for INTEGER AUTOINCREMENT id
if (fs.existsSync(dbPath)) {
  try {
    const tempDb = new Database(dbPath);
    const tableInfo = tempDb.prepare("PRAGMA table_info(users)").all();
    const idColumn = tableInfo.find(col => col.name === "id");
    const isIdInteger = idColumn && idColumn.type === "INTEGER";
    tempDb.close();
    
    if (!isIdInteger) {
      console.log("Migrating database keys to INTEGER AUTOINCREMENT. Resetting app.db...");
      fs.unlinkSync(dbPath);
    }
  } catch (e) {
    console.error("Error checking database migration status:", e.message);
  }
}

const db = new Database(dbPath);

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS appeals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    damage_amount INTEGER DEFAULT 0,
    comment TEXT,
    status TEXT DEFAULT "Yangi",
    created_by INTEGER,
    updated_by INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT,
    FOREIGN KEY(created_by) REFERENCES users(id),
    FOREIGN KEY(updated_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS drop_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_number TEXT UNIQUE NOT NULL,
    blocked_at TEXT NOT NULL,
    balance INTEGER DEFAULT 0,
    blocked_by INTEGER,
    updated_by INTEGER,
    comment TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT,
    FOREIGN KEY(blocked_by) REFERENCES users(id),
    FOREIGN KEY(updated_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS fraud_registry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fraud_type TEXT NOT NULL,
    description TEXT NOT NULL,
    victim_name TEXT NOT NULL,
    fraud_date TEXT NOT NULL,
    damage_amount INTEGER DEFAULT 0,
    measures_taken TEXT,
    comments TEXT,
    created_by INTEGER,
    updated_by INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT,
    FOREIGN KEY(created_by) REFERENCES users(id),
    FOREIGN KEY(updated_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS fraud_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fraud_id INTEGER NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(fraud_id) REFERENCES fraud_registry(id) ON DELETE CASCADE
  );
`);

// Seed Initial Data if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
if (userCount.count === 0) {
  console.log("Seeding initial database data with INTEGER AUTOINCREMENT schema...");

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password_hash, is_admin)
    VALUES (?, ?, ?, ?)
  `);

  // Standard passwords hashed (e.g. admin123 and operator123)
  const adminHash = bcrypt.hashSync("admin123", 10);
  const operatorHash = bcrypt.hashSync("operator123", 10);
  const shaxriyorHash = bcrypt.hashSync("shaxriyor123", 10);
  const madinaHash = bcrypt.hashSync("madina_n123", 10);

  insertUser.run(1, "admin", adminHash, 1);
  insertUser.run(2, "operator", operatorHash, 0);
  insertUser.run(3, "shaxriyor", shaxriyorHash, 0);
  insertUser.run(4, "madina_n", madinaHash, 1);

  // Seed Appeals
  const insertAppeal = db.prepare(`
    INSERT INTO appeals (id, applicant_name, phone, address, source_org, source_system, subject, direction, client_code, card, appeal_date, damage_amount, comment, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertAppeal.run(1, "Abdullayev Anvar", "998901234567", "Toshkent sh., Yunusobod 14-4", "ATB \"Hamkorbank\"", "MOBILE", "To'lov xatoligi", "Transaksiyalar", "CLI-90821", "8600123456784421", "2026-05-24", 1250000, "Pul yechildi, lekin tushmadi...", "Yangi", 2);
  insertAppeal.run(2, "Sattorova Madina", "998934567890", "Samarqand sh., Registon k. 12", "MB Bosh ofisi", "WEB", "Kredit so'rovi", "Kreditlash", "CLI-45123", "9860054321001009", "2026-05-23", 0, "Kredit liniyasi ochilmadi", "Jarayonda", 3);
  insertAppeal.run(3, "\"Global Logistics\" MCHJ", "998999990011", "Buxoro sh., S.Ayniy 45", "Xalq Banki", "ATM", "Naqdlashtirish xatosi", "Inkasatsiya", "CORP-001", "5614332211228877", "2026-05-22", 4000000, "ATM pulni bermadi, balansdan ayirildi", "Kritik", 1);

  // Seed Drop Cards
  const insertDropCard = db.prepare(`
    INSERT INTO drop_cards (id, card_number, blocked_at, balance, comment, blocked_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertDropCard.run(1, "8600112233444912", "2026-05-24 14:22:15", 12450000, "Shubhali P2P tranzaksiyalar oqimi aniqlandi", 2);
  insertDropCard.run(2, "5614321098768821", "2026-05-23 09:10:04", 2100000, "Kredit firibgarligi gumoni", 3);
  insertDropCard.run(3, "4263998877660032", "2026-05-22 18:45:30", 58000200, "Huquqni muhofaza qilish organlari so'rovi", 1);
  insertDropCard.run(4, "8600990088771199", "2026-05-22 10:05:01", 0, "E'tirozli hisob-kitoblar", 2);

  console.log("Database seeded successfully.");
}

// Seed Fraud Registry if empty
const fraudCount = db.prepare("SELECT COUNT(*) as count FROM fraud_registry").get();
if (fraudCount.count === 0) {
  console.log("Seeding initial fraud registry data...");
  const insertFraud = db.prepare(`
    INSERT INTO fraud_registry (id, fraud_type, description, victim_name, fraud_date, damage_amount, measures_taken, comments, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertFraud.run(1, "Karta fishingi", "Telegram orqali soxta aksiya havolasi yuborilgan", "Eshonov Qobil", "2026-06-01", 5500000, "Karta bloklandi, bank arizasi yozildi", "Fishing bot aniqlandi", 2);
  insertFraud.run(2, "P2P o'tkazma firibgarligi", "Olx.uz saytida soxta chek yuborib tovar o'zlashtirilgan", "Karimova Zilola", "2026-06-02", 12000000, "Ichki ishlar organlariga ma'lumot yuborildi", "Shubhali karta tranzaksiyalari tahlil qilindi", 3);

  const insertAttachment = db.prepare(`
    INSERT INTO fraud_attachments (id, fraud_id, original_name, file_path)
    VALUES (?, ?, ?, ?)
  `);
  insertAttachment.run(1, 1, "soxta_havola_skrinshot.png", "/upload_files/sample_fishing.png");
  insertAttachment.run(2, 2, "olx_yozishmalar.pdf", "/upload_files/sample_chat.pdf");
  
  console.log("Fraud registry seeded successfully.");
}

module.exports = db;
