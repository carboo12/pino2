const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function seedAdmin() {
  const client = new Client({
    host: '190.56.16.85',
    port: 5432,
    user: 'alacaja',
    password: '__DB_PASSWORD_PLACEHOLDER__',
    database: 'multitienda_db',
  });

  try {
    await client.connect();
    console.log('✅ Conectado para seed de administrador');

    // Email del admin
    const email = 'admin@multitienda.com';

    // Verificar si ya existe
    const res = await client.query('SELECT id FROM users WHERE email = $1', [email]);

    if (res.rows.length === 0) {
      const id = uuidv4();
      const passHash = await bcrypt.hash('Admin@2026', 10);
      
      await client.query(
        'INSERT INTO users (id, email, password_hash, name, role, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())',
        [id, email, passHash, 'Administrador del Sistema', 'master-admin', true]
      );
      
      console.log('✅ Usuario Administrador Creado:');
      console.log('📧 Correo: admin@multitienda.com');
      console.log('🔑 Pass:   Admin@2026');
    } else {
      console.log('ℹ️  El usuario administrador ya existe.');
    }
  } catch (error) {
    console.error('❌ Error en el seed:', error.message);
  } finally {
    await client.end();
  }
}

seedAdmin();
