const { Client } = require('pg');

const client = new Client({
  host: '190.56.16.85',
  port: 5432,
  user: 'alacaja',
  password: '__DB_PASSWORD_PLACEHOLDER__',
  database: 'multitienda_db'
});

const STORE_ID = '9321856d-19ba-42b8-ba47-cf35c0d133dd'; // Central
const RUTERO_ID = '79a5fbab-a931-43d8-997c-4ec21f4057b9'; // Rutero Prueba
const PRODUCT_IDS = [
  '1d22abef-8422-485f-9e35-1cfd526a3e26', // Frijoles
  '2e7860f1-89bf-4e7e-9136-84e6b63e9b89'  // Coca Cola
];

async function simulate() {
  console.log('🚀 Iniciando SIMULACIÓN DE FLUJO EMPRESARIAL (Realista)...');
  await client.connect();

  try {
    // 1. ABASTECIMIENTO DE BODEGA
    console.log('--- [Escenario 1: Abastecimiento] ---');
    for (const pid of PRODUCT_IDS) {
        await client.query(`UPDATE products SET current_stock = 1000, stock_units = 1000 WHERE id = $1`, [pid]);
        await client.query(`
            INSERT INTO movements (store_id, product_id, type, quantity, reference, balance, balance_units, created_at)
            VALUES ($1, $2, 'ADJUSTMENT', 1000, 'Abastecimiento de Bodega', 1000, 1000, NOW())
        `, [STORE_ID, pid]);
    }
    console.log('✅ Bodega abastecida.');

    // 2. ASIGNACIÓN A RUTERO
    console.log('--- [Escenario 2: Asignación a Rutero] ---');
    for (const pid of PRODUCT_IDS) {
        await client.query(`UPDATE products SET current_stock = current_stock - 100 WHERE id = $1`, [pid]);
        await client.query(`
            INSERT INTO vendor_inventories (store_id, vendor_id, product_id, assigned_quantity, current_quantity)
            VALUES ($1, $2, $3, 100, 100)
        `, [STORE_ID, RUTERO_ID, pid]);
        
        await client.query(`
            INSERT INTO movements (store_id, product_id, user_id, type, quantity, reference, balance, balance_units)
            VALUES ($1, $2, $3, 'TRANSFER', 100, 'Carga Mañana', 100, 100)
        `, [STORE_ID, pid, RUTERO_ID]);
    }
    console.log('✅ Rutero recibió carga.');

    // 3. OPERACIÓN DE CAMPO
    console.log('--- [Escenario 3: Ventas y Pedidos] ---');
    const clientRes = await client.query(`
        INSERT INTO clients (store_id, name, phone, address)
        VALUES ($1, 'Pulpería Doña María', '8888-0001', 'Barrio San Carlos')
        RETURNING id
    `, [STORE_ID]);
    const clientId = clientRes.rows[0].id;

    // 3.1 Venta Contado (Usando tabla orders/order_items)
    const sale1Total = 35 * 10;
    const sale1Res = await client.query(`
        INSERT INTO orders (store_id, client_id, vendor_id, total, payment_type, status, created_at)
        VALUES ($1, $2, $3, $4, 'CASH', 'COMPLETED', NOW())
        RETURNING id
    `, [STORE_ID, clientId, RUTERO_ID, sale1Total]);
    const orderId1 = sale1Res.rows[0].id;

    await client.query(`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES ($1, $2, 10, 35.00)
    `, [orderId1, PRODUCT_IDS[0]]);

    await client.query(`
        UPDATE vendor_inventories SET current_quantity = current_quantity - 10, sold_quantity = sold_quantity + 10
        WHERE vendor_id = $1 AND product_id = $2
    `, [RUTERO_ID, PRODUCT_IDS[0]]);
    console.log(`✅ Venta Contado: C$ ${sale1Total}`);

    // 3.2 Venta Crédito
    const sale2Total = 45 * 20;
    const sale2Res = await client.query(`
        INSERT INTO orders (store_id, client_id, vendor_id, total, payment_type, status, created_at)
        VALUES ($1, $2, $3, $4, 'CREDIT', 'COMPLETED', NOW())
        RETURNING id
    `, [STORE_ID, clientId, RUTERO_ID, sale2Total]);
    const orderId2 = sale2Res.rows[0].id;

    await client.query(`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES ($1, $2, 20, 45.00)
    `, [orderId2, PRODUCT_IDS[1]]);

    await client.query(`
        UPDATE vendor_inventories SET current_quantity = current_quantity - 20, sold_quantity = sold_quantity + 20
        WHERE vendor_id = $1 AND product_id = $2
    `, [RUTERO_ID, PRODUCT_IDS[1]]);

    // Generar CXC
    const arRes = await client.query(`
        INSERT INTO accounts_receivable (store_id, client_id, order_id, total_amount, remaining_amount, status)
        VALUES ($1, $2, $3, $4, $5, 'PENDING')
        RETURNING id
    `, [STORE_ID, clientId, orderId2, sale2Total, sale2Total]);
    const arId = arRes.rows[0].id;
    console.log(`✅ Venta Crédito: C$ ${sale2Total}`);

    // 4. ABONO
    console.log('--- [Escenario 4: Cobranza] ---');
    const paymentAmount = 250;
    await client.query(`
        INSERT INTO account_payments (account_id, amount, payment_method, collected_by)
        VALUES ($1, $2, 'CASH', $3)
    `, [arId, paymentAmount, RUTERO_ID]);

    await client.query(`
        UPDATE accounts_receivable SET remaining_amount = remaining_amount - $1, status = 'PARTIAL'
        WHERE id = $2
    `, [paymentAmount, arId]);

    await client.query(`
        INSERT INTO collections (store_id, rutero_id, client_id, account_id, amount, payment_method)
        VALUES ($1, $2, $3, $4, $5, 'CASH')
    `, [STORE_ID, RUTERO_ID, clientId, arId, paymentAmount]);
    console.log(`✅ Abono recibido: C$ ${paymentAmount}`);

    // 5. CIERRE
    console.log('--- [Escenario 5: Cierre de Caja] ---');
    const totalCash = sale1Total + paymentAmount;
    await client.query(`
        INSERT INTO daily_closings (store_id, rutero_id, total_sales, total_collections, cash_total, closing_date)
        VALUES ($1, $2, $3, $4, $5, NOW())
    `, [STORE_ID, RUTERO_ID, sale1Total + sale2Total, paymentAmount, totalCash]);
    console.log(`✅ Cierre de caja registrado.`);

    console.log('\n✨ SIMULACIÓN COMPLETADA SIN ERRORES.');

  } catch (err) {
    console.error('❌ Error en simulación:', err);
  } finally {
    await client.end();
  }
}

simulate();
