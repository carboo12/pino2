const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://alacaja:__DB_PASSWORD_PLACEHOLDER__@190.56.16.85:5432/multitienda_db",
  connectionTimeoutMillis: 10000,
});

async function checkUsers() {
  try {
    await client.connect();
    console.log('Connected to DB');
    const res = await client.query("SELECT email, role, name FROM users WHERE is_active = true LIMIT 10");
    console.log('Users found:');
    console.table(res.rows);
  } catch (err) {
    console.error('Error connecting to DB:', err);
  } finally {
    await client.end();
  }
}

checkUsers();
