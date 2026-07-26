const { Client } = require('pg');

const BASE_CONN = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/postgres';

async function cloneToSistemaInventario() {
  const client = new Client({ connectionString: BASE_CONN });
  await client.connect();

  console.log('================================================================');
  console.log(' CLONANDO pino_migracion_db -> sistema_de_inventario');
  console.log('================================================================\n');

  // Terminate active connections to pino_migracion_db
  console.log('1. Cerrando conexiones activas en pino_migracion_db...');
  await client.query(`
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = 'pino_migracion_db'
      AND pid <> pg_backend_pid();
  `);

  // Drop target DB if exists
  console.log('2. Preparando la base de datos de destino (sistema_de_inventario)...');
  await client.query(`DROP DATABASE IF EXISTS sistema_de_inventario WITH (FORCE);`);

  // Clone database
  console.log('3. Duplicando pino_migracion_db como sistema_de_inventario (TEMPLATE)...');
  await client.query(`CREATE DATABASE sistema_de_inventario WITH TEMPLATE pino_migracion_db OWNER alacaja;`);
  console.log('   ✅ Base de datos sistema_de_inventario creada exitosamente.\n');

  await client.end();

  // Verify clone contents
  const cloneClient = new Client({
    connectionString: 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/sistema_de_inventario'
  });
  await cloneClient.connect();

  console.log('================================================================');
  console.log(' VERIFICACIÓN DE AUDITORÍA EN sistema_de_inventario:');
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
    const res = await cloneClient.query(`SELECT count(*) FROM public."${t.name}"`);
    const cnt = parseInt(res.rows[0].count, 10);
    console.log(`  - ${t.label.padEnd(40)}: ${cnt.toLocaleString().padStart(10)} filas`);
  }

  console.log('================================================================\n');

  await cloneClient.end();
}

cloneToSistemaInventario().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
