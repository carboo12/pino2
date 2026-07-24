const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
  host: '190.56.16.85',
  port: 5432,
  user: 'alacaja',
  password: '__DB_PASSWORD_PLACEHOLDER__',
  database: 'multitienda_db'
});

const usersToUpdate = [
  'admin_test@lospinos.com',
  'bodeg@lospinos.com',
  'vender@lospinos.com',
  'gestor@lospinos.com',
  'rute@lospinos.com',
  'admin@multitienda.com'
];

async function run() {
  try {
    await client.connect();
    console.log("Conectado a la BD");

    const salt = await bcrypt.genSalt(10);
    const hash123 = await bcrypt.hash('123', salt);

    for (const email of usersToUpdate) {
      const res = await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash123, email]);
      if (res.rowCount > 0) {
        console.log(`Contraseña actualizada para: ${email}`);
      } else {
        console.log(`Usuario no encontrado: ${email}`);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

run();
