const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/multitienda_db',
});
pool.query(
  "SELECT u.id, u.email, u.role, (SELECT array_agg(us.store_id) FROM user_stores us WHERE us.user_id = u.id) as store_ids FROM users u WHERE u.email LIKE '%bodeg%' OR u.email LIKE '%lospinos%'",
  (err, res) => {
    if (err) { console.error('Error:', err.message); process.exit(1); }
    console.log(JSON.stringify(res.rows, null, 2));
    pool.end();
  }
);
