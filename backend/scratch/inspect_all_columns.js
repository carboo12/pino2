const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: '34.31.112.238',
    user: 'postgres',
    password: 'Pino2CloudSQL2026!',
    database: 'studio-9680180520-dbbe0-db',
  });
  await client.connect();

  const cols = await client.query(
    "SELECT table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name, column_name"
  );
  
  const byTable = {};
  cols.rows.forEach((r) => {
    if (!byTable[r.table_name]) byTable[r.table_name] = [];
    byTable[r.table_name].push(`${r.column_name} (${r.data_type}, nullable:${r.is_nullable})`);
  });

  console.log(JSON.stringify(byTable, null, 2));
  await client.end();
}

main();
