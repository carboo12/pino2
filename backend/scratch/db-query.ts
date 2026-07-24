import { Client } from 'pg';

async function run() {
  const client = new Client({
    connectionString: "postgresql://alacaja:__DB_PASSWORD_PLACEHOLDER__@190.56.16.85:5432/multitienda_db",
  });
  await client.connect();
  const res = await client.query('SELECT email, role FROM users LIMIT 5;');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

run().catch(console.error);
