const { Client } = require('pg');

const client = new Client({
  host: '190.56.16.85',
  port: 5432,
  user: 'alacaja',
  password: 'TuClaveFuerte',
  database: 'multitienda_db'
});

async function run() {
  try {
    await client.connect();
    
    const storeRes = await client.query('SELECT id FROM stores LIMIT 1');
    const storeId = storeRes.rows[0].id;

    // Get all users
    const users = await client.query("SELECT * FROM users WHERE email='bodeg@lospinos.com'");
    if (users.rowCount > 0) {
       const u = users.rows[0];
       const link = await client.query("SELECT * FROM user_stores WHERE user_id=$1", [u.id]);
       if (link.rowCount === 0) {
          await client.query("INSERT INTO user_stores (user_id, store_id) VALUES ($1, $2)", [u.id, storeId]);
          console.log("Assigned store to bodeg@lospinos.com");
       } else {
          console.log("bodeg@lospinos.com already has a store");
       }
    } else {
       console.log("bodeg@lospinos.com not found");
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

run();
