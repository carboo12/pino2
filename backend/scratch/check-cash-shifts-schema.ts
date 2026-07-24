import { Client } from 'pg';

async function checkSchema() {
  const client = new Client({
    connectionString: "postgresql://alacaja:__DB_PASSWORD_PLACEHOLDER__@190.56.16.85:5432/multitienda_db",
  });
  await client.connect();
  const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'cash_shifts'");
  console.log(res.rows.map(r => r.column_name));
  await client.end();
}

checkSchema().catch(console.error);
