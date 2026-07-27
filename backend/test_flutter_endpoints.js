const axios = require('axios');

const API_BASE = 'https://rhclaroni.com/api-dev';

async function testFlutterEndpoints() {
  console.log('Testing exact Flutter endpoint calls against NestJS...\n');

  try {
    const login = await axios.post(`${API_BASE}/auth/login`, {
      email: 'dueno@lospinos.com',
      password: '123',
    });

    const token = login.data.access_token || login.data.accessToken || login.data.token;
    const storeId = '9321856d-19ba-42b8-ba47-cf35c0d133dd';
    const headers = { Authorization: `Bearer ${token}` };

    console.log('✅ Auth Token received successfully.');

    // 1. GET /products?storeId=...
    console.log(`\nCalling: GET ${API_BASE}/products?storeId=${storeId}`);
    const prodRes = await axios.get(`${API_BASE}/products?storeId=${storeId}&limit=100`, { headers });
    const prods = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data.data || []);
    console.log(`✅ Products returned: ${prods.length} items`);
    if (prods.length > 0) {
      console.log(`   Ejemplo Producto: ID=${prods[0].id}, Nombre=${prods[0].description || prods[0].name}, Stock=${prods[0].currentStock}`);
    }

    // 2. GET /clients?storeId=...
    console.log(`\nCalling: GET ${API_BASE}/clients?storeId=${storeId}`);
    const cliRes = await axios.get(`${API_BASE}/clients?storeId=${storeId}&limit=100`, { headers });
    const clients = Array.isArray(cliRes.data) ? cliRes.data : (cliRes.data.data || []);
    console.log(`✅ Clients returned: ${clients.length} items`);
    if (clients.length > 0) {
      console.log(`   Ejemplo Cliente: ID=${clients[0].id}, Nombre=${clients[0].name}, Teléfono=${clients[0].phone}`);
    }

  } catch (e) {
    console.error('❌ Error during endpoint test:', e.response?.data || e.message);
  }
}

testFlutterEndpoints();
