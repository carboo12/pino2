const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: '34.31.112.238',
    user: 'postgres',
    password: 'Pino2CloudSQL2026!',
    database: 'studio-9680180520-dbbe0-db',
  });

  await client.connect();
  console.log('🔌 Conectando a Cloud SQL para asegurar todas las tablas del sistema...');

  const queries = [
    // 1. CHAINS
    `CREATE TABLE IF NOT EXISTS chains (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      created_at TEXT NOT NULL DEFAULT NOW()::text
    );`,

    // 2. AUTHORIZATIONS
    `CREATE TABLE IF NOT EXISTS authorizations (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      store_id TEXT NOT NULL,
      requester_id TEXT,
      type TEXT NOT NULL,
      details JSONB DEFAULT '{}'::jsonb,
      status TEXT NOT NULL DEFAULT 'PENDING',
      resolution_note TEXT,
      reviewed_by TEXT,
      reviewed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    // 3. CLIENTS
    `CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      store_id TEXT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      email TEXT,
      type TEXT DEFAULT 'REGULAR',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    // 4. CASH SHIFTS (Cajas)
    `CREATE TABLE IF NOT EXISTS cash_shifts (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      store_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      start_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
      end_amount DOUBLE PRECISION,
      status TEXT NOT NULL DEFAULT 'OPEN',
      opened_at TIMESTAMP DEFAULT NOW(),
      closed_at TIMESTAMP,
      notes TEXT
    );`,

    // 5. EXPENSES
    `CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      store_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      amount DOUBLE PRECISION NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    // 6. PROMOTIONS
    `CREATE TABLE IF NOT EXISTS promotions (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      store_id TEXT NOT NULL,
      name TEXT NOT NULL,
      discount_percentage DOUBLE PRECISION NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    // 7. ZONES & SUBZONES
    `CREATE TABLE IF NOT EXISTS zones (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT NOT NULL,
      code TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS sub_zones (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      zone_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    // 8. VEHICLES
    `CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      store_id TEXT NOT NULL,
      plate_number TEXT NOT NULL,
      model TEXT,
      status TEXT DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    // 9. ACCOUNTS RECEIVABLE & PAYABLE
    `CREATE TABLE IF NOT EXISTS accounts_receivable (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      store_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      total_amount DOUBLE PRECISION NOT NULL,
      balance DOUBLE PRECISION NOT NULL,
      status TEXT DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS accounts_payable (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      store_id TEXT NOT NULL,
      supplier_id TEXT NOT NULL,
      total_amount DOUBLE PRECISION NOT NULL,
      balance DOUBLE PRECISION NOT NULL,
      status TEXT DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    // 10. SYNC OUTBOX & INBOX & STATUS
    `CREATE TABLE IF NOT EXISTS sync_outbox (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      store_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      payload JSONB NOT NULL,
      published_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS sync_inbox (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      store_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      payload JSONB NOT NULL,
      processed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS sync_status (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      store_id TEXT NOT NULL,
      last_sync TIMESTAMP DEFAULT NOW()
    );`,

    // 11. VISIT LOGS
    `CREATE TABLE IF NOT EXISTS visit_logs (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      store_id TEXT NOT NULL,
      vendor_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    // 12. VENDOR INVENTORIES
    `CREATE TABLE IF NOT EXISTS vendor_inventories (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      vendor_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    // 13. PURCHASE ORDERS
    `CREATE TABLE IF NOT EXISTS purchase_orders (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      store_id TEXT NOT NULL,
      supplier_id TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      total DOUBLE PRECISION NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    // 14. ROUTE CLIENTS
    `CREATE TABLE IF NOT EXISTS route_clients (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      route_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      visit_order INT DEFAULT 0
    );`,

    // 15. DAILY CLOSINGS
    `CREATE TABLE IF NOT EXISTS daily_closings (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      store_id TEXT NOT NULL,
      closing_date DATE NOT NULL DEFAULT CURRENT_DATE,
      total_sales DOUBLE PRECISION DEFAULT 0,
      total_expenses DOUBLE PRECISION DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    // 16. ARQUEOS
    `CREATE TABLE IF NOT EXISTS arqueos (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      store_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      expected_amount DOUBLE PRECISION NOT NULL,
      actual_amount DOUBLE PRECISION NOT NULL,
      difference DOUBLE PRECISION NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    // 17. CARGAS CAMION
    `CREATE TABLE IF NOT EXISTS cargas_camion (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      store_id TEXT NOT NULL,
      route_id TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    // 18. LIQUIDACIONES RUTA
    `CREATE TABLE IF NOT EXISTS liquidaciones_ruta (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      store_id TEXT NOT NULL,
      route_id TEXT NOT NULL,
      status TEXT DEFAULT 'DRAFT',
      created_at TIMESTAMP DEFAULT NOW()
    );`
  ];

  for (const q of queries) {
    try {
      await client.query(q);
    } catch (err) {
      console.error('Error creando estructura:', err.message);
    }
  }

  console.log('🎉 Estructura de base de datos completa asegurada en Cloud SQL.');
  await client.end();
}

main().catch((err) => {
  console.error('❌ Error migrando Cloud SQL:', err);
  process.exit(1);
});
