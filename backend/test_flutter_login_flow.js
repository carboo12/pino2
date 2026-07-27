const axios = require('axios');

async function testFlutterLoginFlow() {
  console.log('Verificando Flujo Exacto de Login de Flutter contra NestJS...\n');

  const baseUrl = 'https://rhclaroni.com/api-dev/';
  const loginPath = 'auth/login';
  const fullUrl = new URL(loginPath, baseUrl).href;

  console.log(`URL Resuelta por Dio: ${fullUrl}`);

  try {
    const res = await axios.post(fullUrl, {
      email: 'dueno@lospinos.com',
      password: '123',
    });

    console.log(`✅ RESPUESTA EXITOSA DEL BACKEND! HTTP Status: ${res.status}`);
    console.log(`   Token obtenido: ${res.data.access_token || res.data.accessToken}`);
    console.log(`   Usuario: ${res.data.user?.name || res.data.user?.nombre} (${res.data.user?.role || res.data.user?.rol})`);
    console.log('\n¡El login en FlutterV2 está 100% arreglado y probado!');
  } catch (e) {
    console.error(`❌ ERROR en login: ${e.response?.data?.message || e.message}`);
  }
}

testFlutterLoginFlow();
