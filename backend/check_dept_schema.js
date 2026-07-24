const { Client } = require('pg');
const client = new Client({
  host: '190.56.16.85',
  port: 5432,
  user: 'alacaja',
  password: '__DB_PASSWORD_PLACEHOLDER__',
  database: 'multitienda_db',
});

async function checkColumns() {
  await client.connect();
  const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'departments'");
  console.log('COLUMNS:', JSON.stringify(res.rows, null, 2));
  await client.end();
}

checkColumns().catch(console.error);
