const { Pool } = require('C:/Users/carlo/OneDrive/Documents/Distri/pino2/backend/node_modules/pg');

const pool = new Pool({
  host: '34.31.112.238',
  port: 5432,
  user: 'postgres',
  password: 'Pino2CloudSQL2026!',
  database: 'studio-9680180520-dbbe0-db',
});

async function testRoutesQuery() {
  try {
    const storeId = 'a3fccd8c-9a87-45b9-91a5-908f98339945';
    console.log('Testing routes query...');
    const sql = `
      SELECT r.*,
             COALESCE(
               jsonb_agg(rc.client_id::text ORDER BY rc.visit_order)
                 FILTER (WHERE rc.client_id IS NOT NULL),
               '[]'::jsonb
             ) AS normalized_client_ids
        FROM routes r
        LEFT JOIN route_clients rc ON rc.route_id = r.id
       WHERE r.store_id = $1
       GROUP BY r.id ORDER BY r.route_date DESC, r.created_at DESC`;
    const res = await pool.query(sql, [storeId]);
    console.log('Routes query result:', res.rows.length);
  } catch (err) {
    console.error('Routes query ERROR:', err.message);
  }

  try {
    console.log('Testing pending-orders query...');
    const sql2 = `SELECT * FROM orders WHERE status = 'Pendiente'`;
    const res2 = await pool.query(sql2);
    console.log('Orders query result:', res2.rows.length);
  } catch (err) {
    console.error('Orders query ERROR:', err.message);
  } finally {
    await pool.end();
  }
}

testRoutesQuery();
