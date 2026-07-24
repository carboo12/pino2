const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://alacaja:__DB_PASSWORD_PLACEHOLDER__@190.56.16.85:5432/multitienda_db",
});

async function createTestTicket() {
  try {
    await client.connect();
    
    // 1. Get a storeId
    const storeRes = await client.query("SELECT id FROM stores LIMIT 1");
    const storeId = storeRes.rows[0].id;

    // 2. Get some products from that store
    const prodRes = await client.query("SELECT id, description, sale_price FROM products WHERE store_id = $1 LIMIT 2", [storeId]);
    const items = prodRes.rows.map(p => ({
      productId: p.id,
      description: p.description,
      quantity: 1,
      price: parseFloat(p.sale_price),
      total: parseFloat(p.sale_price)
    }));

    const total = items.reduce((sum, item) => sum + item.total, 0);

    // 3. Insert into pending_orders using correct columns
    const orderRes = await client.query(
      `INSERT INTO pending_orders (store_id, client_name, items, total, status, notes) 
       VALUES ($1, $2, $3, $4, 'Pendiente', 'Test para Verificación de Caja') 
       RETURNING id`,
      [storeId, 'INTEGRACION TEST', JSON.stringify(items), total]
    );

    console.log('Successfully created test ticket:');
    console.log(orderRes.rows[0]);
    console.log('Store ID used:', storeId);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

createTestTicket();
