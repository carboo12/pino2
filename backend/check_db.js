const { Client } = require('pg');

async function run() {
  const c = new Client({ connectionString: 'postgresql://alacaja:__DB_PASSWORD_PLACEHOLDER__@190.56.16.85:5432/multitienda_db' });
  await c.connect();

  // 1. Check current products columns
  const cols = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'products' ORDER BY ordinal_position`);
  console.log('Products columns:', cols.rows.map(x => x.column_name));

  // 2. Check if product_barcodes already exists
  const exists = await c.query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_barcodes')`);
  console.log('product_barcodes exists:', exists.rows[0].exists);

  // 3. Count products with barcodes
  const count = await c.query(`SELECT COUNT(*) FROM products WHERE barcode IS NOT NULL AND barcode != ''`);
  console.log('Products with barcodes:', count.rows[0].count);

  await c.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
