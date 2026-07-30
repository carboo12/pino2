async function testEndpoints() {
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
    const firstStoreId = stores[0]?.id || 'a3fccd8c-9a87-45b9-91a5-908f98339945';

    console.log('3. Fetching /users without filter...');
    const usersRes = await fetch(`${baseUrl}/users`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    console.log('Users Status:', usersRes.status);
    const usersData = await usersRes.json();
    console.log(`Total users in DB: ${Array.isArray(usersData) ? usersData.length : 'not array'}`);
    if (Array.isArray(usersData)) {
      console.table(usersData.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, storeIds: u.storeIds })));
    }

    console.log(`4. Fetching /users?storeId=${firstStoreId}...`);
    const usersFilteredRes = await fetch(`${baseUrl}/users?storeId=${firstStoreId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    console.log('Filtered Users Status:', usersFilteredRes.status);
    const usersFilteredData = await usersFilteredRes.json();
    console.log(`Filtered users count: ${Array.isArray(usersFilteredData) ? usersFilteredData.length : 'not array'}`);

    console.log(`5. Fetching /routes?storeId=${firstStoreId}...`);
    const routesRes = await fetch(`${baseUrl}/routes?storeId=${firstStoreId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    console.log('Routes Status:', routesRes.status);
    const routesText = await routesRes.text();
    console.log('Routes Response:', routesText);

    console.log('6. Fetching /pending-orders?status=Pendiente...');
    const pendingRes = await fetch(`${baseUrl}/pending-orders?status=Pendiente`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    console.log('Pending Orders Status:', pendingRes.status);
    const pendingText = await pendingRes.text();
    console.log('Pending Orders Response:', pendingText);

  } catch (err) {
    console.error('Test error:', err);
  }
}

testEndpoints();
