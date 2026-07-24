const { Client } = require('pg');

async function createDatabase() {
  // Connect to default 'postgres' database to create a new one
  const client = new Client({
    host: '190.56.16.85',
    port: 5432,
    user: 'alacaja',
    password: '__DB_PASSWORD_PLACEHOLDER__',
    database: 'postgres',
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL server');

    // Check if database already exists
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'multitienda_db'"
    );

    if (res.rows.length === 0) {
      await client.query('CREATE DATABASE multitienda_db OWNER alacaja ENCODING \'UTF8\'');
      console.log('✅ Database "multitienda_db" created successfully');
    } else {
      console.log('ℹ️  Database "multitienda_db" already exists');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createDatabase();
