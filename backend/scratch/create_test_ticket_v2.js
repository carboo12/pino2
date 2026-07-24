const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://alacaja:__DB_PASSWORD_PLACEHOLDER__@190.56.16.85:5432/multitienda_db",
});

async function createTestTicket() {
  try {
    await client.connect();
    
    // Correct storeId for 'cajero@tienda.com'
    const storeId = '4e2d3397-c839-493a-b908-88251ae05924';

    // 2. Get some products from that store
    const prodRes = await client.query("SELECT id, description, sale_price FROM products WHERE store_id = $1 LIMIT 3", [storeId]);
    
    if (prodRes.rowCount === 0) {
        // Fallback: search for any products if specific store has none
        console.log('No products in store, searching globally...');
        const globalRes = await client.query("SELECT id, description, sale_price FROM products LIMIT 3");
        prodRes.rows = globalRes.rows;
    }

    const items = prodRes.rows.map(p => ({
      productId: p.id,
      description: p.description,
      quantity: 1,
      price: parseFloat(p.sale_price),
      total: parseFloat(p.sale_price)
    }));

    const total = items.reduce((sum, item) => sum + item.total, 0);

    // 3. Insert into pending_orders
    const orderRes = await client.query(
      `INSERT INTO pending_orders (store_id, client_name, items, total, status, notes) 
       VALUES ($1, $2, $3, $4, 'Pendiente', 'Test Final de Integración') 
       RETURNING id`,
      [storeId, 'GUSTAVO LIRA (TEST)', JSON.stringify(items), total]
    );

    console.log('Successfully created test ticket for Los Pinos - Sur:');
    console.log(orderRes.rows[0]);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

createTestTicket();
