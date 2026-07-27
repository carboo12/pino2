const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sistema_inventario',
});

async function assignUsersToStores() {
  console.log('Asociando todos los usuarios a Supermercado Los Pinos y Distribuidora Los Pinos...\n');

  try {
    const storesRes = await pool.query('SELECT id, name FROM stores');
    const storeIds = storesRes.rows.map(s => s.id);

    const usersRes = await pool.query('SELECT id, email, name, role FROM users');
    
    for (const u of usersRes.rows) {
      for (const stId of storeIds) {
        await pool.query(
          `INSERT INTO user_stores (user_id, store_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [u.id, stId]
        );
      }
    }

    console.log('✅ Usuarios asociados correctamente a ambas tiendas:');
    storesRes.rows.forEach(s => {
      console.log(`   - Tienda: "${s.name}" (ID: ${s.id})`);
    });

  } catch (e) {
    console.error('Error al asociar usuarios a tiendas:', e.message);
  } finally {
    await pool.end();
  }
}

assignUsersToStores();
