const { Client } = require('pg');

const PINO_CONN = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/pino_migracion_db';

async function purgeAllTestSeedData() {
  const pino = new Client({ connectionString: PINO_CONN });
  await pino.connect();

  console.log('================================================================');
  console.log(' DEPURACIÓN TOTAL DE DATOS DE PRUEBA / SEMILLA EN pino_migracion_db');
  console.log('================================================================\n');

  // Clear references in sales, orders & aux tables
  await pino.query(`UPDATE sales SET cash_shift_id = NULL`);
  await pino.query(`UPDATE sales SET cashier_id = NULL WHERE cashier_id IN (SELECT id FROM users WHERE legacy_vendor_code IS NULL)`);
  await pino.query(`UPDATE orders SET vendor_id = NULL WHERE vendor_id IN (SELECT id FROM users WHERE legacy_vendor_code IS NULL)`);
  await pino.query(`DELETE FROM accounts_receivable WHERE order_id IN (SELECT id FROM orders WHERE legacy_doc_number IS NULL)`);
  await pino.query(`DELETE FROM pending_deliveries WHERE order_id IN (SELECT id FROM orders WHERE legacy_doc_number IS NULL)`);
  await pino.query(`DELETE FROM cash_shifts`);
  await pino.query(`DELETE FROM user_stores WHERE user_id IN (SELECT id FROM users WHERE legacy_vendor_code IS NULL)`);

  // 1. Clean Users: Keep only users mapped from legacy or active admin
  console.log('1. Depurando usuarios de prueba (users)...');
  const delUsersRes = await pino.query(`
    DELETE FROM users 
    WHERE legacy_vendor_code IS NULL 
      AND email != 'admin@multitienda.com'
  `);
  console.log(`   ✅ ${delUsersRes.rowCount} usuarios de prueba eliminados.`);

  // 2. Clean Departments: Keep only departments mapped from legacy
  console.log('2. Depurando categorías/departamentos de prueba (departments)...');
  await pino.query(`UPDATE products SET department_id = NULL WHERE department_id IN (SELECT id FROM departments WHERE description NOT LIKE 'Migrado desde grupo legacy%')`);
  const delDeptsRes = await pino.query(`
    DELETE FROM departments 
    WHERE description NOT LIKE 'Migrado desde grupo legacy%'
  `);
  console.log(`   ✅ ${delDeptsRes.rowCount} departamentos de prueba eliminados.`);

  // 3. Clean Suppliers: Keep only suppliers mapped from legacy
  console.log('3. Depurando proveedores de prueba (suppliers)...');
  await pino.query(`UPDATE products SET supplier_id = NULL WHERE supplier_id IN (SELECT id FROM suppliers WHERE legacy_code IS NULL)`);
  const delSuppliersRes = await pino.query(`
    DELETE FROM suppliers 
    WHERE legacy_code IS NULL
  `);
  console.log(`   ✅ ${delSuppliersRes.rowCount} proveedores de prueba eliminados.`);

  // 4. Clean any remaining unmapped test sales/orders if any
  console.log('4. Verificando transacciones de prueba...');
  const delSalesRes = await pino.query(`DELETE FROM sales WHERE legacy_doc_number IS NULL AND ticket_number NOT LIKE '0%'`);
  const delOrdersRes = await pino.query(`DELETE FROM orders WHERE legacy_doc_number IS NULL AND tipo_pedido NOT IN ('PED', 'ESP')`);
  console.log(`   ✅ Transacciones de prueba depuradas (Sales: ${delSalesRes.rowCount}, Orders: ${delOrdersRes.rowCount}).`);

  // 5. Final Row Count Audit
  console.log('\n================================================================');
  console.log(' CONTEO AUDITADO DEFINITIVO DE pino_migracion_db (100% PURO LEGACY):');
  console.log('================================================================');

  const tablesToAudit = [
    { name: 'movements', label: 'Movimientos de Kárdex' },
    { name: 'sale_items', label: 'Renglones de Venta' },
    { name: 'order_items', label: 'Renglones de Pedido' },
    { name: 'sales', label: 'Encabezados de Venta' },
    { name: 'orders', label: 'Encabezados de Pedidos' },
    { name: 'legacy_audit_logs', label: 'Logs de Auditoría (tranuser)' },
    { name: 'legacy_operclit_ext', label: 'Extensión Facturas (operclit_ext)' },
    { name: 'legacy_cargos', label: 'Cargos y Servicios (cargodet)' },
    { name: 'expenses', label: 'Gastos Operativos (gastarti)' },
    { name: 'clients', label: 'Catálogo de Clientes (cliempre)' },
    { name: 'products', label: 'Catálogo de Productos (articulo)' },
    { name: 'legacy_cuadres_caja', label: 'Cuadres de Caja (syh_cuadre_caja)' },
    { name: 'legacy_notas_credito', label: 'Notas de Crédito (notascre_aplic)' },
    { name: 'returns', label: 'Devoluciones (devolti)' },
    { name: 'suppliers', label: 'Proveedores (suplidor)' },
    { name: 'departments', label: 'Departamentos (grupos)' },
    { name: 'users', label: 'Usuarios / Vendedores (listvend)' },
  ];

  for (const t of tablesToAudit) {
    const res = await pino.query(`SELECT count(*) FROM public."${t.name}"`);
    const cnt = parseInt(res.rows[0].count, 10);
    console.log(`  - ${t.label.padEnd(40)}: ${cnt.toLocaleString().padStart(10)} filas`);
  }

  console.log('================================================================\n');

  await pino.end();
}

purgeAllTestSeedData().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
