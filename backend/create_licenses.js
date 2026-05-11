const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
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

const { Client: PgClient } = require('pg');
const client = new PgClient({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT || 5432),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

async function run() {
  try {
    await client.connect();
    const { rows: stores } = await client.query('SELECT id, name FROM stores ORDER BY name');
    console.log('Creando licencias para', stores.length, 'tiendas...');
    for (const store of stores) {
      const existing = await client.query('SELECT id FROM licenses WHERE store_id = $1', [store.id]);
      if (existing.rows.length > 0) {
        console.log('Ya existe licencia para:', store.name);
        continue;
      }
      const key = 'PINO-' + store.id.substring(0, 8).toUpperCase();
      await client.query(
        `INSERT INTO licenses (store_id, license_key, status, type, start_date, end_date, max_users)
         VALUES ($1, $2, 'Activa', 'premium', NOW(), NOW() + INTERVAL '1 year', 10)`,
        [store.id, key]
      );
      console.log('Creada licencia para:', store.name, '- Key:', key);
    }
    console.log('\nLicencias actuales:');
    const { rows: lic } = await client.query(
      'SELECT l.id, s.name, l.license_key, l.status, l.end_date FROM licenses l JOIN stores s ON s.id = l.store_id'
    );
    lic.forEach(r => console.log('  -', r.name, '|', r.license_key, '|', r.status, '| vence:', r.end_date));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

run();
