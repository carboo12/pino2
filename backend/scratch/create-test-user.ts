import { Client } from 'pg';
import * as bcrypt from 'bcrypt';

async function createTestUser() {
  const client = new Client({
    connectionString: "postgresql://alacaja:__DB_PASSWORD_PLACEHOLDER__@190.56.16.85:5432/multitienda_db",
  });
  await client.connect();
  
  const email = 'test-audit@pino.com';
  const password = 'Password123!';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  await client.query('DELETE FROM users WHERE email = $1', [email]);
  await client.query(
    'INSERT INTO users (id, name, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5, $6)',
    ['00000000-0000-0000-0000-000000000000', 'Test Auditor', email, hashedPassword, 'admin', true]
  );
  
  console.log('Test user created: ' + email);
  await client.end();
}

createTestUser().catch(console.error);
