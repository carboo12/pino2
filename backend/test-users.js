
const { Pool } = require('pg');
const pool = new Pool({
  host: '190.56.16.85',
  port: 5432,
  user: 'alacaja',
  password: '__DB_PASSWORD_PLACEHOLDER__',
  database: 'multitienda_db'
});
pool.query('SELECT * FROM user_stores', (err, res) => {
  if (err) throw err;
  console.table(res.rows);
  pool.end();
});

