const { Pool } = require('C:/Users/carlo/OneDrive/Documents/Distri/pino2/backend/node_modules/pg');
const bcrypt = require('C:/Users/carlo/OneDrive/Documents/Distri/pino2/backend/node_modules/bcrypt');

const pool = new Pool({
  host: '34.31.112.238',
  port: 5432,
  user: 'postgres',
  password: 'Pino2CloudSQL2026!',
  database: 'studio-9680180520-dbbe0-db',
});

async function resetPass() {
  try {
    const hash = await bcrypt.hash('Admin123!', 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, 'reinazelva@gmail.com']);
    console.log('Password for reinazelva@gmail.com updated to Admin123!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

resetPass();
