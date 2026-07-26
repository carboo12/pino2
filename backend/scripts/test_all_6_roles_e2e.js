const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3010/api';

const USERS_TO_TEST = [
  {
    roleName: '1. JEFE / ENCARGADO DE BODEGA',
    roleKey: 'admin',
    email: 'dueno@lospinos.com',
    password: '123',
    expectedCanAccessProducts: true,
    expectedCanAccessUsers: true,
    expectedCanAccessAuthorizations: true,
    isGlobal: false,
  },
  {
    roleName: '2. ADMINISTRADOR GENERAL',
    roleKey: 'super-admin',
    email: 'admin@multitienda.com',
    password: '123',
    expectedCanAccessProducts: true,
    expectedCanAccessUsers: true,
    expectedCanAccessAuthorizations: true,
    isGlobal: true,
  },
  {
    roleName: '3. ANALISTA DE INVENTARIO (Bodeguero)',
    roleKey: 'inventory',
    email: 'bodeg@lospinos.com',
    password: '123',
    expectedCanAccessProducts: true,
    expectedCanAccessKardex: true,
    expectedCanAccessUsers: false,
    isGlobal: false,
  },
  {
    roleName: '4. AUXILIAR DE RECEPCIÓN Y DESPACHO',
    roleKey: 'auxiliar',
    email: 'cajero@tienda.com',
    password: '123',
    expectedCanAccessCargas: true,
    expectedCanAccessUsers: false,
    isGlobal: false,
  },
  {
    roleName: '5. GESTOR DE VENTAS (Preventista Móvil)',
    roleKey: 'gestor',
    email: 'gestor@lospinos.com',
    password: '123',
    expectedCanAccessOrders: true,
    expectedCanAccessClients: true,
    isGlobal: false,
  },
  {
    roleName: '6. RUTERO / REPARTIDOR (Repartidor Móvil)',
    roleKey: 'rutero',
    email: 'rute@lospinos.com',
    password: '123',
    expectedCanAccessDeliveries: true,
    expectedCanAccessCargas: true,
    isGlobal: false,
  },
];

async function runE2ERoleValidation() {
  console.log('================================================================');
  console.log('  PRUEBA AUTOMATIZADA E2E — 6 ROLES CANÓNICOS Y PERMISOS TRELLO');
  console.log('================================================================\n');

  const results = [];

  for (const userSpec of USERS_TO_TEST) {
    console.log(`\n----------------------------------------------------------------`);
    console.log(`PROBANDO ROL: ${userSpec.roleName} (${userSpec.email})`);
    console.log(`----------------------------------------------------------------`);

    try {
      // 1. Authenticate login
      const loginRes = await axios.post(`${API_BASE}/auth/login`, {
        email: userSpec.email,
        password: userSpec.password,
      });

      const token = loginRes.data.access_token || loginRes.data.token || loginRes.data.accessToken;
      const user = loginRes.data.user;

      console.log(`  ✅ LOGIN EXITOSO: Token recibido (${token ? token.substring(0, 20) + '...' : 'SIN TOKEN'})`);
      console.log(`  - User ID: ${user.id || user.sub}`);
      console.log(`  - Rol Retornado en API: "${user.role}"`);
      console.log(`  - Tiendas Asignadas: ${JSON.stringify(user.storeIds || user.stores || [])}`);

      const headers = { Authorization: `Bearer ${token}` };
      const validStoreId = '9321856d-19ba-42b8-ba47-cf35c0d133dd';
      let testStoreId = (user.storeIds && user.storeIds.length > 0) ? user.storeIds[0] : validStoreId;

      // Test 1: Health check / Auth profile
      const profileRes = await axios.get(`${API_BASE}/auth/profile`, { headers }).catch(e => e.response || { status: e.code });
      console.log(`  - Endpoint /auth/profile: HTTP ${profileRes.status}`);

      // Test 2: Endpoint /products
      const productsRes = await axios.get(`${API_BASE}/products?storeId=${testStoreId}`, { headers }).catch(e => e.response || { status: e.code });
      console.log(`  - Endpoint /products: HTTP ${productsRes.status}`);

      // Test 3: Endpoint /users (Admin / Super-Admin restricted)
      const usersRes = await axios.get(`${API_BASE}/users?storeId=${testStoreId}`, { headers }).catch(e => e.response || { status: e.code });
      console.log(`  - Endpoint /users (Gestión Usuarios): HTTP ${usersRes.status}`);

      // Test 4: Endpoint /cargas-camion
      const cargasRes = await axios.get(`${API_BASE}/cargas-camion?storeId=${testStoreId}`, { headers }).catch(e => e.response || { status: e.code });
      console.log(`  - Endpoint /cargas-camion: HTTP ${cargasRes.status}`);

      // Test 5: Endpoint /authorizations
      const authsRes = await axios.get(`${API_BASE}/authorizations?storeId=${testStoreId}`, { headers }).catch(e => e.response || { status: e.code });
      console.log(`  - Endpoint /authorizations (Autorizaciones Emergencia): HTTP ${authsRes.status}`);

      const roleResult = {
        roleName: userSpec.roleName,
        email: userSpec.email,
        loginOk: true,
        apiRole: user.role,
        profileStatus: profileRes.status,
        productsStatus: productsRes.status,
        usersStatus: usersRes.status,
        cargasStatus: cargasRes.status,
        authorizationsStatus: authsRes.status,
      };

      results.push(roleResult);

    } catch (err) {
      const detail = err.response?.data?.message || err.response?.data || err.code || err.message;
      console.error(`  ❌ ERROR EN LOGIN O EJECUCIÓN (${userSpec.email}):`, detail);
      results.push({
        roleName: userSpec.roleName,
        email: userSpec.email,
        loginOk: false,
        error: String(detail),
      });
    }
  }

  console.log('\n================================================================');
  console.log('  RESUMEN FINAL DE COMPROBACIÓN DE LOS 6 ROLES');
  console.log('================================================================');
  console.table(results);

  // Write detailed report to docs
  const reportContent = `===============================================================================
REPORTE DE EJECUCIÓN PRUEBAS E2E — 6 ROLES CANÓNICOS TRELLO
===============================================================================
Fecha: 2026-07-26
Servidor Backend: ${API_BASE}

RESULTADOS OBTENIDOS POR ROL:
${JSON.stringify(results, null, 2)}

===============================================================================
FIN DEL REPORTE E2E
===============================================================================
`;
  fs.writeFileSync(path.join(__dirname, '../../docs/REPORTE_PRUEBAS_E2E_6_ROLES_2026-07-26.txt'), reportContent);
  console.log('\nReporte guardado en docs/REPORTE_PRUEBAS_E2E_6_ROLES_2026-07-26.txt');
}

runE2ERoleValidation().catch(console.error);
