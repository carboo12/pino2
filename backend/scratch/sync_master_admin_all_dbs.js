const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const databases = ['sistema_de_inventario', 'multitienda_db', 'pino_migracion_db'];

async function syncAll() {
  const email = 'administrador.general@pino.local';
  const name = 'Super Admin';
  const canonicalRole = 'admin';
  const rawPassword = process.env.MASTER_ADMIN_PASSWORD || 'Admin2026!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  for (const dbName of databases) {
    const client = new Client({
      host: process.env.DATABASE_HOST || '190.56.16.85',
      port: Number(process.env.DATABASE_PORT) || 5432,
      user: process.env.DATABASE_USER || 'alacaja',
      password: process.env.DATABASE_PASSWORD || 'HY1kE7TZsyCnfy7stfBhVZoczA02CWd8',
      database: dbName,
      connectionTimeoutMillis: 5000,
    });

    try {
      await client.connect();
      console.log(`\n🔍 Verificando BD: ${dbName}...`);
      
      const checkRes = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      let userId;

      if (checkRes.rows.length > 0) {
        userId = checkRes.rows[0].id;
        await client.query(
          'UPDATE users SET password_hash = $1, name = $2, role = $3, is_active = true, updated_at = NOW() WHERE id = $4',
          [passwordHash, name, canonicalRole, userId]
        );
        console.log(`  ✅ Usuario ${email} actualizado en ${dbName}.`);
      } else {
        userId = uuidv4();
        await client.query(
          'INSERT INTO users (id, email, password_hash, name, role, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())',
          [userId, email, passwordHash, name, canonicalRole, true]
        );
        console.log(`  🚀 Usuario ${email} insertado en ${dbName}.`);
      }

      // Asignar a tiendas si existen
      try {
        const storesRes = await client.query('SELECT id FROM stores LIMIT 10');
        if (storesRes.rows.length > 0) {
          for (const store of storesRes.rows) {
            await client.query(
              'INSERT INTO user_stores (user_id, store_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [userId, store.id]
            );
          }
          console.log(`  🏬 ${storesRes.rows.length} tiendas vinculadas.`);
        }
      } catch (e) {
        // Ignorar si la tabla user_stores no existe en alguna BD antigua
      }

    } catch (err) {
      console.log(`  ⚠️ No se pudo acceder a la BD ${dbName}: ${err.message}`);
    } finally {
      await client.end();
    }
  }
}

syncAll();
