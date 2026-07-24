const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

const client = new Client({
  connectionString: "postgresql://alacaja:__DB_PASSWORD_PLACEHOLDER__@190.56.16.85:5432/multitienda_db",
});

async function populateWarehouse() {
  try {
    await client.connect();
    const storeId = '9321856d-19ba-42b8-ba47-cf35c0d133dd';
    
    const scenarios = [
      { name: 'PEDIDO CALLE - JUAN PEREZ', status: 'RECIBIDO', total: 450.00 },
      { name: 'CLIENTE MAYORISTA - MERCADITO EL SOL', status: 'EN_PREPARACION', total: 1250.75 },
      { name: 'PREVENTA ZONA NORTE - DOÑA MARIA', status: 'ALISTADO', total: 320.40 },
      { name: 'DISTRIBUCION OESTE - RUTA 5', status: 'CARGADO_CAMION', total: 890.00 },
      { name: 'NUEVO PEDIDO MOVIL - TIENDA SUR', status: 'RECIBIDO', total: 125.00 }
    ];

    for (const scene of scenarios) {
      const orderId = uuidv4();
      
      // Insert Order
      await client.query(
        `INSERT INTO orders (id, store_id, client_name, total, status, payment_type, notes) 
         VALUES ($1, $2, $3, $4, $5, 'CONTADO', 'Inyectado por Antigravity para Test de Bodega')`,
        [orderId, storeId, scene.name, scene.total, scene.status]
      );

      // Add a generic item to each order
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) 
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, '6126fa44-f3e8-421e-a1de-d7d1557bcdff', 1, scene.total, scene.total]
      );
      
      console.log(`Created order for ${scene.name} with status ${scene.status}`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

populateWarehouse();
