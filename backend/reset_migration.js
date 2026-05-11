const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://alacaja:TuClaveFuerte@190.56.16.85:5432/multitienda_db'
});
client.connect().then(async () => {
  await client.query("DELETE FROM schema_migrations WHERE filename = '2026-05-04_ensure_operational.sql'");
  console.log('Deleted migration record');
  await client.end();
});
