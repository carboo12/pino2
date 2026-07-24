const { Pool } = require('pg');
const pool = new Pool({ host: '190.56.16.85', port: 5432, user: 'alacaja', password: '__DB_PASSWORD_PLACEHOLDER__', database: 'multitienda_db' });
pool.query("SELECT email, role FROM users;").then(res => console.log('USERS:', JSON.stringify(res.rows, null, 2))).catch(console.error).finally(() => pool.end());
