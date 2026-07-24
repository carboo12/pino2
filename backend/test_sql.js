const { Pool } = require('pg');
const pool = new Pool({ host: '190.56.16.85', port: 5432, user: 'alacaja', password: '__DB_PASSWORD_PLACEHOLDER__', database: 'multitienda_db' });

async function run() {
  try {
    const res = await pool.query(`
      SELECT pd.*, COALESCE(c.name, o.client_name) as client_name, COALESCE(pd.address, c.address) as client_address, o.total as order_total, o.sales_manager_name, o.payment_type,
        COALESCE(
          json_agg(
            json_build_object(
              'id', COALESCE(oi.id, oi.product_id),
              'productId', oi.product_id,
              'description', COALESCE(p.description, 'Producto'),
              'quantity', oi.quantity,
              'salePrice', oi.unit_price
            )
            ORDER BY oi.id
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) as items
      FROM pending_deliveries pd 
      LEFT JOIN clients c ON pd.client_id = c.id 
      LEFT JOIN orders o ON pd.order_id = o.id 
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE pd.store_id = '9321856d-19ba-42b8-ba47-cf35c0d133dd'
      GROUP BY pd.id, c.name, c.address, o.client_name, o.total, o.sales_manager_name, o.payment_type
      ORDER BY pd.created_at DESC
    `);
    console.log("SUCCESS:", res.rowCount);
  } catch(e) {
    console.error("ERROR:", e.message);
  } finally {
    pool.end();
  }
}
run();
