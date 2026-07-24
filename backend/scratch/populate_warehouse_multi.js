const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

const client = new Client({
  connectionString: "postgresql://alacaja:__DB_PASSWORD_PLACEHOLDER__@190.56.16.85:5432/multitienda_db",
});

async function populateWarehouse() {
  try {
    await client.connect();
    const storeId = '9321856d-19ba-42b8-ba47-cf35c0d133dd';
    const orderId = uuidv4();
    
    // Insert Order
    await client.query(
    `INSERT INTO orders (id, store_id, client_name, total, status, payment_type, notes) VALUES ($1, $2, $3, $4, $5, 'CONTADO', 'Inyectado por Antigravity para Test de Bodega MultiProducto')`,
    [orderId, storeId, 'SUPERMERCADO CENTRAL (Multi-Producto)', 5850.50, 'EN_PREPARACION']
    );

    // Obtener algunos productos de esta tienda
    const productsRes = await client.query('SELECT * FROM products WHERE store_id = $1 LIMIT 5', [storeId]);
    
    if (productsRes.rows.length > 0) {
        for (let i = 0; i < productsRes.rows.length; i++) {
        const p = productsRes.rows[i];
        
        // Cantidades asimétricas para forzar bultos + unidades sueltas
        // Ejemplo: Si trae 12 por bulto y le pedimos 27, debe calcular 2 bultos + 3 unidades.
        const quantity = (i + 1) * 15 + (i % 2 === 0 ? 3 : 0); 
        const defaultSubtotal = p.sale_price * quantity;
        
        await client.query(
            `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES ($1, $2, $3, $4, $5)`,
            [orderId, p.id, quantity, p.sale_price, defaultSubtotal]
        );
        console.log(`Added product ${p.description} - qty: ${quantity}`);
        }
    } else {
         // Fallback al producto generico
         await client.query(
            `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES ($1, $2, $3, $4, $5)`,
            [orderId, '6126fa44-f3e8-421e-a1de-d7d1557bcdff', 48, 150.00, 7200.00]
        );
         await client.query(
            `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES ($1, $2, $3, $4, $5)`,
            [orderId, '4fa6e431-be2d-4bfb-bd55-eb54e4708ff8', 15, 20.00, 300.00]
        );
    }
    
    console.log('Multi-product order created successfully!');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

populateWarehouse();
