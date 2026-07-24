const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
  host: '190.56.16.85',
  port: 5432,
  user: 'alacaja',
  password: '__DB_PASSWORD_PLACEHOLDER__',
  database: 'multitienda_db'
});

async function run() {
  try {
    await client.connect();
    console.log("Conectado a la BD para reset masivo");

    const salt = await bcrypt.genSalt(10);
    const hash123 = await bcrypt.hash('123', salt);

    const res = await client.query('UPDATE users SET password_hash = $1', [hash123]);
    console.log(`Éxito: Se han actualizado ${res.rowCount} cuentas con la contraseña '123'.`);

  } catch (error) {
    console.error("Error durante el reset masivo:", error);
  } finally {
    await client.end();
  }
}

run();
