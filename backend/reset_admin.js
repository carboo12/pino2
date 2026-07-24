const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
  host: '190.56.16.85',
  port: 5432,
  user: 'alacaja',
  password: '__DB_PASSWORD_PLACEHOLDER__',
  database: 'multitienda_db'
});

async function run() {
  try {
    await client.connect();
    const salt = await bcrypt.genSalt(10);
    const hashAdmin123 = await bcrypt.hash('admin123', salt);
    await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hashAdmin123, 'admin@multitienda.com']);
    console.log("admin@multitienda.com actualizado a admin123");
  } finally {
    await client.end();
  }
}
run();
