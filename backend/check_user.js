const { Pool } = require('pg');
const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  user: 'pino_app',
  password: 'HY1kE7TZsyCnfy7stfBhVZoczA02CWd8',
  database: 'multitienda_db',
});
pool.query(
  "SELECT u.id, u.email, u.role, array_agg(us.store_id) as store_ids FROM users u LEFT JOIN user_stores us ON us.user_id = u.id WHERE u.email LIKE '%bodeg%' OR u.email LIKE '%lospinos%' GROUP BY u.id, u.email, u.role",
  (err, res) => {
    if (err) { console.error('Error:', err.message); process.exit(1); }
    console.log(JSON.stringify(res.rows, null, 2));
    pool.end();
  }
);
