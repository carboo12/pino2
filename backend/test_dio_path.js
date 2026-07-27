const axios = require('axios');

async function testLoginPaths() {
  console.log('Testing path resolution for auth/login...\n');

  const testCases = [
    'https://rhclaroni.com/api-dev/auth/login',
    'https://rhclaroni.com/api-devauth/login',
    'https://rhclaroni.com/auth/login',
  ];

  for (const url of testCases) {
    try {
      const res = await axios.post(url, { email: 'dueno@lospinos.com', password: '123' }, { timeout: 4000 });
      console.log(`✅ URL "${url}" -> SUCCESS Status: ${res.status}`);
    } catch (e) {
      console.log(`❌ URL "${url}" -> FAILED Status: ${e.response?.status || e.code || e.message}`);
    }
  }
}

testLoginPaths();
