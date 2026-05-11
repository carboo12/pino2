const { Client } = require('pg');
const client = new Client({
  host: '190.56.16.85',
  port: 5432,
  user: 'alacaja',
  password: 'TuClaveFuerte',
  database: 'multitienda_db'
});
async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT u.email, u.role, us.store_id 
    FROM users u 
    LEFT JOIN user_stores us ON u.id = us.user_id 
    WHERE u.email = 'bodeg@lospinos.com' OR u.email = 'bodeguero@tienda.com'
  `);
  console.log(res.rows);
  await client.end();
}
run();
