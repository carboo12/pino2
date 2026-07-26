const { Pool } = require('pg');
const pool = new Pool({
  host: '190.56.16.85',
  port: 5432,
  user: 'alacaja',
  password: 'TuClaveFuerte',
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
