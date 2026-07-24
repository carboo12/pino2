const { Client } = require('pg');
const c = new Client('postgresql://alacaja:__DB_PASSWORD_PLACEHOLDER__@190.56.16.85:5432/multitienda_db');

c.connect()
  .then(() => c.query(`
    CREATE TABLE IF NOT EXISTS errors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      message TEXT,
      url TEXT,
      source TEXT,
      lineno INTEGER,
      colno INTEGER,
      error_obj TEXT,
      user_agent TEXT,
      store_id UUID,
      resolved BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `))
  .then(() => console.log('TABLE ERRORS CREATED'))
  .catch(console.error)
  .finally(() => c.end());
