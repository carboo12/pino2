const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sistema_inventario',
});

async function associateDataToBothStores() {
  console.log('Asociando catálogo de productos y clientes a ambas tiendas en PostgreSQL...\n');

  const store1 = '9321856d-19ba-42b8-ba47-cf35c0d133dd'; // Supermercado
  const store2 = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'; // Distribuidora

  try {
    // 1. Duplicar/Asociar productos para Distribuidora Los Pinos (store2)
    console.log('1. Duplicando productos para Distribuidora Los Pinos...');
    const dupProducts = await pool.query(`
      INSERT INTO products (
        store_id, department_id, barcode, description, sale_price, cost_price, current_stock,
        is_active, uses_inventory, min_stock, brand, wholesale_price, price1, price2, price3,
        price4, price5, supplier_id, sub_department, units_per_bulk, bulk_price_1, bulk_price_2,
        bulk_price_3, bulk_price_4, bulk_price_5, handles_bulk,
        legacy_code, tax_rate, unit_of_measure, reference, average_cost
      )
      SELECT 
        $1, department_id, barcode, description, sale_price, cost_price, current_stock,
        is_active, uses_inventory, min_stock, brand, wholesale_price, price1, price2, price3,
        price4, price5, supplier_id, sub_department, units_per_bulk, bulk_price_1, bulk_price_2,
        bulk_price_3, bulk_price_4, bulk_price_5, handles_bulk,
        legacy_code, tax_rate, unit_of_measure, reference, average_cost
      FROM products
      WHERE store_id = $2
        AND NOT EXISTS (
          SELECT 1 FROM products p2 WHERE p2.store_id = $1 AND p2.description = products.description
        )
    `, [store2, store1]);
    console.log(`   - Productos agregados a Distribuidora: ${dupProducts.rowCount}`);

    // 2. Duplicar/Asociar clientes para Distribuidora Los Pinos (store2)
    console.log('2. Duplicando clientes para Distribuidora Los Pinos...');
    const dupClients = await pool.query(`
      INSERT INTO clients (
        store_id, name, email, phone, address, grupo_economico_id, grupo_cliente_id,
        preventa_id, zona, limite_credito, saldo_pendiente, dias_credito, frecuencia_visita,
        dia_visita, notas_entrega, lat, lng, is_active
      )
      SELECT 
        $1, name, email, phone, address, grupo_economico_id, grupo_cliente_id,
        preventa_id, zona, limite_credito, saldo_pendiente, dias_credito, frecuencia_visita,
        dia_visita, notas_entrega, lat, lng, is_active
      FROM clients
      WHERE store_id = $2
        AND NOT EXISTS (
          SELECT 1 FROM clients c2 WHERE c2.store_id = $1 AND c2.name = clients.name
        )
    `, [store2, store1]);
    console.log(`   - Clientes agregados a Distribuidora: ${dupClients.rowCount}`);

    const countProd = await pool.query('SELECT store_id, COUNT(*) FROM products GROUP BY store_id');
    console.log('\nResumen de Productos por Tienda:');
    countProd.rows.forEach(r => console.log(`   - store_id: ${r.store_id} -> ${r.count} productos`));

    const countCli = await pool.query('SELECT store_id, COUNT(*) FROM clients GROUP BY store_id');
    console.log('\nResumen de Clientes por Tienda:');
    countCli.rows.forEach(r => console.log(`   - store_id: ${r.store_id} -> ${r.count} clientes`));

  } catch (e) {
    console.error('Error al asociar productos y clientes:', e.message);
  } finally {
    await pool.end();
  }
}

associateDataToBothStores();
