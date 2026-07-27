const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function verifyAllFlutterEndpoints() {
  console.log('====================================================');
  console.log('AUDITORIA DE INTEGRIDAD 100% DE ENDPOINTS FLUTTER');
  console.log('====================================================\n');

  let successCount = 0;
  let totalCount = 0;

  // 1. Auth Login
  let token = '';
  let userId = '';
  const storeId = '9321856d-19ba-42b8-ba47-cf35c0d133dd';

  totalCount++;
  try {
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'dueno@lospinos.com',
      password: '123',
    });
    token = loginRes.data.access_token || loginRes.data.accessToken || loginRes.data.token;
    userId = loginRes.data.user?.id || loginRes.data.user?.sub;
    console.log(`1. [POST /auth/login] ✅ OK | Token Length: ${token.length} | User ID: ${userId}`);
    successCount++;
  } catch (e) {
    console.error(`1. [POST /auth/login] ❌ ERROR: ${e.response?.data?.message || e.message}`);
  }

  const headers = { Authorization: `Bearer ${token}` };

  // 2. Catalog Products
  totalCount++;
  try {
    const res = await axios.get(`${API_BASE}/products?storeId=${storeId}&limit=300`, { headers });
    const items = Array.isArray(res.data) ? res.data : (res.data.data || []);
    console.log(`2. [GET /products] ✅ OK | ${items.length} productos devueltos`);
    successCount++;
  } catch (e) {
    console.error(`2. [GET /products] ❌ ERROR: ${e.response?.data?.message || e.message}`);
  }

  // 3. Client Portfolio
  totalCount++;
  try {
    const res = await axios.get(`${API_BASE}/clients?storeId=${storeId}&limit=300&allClients=true`, { headers });
    const items = Array.isArray(res.data) ? res.data : (res.data.data || []);
    console.log(`3. [GET /clients] ✅ OK | ${items.length} clientes devueltos`);
    successCount++;
  } catch (e) {
    console.error(`3. [GET /clients] ❌ ERROR: ${e.response?.data?.message || e.message}`);
  }

  // 4. Accounts Receivable (Collections)
  totalCount++;
  try {
    const res = await axios.get(`${API_BASE}/accounts-receivable?storeId=${storeId}`, { headers });
    const items = Array.isArray(res.data) ? res.data : (res.data.data || []);
    console.log(`4. [GET /accounts-receivable] ✅ OK | ${items.length} cobros devueltos`);
    successCount++;
  } catch (e) {
    console.error(`4. [GET /accounts-receivable] ❌ ERROR: ${e.response?.data?.message || e.message}`);
  }

  // 5. Pending Deliveries
  totalCount++;
  try {
    const res = await axios.get(`${API_BASE}/pending-deliveries?storeId=${storeId}`, { headers });
    const items = Array.isArray(res.data) ? res.data : (res.data.data || []);
    console.log(`5. [GET /pending-deliveries] ✅ OK | ${items.length} entregas devueltas`);
    successCount++;
  } catch (e) {
    console.error(`5. [GET /pending-deliveries] ❌ ERROR: ${e.response?.data?.message || e.message}`);
  }

  // 6. Routes
  totalCount++;
  try {
    const res = await axios.get(`${API_BASE}/routes?storeId=${storeId}`, { headers });
    const items = Array.isArray(res.data) ? res.data : (res.data.data || []);
    console.log(`6. [GET /routes] ✅ OK | ${items.length} rutas devueltas`);
    successCount++;
  } catch (e) {
    console.error(`6. [GET /routes] ❌ ERROR: ${e.response?.data?.message || e.message}`);
  }

  // 7. Pending Orders (Warehouse Board)
  totalCount++;
  try {
    const res = await axios.get(`${API_BASE}/pending-orders?storeId=${storeId}`, { headers });
    const items = Array.isArray(res.data) ? res.data : (res.data.data || []);
    console.log(`7. [GET /pending-orders] ✅ OK | ${items.length} pedidos de bodega devueltos`);
    successCount++;
  } catch (e) {
    console.error(`7. [GET /pending-orders] ❌ ERROR: ${e.response?.data?.message || e.message}`);
  }

  // 8. Vendor Inventories
  totalCount++;
  try {
    const res = await axios.get(`${API_BASE}/vendor-inventories?storeId=${storeId}`, { headers });
    const items = Array.isArray(res.data) ? res.data : (res.data.data || []);
    console.log(`8. [GET /vendor-inventories] ✅ OK | ${items.length} registros de inventario vendedor devueltos`);
    successCount++;
  } catch (e) {
    console.error(`8. [GET /vendor-inventories] ❌ ERROR: ${e.response?.data?.message || e.message}`);
  }

  // 9. Daily Closings
  totalCount++;
  try {
    const res = await axios.get(`${API_BASE}/daily-closings?storeId=${storeId}`, { headers });
    const items = Array.isArray(res.data) ? res.data : (res.data.data || []);
    console.log(`9. [GET /daily-closings] ✅ OK | ${items.length} cierres diarios devueltos`);
    successCount++;
  } catch (e) {
    console.error(`9. [GET /daily-closings] ❌ ERROR: ${e.response?.data?.message || e.message}`);
  }

  // 10. Sales History
  totalCount++;
  try {
    const res = await axios.get(`${API_BASE}/sales?storeId=${storeId}`, { headers });
    const items = Array.isArray(res.data) ? res.data : (res.data.data || []);
    console.log(`10. [GET /sales] ✅ OK | ${items.length} ventas devueltas`);
    successCount++;
  } catch (e) {
    console.error(`10. [GET /sales] ❌ ERROR: ${e.response?.data?.message || e.message}`);
  }

  // 11. Expenses
  totalCount++;
  try {
    const res = await axios.get(`${API_BASE}/expenses?storeId=${storeId}`, { headers });
    const items = Array.isArray(res.data) ? res.data : (res.data.data || []);
    console.log(`11. [GET /expenses] ✅ OK | ${items.length} gastos devueltos`);
    successCount++;
  } catch (e) {
    console.error(`11. [GET /expenses] ❌ ERROR: ${e.response?.data?.message || e.message}`);
  }

  // 12. Promotions
  totalCount++;
  try {
    const res = await axios.get(`${API_BASE}/promotions?storeId=${storeId}`, { headers });
    const items = Array.isArray(res.data) ? res.data : (res.data.data || []);
    console.log(`12. [GET /promotions] ✅ OK | ${items.length} promociones devueltas`);
    successCount++;
  } catch (e) {
    console.error(`12. [GET /promotions] ❌ ERROR: ${e.response?.data?.message || e.message}`);
  }

  // 13. Stores List
  totalCount++;
  try {
    const res = await axios.get(`${API_BASE}/stores`, { headers });
    const items = Array.isArray(res.data) ? res.data : (res.data.data || []);
    console.log(`13. [GET /stores] ✅ OK | ${items.length} tiendas devueltas`);
    successCount++;
  } catch (e) {
    console.error(`13. [GET /stores] ❌ ERROR: ${e.response?.data?.message || e.message}`);
  }

  console.log('\n====================================================');
  console.log(`RESUMEN AUDITORIA: ${successCount} DE ${totalCount} ENDPOINTS EXITOSOS (${Math.round((successCount/totalCount)*100)}%)`);
  console.log('====================================================\n');
}

verifyAllFlutterEndpoints();
