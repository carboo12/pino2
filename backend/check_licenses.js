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
    console.log('=== TIENDAS ===');
    const stores = await client.query('SELECT id, name, store_type FROM stores ORDER BY name');
    stores.rows.forEach(r => console.log(r.id, '-', r.name, `(${r.store_type || 'sin tipo'})`));

    console.log('\n=== LICENCIAS EXISTENTES ===');
    const lic = await client.query('SELECT id, store_id, status, expires_at FROM licenses');
    if (lic.rows.length === 0) {
      console.log('Ninguna licencia encontrada');
    } else {
      lic.rows.forEach(r => console.log(r.id, '- store:', r.store_id, '- status:', r.status, '- expires:', r.expires_at));
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

run();
