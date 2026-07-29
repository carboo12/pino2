const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function seedCloudSQL() {
  const dbConfig = {
    host: '34.31.112.238',
    port: 5432,
    user: 'postgres',
    password: 'Pino2CloudSQL2026!',
    database: 'studio-9680180520-dbbe0-db',
    connectionTimeoutMillis: 10000,
    ssl: false,
  };

  const client = new Client(dbConfig);

  const email = 'administrador.general@pino.local';
  const name = 'Super Admin';
  const canonicalRole = 'admin';
  const rawPassword = 'Admin2026!';

  try {
    console.log(`🔌 Conectando a Cloud SQL Firebase Data Connect (${dbConfig.host}:${dbConfig.port}/${dbConfig.database})...`);
    await client.connect();
    console.log('✅ Conexión establecida exitosamente con Cloud SQL.');

    const passHash = await bcrypt.hash(rawPassword, 10);
    const userId = uuidv4();

    // 1. Agregar columnas requeridas por el backend a la tabla users de Cloud SQL
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT NOW()');

    // Insertar o actualizar el Super Admin
    const checkUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkUser.rows.length === 0) {
      console.log(`🚀 Insertando Super Admin (${email}) en Cloud SQL...`);
      await client.query(
        `INSERT INTO users (id, email, password_hash, name, role, active, is_active, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()::text, NOW())`,
        [userId, email, passHash, name, canonicalRole, true, true]
      );
      console.log('✅ Super Admin insertado en Cloud SQL.');
    } else {
      console.log(`ℹ️ Super Admin (${email}) ya existía en Cloud SQL. Actualizando credenciales...`);
      await client.query(
        `UPDATE users SET password_hash = $1, name = $2, role = $3, active = true, is_active = true WHERE email = $4`,
        [passHash, name, canonicalRole, email]
      );
      console.log('✅ Credenciales actualizadas en Cloud SQL.');
    }

    // 2. Insertar Tiendas de prueba en Cloud SQL si no existen
    const checkStores = await client.query('SELECT id FROM stores LIMIT 1');
    if (checkStores.rows.length === 0) {
      console.log('🛒 Insertando Tiendas de prueba en Cloud SQL...');
      const storeId1 = uuidv4();
      const storeId2 = uuidv4();
      await client.query(
        `INSERT INTO stores (id, name, code, active, created_at) VALUES 
         ($1, 'Tienda Central Pino', 'STORE-001', true, NOW()::text),
         ($2, 'Sucursal Norte', 'STORE-002', true, NOW()::text)`,
        [storeId1, storeId2]
      );
      console.log('✅ Tiendas creadas en Cloud SQL.');
    }

    // 3. Crear tabla user_stores en Cloud SQL si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_stores (
        user_id text NOT NULL,
        store_id text NOT NULL,
        PRIMARY KEY (user_id, store_id)
      )
    `);

    const allStores = await client.query('SELECT id FROM stores');
    const uRes = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (uRes.rows.length > 0 && allStores.rows.length > 0) {
      const uId = uRes.rows[0].id;
      for (const s of allStores.rows) {
        await client.query(
          'INSERT INTO user_stores (user_id, store_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [uId, s.id]
        );
      }
      console.log('✅ Tiendas vinculadas al Super Admin en Cloud SQL.');
    }

    console.log('\n======================================================');
    console.log('🎉 REGISTRO EN CLOUD SQL (FIREBASE DATA CONNECT) OK!');
    console.log('======================================================');
    console.log(`📧 Email:    ${email}`);
    console.log(`🔑 Pass:     ${rawPassword}`);
    console.log(`🛡️ Rol:      ${canonicalRole}`);
    console.log('======================================================\n');

  } catch (err) {
    console.error('❌ Error al conectar o registrar en Cloud SQL:', err.message);
  } finally {
    await client.end();
  }
}

seedCloudSQL();
