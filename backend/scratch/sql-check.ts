import { Client } from 'pg';

async function checkIntegrity() {
  const client = new Client({
    connectionString: "postgresql://alacaja:__DB_PASSWORD_PLACEHOLDER__@190.56.16.85:5432/multitienda_db",
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('--- SQL Integrity Check ---');
    await client.connect();
    
    // 1. Check for products without barcodes (critical for POS)
    const noBarcodes = await client.query('SELECT COUNT(*) FROM products WHERE id NOT IN (SELECT product_id FROM product_barcodes)');
    console.log(`- Products without barcodes: ${noBarcodes.rows[0].count}`);

    // 2. Check for inconsistent stock (sum of warehouse vs products.current_stock)
    // (This depends on the specific schema logic, but let's check if there are null stocks)
    const nullStock = await client.query('SELECT COUNT(*) FROM products WHERE current_stock IS NULL');
    console.log(`- Products with NULL stock: ${nullStock.rows[0].count}`);

    // 3. Check for duplicated primary barcodes
    const dupPrimary = await client.query('SELECT product_id, COUNT(*) FROM product_barcodes WHERE is_primary = true GROUP BY product_id HAVING COUNT(*) > 1');
    console.log(`- Products with duplicated primary barcodes: ${dupPrimary.rowCount}`);

    // 4. Check for sync log idempotency
    const syncLogs = await client.query('SELECT COUNT(*) FROM sync_idempotency_log');
    console.log(`- Total sync idempotency logs: ${syncLogs.rows[0].count}`);

    await client.end();
  } catch (error: any) {
    console.error('SQL Check failed:', error.message);
  }
}

checkIntegrity();
