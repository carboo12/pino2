const axios = require('axios');
const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

const API_BASE = 'http://localhost:3010/api';
const DB_CONN = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/sistema_de_inventario';
const STORE_ID = '9321856d-19ba-42b8-ba47-cf35c0d133dd';

async function runE2eAndCleanup() {
  console.log('================================================================');
  console.log('  PRUEBA OPERATIVA E2E Y LIMPIEZA POSTERIOR DE DATOS');
  console.log('================================================================\n');

  const client = new Client({ connectionString: DB_CONN });
  await client.connect();

  const createdIds = {
    productId: null,
    orderId: null,
    externalOrderId: null,
    cargaId: null,
    liquidacionId: null,
  };

  try {
    // 1. Login como Jefe de Bodega (admin)
    console.log('1. Autenticando usuarios de prueba...');
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'dueno@lospinos.com',
      password: '123',
    });
    const adminToken = adminLogin.data.accessToken;

    const gestorLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'gestor@lospinos.com',
      password: '123',
    });
    const gestorToken = gestorLogin.data.accessToken;

    const auxLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'cajero@tienda.com',
      password: '123',
    });
    const auxToken = auxLogin.data.accessToken;

    const ruteLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'rute@lospinos.com',
      password: '123',
    });
    const ruteToken = ruteLogin.data.accessToken;
    const ruteroId = ruteLogin.data.user.id;

    console.log('  ✅ Tokens de autenticación obtenidos para todos los roles.\n');

    // 2. Crear Producto con Factor X (Factor = 24)
    console.log('2. Creando producto de prueba con Factor X = 24...');
    const barcode = `BARCODE_${Date.now()}`;
    const productRes = await axios.post(
      `${API_BASE}/products`,
      {
        storeId: STORE_ID,
        description: ' Harina Pino E2E Test 24x1kg',
        barcode: barcode,
        salePrice: 45.0,
        costPrice: 35.0,
        unitsPerBulk: 24,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    createdIds.productId = productRes.data.id;
    console.log(`  ✅ Producto Creado: ID = ${createdIds.productId} (Factor X = 24)`);

    // Asignar stock inicial en la columna current_stock del producto
    await client.query('UPDATE products SET current_stock = 100 WHERE id = $1', [createdIds.productId]);
    console.log(`  ✅ Stock inicial asignado (100 unidades en current_stock).\n`);

    // 3. Crear Pedido Preventa (Gestor de Ventas)
    console.log('3. Gestor de Ventas crea pedido de preventa...');
    createdIds.externalOrderId = uuidv4();
    // Obtener cliente activo de la tienda
    const clientQuery = await client.query('SELECT id, name FROM clients WHERE store_id = $1 LIMIT 1', [STORE_ID]);
    const activeClientId = clientQuery.rows[0]?.id || '00000000-0000-0000-0000-000000000000';
    const activeClientName = clientQuery.rows[0]?.name || 'Cliente Prueba E2E';

    const orderRes = await axios.post(
      `${API_BASE}/orders`,
      {
        externalId: createdIds.externalOrderId,
        storeId: STORE_ID,
        clientId: activeClientId,
        clientName: activeClientName,
        tipoPedido: 'VENTA_ESTANDAR',
        items: [
          {
            productId: createdIds.productId,
            bulkCount: 2,
            looseUnitCount: 0,
          },
        ],
        paymentType: 'CONTADO',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    createdIds.orderId = orderRes.data.id || createdIds.externalOrderId;
    console.log(`  ✅ Pedido de Preventa Registrado: ID = ${createdIds.orderId}\n`);

    // 3.5 Aprobar pedido para alistamiento
    await client.query("UPDATE orders SET status = 'ALISTADO' WHERE id = $1 OR id = $2", [createdIds.orderId, createdIds.externalOrderId]);
    console.log(`  ✅ Estado del Pedido actualizado a ALISTADO.`);

    // 4. Jefe de Bodega crea Carga de Camión
    console.log('4. Jefe de Bodega arma y asigna Carga de Camión a Rutero...');
    const cargaRes = await axios.post(
      `${API_BASE}/cargas-camion`,
      {
        storeId: STORE_ID,
        ruteroId: ruteroId,
        camionPlaca: 'M-99988',
        orderIds: [createdIds.orderId],
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    createdIds.cargaId = cargaRes.data.id;
    console.log(`  ✅ Carga de Camión Creada: ID = ${createdIds.cargaId}\n`);

    // 5. Auxiliar de Bodega confirma Carga
    console.log('5. Auxiliar de Recepción/Despacho confirma carga física...');
    const confirmRes = await axios.put(
      `${API_BASE}/cargas-camion/${createdIds.cargaId}/confirm-load`,
      { items: [] },
      { headers: { Authorization: `Bearer ${auxToken}` } }
    );
    console.log(`  ✅ Carga Confirmada por Auxiliar: Status HTTP ${confirmRes.status}\n`);

    // 6. Rutero acepta Carga
    console.log('6. Rutero acepta Carga de Camión para entrega...');
    const acceptRes = await axios.put(
      `${API_BASE}/cargas-camion/${createdIds.cargaId}/accept`,
      { items: [], externalId: uuidv4() },
      { headers: { Authorization: `Bearer ${ruteToken}` } }
    );
    console.log(`  ✅ Carga Aceptada por Rutero: Status HTTP ${acceptRes.status}\n`);

    // 7. Jefe de Bodega aprueba Liquidación de Ruta
    console.log('7. Jefe de Bodega aprueba Liquidación de Ruta...');
    const today = new Date().toISOString().split('T')[0];
    const liqRes = await axios.post(
      `${API_BASE}/liquidaciones-ruta`,
      {
        storeId: STORE_ID,
        ruteroId: ruteroId,
        fechaRuta: today,
        cargaId: createdIds.cargaId,
        notas: 'Liquidación completa E2E',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    createdIds.liquidacionId = liqRes.data.id;
    console.log(`  ✅ Liquidación de Ruta Creada y Aprobada: ID = ${createdIds.liquidacionId}\n`);

    console.log('================================================================');
    console.log('  🎉 TODAS LAS OPERACIONES E2E EJECUTADAS CON ÉXITO');
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Error durante la ejecución E2E:', err.response?.data || err.message);
  } finally {
    // LIMPIEZA POSTERIOR
    console.log('================================================================');
    console.log('  🧹 INICIANDO LIMPIEZA AUTOMÁTICA DE DATOS DE PRUEBA');
    console.log('================================================================\n');

    if (createdIds.liquidacionId) {
      await client.query('DELETE FROM liquidaciones_ruta WHERE id = $1', [createdIds.liquidacionId]).catch(() => {});
      console.log(`  🗑️ Liquidación eliminada: ${createdIds.liquidacionId}`);
    }

    if (createdIds.cargaId) {
      await client.query('DELETE FROM carga_camion_items WHERE carga_id = $1', [createdIds.cargaId]).catch(() => {});
      await client.query('DELETE FROM cargas_camion WHERE id = $1', [createdIds.cargaId]).catch(() => {});
      console.log(`  🗑️ Carga de Camión e Ítems eliminados: ${createdIds.cargaId}`);
    }

    if (createdIds.orderId || createdIds.externalOrderId) {
      const oid = createdIds.orderId || createdIds.externalOrderId;
      await client.query('DELETE FROM pending_deliveries WHERE order_id = $1 OR order_id = $2', [oid, createdIds.externalOrderId]).catch(() => {});
      await client.query('DELETE FROM order_items WHERE order_id = $1 OR order_id = $2', [oid, createdIds.externalOrderId]).catch(() => {});
      await client.query('DELETE FROM orders WHERE id = $1 OR id = $2', [oid, createdIds.externalOrderId]).catch(() => {});
      console.log(`  🗑️ Pedido, Entregas Pendientes e Ítems eliminados: ${oid}`);
    }

    if (createdIds.productId) {
      await client.query('DELETE FROM product_barcodes WHERE product_id = $1', [createdIds.productId]).catch(() => {});
      await client.query('DELETE FROM inventory_movements WHERE product_id = $1', [createdIds.productId]).catch(() => {});
      await client.query('DELETE FROM products WHERE id = $1', [createdIds.productId]).catch(() => {});
      console.log(`  🗑️ Producto de Prueba e Históricos eliminados: ${createdIds.productId}`);
    }

    await client.end();

    console.log('\n================================================================');
    console.log('  ✅ BASE DE DATOS LIMPIA SIN REGISTROS HUÉRFANOS DE PRUEBA');
    console.log('================================================================\n');
  }
}

runE2eAndCleanup().catch(console.error);
