const { Pool } = require('pg');
const pool = new Pool({
  host: '190.56.16.85',
  port: 5432,
  user: 'alacaja',
  password: '__DB_PASSWORD_PLACEHOLDER__',
  database: 'multitienda_db'
});

async function check() {
  try {
    const res = await pool.query("SELECT email, password, password_hash FROM users WHERE email IN ('admin@multitienda.com', 'admin_test@lospinos.com', 'vender@lospinos.com', 'bodeg@lospinos.com', 'rute@lospinos.com', 'gestor@lospinos.com')");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

check();
