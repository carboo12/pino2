const axios = require('axios');

async function testFlutterDataEndpoints() {
  console.log('================================================================');
  console.log('PRUEBA DE ENDPOINTS DE CLIENTES Y PRODUCTOS EN FLUTTER');
  console.log('URL Base: https://rhclaroni.com/api-dev');
  console.log('================================================================\n');

  const usersToTest = [
    { label: 'Gestor de Ventas', email: 'gestor@lospinos.com', pass: '123' },
    { label: 'Rutero Repartidor', email: 'rute@lospinos.com', pass: '123' },
    { label: 'Jefe Maestro', email: 'dueno@lospinos.com', pass: '123' },
  ];

  for (const u of usersToTest) {
    console.log(`\n🔑 1. Autenticando [${u.label}] (${u.email})...`);
    try {
      const loginRes = await axios.post('https://rhclaroni.com/api-dev/auth/login', {
        email: u.email,
        password: u.pass,
      });

      const token = loginRes.data.access_token || loginRes.data.accessToken || loginRes.data.token;
      const headers = { Authorization: `Bearer ${token}` };

      // 2. Probar GET /stores
      const storesRes = await axios.get('https://rhclaroni.com/api-dev/stores', { headers });
      const stores = storesRes.data || [];
      console.log(`   - GET /stores -> Total tiendas devueltas: ${Array.isArray(stores) ? stores.length : JSON.stringify(stores)}`);
      
      const primaryStoreId = Array.isArray(stores) && stores.length > 0 ? stores[0].id : '9321856d-19ba-42b8-ba47-cf35c0d133dd';

      // 3. Probar GET /products?storeId=...
      try {
        const prodRes = await axios.get(`https://rhclaroni.com/api-dev/products?storeId=${primaryStoreId}&limit=300`, { headers });
        const prods = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data?.data || []);
        console.log(`   - GET /products?storeId=${primaryStoreId}&limit=300 -> Total productos devueltos: ${prods.length}`);
        if (prods.length > 0) {
          console.log(`     Muestra Producto 1: [${prods[0].name}] (SKU: ${prods[0].sku}, Stock: ${prods[0].stock})`);
        }
      } catch (errProd) {
        console.error(`   ❌ ERROR en GET /products: HTTP ${errProd.response?.status} - ${JSON.stringify(errProd.response?.data || errProd.message)}`);
      }

      // 4. Probar GET /clients?storeId=...&allClients=true
      try {
        const clientRes = await axios.get(`https://rhclaroni.com/api-dev/clients?storeId=${primaryStoreId}&limit=300&allClients=true`, { headers });
        const clients = Array.isArray(clientRes.data) ? clientRes.data : (clientRes.data?.data || []);
        console.log(`   - GET /clients?storeId=${primaryStoreId}&limit=300&allClients=true -> Total clientes devueltos: ${clients.length}`);
        if (clients.length > 0) {
          console.log(`     Muestra Cliente 1: [${clients[0].name}] (ID: ${clients[0].id})`);
        }
      } catch (errClient) {
        console.error(`   ❌ ERROR en GET /clients: HTTP ${errClient.response?.status} - ${JSON.stringify(errClient.response?.data || errClient.message)}`);
      }

      // 5. Probar GET /clients?storeId=... SIN allClients=true
      try {
        const clientRes2 = await axios.get(`https://rhclaroni.com/api-dev/clients?storeId=${primaryStoreId}&limit=300`, { headers });
        const clients2 = Array.isArray(clientRes2.data) ? clientRes2.data : (clientRes2.data?.data || []);
        console.log(`   - GET /clients?storeId=${primaryStoreId}&limit=300 (sin allClients=true) -> Total clientes devueltos: ${clients2.length}`);
      } catch (errClient2) {
        console.error(`   ❌ ERROR en GET /clients (sin allClients): HTTP ${errClient2.response?.status} - ${JSON.stringify(errClient2.response?.data || errClient2.message)}`);
      }

    } catch (e) {
      console.error(`❌ Error autenticando ${u.email}: ${e.response?.status} - ${JSON.stringify(e.response?.data || e.message)}`);
    }
  }
}

testFlutterDataEndpoints();
