const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sistema_inventario',
});

async function inspectColumns() {
  const resProd = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'products'");
  console.log('Columnas de products:', resProd.rows.map(r => r.column_name).join(', '));

  const resCli = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'clients'");
  console.log('Columnas de clients:', resCli.rows.map(r => r.column_name).join(', '));

  await pool.end();
}

inspectColumns();
