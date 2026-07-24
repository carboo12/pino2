const { Client } = require('pg');
const c = new Client('postgresql://alacaja:__DB_PASSWORD_PLACEHOLDER__@190.56.16.85:5432/multitienda_db');

c.connect()
  .then(() => c.query(`
    DROP TABLE IF EXISTS errors;
    
    CREATE TABLE IF NOT EXISTS error_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      message TEXT,
      stack TEXT,
      location TEXT,
      user_id UUID,
      store_id UUID,
      additional_info JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `))
  .then(() => console.log('TABLE ERROR_LOGS CREATED'))
  .catch(console.error)
  .finally(() => c.end());
