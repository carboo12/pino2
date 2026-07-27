const axios = require('axios');

const API_BASE = 'https://rhclaroni.com/api-dev';

const USERS = [
  { role: 'Super Admin', email: 'admin@multitienda.com', pass: '123' },
  { role: 'Jefe / Dueño', email: 'dueno@lospinos.com', pass: '123' },
  { role: 'Gestor Ventas', email: 'gestor@lospinos.com', pass: '123' },
  { role: 'Rutero', email: 'rute@lospinos.com', pass: '123' },
  { role: 'Bodeguero', email: 'bodeg@lospinos.com', pass: '123' },
  { role: 'Cajero', email: 'cajero@tienda.com', pass: '123' },
];

async function runAudit() {
  console.log('====================================================');
  console.log('AUDITORIA DE ENDPOINTS POR PERFIL Y ROL');
  console.log('====================================================\n');

  for (const user of USERS) {
    console.log(`\n----------------------------------------------------`);
    console.log(`PERFIL: ${user.role} (${user.email})`);
    console.log(`----------------------------------------------------`);

    try {
      // 1. Login
      const loginRes = await axios.post(`${API_BASE}/auth/login`, {
        email: user.email,
        password: user.pass,
      });

      const token = loginRes.data.access_token || loginRes.data.accessToken || loginRes.data.token;
      const userData = loginRes.data.user || {};
      const userId = userData.id || userData.sub;

      console.log(`✅ Login OK | User ID: ${userId} | Role: ${userData.role}`);

      const headers = { Authorization: `Bearer ${token}` };

      // 2. Fetch stores
      let stores = [];
      try {
        const storesRes = await axios.get(`${API_BASE}/users/${userId}/stores`, { headers });
        stores = Array.isArray(storesRes.data) ? storesRes.data : (storesRes.data.data || []);
        console.log(`   Stores asignadas: ${stores.length} (${stores.map(s => s.name || s.id).join(', ')})`);
      } catch (e) {
        console.log(`   ⚠️ Stores fetch error: ${e.response?.data?.message || e.message}`);
      }

      const storeId = stores[0]?.id || userData.primaryStoreId || '9321856d-19ba-42b8-ba47-cf35c0d133dd';
      console.log(`   Usando Store ID: ${storeId}`);

      // 3. Test Products
      try {
        const prodRes = await axios.get(`${API_BASE}/products?storeId=${storeId}&limit=50`, { headers });
        const prods = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data.data || []);
        console.log(`   📦 Productos: ${prods.length} devueltos`);
      } catch (e) {
        console.log(`   ❌ Products error: ${e.response?.data?.message || e.message}`);
      }

      // 4. Test Clients
      try {
        const cliRes = await axios.get(`${API_BASE}/clients?storeId=${storeId}&limit=50`, { headers });
        const clients = Array.isArray(cliRes.data) ? cliRes.data : (cliRes.data.data || []);
        console.log(`   👥 Clientes: ${clients.length} devueltos`);
      } catch (e) {
        console.log(`   ❌ Clients error: ${e.response?.data?.message || e.message}`);
      }

      // 5. Test Collections / Receivables
      try {
        const recRes = await axios.get(`${API_BASE}/accounts-receivable?storeId=${storeId}`, { headers });
        const recs = Array.isArray(recRes.data) ? recRes.data : (recRes.data.data || []);
        console.log(`   💰 Cuentas por Cobrar: ${recs.length} devueltas`);
      } catch (e) {
        console.log(`   ❌ Receivables error: ${e.response?.data?.message || e.message}`);
      }

      // 6. Test Deliveries / Routes
      try {
        const routesRes = await axios.get(`${API_BASE}/routes?storeId=${storeId}`, { headers });
        const routes = Array.isArray(routesRes.data) ? routesRes.data : (routesRes.data.data || []);
        console.log(`   🚚 Rutas: ${routes.length} devueltas`);
      } catch (e) {
        console.log(`   ❌ Routes error: ${e.response?.data?.message || e.message}`);
      }

    } catch (e) {
      console.log(`❌ Login FAILED para ${user.email}: ${e.response?.data?.message || e.message}`);
    }
  }
}

runAudit();
