const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
  host: '190.56.16.85', port: 5432, user: 'alacaja', password: '__DB_PASSWORD_PLACEHOLDER__', database: 'multitienda_db'
});

async function run() {
  await client.connect();
  
  // Reseteando contraseña específicamente para admin_test@lospinos.com a '123'
  const hash = await bcrypt.hash('123', 10);
  
  const res = await client.query("UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING email, role", [hash, 'admin_test@lospinos.com']);
  
  if (res.rows.length > 0) {
      console.log("✅ Contraseña reseteada con éxito a '123' para: " + res.rows[0].email);
  } else {
      console.log("❌ No se encontró la cuenta admin_test@lospinos.com");
  }
  
  await client.end();
}

run();
