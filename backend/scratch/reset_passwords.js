const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
  host: '190.56.16.85', port: 5432, user: 'alacaja', password: '__DB_PASSWORD_PLACEHOLDER__', database: 'multitienda_db'
});

async function run() {
  await client.connect();
  
  // Establecer todas las contraseñas a '123' para facilitar pruebas
  const hash = await bcrypt.hash('123', 10);
  
  await client.query("UPDATE users SET password_hash = $1", [hash]);
  
  console.log("✅ Todas las contraseñas han sido reseteadas a: 123");
  
  await client.end();
}

run();
