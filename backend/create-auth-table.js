const { Client } = require('pg');
const c = new Client('postgresql://alacaja:__DB_PASSWORD_PLACEHOLDER__@190.56.16.85:5432/multitienda_db');

c.connect()
  .then(() => c.query(`
    CREATE TABLE IF NOT EXISTS authorizations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID,
      requester_id UUID,
      type VARCHAR(50) NOT NULL,
      details JSONB,
      status VARCHAR(20) DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `))
  .then(() => console.log('TABLE AUTHORIZATIONS CREATED'))
  .catch(console.error)
  .finally(() => c.end());
