async function testCreateUserWithStore() {
  const baseUrl = 'https://pino2--studio-9680180520-dbbe0.us-east4.hosted.app/api';
  console.log('1. Logging in as reinazelva@gmail.com...');

  try {
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'reinazelva@gmail.com',
        password: 'Admin123!',
      }),
    });

    const loginData = await loginRes.json();
    const token = loginData.access_token || loginData.token || (loginData.data && loginData.data.access_token);
    if (!token) {
      console.error('Login failed');
      return;
    }

    console.log('2. Fetching stores...');
    const storesRes = await fetch(`${baseUrl}/stores`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const storesData = await storesRes.json();
    const stores = Array.isArray(storesData) ? storesData : (storesData.data || []);
    console.log(`Found ${stores.length} store(s).`);

    const targetStoreId = stores.length > 0 ? stores[0].id : null;
    console.log('Target store ID:', targetStoreId);

    console.log('3. Creating user linked to store...');
    const createRes = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: `cajero_tienda_${Date.now()}@test.com`,
        password: 'Password123!',
        name: 'Cajero Con Tienda Test',
        role: 'cajero',
        storeId: targetStoreId,
      }),
    });

    console.log('Create User Status:', createRes.status);
    const text = await createRes.text();
    console.log('Create User Response:', text);
  } catch (err) {
    console.error('Test error:', err);
  }
}

testCreateUserWithStore();
