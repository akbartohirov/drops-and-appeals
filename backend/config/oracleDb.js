const oracledb = require("oracledb");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function getOracleConnection() {
  return oracledb.getConnection({
    user: process.env.ORACLE_USER || process.env.DB_USER,
    password: process.env.ORACLE_PASSWORD || process.env.DB_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING || process.env.DB_CONNECT_STRING,
  });
}

module.exports = {
  oracledb,
  getOracleConnection,
};

