const { Pool } = require('C:/Users/carlo/OneDrive/Documents/Distri/pino2/backend/node_modules/pg');

const pool = new Pool({
  host: '34.31.112.238',
  port: 5432,
  user: 'postgres',
  password: 'Pino2CloudSQL2026!',
  database: 'studio-9680180520-dbbe0-db',
});

async function check() {
  try {
    const res = await pool.query('SELECT id, email, role, name FROM users LIMIT 10');
    console.log('Users in Cloud SQL:');
    console.table(res.rows);
  } catch (err) {
    console.error('DB Query error:', err.message);
  } finally {
    await pool.end();
  }
}

check();
