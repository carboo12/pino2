const { Client } = require('pg');

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
    console.log("Conectado a la BD para asignar tiendas...");

    // Obtener la primera tienda
    const storeRes = await client.query('SELECT id FROM stores LIMIT 1');
    if (storeRes.rowCount === 0) {
      console.log("No hay tiendas");
      return;
    }
    const storeId = storeRes.rows[0].id;

    // Buscar usuarios que no tienen tienda asignada
    const usersRes = await client.query(`
      SELECT u.id, u.email FROM users u
      LEFT JOIN user_stores us ON u.id = us.user_id
      WHERE us.store_id IS NULL AND u.role NOT IN ('master-admin')
    `);

    console.log(`Encontrados ${usersRes.rowCount} usuarios sin tienda asignada.`);

    for (const user of usersRes.rows) {
      await client.query('INSERT INTO user_stores (user_id, store_id) VALUES ($1, $2)', [user.id, storeId]);
      console.log(`Tienda asignada a: ${user.email}`);
    }

    console.log("Proceso terminado.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

run();
