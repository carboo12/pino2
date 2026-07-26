const { Client } = require('pg');

const DB_CONN = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/sistema_de_inventario';
const STORE_ID = '9321856d-19ba-42b8-ba47-cf35c0d133dd';

async function assignStoresToUsers() {
  const client = new Client({ connectionString: DB_CONN });
  await client.connect();

  console.log('================================================================');
  console.log('  VINCULANDO TIENDA PRINCIPAL A LOS 6 USUARIOS CANÓNICOS');
  console.log('================================================================\n');

  const emails = [
    'dueno@lospinos.com',
    'admin@multitienda.com',
    'bodeg@lospinos.com',
    'cajero@tienda.com',
    'gestor@lospinos.com',
    'rute@lospinos.com'
  ];

  for (const email of emails) {
    const userRes = await client.query('SELECT id, email, role FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      console.log(`⚠️ Usuario ${email} no encontrado.`);
      continue;
    }

    const u = userRes.rows[0];
    // Check user_stores
    const storeLink = await client.query('SELECT * FROM user_stores WHERE user_id = $1 AND store_id = $2', [u.id, STORE_ID]);
    if (storeLink.rows.length === 0) {
      await client.query('INSERT INTO user_stores (id, user_id, store_id) VALUES (gen_random_uuid(), $1, $2)', [u.id, STORE_ID]);
      console.log(`  ✅ Tienda ${STORE_ID} vinculada exitosamente a ${email} (${u.role})`);
    } else {
      console.log(`  - Usuario ${email} (${u.role}) ya tiene la tienda vinculada.`);
    }
  }

  await client.end();
  console.log('\n================================================================');
  console.log('  ✅ VINCULACIÓN COMPLETADA EN POSTGRESQL');
  console.log('================================================================');
}

assignStoresToUsers().catch(console.error);
