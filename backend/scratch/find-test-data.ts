import { Client } from 'pg';

async function findTestData() {
  const client = new Client({
    connectionString: "postgresql://alacaja:__DB_PASSWORD_PLACEHOLDER__@190.56.16.85:5432/multitienda_db",
  });
  await client.connect();
  const store = await client.query('SELECT id FROM stores LIMIT 1');
  const product = await client.query('SELECT id, current_stock FROM products WHERE current_stock > 10 LIMIT 1');
  const cashier = await client.query('SELECT id FROM users WHERE role = \'admin\' LIMIT 1');
  
  console.log(JSON.stringify({
    storeId: store.rows[0]?.id,
    productId: product.rows[0]?.id,
    initialStock: product.rows[0]?.current_stock,
    cashierId: cashier.rows[0]?.id
  }, null, 2));
  
  await client.end();
}

findTestData().catch(console.error);
