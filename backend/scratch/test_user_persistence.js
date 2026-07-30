const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcrypt');

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || '34.57.199.231',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Pino2_2026_SecureKey',
  database: process.env.DB_NAME || 'pino2_db',
  ssl: false,
};

async function testUserPersistence() {
  const client = new Client(dbConfig);
  console.log('🔌 Conectando a Cloud SQL para prueba de persistencia de Usuarios...');
  await client.connect();

  try {
    const testEmail = `test_user_${Date.now()}@pino.local`;
    const testName = 'Usuario Prueba Persistencia';
    const testRole = 'admin'; // canonical role

    console.log(`\n1️⃣ Creando usuario de prueba (${testEmail})...`);
    const passwordHash = await bcrypt.hash('123456', 10);
    const insertRes = await client.query(
      `INSERT INTO users (email, password_hash, name, role) 
       VALUES ($1, $2, $3, $4) RETURNING id, email, name, role`,
      [testEmail, passwordHash, testName, testRole]
    );

    const createdUser = insertRes.rows[0];
    console.log('✅ Usuario creado exitosamente:', createdUser);

    // Obtener la primera tienda
    const storeRes = await client.query('SELECT id, name FROM stores LIMIT 1');
    if (storeRes.rows.length > 0) {
      const storeId = storeRes.rows[0].id;
      console.log(`\n2️⃣ Vinculando usuario ${createdUser.id} a tienda ${storeRes.rows[0].name} (${storeId})...`);
      
      await client.query(
        'INSERT INTO user_stores (user_id, store_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [createdUser.id, storeId]
      );

      const linkRes = await client.query(
        'SELECT u.email, s.name as store_name FROM user_stores us JOIN users u ON u.id = us.user_id JOIN stores s ON s.id = us.store_id WHERE u.id = $1',
        [createdUser.id]
      );
      console.log('✅ Vinculación a tienda verificada:', linkRes.rows);
    }

    console.log(`\n3️⃣ Actualizando usuario (${createdUser.id})...`);
    const updateRes = await client.query(
      `UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, role`,
      ['Usuario Prueba Persistencia ACTUALIZADO', createdUser.id]
    );
    console.log('✅ Usuario actualizado exitosamente:', updateRes.rows[0]);

    console.log(`\n4️⃣ Eliminando usuario de prueba (${createdUser.id})...`);
    await client.query('DELETE FROM user_stores WHERE user_id = $1', [createdUser.id]);
    await client.query('DELETE FROM users WHERE id = $1', [createdUser.id]);
    console.log('✅ Usuario y vinculaciones eliminados de la base de datos.');

    console.log('\n🎉 PRUEBA DE PERSISTENCIA DE USUARIOS COMPLETADA CON ÉXITO.');
  } catch (err) {
    console.error('❌ Error durante la prueba de persistencia:', err);
  } finally {
    await client.end();
  }
}

testUserPersistence();
