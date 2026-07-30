const { Pool } = require('C:/Users/carlo/OneDrive/Documents/Distri/pino2/backend/node_modules/pg');

const pool = new Pool({
  host: '34.31.112.238',
  port: 5432,
  user: 'postgres',
  password: 'Pino2CloudSQL2026!',
  database: 'studio-9680180520-dbbe0-db',
});

async function fixConstraints() {
  try {
    console.log('1. Setting DEFAULT true for active...');
    await pool.query('ALTER TABLE users ALTER COLUMN active SET DEFAULT true');
    await pool.query('UPDATE users SET active = true WHERE active IS NULL');

    console.log('2. Setting DEFAULT true for is_active...');
    await pool.query('ALTER TABLE users ALTER COLUMN is_active SET DEFAULT true');
    await pool.query('UPDATE users SET is_active = true WHERE is_active IS NULL');

    console.log('3. Setting DEFAULT NOW()::text for created_at...');
    await pool.query("ALTER TABLE users ALTER COLUMN created_at SET DEFAULT NOW()::text");
    await pool.query("UPDATE users SET created_at = NOW()::text WHERE created_at IS NULL");

    console.log('Database defaults successfully applied to users table!');
  } catch (err) {
    console.error('Error applying DB defaults:', err.message);
  } finally {
    await pool.end();
  }
}

fixConstraints();
