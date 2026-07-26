const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Client } = require('pg');

const CONNECTION_STRING = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/pino_legacy_db';
const DIR_PATH = 'D:\\pino\\migrar';

const FILES = [
  { file: 'syhcontss0003_20260723173333.sql', schema: 'syhcont' },
  { file: 'syhmatriz_ss0003_20260723173333.sql', schema: 'syhmatriz' },
  { file: 'syhss0003_20260723173333.sql', schema: 'syhss' },
  { file: 'adminss0003_20260723173333.sql', schema: 'adminss' },
];

async function countSqlFileTables(filePath) {
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let createTableCount = 0;
  const tableNames = [];

  for await (const line of rl) {
    if (line.toUpperCase().includes('CREATE TABLE')) {
      createTableCount++;
      const match = line.match(/CREATE TABLE\s+(IF NOT EXISTS\s+)?`?([a-zA-Z0-9_]+)`?/i);
      if (match && match[2]) {
        tableNames.push(match[2].toLowerCase());
      }
    }
  }

  return { createTableCount, tableNames };
}

async function verifyImport() {
  const client = new Client({ connectionString: CONNECTION_STRING });
  await client.connect();
  console.log('====================================================');
  console.log('AUDITORÍA DE REVISIÓN DE MIGRACIÓN: pino_legacy_db');
  console.log('====================================================\n');

  let totalSqlTables = 0;
  let totalDbTables = 0;

  for (const item of FILES) {
    const filePath = path.join(DIR_PATH, item.file);
    const { createTableCount, tableNames } = await countSqlFileTables(filePath);

    // Get database tables in schema
    const dbTablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1
    `, [item.schema]);
    const dbTableNames = dbTablesRes.rows.map(r => r.table_name.toLowerCase());
    const dbTableCount = dbTableNames.length;

    totalSqlTables += createTableCount;
    totalDbTables += dbTableCount;

    // Find missing tables if any
    const missingTables = tableNames.filter(t => !dbTableNames.includes(t));

    console.log(`[SCHEMA: ${item.schema.toUpperCase()}]`);
    console.log(`   - Archivo: ${item.file}`);
    console.log(`   - Tablas en archivo SQL: ${createTableCount}`);
    console.log(`   - Tablas creadas en DB: ${dbTableCount}`);
    if (missingTables.length > 0) {
      console.log(`   - Tablas omitidas / no creadas (${missingTables.length}):`, missingTables.slice(0, 10));
    } else {
      console.log(`   - Estado: ✅ 100% DE LAS TABLAS CREADAS EN LA BASE DE DATOS`);
    }
    console.log('');
  }

  // Row counts for key operational tables across all schemas
  console.log('----------------------------------------------------');
  console.log('AUDITORÍA DE REGISTROS / FILAS EN TABLAS OPERATIVAS:');
  console.log('----------------------------------------------------');

  const keyTables = [
    { schema: 'adminss', table: 'articulos' },
    { schema: 'adminss', table: 'clientes' },
    { schema: 'adminss', table: 'vendedores' },
    { schema: 'adminss', table: 'facturas' },
    { schema: 'adminss', table: 'proveedor' },
    { schema: 'adminss', table: 'deposito' },
    { schema: 'adminss', table: 'cajas' },
    { schema: 'adminss', table: 'actividad' },
    { schema: 'syhss', table: 'articulos' },
    { schema: 'syhss', table: 'clientes' },
    { schema: 'syhmatriz', table: 'agencias' },
    { schema: 'syhcont', table: 'syh_cent_cost' }
  ];

  for (const kt of keyTables) {
    try {
      const countRes = await client.query(`SELECT COUNT(*) FROM "${kt.schema}"."${kt.table}"`);
      console.log(`   - ${kt.schema}.${kt.table}: ${countRes.rows[0].count} filas cargadas`);
    } catch (err) {
      console.log(`   - ${kt.schema}.${kt.table}: Error de consulta (${err.message.slice(0, 50)})`);
    }
  }

  console.log('\n====================================================');
  console.log(`TOTAL TABLAS EN ARCHIVOS ORIGINALES: ${totalSqlTables}`);
  console.log(`TOTAL TABLAS REGISTRADAS EN PINO_LEGACY_DB: ${totalDbTables}`);
  console.log(`COBERTURA TOTAL: ${((totalDbTables / totalSqlTables) * 100).toFixed(2)}%`);
  console.log('====================================================');

  await client.end();
}

verifyImport().catch(err => {
  console.error('Fatal Verification Error:', err);
  process.exit(1);
});
