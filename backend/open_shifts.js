const { Pool } = require('pg');
const pool = new Pool({ host: '190.56.16.85', port: 5432, user: 'alacaja', password: '__DB_PASSWORD_PLACEHOLDER__', database: 'multitienda_db' });
pool.query("UPDATE cash_shifts SET status = 'OPEN';").then(res => console.log('UPDATED SHIFTS:', res.rowCount)).catch(console.error).finally(() => pool.end());
