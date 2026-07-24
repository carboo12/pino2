const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://alacaja:__DB_PASSWORD_PLACEHOLDER__@190.56.16.85:5432/multitienda_db'
});
client.connect().then(async () => {
  const res = await client.query(`
    SELECT u.id, u.email, u.role, us.store_id 
    FROM users u 
    LEFT JOIN user_stores us ON u.id = us.user_id 
    WHERE u.email = 'test-audit@pino.com'
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
