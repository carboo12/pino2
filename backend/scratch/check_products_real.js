const { Client } = require('pg');

const client = new Client({
  host: '190.56.16.85',
  port: 5432,
  user: 'alacaja',
  password: '__DB_PASSWORD_PLACEHOLDER__',
  database: 'multitienda_db'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT id, description, current_stock, sale_price 
    FROM products 
    WHERE store_id = '9321856d-19ba-42b8-ba47-cf35c0d133dd' 
    LIMIT 5
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

run();
