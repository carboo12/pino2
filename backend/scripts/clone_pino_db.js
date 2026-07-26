const { Client } = require('pg');

const CONNECTION_STRING = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/postgres';

async function cloneDatabase() {
  const client = new Client({ connectionString: CONNECTION_STRING });
  await client.connect();

  console.log('1. Verificando si existe la base de datos pino_migracion_db...');
  const checkRes = await client.query(`SELECT datname FROM pg_database WHERE datname = 'pino_migracion_db'`);
  if (checkRes.rows.length > 0) {
    console.log('   Desconectando usuarios de pino_migracion_db existente...');
    await client.query(`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE datname = 'pino_migracion_db' AND pid != pg_backend_pid()
    `);
    console.log('   Eliminando pino_migracion_db previa...');
    await client.query(`DROP DATABASE pino_migracion_db`);
  }

  console.log('2. Desconectando usuarios activos de multitienda_db...');
  await client.query(`
    SELECT pg_terminate_backend(pid) 
    FROM pg_stat_activity 
    WHERE datname = 'multitienda_db' AND pid != pg_backend_pid()
  `);

  console.log('3. Duplicando multitienda_db en pino_migracion_db...');
  await client.query(`CREATE DATABASE pino_migracion_db WITH TEMPLATE multitienda_db`);

  console.log('\n================================================================');
  console.log(' ✅ BASE DE DATOS pino_migracion_db CREADA CON ÉXITO');
  console.log('    Es una copia 100% idéntica en estructura y datos de Pino (multitienda_db).');
  console.log('================================================================\n');

  await client.end();
}

cloneDatabase().catch(err => {
  console.error('Error al clonar la base de datos:', err);
  process.exit(1);
});
