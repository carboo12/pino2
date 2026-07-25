const { Client } = require('pg');
const c = new Client({
  host: '190.56.16.85',
  port: 5432,
  database: 'multitienda_db',
  user: 'pino_app',
  password: 'HY1kE7TZsyCnfy7stfBhVZoczA02CWd8'
});

async function run() {
  await c.connect();
  console.log('=== CONECTADO ===');

  // 1. Tablas
  const tables = await c.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`);
  console.log('\n=== TABLAS (' + tables.rows.length + ') ===');
  tables.rows.forEach(r => console.log('  ' + r.table_name));

  // 2. Columnas de products
  const prodCols = await c.query(`SELECT column_name, data_type, is_nullable, column_default, generation_expression FROM information_schema.columns WHERE table_name='products' ORDER BY ordinal_position`);
  console.log('\n=== COLUMNAS DE products ===');
  prodCols.rows.forEach(r => console.log(`  ${r.column_name} | ${r.data_type} | nullable:${r.is_nullable} | default:${r.column_default || '-'} | generated:${r.generation_expression || '-'}`));

  // 3. Constraints de products
  const constraints = await c.query(`SELECT conname, contype, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid='products'::regclass ORDER BY conname`);
  console.log('\n=== CONSTRAINTS DE products ===');
  constraints.rows.forEach(r => console.log(`  ${r.conname} (${r.contype}): ${r.def}`));

  // 4. Verificar handles_bulk y stock
  const bulkStats = await c.query(`SELECT handles_bulk, COUNT(*) as cnt, AVG(units_per_bulk) as avg_upb FROM products GROUP BY handles_bulk`);
  console.log('\n=== ESTADISTICAS handles_bulk ===');
  bulkStats.rows.forEach(r => console.log(`  handles_bulk=${r.handles_bulk}: ${r.cnt} productos, avg_upb=${parseFloat(r.avg_upb).toFixed(1)}`));

  // 5. Verificar stock_bulks y stock_units GENERATED
  const stockCheck = await c.query(`SELECT id, description, current_stock, stock_bulks, stock_units, units_per_bulk, handles_bulk FROM products WHERE handles_bulk = true LIMIT 10`);
  console.log('\n=== PRODUCTOS CON handles_bulk=true (max 10) ===');
  stockCheck.rows.forEach(r => console.log(`  [${r.id}] ${r.description}: stock=${r.current_stock}, bulks=${r.stock_bulks}, units=${r.stock_units}, upb=${r.units_per_bulk}`));

  // 6. Columnas de order_items
  const oiCols = await c.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='order_items' AND column_name LIKE '%bulk%' OR (table_name='order_items' AND column_name LIKE '%unit%') ORDER BY column_name`);
  console.log('\n=== order_items columnas bulk/unit ===');
  oiCols.rows.forEach(r => console.log(`  ${r.column_name} | ${r.data_type}`));

  // 7. Columnas de sale_items
  const siCols = await c.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='sale_items' AND column_name LIKE '%bulk%' OR (table_name='sale_items' AND column_name LIKE '%unit%') ORDER BY column_name`);
  console.log('\n=== sale_items columnas bulk/unit ===');
  siCols.rows.forEach(r => console.log(`  ${r.column_name} | ${r.data_type}`));

  // 8. Columnas de movements
  const mvCols = await c.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='movements' AND (column_name LIKE '%bulk%' OR column_name LIKE '%unit%' OR column_name LIKE '%snapshot%') ORDER BY column_name`);
  console.log('\n=== movements columnas bulk/unit/snapshot ===');
  mvCols.rows.forEach(r => console.log(`  ${r.column_name} | ${r.data_type}`));

  // 9. Indices existentes
  const idxs = await c.query(`SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('products','order_items','sale_items','movements','outbox_events','inventory_ledger') AND schemaname='public' ORDER BY tablename, indexname`);
  console.log('\n=== INDICES RELEVANTES ===');
  idxs.rows.forEach(r => console.log(`  ${r.indexname}`));

  // 10. Verificar mismatches
  const mismatches = await c.query(`SELECT COUNT(*) as cnt FROM products WHERE handles_bulk = true AND (stock_bulks != current_stock / units_per_bulk OR stock_units != current_stock % units_per_bulk)`);
  console.log('\n=== MISMATCHES stock GENERATED ===');
  console.log('  Mismatches:', mismatches.rows[0].cnt);

  // 11. Outbox pendientes
  try {
    const outbox = await c.query(`SELECT status, COUNT(*) as cnt FROM outbox_events GROUP BY status`);
    console.log('\n=== OUTBOX STATUS ===');
    outbox.rows.forEach(r => console.log(`  ${r.status}: ${r.cnt}`));
  } catch(e) {
    console.log('\n=== OUTBOX: tabla no existe o error ===');
  }

  // 12. Total registros clave
  const counts = await c.query(`
    SELECT 'products' as t, COUNT(*) as c FROM products
    UNION ALL SELECT 'orders', COUNT(*) FROM orders
    UNION ALL SELECT 'order_items', COUNT(*) FROM order_items
    UNION ALL SELECT 'sales', COUNT(*) FROM sales
    UNION ALL SELECT 'sale_items', COUNT(*) FROM sale_items
    UNION ALL SELECT 'movements', COUNT(*) FROM movements
    UNION ALL SELECT 'users', COUNT(*) FROM users
    UNION ALL SELECT 'stores', COUNT(*) FROM stores
    UNION ALL SELECT 'clients', COUNT(*) FROM clients
  `);
  console.log('\n=== CONTEOS ===');
  counts.rows.forEach(r => console.log(`  ${r.t}: ${r.c}`));

  await c.end();
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
