
const { Pool } = require('pg');
const pool = new Pool({
  host: '190.56.16.85',
  port: 5432,
  user: 'alacaja',
  password: '__DB_PASSWORD_PLACEHOLDER__',
  database: 'multitienda_db'
});

async function checkTable() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'departments'
    `);
    console.log('Departments Columns:');
    res.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));
  } catch (e) {
    console.error('Error checking table:', e.message);
  } finally {
    await pool.end();
  }
}
checkTable();
