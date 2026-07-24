const { Client } = require('pg');

const client = new Client({
  host: '190.56.16.85', port: 5432, user: 'alacaja', password: '__DB_PASSWORD_PLACEHOLDER__', database: 'multitienda_db'
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='movements'");
  console.log(res.rows.map(r => r.column_name).join(', '));
  await client.end();
}

run();
