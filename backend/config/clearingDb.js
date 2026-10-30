const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const poolConfig = {
  host: process.env.HUMO_DB_HOST || process.env.PG_HOST || process.env.PGHOST || process.env.DB_HOST || "localhost",
  port: parseInt(process.env.HUMO_DB_PORT || process.env.PG_PORT || process.env.PGPORT || process.env.DB_PORT || "5432", 10),
  user: process.env.HUMO_DB_USER || process.env.PG_USER || process.env.PGUSER || "postgres",
  password: process.env.HUMO_DB_PASSWORD || process.env.PG_PASSWORD || process.env.PGPASSWORD || "postgres",
  database: process.env.HUMO_DB_NAME || "humo_clearing_p2p",
};

const pool = new Pool(poolConfig);

const query = async (text, params = []) => {
  return pool.query(text, params);
};

const queryOne = async (text, params = []) => {
  const result = await query(text, params);
  return result.rows[0] || null;
};

const queryAll = async (text, params = []) => {
  const result = await query(text, params);
  return result.rows;
};

// Initialize schema for humo_clearing_p2p
const initClearingDb = async () => {
  try {
    await query(`
      -- Humo2Humo table
      CREATE TABLE IF NOT EXISTS humo2humo (
        id BIGSERIAL PRIMARY KEY,
        pan1 VARCHAR(19),
        person_code VARCHAR(14),
        card_acct VARCHAR(32),
        pan2 VARCHAR(19),
        amount NUMERIC(18,2),
        tran_date TIMESTAMP WITHOUT TIME ZONE,
        rrn VARCHAR(32),
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_humo2humo_pan1 ON humo2humo(pan1);
      CREATE INDEX IF NOT EXISTS idx_humo2humo_pan2 ON humo2humo(pan2);
      CREATE INDEX IF NOT EXISTS idx_humo2humo_person_code ON humo2humo(person_code);
      CREATE INDEX IF NOT EXISTS idx_humo2humo_rrn ON humo2humo(rrn);
      CREATE INDEX IF NOT EXISTS idx_humo2humo_tran_date ON humo2humo(tran_date);

      -- Uzcard2Humo table
      CREATE TABLE IF NOT EXISTS uzcard2humo (
        id BIGSERIAL PRIMARY KEY,
        sender_pan VARCHAR(19),
        sender_rrn VARCHAR(32),
        receiver_pan VARCHAR(19),
        receiver_rrn VARCHAR(32),
        amount NUMERIC(18,2),
        tran_date TIMESTAMP WITHOUT TIME ZONE,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_uzcard2humo_sender_pan ON uzcard2humo(sender_pan);
      CREATE INDEX IF NOT EXISTS idx_uzcard2humo_sender_rrn ON uzcard2humo(sender_rrn);
      CREATE INDEX IF NOT EXISTS idx_uzcard2humo_receiver_pan ON uzcard2humo(receiver_pan);
      CREATE INDEX IF NOT EXISTS idx_uzcard2humo_receiver_rrn ON uzcard2humo(receiver_rrn);
      CREATE INDEX IF NOT EXISTS idx_uzcard2humo_tran_date ON uzcard2humo(tran_date);

      -- Sync logs table
      CREATE TABLE IF NOT EXISTS clearing_sync_files (
        id SERIAL PRIMARY KEY,
        oracle_file_id BIGINT UNIQUE NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        rows_count INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'SUCCESS',
        error_message TEXT,
        duration_ms INTEGER DEFAULT 0,
        processed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_clearing_sync_oracle_id ON clearing_sync_files(oracle_file_id);
    `);
    console.log("PostgreSQL 'humo_clearing_p2p' jadvallari va indekslari tekshirildi/yaratildi.");
  } catch (err) {
    console.error("clearingDb initsializatsiya xatosi:", err.message);
    throw err;
  }
};

module.exports = {
  pool,
  query,
  queryOne,
  queryAll,
  initClearingDb,
};

