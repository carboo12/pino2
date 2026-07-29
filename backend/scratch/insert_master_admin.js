const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function createMasterAdmin() {
  const dbConfig = {
    host: process.env.DATABASE_HOST || '190.56.16.85',
    port: Number(process.env.DATABASE_PORT) || 5432,
    user: process.env.DATABASE_USER || 'alacaja',
    password: process.env.DATABASE_PASSWORD || 'HY1kE7TZsyCnfy7stfBhVZoczA02CWd8',
    database: process.env.DATABASE_NAME || 'sistema_de_inventario',
    connectionTimeoutMillis: 10000,
  };

  let client = new Client(dbConfig);

  const email = 'administrador.general@pino.local';
  const name = 'Super Admin';
  const rawRole = 'master-admin';
  const canonicalRole = 'admin'; // canonical role
  const rawPassword = process.env.MASTER_ADMIN_PASSWORD || 'Admin2026!';

  try {
    console.log(`🔌 Conectando a la base de datos (${dbConfig.host}:${dbConfig.port}/${dbConfig.database})...`);
    await client.connect();
    console.log('✅ Conexión establecida a la base de datos.');

    const checkRes = await client.query('SELECT id, email, role FROM users WHERE email = $1', [email]);

    const passwordHash = await bcrypt.hash(rawPassword, 10);

    let userId;
    if (checkRes.rows.length > 0) {
      userId = checkRes.rows[0].id;
      console.log(`ℹ️ Usuario ${email} ya existe. Actualizando contraseña, rol y estado activo...`);
      await client.query(
        'UPDATE users SET password_hash = $1, name = $2, role = $3, is_active = true, updated_at = NOW() WHERE id = $4',
        [passwordHash, name, canonicalRole, userId]
      );
      console.log('✅ Usuario actualizado correctamente.');
    } else {
      userId = uuidv4();
      console.log(`🚀 Insertando nuevo usuario ${email}...`);
      await client.query(
        'INSERT INTO users (id, email, password_hash, name, role, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())',
        [userId, email, passwordHash, name, canonicalRole, true]
      );
      console.log('✅ Usuario insertado correctamente.');
    }

    // Verificar si existe la tabla stores / user_stores y asignar la primera tienda o todas las tiendas
    const storesRes = await client.query('SELECT id FROM stores LIMIT 10');
    if (storesRes.rows.length > 0) {
      for (const store of storesRes.rows) {
        await client.query(
          'INSERT INTO user_stores (user_id, store_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userId, store.id]
        );
      }
      console.log(`✅ Asignadas ${storesRes.rows.length} tiendas al usuario ${email}.`);
    }

    console.log('\n========================================');
    console.log('🎉 REGISTRO DE SUPER ADMIN COMPLETADO');
    console.log('========================================');
    console.log(`📧 Email:    ${email}`);
    console.log(`👤 Nombre:   ${name}`);
    console.log(`🔑 Pass:     ${rawPassword}`);
    console.log(`🛡️ Rol:      ${canonicalRole} (${rawRole})`);
    console.log('========================================\n');

  } catch (err) {
    console.error('❌ Error al insertar usuario en la BD:', err.message);
  } finally {
    await client.end();
  }
}

createMasterAdmin();
