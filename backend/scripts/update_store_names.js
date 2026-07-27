const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sistema_inventario',
});

async function updateStoreNames() {
  console.log('Inspeccionando y actualizando nombres de tiendas en PostgreSQL...\n');

  try {
    const res = await pool.query('SELECT id, name FROM stores ORDER BY created_at ASC');
    console.log('Tiendas encontradas actualmente:');
    res.rows.forEach((s, idx) => {
      console.log(`[${idx + 1}] ID: ${s.id} | Nombre: "${s.name}"`);
    });

    if (res.rows.length >= 2) {
      const store1Id = res.rows[0].id;
      const store2Id = res.rows[1].id;

      await pool.query('UPDATE stores SET name = $1 WHERE id = $2', ['Supermercado Los Pinos', store1Id]);
      await pool.query('UPDATE stores SET name = $1 WHERE id = $2', ['Distribuidora Los Pinos', store2Id]);

      console.log('\n✅ Tiendas actualizadas con éxito en PostgreSQL:');
      console.log(`   - Tienda 1 (${store1Id}) -> "Supermercado Los Pinos"`);
      console.log(`   - Tienda 2 (${store2Id}) -> "Distribuidora Los Pinos"`);
    } else if (res.rows.length === 1) {
      const store1Id = res.rows[0].id;
      await pool.query('UPDATE stores SET name = $1 WHERE id = $2', ['Supermercado Los Pinos', store1Id]);
      
      const chainRes = await pool.query('SELECT id FROM chains LIMIT 1');
      const chainId = chainRes.rows[0]?.id;

      const newStoreRes = await pool.query(`
        INSERT INTO stores (id, chain_id, name, address, phone)
        VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', $1, 'Distribuidora Los Pinos', 'Managua', '88888888')
        ON CONFLICT (id) DO UPDATE SET name = 'Distribuidora Los Pinos'
        RETURNING id, name
      `, [chainId]);
      console.log('\n✅ Tiendas configuradas:');
      console.log(`   - Tienda 1 -> "Supermercado Los Pinos"`);
      console.log(`   - Tienda 2 -> "Distribuidora Los Pinos" (${newStoreRes.rows[0].id})`);
    }

    const verify = await pool.query('SELECT id, name FROM stores ORDER BY created_at ASC');
    console.log('\nNombres de Tiendas Finales:');
    verify.rows.forEach((s, idx) => {
      console.log(`   ${idx + 1}. [${s.name}] (ID: ${s.id})`);
    });

  } catch (e) {
    console.error('Error al actualizar tiendas:', e.message);
  } finally {
    await pool.end();
  }
}

updateStoreNames();
