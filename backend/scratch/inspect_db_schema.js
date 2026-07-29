const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: '34.31.112.238',
    user: 'postgres',
    password: 'Pino2CloudSQL2026!',
    database: 'studio-9680180520-dbbe0-db',
  });
  await client.connect();
  console.log('Connected to Cloud SQL.');

  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
  );
  console.log('Tables:', tables.rows.map((r) => r.table_name));

  const storeCols = await client.query(
    "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='stores'"
  );
  console.log('Stores Columns:', storeCols.rows);

  try {
    const chains = await client.query('SELECT * FROM chains');
    console.log('Chains Count:', chains.rowCount, 'Rows:', chains.rows);
  } catch (err) {
    console.error('Chains Query Error:', err.message);
  }

  await client.end();
}

main();
