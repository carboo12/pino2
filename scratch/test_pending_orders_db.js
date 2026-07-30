const { Pool } = require('C:/Users/carlo/OneDrive/Documents/Distri/pino2/backend/node_modules/pg');

const pool = new Pool({
  host: '34.31.112.238',
  port: 5432,
  user: 'postgres',
  password: 'Pino2CloudSQL2026!',
  database: 'studio-9680180520-dbbe0-db',
});

async function testPendingOrders() {
  try {
    console.log('Inspecting pending_orders columns...');
    const cols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pending_orders'
      ORDER BY ordinal_position
    `);
    console.table(cols.rows);

    console.log('Running query...');
    const res = await pool.query(`
      SELECT po.*, COALESCE(c.name, po.client_name) as client_name 
      FROM pending_orders po 
      LEFT JOIN clients c ON po.client_id::text = c.id::text
      ORDER BY po.created_at DESC
    `);
    console.log('Query success! Total rows:', res.rows.length);
  } catch (err) {
    console.error('Pending orders DB ERROR:', err.message);
  } finally {
    await pool.end();
  }
}

testPendingOrders();
