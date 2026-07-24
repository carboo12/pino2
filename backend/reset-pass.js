const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function resetAdminPassword() {
  const client = new Client({
    connectionString: 'postgresql://alacaja:__DB_PASSWORD_PLACEHOLDER__@190.56.16.85:5432/multitienda_db'
  });
  try {
    await client.connect();
    const hash = await bcrypt.hash('123', 10);
    const res = await client.query(
      "UPDATE users SET password_hash = $1 RETURNING id",
      [hash]
    );
    console.log(`✅ ${res.rowCount} users passwords updated to 123`);
    
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

resetAdminPassword();
