const axios = require('axios');

async function testAllLoginUrls() {
  console.log('Testing login endpoints across all candidate hosts...\n');

  const candidates = [
    'http://localhost:3000/api/auth/login',
    'http://127.0.0.1:3000/api/auth/login',
    'https://rhclaroni.com/api-dev/auth/login',
    'http://rhclaroni.com/api-dev/auth/login',
    'http://rhclaroni.com:3000/api/auth/login',
  ];

  for (const url of candidates) {
    try {
      const res = await axios.post(
        url,
        { email: 'dueno@lospinos.com', password: '123' },
        { timeout: 3000 }
      );
      console.log(`✅ SUCCESS on [${url}] -> Status: ${res.status}, User: ${res.data?.user?.email || res.data?.user?.nombre}`);
    } catch (e) {
      console.log(`❌ FAIL on [${url}] -> ${e.response?.status || e.code || e.message}`);
    }
  }
}

testAllLoginUrls();
