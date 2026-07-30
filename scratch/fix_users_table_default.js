const { Pool } = require('C:/Users/carlo/OneDrive/Documents/Distri/pino2/backend/node_modules/pg');

const pool = new Pool({
  host: '34.31.112.238',
  port: 5432,
  user: 'postgres',
  password: 'Pino2CloudSQL2026!',
  database: 'studio-9680180520-dbbe0-db',
});

async function setUsersIdDefault() {
  try {
    await pool.query('ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid()');
    console.log('Successfully set DEFAULT gen_random_uuid() for users.id column!');
  } catch (err) {
    console.error('Error setting default:', err.message);
  } finally {
    await pool.end();
  }
}

setUsersIdDefault();
