const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    process.env[key] = process.env[key] || rawValue.replace(/^["']|["']$/g, '');
  }
}

const client = new Client({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT || 5432),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

async function run() {
  try {
    await client.connect();
    console.log('✅ Conectado a la BD');

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    const { rows } = await client.query('SELECT filename FROM schema_migrations');
    const appliedMigrations = new Set(rows.map(r => r.filename));

    const files = fs.readdirSync(__dirname)
      .filter(f => f.endsWith('.sql'))
      .sort(); // ensures they run in alphabetical order

    let appliedCount = 0;

    for (const file of files) {
      if (!appliedMigrations.has(file)) {
        console.log(`🔄 Ejecutando migración: ${file}`);
        const sql = fs.readFileSync(path.join(__dirname, file), 'utf-8');
        
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query(
            `INSERT INTO schema_migrations (filename) VALUES ($1)`,
            [file],
          );
          await client.query('COMMIT');
          console.log(`✅ Migración aplicada exitosamente: ${file}`);
          appliedCount++;
        } catch (err) {
          await client.query('ROLLBACK');
          console.error(`❌ Error en migración ${file}:`, err.message);
          throw err;
        }
      }
    }

    if (appliedCount === 0) {
      console.log('✨ Base de datos al día. No hay migraciones pendientes.');
    } else {
      console.log(`🎉 Se aplicaron ${appliedCount} migraciones exitosamente.`);
    }

  } catch (error) {
    console.error('❌ Error general de migraciones:', error.message);
    await client.end().catch(() => {});
    process.exit(1);
    return;
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error('❌ Error fatal:', error.message);
  process.exit(1);
});
