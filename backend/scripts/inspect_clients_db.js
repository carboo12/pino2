const { Client } = require('pg');

const DB_CONN = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/sistema_de_inventario';
const STORE_ID = '9321856d-19ba-42b8-ba47-cf35c0d133dd';

async function inspectClients() {
  const client = new Client({ connectionString: DB_CONN });
  await client.connect();

  console.log('================================================================');
  console.log('  INSPECCIONANDO CLIENTES Y STORE_ID EN POSTGRESQL');
  console.log('================================================================\n');

  const total = await client.query('SELECT COUNT(*) FROM clients');
  console.log(`Total Clientes en DB: ${total.rows[0].count}`);

  const storeClients = await client.query('SELECT COUNT(*) FROM clients WHERE store_id = $1', [STORE_ID]);
  console.log(`Clientes con store_id '${STORE_ID}': ${storeClients.rows[0].count}`);

  const nullStoreClients = await client.query('SELECT COUNT(*) FROM clients WHERE store_id IS NULL');
  console.log(`Clientes con store_id NULL: ${nullStoreClients.rows[0].count}`);

  const byStore = await client.query('SELECT store_id, COUNT(*) FROM clients GROUP BY store_id');
  console.log('\nDesglose de clientes por store_id:');
  console.table(byStore.rows);

  const sample = await client.query('SELECT id, name, code, store_id FROM clients LIMIT 10');
  console.log('\nMuestra de 10 clientes:');
  console.table(sample.rows);

  await client.end();
}

inspectClients().catch(console.error);
