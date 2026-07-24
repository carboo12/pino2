const { Client } = require('pg');

const client = new Client({
  host: '190.56.16.85',
  port: 5432,
  user: 'alacaja',
  password: '__DB_PASSWORD_PLACEHOLDER__',
  database: 'multitienda_db'
});

async function cleanData() {
  console.log('🚀 Iniciando limpieza PROFUNDA de datos operacionales...');
  
  try {
    await client.connect();
    
    const tablesToTruncate = [
      'sale_items',
      'sales',
      'order_items',
      'orders',
      'order_status_history',
      'movements',
      'vendor_inventories',
      'account_payments',
      'accounts_receivable',
      'payable_payments',
      'accounts_payable',
      'collections',
      'daily_closings',
      'notifications',
      'device_tokens',
      'sync_status',
      'sync_logs',
      'consultasql_historial',
      'returns',
      'return_items',
      'pending_orders',
      'pending_deliveries',
      'inventory_adjustments',
      'visit_logs',
      'cash_shifts',
      'invoice_items',
      'invoices',
      'expenses',
      'error_logs',
      'clients' // Limpiamos clientes para flujo 100% desde cero
    ];

    console.log('📦 Truncando tablas operacionales...');
    for (const table of tablesToTruncate) {
        try {
            await client.query(`TRUNCATE TABLE ${table} CASCADE`);
            console.log(` ✅ Tabla ${table} limpiada.`);
        } catch (e) {
            console.warn(` ⚠️ No se pudo limpiar tabla ${table}: ${e.message}`);
        }
    }

    console.log('🔄 Reiniciando stock de productos a 0...');
    try {
        await client.query('UPDATE products SET current_stock = 0, stock_units = 0, stock_bulks = 0');
        console.log(' ✅ Stock de productos (current_stock, units, bulks) reiniciado a 0.');
    } catch (e) {
        console.warn(' ⚠️ Error al reiniciar stock de productos:', e.message);
    }

    console.log('\n✨ Limpieza COMPLETA aplicada.');
    console.log('Preservados: Usuarios, Tiendas, Roles, Cadenas, Zonas y Catálogo de Productos.');

  } catch (err) {
    console.error('❌ Error fatal durante la limpieza:', err);
  } finally {
    await client.end();
  }
}

cleanData();
