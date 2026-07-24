const { Client } = require('pg');

const client = new Client({
  host: '190.56.16.85', port: 5432, user: 'alacaja', password: '__DB_PASSWORD_PLACEHOLDER__', database: 'multitienda_db'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'vendor_inventories'
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

run();
