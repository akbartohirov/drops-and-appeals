// db.js
// SQLite sxema: users, appeals, drop_cards
// ES Module muhitida ishlaydi ("type": "module")

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const DATA_DIR = './data';
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'app.db'));

// Tavsiya etilgan pragmalar
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

// --- SCHEMA ---
db.exec(`
-- ======================
-- Users
-- ======================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin INTEGER DEFAULT 0,                  -- 1 = admin, 0 = oddiy user
  created_at TEXT DEFAULT (datetime('now'))
);

-- ======================
-- Appeals (Murojaatlar)
-- ======================
CREATE TABLE IF NOT EXISTS appeals (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,

  applicant_name    TEXT NOT NULL,             -- 1) Murojaatchi nomi
  address           TEXT,                      -- 2) Manzili
  phone             TEXT,                      -- 3) Telefon raqami

  source_org        TEXT,                      -- 4) Murojaat kelib tushgan tashkilot
  source_system     TEXT,                      -- 5) Murojaat kelib tushgan tizim

  subject           TEXT,                      -- 6) Tekshirish predmeti
  direction         TEXT,                      -- 7) Yo'nalish

  client_code       TEXT,                      -- 8) Mijoz unikal kodi
  card              TEXT,                      -- 9) Kartasi (masklangan bo'lsa ma'qul)

  appeal_date       TEXT NOT NULL,             -- 10) Murojaat sanasi (YYYY-MM-DD yoki datetime)
  damage_amount     REAL,                      -- 11) Zarar summasi

  comment           TEXT,                      -- 12) Izoh

  created_by        INTEGER NOT NULL,          -- 13) Kim tomonidan yaratilganligi (users.id)
  updated_by        INTEGER,                   -- oxirgi yangilagan (users.id)
  created_at        TEXT DEFAULT (datetime('now')),
  updated_at        TEXT,

  FOREIGN KEY (created_by) REFERENCES users(id) 
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_appeals_date        ON appeals(appeal_date);
CREATE INDEX IF NOT EXISTS idx_appeals_client_code ON appeals(client_code);
CREATE INDEX IF NOT EXISTS idx_appeals_created_by  ON appeals(created_by);

-- ======================
-- Drop Cards (Drop kartalar)
-- ======================
CREATE TABLE IF NOT EXISTS drop_cards (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  card_number TEXT NOT NULL,                   -- bloklangan karta raqami (to'liq yoki masklangan)
  blocked_at  TEXT NOT NULL,                   -- bloklangan sana (YYYY-MM-DD yoki datetime)
  balance     REAL,                            -- qoldiq
  blocked_by  INTEGER NOT NULL,                -- kim blokladi (users.id)
  updated_by  INTEGER,                         -- oxirgi yangilagan (users.id)
  comment     TEXT,                            -- izoh
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT,

  FOREIGN KEY (blocked_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_drop_cards_blocked_at ON drop_cards(blocked_at);
CREATE INDEX IF NOT EXISTS idx_drop_cards_blocked_by ON drop_cards(blocked_by);
`);

// --- OPTIONAL: birinchi adminni seed qilish ---
// .env orqali ber: ADMIN_USERNAME, ADMIN_PASSWORD (yoki default qiymatlar bilan yashaysan)
function ensureFirstAdmin() {
  console.log(process.env.ADMIN_PASSWORD, process.env.ADMIN_USERNAME);
  try {
    const count = db.prepare('SELECT COUNT(*) AS c FROM users WHERE is_admin = 1').get().c;
    if (count > 0) return;

    const username = process.env.ADMIN_USERNAME || 'admin';
    const rawPass = process.env.ADMIN_PASSWORD || 'admin123'; // ishlab chiqarishda buni almashtirish majburiy
    const hash = bcrypt.hashSync(rawPass, 10);

    db.prepare('INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1)')
      .run(username, hash);

    // Quruq konsol xabari: ha, bu yerda hech kimga sir yo‘q.
    console.log(`[db] Admin user yaratildi: username='${username}' (parolni darhol almashtir)`);
  } catch (e) {
    console.error('[db] Admin seedda xatolik:', e);
  }
}
ensureFirstAdmin();

export default db;