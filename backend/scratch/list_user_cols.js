const { Pool } = require('pg');
const pool = new Pool({
  host: '190.56.16.85', port: 5432, user: 'alacaja', password: '__DB_PASSWORD_PLACEHOLDER__', database: 'multitienda_db'
});
pool.query("SELECT * FROM users LIMIT 1").then(res => {
  console.log("COLUMNS:", Object.keys(res.rows[0]));
}).catch(console.error).finally(() => pool.end());
