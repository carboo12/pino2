const { Client } = require('pg');

const CONNECTION_STRING = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/sistema_de_inventario';
const STORE_ID = '9321856d-19ba-42b8-ba47-cf35c0d133dd';

const QUERIES_TO_BENCHMARK = [
  {
    name: '1. Listar Clientes Activos por Sucursal',
    sql: 'SELECT * FROM clients WHERE store_id = $1 AND is_active = true ORDER BY name ASC LIMIT 50',
    params: [STORE_ID],
  },
  {
    name: '2. Contar Total Clientes en Sucursal',
    sql: 'SELECT COUNT(*)::int AS total FROM clients WHERE store_id = $1 AND is_active = true',
    params: [STORE_ID],
  },
  {
    name: '3. Catálogo de Productos Activos',
    sql: 'SELECT * FROM products WHERE store_id = $1 AND is_active = true ORDER BY description ASC LIMIT 100',
    params: [STORE_ID],
  },
  {
    name: '4. Pedidos Recientes de la Sucursal',
    sql: 'SELECT * FROM orders WHERE store_id = $1 ORDER BY created_at DESC LIMIT 100',
    params: [STORE_ID],
  },
  {
    name: '5. Ventas / Facturas Emitidas',
    sql: 'SELECT * FROM sales WHERE store_id = $1 ORDER BY created_at DESC LIMIT 100',
    params: [STORE_ID],
  },
  {
    name: '6. Listar Rutas de la Sucursal',
    sql: 'SELECT * FROM routes WHERE store_id = $1 ORDER BY route_date DESC LIMIT 50',
    params: [STORE_ID],
  },
  {
    name: '7. Cuentas por Cobrar Pendientes (CxC)',
    sql: "SELECT * FROM accounts_receivable WHERE store_id = $1 AND status = 'PENDING' ORDER BY due_date ASC",
    params: [STORE_ID],
  },
  {
    name: '8. Cuentas por Pagar Pendientes (CxP)',
    sql: "SELECT * FROM accounts_payable WHERE store_id = $1 AND status = 'PENDING' ORDER BY due_date ASC",
    params: [STORE_ID],
  },
  {
    name: '9. Proveedores Registrados',
    sql: 'SELECT * FROM suppliers ORDER BY name ASC',
    params: [],
  },
  {
    name: '10. Movimientos Kárdex de Inventario',
    sql: 'SELECT * FROM movements WHERE store_id = $1 ORDER BY created_at DESC LIMIT 100',
    params: [STORE_ID],
  },
  {
    name: '11. Usuarios Operativos por Sucursal',
    sql: `SELECT u.id, u.name, u.email, u.role, u.is_active 
          FROM users u 
          JOIN user_stores us ON us.user_id = u.id 
          WHERE us.store_id = $1 AND u.is_active = true`,
    params: [STORE_ID],
  },
  {
    name: '12. Cargas de Camión Activas',
    sql: 'SELECT * FROM cargas_camion WHERE store_id = $1 ORDER BY created_at DESC LIMIT 50',
    params: [STORE_ID],
  },
  {
    name: '13. Arqueo / Turnos de Caja Abiertos',
    sql: "SELECT * FROM cash_shifts WHERE store_id = $1 AND status = 'OPEN'",
    params: [STORE_ID],
  },
  {
    name: '14. Facturas de Proveedor (Recepción Compras)',
    sql: 'SELECT * FROM invoices WHERE store_id = $1 ORDER BY created_at DESC LIMIT 50',
    params: [STORE_ID],
  },
];

