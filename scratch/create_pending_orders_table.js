const { Pool } = require('C:/Users/carlo/OneDrive/Documents/Distri/pino2/backend/node_modules/pg');

const pool = new Pool({
  host: '34.31.112.238',
  port: 5432,
  user: 'postgres',
  password: 'Pino2CloudSQL2026!',
  database: 'studio-9680180520-dbbe0-db',
});

async function createPendingOrdersTable() {
  try {
    console.log('Creating pending_orders table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pending_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id TEXT NOT NULL,
        client_id TEXT,
        client_name TEXT,
        items JSONB DEFAULT '[]'::jsonb,
        total NUMERIC(12, 2) DEFAULT 0,
        notes TEXT,
        payment_method TEXT DEFAULT 'Efectivo',
        status TEXT DEFAULT 'Pendiente',
        dispatched_by TEXT,
        dispatched_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('pending_orders table created successfully!');
  } catch (err) {
    console.error('Error creating pending_orders table:', err.message);
  } finally {
    await pool.end();
  }
}

createPendingOrdersTable();
