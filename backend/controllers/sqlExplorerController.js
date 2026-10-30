const clearingDb = require("../config/clearingDb");
const mainDb = require("../config/db");

/**
 * SQL so'rovni bajarish
 */
exports.executeSql = async (req, res) => {
  const { query: sqlQuery, targetDb = "clearing" } = req.body;

  if (!sqlQuery || typeof sqlQuery !== "string" || !sqlQuery.trim()) {
    return res.status(400).json({ error: "SQL so'rovi bo'sh bo'lishi mumkin emas!" });
  }

  const selectedPool = targetDb === "main" ? mainDb.pool : clearingDb.pool;

  const startTime = Date.now();
  let client;

  try {
    client = await selectedPool.connect();
    const result = await client.query(sqlQuery);
    const executionTimeMs = Date.now() - startTime;

    // Agar natija massiv bo'lsa (bir nechta query bo'lsa)
    const finalResult = Array.isArray(result) ? result[result.length - 1] : result;

    const columns = finalResult.fields ? finalResult.fields.map((f) => f.name) : [];
    const rows = finalResult.rows || [];
    const rowCount = typeof finalResult.rowCount === "number" ? finalResult.rowCount : rows.length;

    return res.json({
      success: true,
      columns,
      rows,
      rowCount,
      command: finalResult.command,
      executionTimeMs,
      targetDb
    });
  } catch (err) {
    const executionTimeMs = Date.now() - startTime;
    return res.status(400).json({
      success: false,
      error: err.message,
      detail: err.detail,
      position: err.position,
      executionTimeMs
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

/**
 * Mavjud jadvallar va ularning ustunlarini olish
 */
exports.getTables = async (req, res) => {
  const { targetDb = "clearing" } = req.query;
  const selectedPool = targetDb === "main" ? mainDb.pool : clearingDb.pool;

  try {
    const tablesQuery = `
      SELECT 
        t.table_name,
        COALESCE(s.n_live_tup, 0) as approximate_rows
      FROM information_schema.tables t
      LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
      WHERE t.table_schema = 'public'
      ORDER BY t.table_name;
    `;

    const columnsQuery = `
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `;

    const [tablesRes, colsRes] = await Promise.all([
      selectedPool.query(tablesQuery),
      selectedPool.query(columnsQuery)
    ]);

    const tablesMap = {};
    for (const row of tablesRes.rows) {
      tablesMap[row.table_name] = {
        name: row.table_name,
        approximateRows: parseInt(row.approximate_rows, 10),
        columns: []
      };
    }

    for (const col of colsRes.rows) {
      if (tablesMap[col.table_name]) {
        tablesMap[col.table_name].columns.push({
          name: col.column_name,
          type: col.data_type
        });
      }
    }

    res.json({
      targetDb,
      tables: Object.values(tablesMap)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

