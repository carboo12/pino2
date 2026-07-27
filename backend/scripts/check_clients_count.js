const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sistema_inventario',
});

async function checkClients() {
  console.log('Inspeccionando total de clientes en base de datos PostgreSQL...\n');

  try {
    const total = await pool.query('SELECT COUNT(*) FROM clients WHERE is_active = true');
    console.log(`Total de clientes en tabla "clients": ${total.rows[0].count}`);

    const sample = await pool.query('SELECT id, name, code, assigned_vendor_id, store_id FROM clients WHERE is_active = true LIMIT 10');
    console.log('\nMuestra de 10 clientes:');
    sample.rows.forEach((c, idx) => {
      console.log(`[${idx + 1}] ID: ${c.id} | Nombre: "${c.name}" | Codigo: ${c.code} | Vendedor Asignado: ${c.assigned_vendor_id || 'SIN ASIGNAR'}`);
    });

  } catch (e) {
    console.error('Error al consultar clientes:', e.message);
  } finally {
    await pool.end();
  }
}

checkClients();
