const axios = require('axios');

async function testCredentials() {
  console.log('Probando credenciales de usuarios contra https://rhclaroni.com/api-dev/auth/login...\n');

  const credentialsToTest = [
    { email: 'admin@multitienda.com', password: '123' },
    { email: 'dueno@lospinos.com', password: '123' },
    { email: 'dueno@lospinos.com', password: '1234' },
    { email: 'dueno@lospinos.com', password: 'admin' },
    { email: 'dueno@lospinos.com', password: 'password' },
    { email: 'gestor@lospinos.com', password: '123' },
    { email: 'rute@lospinos.com', password: '123' },
  ];

  for (const cred of credentialsToTest) {
    try {
      const res = await axios.post('https://rhclaroni.com/api-dev/auth/login', {
        email: cred.email,
        password: cred.password,
      });
      console.log(`✅ EXITO: [${cred.email}] con password ["${cred.password}"] -> HTTP ${res.status}`);
      console.log(`   Rol: ${res.data.user?.role || res.data.user?.rol}, Nombre: ${res.data.user?.name || res.data.user?.nombre}`);
    } catch (e) {
      console.log(`❌ FALLO: [${cred.email}] con password ["${cred.password}"] -> Status: ${e.response?.status || e.code}, Msg: ${JSON.stringify(e.response?.data || e.message)}`);
    }
  }
}

testCredentials();
