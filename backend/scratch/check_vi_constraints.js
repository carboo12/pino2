const { Client } = require('pg');

const client = new Client({
  host: '190.56.16.85', port: 5432, user: 'alacaja', password: '__DB_PASSWORD_PLACEHOLDER__', database: 'multitienda_db'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT conname, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = 'public' AND contypid = 'vendor_inventories'::regclass
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

run();
