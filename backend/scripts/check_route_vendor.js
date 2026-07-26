const { Client } = require('pg');
const client = new Client({
  connectionString:
    'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/sistema_de_inventario',
});

client.connect().then(async () => {
  const u = await client.query('SELECT * FROM users WHERE id = $1', [
    '8628c4f1-51bb-4055-88d3-7e3c8bacef41',
  ]);
  console.log('USER FROM DB BY ID:', u.rows[0]);

  const allU = await client.query('SELECT id, name, role, store_id FROM users');
  console.log('ALL USERS IN DB:', allU.rows);

  client.end();
});
