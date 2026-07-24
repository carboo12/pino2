const { Client } = require('pg');
const bcrypt = require('bcrypt');

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
    const sid = '9321856d-19ba-42b8-ba47-cf35c0d133dd';
    
    const u = [
      { e: 'admin_test@lospinos.com', n: 'Admin Prueba', r: 'Store Administrator', p: 'admin123' },
      { e: 'bodeg@lospinos.com', n: 'Bodeguero Prueba', r: 'Bodeguero', p: 'bodega123' },
      { e: 'vender@lospinos.com', n: 'Vendedor Prueba', r: 'Vendedor Ambulante', p: 'ventas123' },
      { e: 'gestor@lospinos.com', n: 'Gestor Prueba', r: 'Gestor de Ventas', p: 'gestor123' },
      { e: 'rute@lospinos.com', n: 'Rutero Prueba', r: 'Rutero', p: 'ruta123' }
    ];

    for (const item of u) {
      await client.query('DELETE FROM users WHERE email = $1', [item.e]);
      const hp = await bcrypt.hash(item.p, 10);
      
      // Insertar usuario
      await client.query(
        'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)',
        [item.e, hp, item.n, item.r]
      );
      
      // Obtener el ID
      const r = await client.query('SELECT id FROM users WHERE email = $1', [item.e]);
      const uid = r.rows[0].id;
      
      // Asignar tienda
      await client.query('DELETE FROM user_stores WHERE user_id = $1', [uid]);
      await client.query('INSERT INTO user_stores (user_id, store_id) VALUES ($1, $2)', [uid, sid]);
      
      console.log(`CREADO: ${item.e}`);
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await client.end();
  }
}
run();
