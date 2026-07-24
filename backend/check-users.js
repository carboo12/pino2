const { Client } = require('pg');
require('dotenv').config();

async function checkUsers() {
  const client = new Client({
    connectionString: 'postgresql://alacaja:__DB_PASSWORD_PLACEHOLDER__@190.56.16.85:5432/multitienda_db'
  });
  try {
    await client.connect();
    const res = await client.query('SELECT email, role FROM users');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkUsers();