async function runBenchmark() {
  const client = new Client({ connectionString: CONNECTION_STRING });
  await client.connect();
  console.log('================================================================');
  console.log('BENCHMARK Y AUDITORÍA DE CONSULTAS SELECT — SISTEMA DE INVENTARIO');
  console.log('================================================================\n');

  const preResults = [];

  for (const item of QUERIES_TO_BENCHMARK) {
    // Warmup
    await client.query(item.sql, item.params);

    const times = [];
    let rowCount = 0;
    for (let i = 0; i < 5; i++) {
      const start = process.hrtime.bigint();
      const res = await client.query(item.sql, item.params);
      const end = process.hrtime.bigint();
      const ms = Number(end - start) / 1e6;
      times.push(ms);
      rowCount = res.rowCount;
    }

    const avgMs = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2);
    const minMs = Math.min(...times).toFixed(2);
    const maxMs = Math.max(...times).toFixed(2);

    const explainRes = await client.query(`EXPLAIN ANALYZE ${item.sql}`, item.params);
    const planLines = explainRes.rows.map(r => r['QUERY PLAN']).join('\n');
    const usesIndex = planLines.includes('Index Scan') || planLines.includes('Bitmap Index Scan') || planLines.includes('Index Only Scan');
    const scanType = usesIndex ? 'INDEX SCAN ⚡' : 'SEQ SCAN ⚠️';

    preResults.push({
      Consulta: item.name,
      'Filas': rowCount,
      'Tiempo Prom (ms)': `${avgMs} ms`,
      'Min (ms)': `${minMs} ms`,
      'Max (ms)': `${maxMs} ms`,
      'Escaneo SQL': scanType,
    });
  }

  console.log('--- MEDICIÓN INICIAL PREVIA A OPTIMIZACIÓN ---');
  console.table(preResults);

  // Creación de índices compuestos para optimización de consultas
  console.log('\n----------------------------------------------------------------');
  console.log('CREANDO E INSTALANDO ÍNDICES DE RENDIMIENTO EN POSTGRESQL...');
  console.log('----------------------------------------------------------------');

  const indexQueries = [
    'CREATE INDEX IF NOT EXISTS idx_clients_store_active ON clients(store_id, is_active);',
    'CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);',
    'CREATE INDEX IF NOT EXISTS idx_products_store_active ON products(store_id, is_active);',
    'CREATE INDEX IF NOT EXISTS idx_orders_store_created ON orders(store_id, created_at DESC);',
    'CREATE INDEX IF NOT EXISTS idx_sales_store_created ON sales(store_id, created_at DESC);',
    'CREATE INDEX IF NOT EXISTS idx_routes_store_date ON routes(store_id, route_date DESC);',
    'CREATE INDEX IF NOT EXISTS idx_cxc_store_status ON accounts_receivable(store_id, status);',
    'CREATE INDEX IF NOT EXISTS idx_cxp_store_status ON accounts_payable(store_id, status);',
    'CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);',
    'CREATE INDEX IF NOT EXISTS idx_movements_store_created ON movements(store_id, created_at DESC);',
    'CREATE INDEX IF NOT EXISTS idx_user_stores_store_user ON user_stores(store_id, user_id);',
    'CREATE INDEX IF NOT EXISTS idx_cargas_camion_store_created ON cargas_camion(store_id, created_at DESC);',
    'CREATE INDEX IF NOT EXISTS idx_cash_shifts_store_status ON cash_shifts(store_id, status);',
    'CREATE INDEX IF NOT EXISTS idx_invoices_store_created ON invoices(store_id, created_at DESC);',
  ];

  for (const idxSql of indexQueries) {
    try {
      await client.query(idxSql);
      console.log(`   ✅ Índice instalado: ${idxSql.replace('CREATE INDEX IF NOT EXISTS ', '')}`);
    } catch (e) {
      console.error(`   ❌ Error: ${e.message}`);
    }
  }

  // Medición post-optimización
  console.log('\n================================================================');
  console.log('RESULTADOS CON ÍNDICES OPTIMIZADOS (POST-OPTIMIZACIÓN)');
  console.log('================================================================\n');

  const postResults = [];

  for (const item of QUERIES_TO_BENCHMARK) {
    await client.query(item.sql, item.params);
    const times = [];
    let rowCount = 0;
    for (let i = 0; i < 5; i++) {
      const start = process.hrtime.bigint();
      const res = await client.query(item.sql, item.params);
      const end = process.hrtime.bigint();
      const ms = Number(end - start) / 1e6;
      times.push(ms);
      rowCount = res.rowCount;
    }

    const avgMs = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2);
    const minMs = Math.min(...times).toFixed(2);
    const maxMs = Math.max(...times).toFixed(2);

    const explainRes = await client.query(`EXPLAIN ANALYZE ${item.sql}`, item.params);
    const planLines = explainRes.rows.map(r => r['QUERY PLAN']).join('\n');
    const usesIndex = planLines.includes('Index Scan') || planLines.includes('Bitmap Index Scan') || planLines.includes('Index Only Scan');
    const scanType = usesIndex ? 'INDEX SCAN ⚡' : 'SEQ SCAN ⚠️';

    postResults.push({
      Consulta: item.name,
      'Filas': rowCount,
      'Tiempo Prom (ms)': `${avgMs} ms`,
      'Min (ms)': `${minMs} ms`,
      'Max (ms)': `${maxMs} ms`,
      'Escaneo SQL': scanType,
    });
  }

  console.table(postResults);

  await client.end();
  console.log('\n✅ BENCHMARK DE CONSULTAS SELECT Y OPTIMIZACIÓN DE ÍNDICES FINALIZADO');
}

runBenchmark().catch(console.error);
