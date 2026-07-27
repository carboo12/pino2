const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sistema_inventario',
});

async function checkClientsStoreIds() {
  console.log('Inspeccionando distribución de store_id en la tabla clients...\n');

  try {
    const res = await pool.query('SELECT store_id, COUNT(*) FROM clients GROUP BY store_id');
    console.log('Clientes por store_id:');
    res.rows.forEach(r => {
      console.log(`   - store_id: "${r.store_id}" | Total: ${r.count}`);
    });

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

checkClientsStoreIds();
