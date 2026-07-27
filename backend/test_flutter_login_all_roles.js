const axios = require('axios');

async function testAllFlutterLogins() {
  console.log('===========================================================');
  console.log('PRUEBA DE LOGIN EN FLUTTER V2 CONTRA ENDPOINT DE PRODUCCION');
  console.log('URL: https://rhclaroni.com/api-dev/auth/login');
  console.log('===========================================================\n');

  const usersToTest = [
    { label: 'Super Administrador', email: 'admin@multitienda.com', pass: '123' },
    { label: 'Jefe / Dueño', email: 'dueno@lospinos.com', pass: '123' },
    { label: 'Gestor de Ventas', email: 'gestor@lospinos.com', pass: '123' },
    { label: 'Rutero / Repartidor', email: 'rute@lospinos.com', pass: '123' },
  ];

  const baseUrl = 'https://rhclaroni.com/api-dev/';
  const loginPath = 'auth/login';
  const fullUrl = new URL(loginPath, baseUrl).href;

  for (const u of usersToTest) {
    try {
      const res = await axios.post(fullUrl, {
        email: u.email,
        password: u.pass,
      });

      const token = res.data.access_token || res.data.accessToken || res.data.token;
      const user = res.data.user || res.data.usuario || {};

      console.log(`✅ [${u.label}] (${u.email})`);
      console.log(`   - HTTP Status: ${res.status}`);
      console.log(`   - Token JWT: ${token ? token.substring(0, 35) + '...' : 'SIN TOKEN'}`);
      console.log(`   - ID Usuario: ${user.id}`);
      console.log(`   - Nombre: ${user.name || user.nombre}`);
      console.log(`   - Rol Devuelto: ${user.role || user.rol}`);
      console.log(`   - Tiendas Asignadas: ${JSON.stringify(user.storeIds || user.userStores || [])}`);
      console.log('-----------------------------------------------------------');
    } catch (e) {
      console.error(`❌ [${u.label}] (${u.email}) -> ERROR: ${e.response?.status} - ${JSON.stringify(e.response?.data || e.message)}`);
      console.log('-----------------------------------------------------------');
    }
  }
}

testAllFlutterLogins();
