const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sistema_inventario',
});

async function runCleanAndSetup() {
  console.log('🧹 Limpiando cadenas ficticias y configurando la Cadena Única "Grupo Los Pinos"...\n');

  try {
    // 1. Asegurar la cadena oficial "Grupo Los Pinos"
    let chainRes = await pool.query("SELECT id FROM chains WHERE name ILIKE '%Los Pinos%' LIMIT 1");
    let chainId;

    if (chainRes.rows.length === 0) {
      const newChain = await pool.query(`
        INSERT INTO chains (name, owner_name, owner_email, status)
        VALUES ('Grupo Los Pinos', 'Carlos Lira', 'carlos@lospinos.com', 'active')
        RETURNING id
      `);
      chainId = newChain.rows[0].id;
    } else {
      chainId = chainRes.rows[0].id;
      await pool.query("UPDATE chains SET name = 'Grupo Los Pinos', owner_name = 'Carlos Lira' WHERE id = $1", [chainId]);
    }

    // 2. Eliminar cualquier otra cadena ficticia ("Corporación Los Pinos", "Tiendas Al Costo", etc.)
    await pool.query("DELETE FROM chains WHERE id != $1", [chainId]);
    console.log(`✅ Cadena oficial única configurada: "Grupo Los Pinos" (ID: ${chainId})`);

    // 3. Vincular y asegurar las 3 sucursales con su correspondiente store_type
    const storesRes = await pool.query("SELECT id, name FROM stores ORDER BY created_at ASC");
    console.log(`\nSucursales encontradas: ${storesRes.rows.length}`);

    if (storesRes.rows.length >= 3) {
      await pool.query("UPDATE stores SET chain_id = $1, name = 'Bodega Central Los Pinos', store_type = 'BODEGA_CENTRAL' WHERE id = $2", [chainId, storesRes.rows[0].id]);
      await pool.query("UPDATE stores SET chain_id = $1, name = 'Distribuidora Los Pinos', store_type = 'DISTRIBUIDORA' WHERE id = $2", [chainId, storesRes.rows[1].id]);
      await pool.query("UPDATE stores SET chain_id = $1, name = 'Supermercado Los Pinos', store_type = 'SUPERMERCADO' WHERE id = $2", [chainId, storesRes.rows[2].id]);
    } else if (storesRes.rows.length === 2) {
      await pool.query("UPDATE stores SET chain_id = $1, name = 'Supermercado Los Pinos', store_type = 'SUPERMERCADO' WHERE id = $2", [chainId, storesRes.rows[0].id]);
      await pool.query("UPDATE stores SET chain_id = $1, name = 'Distribuidora Los Pinos', store_type = 'DISTRIBUIDORA' WHERE id = $2", [chainId, storesRes.rows[1].id]);
      await pool.query(`
        INSERT INTO stores (chain_id, name, address, phone, store_type, is_active)
        VALUES ($1, 'Bodega Central Los Pinos', 'Managua', '2222-1111', 'BODEGA_CENTRAL', true)
      `, [chainId]);
    }

    // 4. Mostrar resumen final
    const finalChains = await pool.query("SELECT * FROM chains");
    console.log('\n📊 Cadenas en Base de Datos:');
    finalChains.rows.forEach(c => console.log(`   - [${c.name}] (Owner: ${c.owner_name})`));

    const finalStores = await pool.query("SELECT id, name, store_type FROM stores ORDER BY created_at ASC");
    console.log('\n🏪 Sucursales Oficiales Configuradas:');
    finalStores.rows.forEach(s => console.log(`   - [${s.name}] | Tipo: ${s.store_type} (ID: ${s.id})`));

  } catch (error) {
    console.error('Error en el script de limpieza:', error.message);
  } finally {
    await pool.end();
  }
}

runCleanAndSetup();
