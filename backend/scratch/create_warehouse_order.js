const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

const client = new Client({
  connectionString: "postgresql://alacaja:__DB_PASSWORD_PLACEHOLDER__@190.56.16.85:5432/multitienda_db",
});

async function createWarehouseOrder() {
  try {
    await client.connect();
    
    const storeId = '9321856d-19ba-42b8-ba47-cf35c0d133dd';
    const orderId = uuidv4();
    
    // 1. Insert order
    await client.query(
      `INSERT INTO orders (id, store_id, client_name, total, status, payment_type, notes) 
       VALUES ($1, $2, $3, $4, 'RECIBIDO', 'CONTADO', 'Pedido de Prueba para Bodega')`,
      [orderId, storeId, 'PREVENTA TEST GUSTAVO', 177.50]
    );

    // 2. Insert order items
    // Product 1: Detergente Omo 500g (32.00)
    await client.query(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) 
       VALUES ($1, $2, $3, $4, $5)`,
      [orderId, '6126fa44-f3e8-421e-a1de-d7d1557bcdff', 1, 32.00, 32.00]
    );

    // Product 2: Arroz Faisán 10lb (145.50)
    await client.query(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) 
       VALUES ($1, $2, $3, $4, $5)`,
      [orderId, '23712fdb-85fd-4f9e-90ea-4acc48b372d3', 1, 145.50, 145.50]
    );

    console.log('Successfully created warehouse order:', orderId);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

createWarehouseOrder();
