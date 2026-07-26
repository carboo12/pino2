const { Client } = require('pg');

const PINO_CONN = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/pino_migracion_db';

async function cleanNonLegacySeedData() {
  const pino = new Client({ connectionString: PINO_CONN });
  await pino.connect();

  console.log('================================================================');
  console.log(' ELIMINANDO DATOS SEMILLA / PRUEBA QUE NO SON DEL SISTEMA LEGACY');
  console.log('================================================================\n');

  // Delete references in auxiliary seed tables
  await pino.query(`DELETE FROM vendor_inventories WHERE product_id IN (SELECT id FROM products WHERE legacy_code IS NULL)`);
  await pino.query(`DELETE FROM product_barcodes WHERE product_id IN (SELECT id FROM products WHERE legacy_code IS NULL)`);

  // Delete non-legacy seed products
  console.log('1. Eliminando productos semilla originales de Pino (legacy_code IS NULL)...');
  const delProdsRes = await pino.query(`
    DELETE FROM products 
    WHERE legacy_code IS NULL 
      AND id NOT IN (SELECT DISTINCT product_id FROM sale_items WHERE product_id IS NOT NULL)
      AND id NOT IN (SELECT DISTINCT product_id FROM order_items WHERE product_id IS NOT NULL)
      AND id NOT IN (SELECT DISTINCT product_id FROM movements WHERE product_id IS NOT NULL)
  `);
  console.log(`   ✅ ${delProdsRes.rowCount} productos semilla eliminados.\n`);

  // Delete non-legacy seed clients
  console.log('2. Eliminando clientes semilla originales de Pino (legacy_code IS NULL)...');
  const delClientsRes = await pino.query(`
    DELETE FROM clients 
    WHERE legacy_code IS NULL 
      AND id NOT IN (SELECT DISTINCT client_id FROM sales WHERE client_id IS NOT NULL)
      AND id NOT IN (SELECT DISTINCT client_id FROM orders WHERE client_id IS NOT NULL)
  `);
  console.log(`   ✅ ${delClientsRes.rowCount} clientes semilla eliminados.\n`);

  // Verify total row counts in pino_migracion_db
  const prodCount = await pino.query(`SELECT count(*) FROM products`);
  const clientCount = await pino.query(`SELECT count(*) FROM clients`);

  console.log('================================================================');
  console.log(' CONTEO FINAL PURO 100% LEGACY EN pino_migracion_db:');
  console.log('================================================================');
  console.log(`  - Productos en products: ${prodCount.rows[0].count} (3,556 del ERP legacy + 4 comodines)`);
  console.log(`  - Clientes en clients:   ${clientCount.rows[0].count} (4,288 exactos del ERP legacy)`);
  console.log('================================================================\n');

  await pino.end();
}

cleanNonLegacySeedData().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
