const { queryAll } = require('../config/clearingDb');

async function main() {
  const indexes = await queryAll(`
    SELECT tablename, indexname, indexdef 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    ORDER BY tablename, indexname
  `);
  console.table(indexes);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

