const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
  connectionString: "postgresql://alacaja:__DB_PASSWORD_PLACEHOLDER__@190.56.16.85:5432/multitienda_db",
  connectionTimeoutMillis: 10000,
});

async function verifyPassword() {
  try {
    await client.connect();
    const email = 'cajero@tienda.com';
    const res = await client.query("SELECT password_hash FROM users WHERE email = $1", [email]);
    
    if (res.rowCount === 0) {
       console.log('User not found');
       return;
    }

    const hash = res.rows[0].password_hash;
    const match = await bcrypt.compare('123', hash);
    console.log(`Password '123' matches hash for ${email}: ${match}`);
    
    if (!match) {
        console.log('Password does not match. Attempting to set password to 123 for testing...');
        const newHash = await bcrypt.hash('123', 10);
        await client.query("UPDATE users SET password_hash = $1 WHERE email = $2", [newHash, email]);
        console.log('Password updated to 123 for cajero@tienda.com');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

verifyPassword();
