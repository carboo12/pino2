const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  user: 'alacaja',
  host: '190.56.16.85',
  database: 'multitienda_db',
  password: '__DB_PASSWORD_PLACEHOLDER__',
  port: 5432,
});

async function main() {
  const users = [
    { email: 'admin_test@lospinos.com', role: 'store-admin', pass: '123', name: 'Administrador' }, // Gestión de tienda, Inventario, Ventas
    { email: 'bodeg@lospinos.com', role: 'inventory', pass: '123', name: 'Bodeguero' }, // Control de Stock
    { email: 'vender@lospinos.com', role: 'cashier', pass: '123', name: 'Vendedor' }, // Punto de Venta
    { email: 'gestor@lospinos.com', role: 'sales-manager', pass: '123', name: 'Gestor Ventas' }, // Reportes
    { email: 'dueno@lospinos.com', role: 'master-admin', pass: '123', name: 'Dueño Maestro' }, // Multitienda control global
  ];

  try {
    const storeRes = await pool.query('SELECT id FROM stores LIMIT 1');
    const storeId = storeRes.rows[0]?.id;
    if (!storeId) throw new Error('No stores found');

    for (const u of users) {
      const hash = await bcrypt.hash(u.pass, 10);
      const exists = await pool.query('SELECT id FROM users WHERE email = $1', [u.email]);
      
      if (exists.rowCount > 0) {
        await pool.query('UPDATE users SET password_hash = $1, role = $2 WHERE email = $3', [hash, u.role, u.email]);
        console.log(`Updated user ${u.email}`);
      } else {
        await pool.query(
          'INSERT INTO users (name, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, true)',
          [u.name, u.email, hash, u.role]
        );
        console.log(`Created user ${u.email}`);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
main();
