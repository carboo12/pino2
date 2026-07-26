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

async function countSqlFileDetails(filePath) {
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let createTableCount = 0;
  const tableNames = [];
  const insertCounts = {}; // table -> number of INSERT statements
  let currentInsertTable = null;

  for await (const line of rl) {
    const upper = line.toUpperCase().trim();

    if (upper.includes('CREATE TABLE')) {
      createTableCount++;
      const match = line.match(/CREATE TABLE\s+(IF NOT EXISTS\s+)?`?([a-zA-Z0-9_]+)`?/i);
      if (match && match[2]) {
        tableNames.push(match[2].toLowerCase());
      }
    }

    if (upper.includes('INSERT INTO')) {
      const match = line.match(/INSERT INTO\s+`?([a-zA-Z0-9_]+)`?/i);
      if (match && match[1]) {
        const tbl = match[1].toLowerCase();
        insertCounts[tbl] = (insertCounts[tbl] || 0) + 1;
      }
    }
  }

  return { createTableCount, tableNames, insertCounts };
}

async function audit() {
  const client = new Client({ connectionString: CONNECTION_STRING });
  await client.connect();

  console.log('================================================================');
  console.log('  AUDITORÍA COMPLETA DE INTEGRIDAD DE DATOS — pino_legacy_db');
  console.log('================================================================\n');

  let grandTotalSqlTables = 0;
  let grandTotalDbTables = 0;
  let grandTotalSqlInserts = 0;
  let grandTotalDbRows = 0;
  let tablesWithData = 0;
  let tablesEmpty = 0;
  let tablesMissingData = 0;
  const problems = [];

  for (const item of FILES) {
    const filePath = path.join(DIR_PATH, item.file);
    console.log(`\n╔══════════════════════════════════════════════════════════╗`);
    console.log(`║  SCHEMA: ${item.schema.toUpperCase().padEnd(47)}║`);
    console.log(`║  Archivo: ${item.file.padEnd(46)}║`);
    console.log(`╚══════════════════════════════════════════════════════════╝`);

    const { createTableCount, tableNames, insertCounts } = await countSqlFileDetails(filePath);

    // Get DB tables
    const dbTablesRes = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name`,
      [item.schema]
    );
    const dbTableNames = dbTablesRes.rows.map(r => r.table_name.toLowerCase());

    grandTotalSqlTables += createTableCount;
    grandTotalDbTables += dbTableNames.length;

    // Missing tables
    const missingTables = tableNames.filter(t => !dbTableNames.includes(t));
    console.log(`\n  [TABLAS] SQL: ${createTableCount} | DB: ${dbTableNames.length} | Faltantes: ${missingTables.length}`);
    if (missingTables.length > 0) {
      console.log(`  ⚠️  Tablas faltantes: ${missingTables.join(', ')}`);
      problems.push(`${item.schema}: ${missingTables.length} tablas faltantes`);
    } else {
      console.log(`  ✅ TODAS las tablas del archivo SQL existen en la DB`);
    }

    // Row-level audit for tables that had INSERT statements
    const tablesWithInserts = Object.keys(insertCounts);
    const sqlInsertsTotal = Object.values(insertCounts).reduce((a, b) => a + b, 0);
    grandTotalSqlInserts += sqlInsertsTotal;

    console.log(`\n  [DATOS] ${tablesWithInserts.length} tablas con INSERT en SQL (${sqlInsertsTotal} total inserts)`);
    console.log(`  ─────────────────────────────────────────────────────`);

    for (const tblName of tablesWithInserts) {
      const sqlInsertCount = insertCounts[tblName];
      try {
        const countRes = await client.query(`SELECT count(*) FROM "${item.schema}"."${tblName}"`);
        const dbRowCount = parseInt(countRes.rows[0].count, 10);
        grandTotalDbRows += dbRowCount;

        if (dbRowCount > 0) {
          tablesWithData++;
          console.log(`  ✅ ${item.schema}.${tblName}: ${sqlInsertCount} INSERT(s) → ${dbRowCount} filas en DB`);
        } else {
          tablesEmpty++;
          console.log(`  ⚠️  ${item.schema}.${tblName}: ${sqlInsertCount} INSERT(s) → 0 filas en DB (INSERT falló)`);
          tablesMissingData++;
          problems.push(`${item.schema}.${tblName}: ${sqlInsertCount} INSERTs pero 0 filas`);
        }
      } catch (err) {
        console.log(`  ❌ ${item.schema}.${tblName}: Error al consultar (${err.message.slice(0, 60)})`);
        problems.push(`${item.schema}.${tblName}: error de consulta`);
      }
    }

    // Also check ALL DB tables for row counts (even those without INSERTs in file)
    console.log(`\n  [TABLAS CON DATOS EN DB (muestra)]`);
    const allCountsRes = await client.query(`
      SELECT schemaname, relname, n_live_tup 
      FROM pg_stat_user_tables 
      WHERE schemaname = $1 AND n_live_tup > 0
      ORDER BY n_live_tup DESC LIMIT 10
    `, [item.schema]);
    if (allCountsRes.rows.length > 0) {
      for (const row of allCountsRes.rows) {
        console.log(`     📊 ${row.schemaname}.${row.relname}: ~${row.n_live_tup} filas`);
      }
    } else {
      console.log(`     (sin datos visibles en pg_stat_user_tables, ejecutando ANALYZE...)`);
      await client.query(`ANALYZE`);
    }
  }

  // GRAND SUMMARY
  console.log(`\n\n╔══════════════════════════════════════════════════════════╗`);
  console.log(`║              RESUMEN FINAL DE AUDITORÍA                 ║`);
  console.log(`╚══════════════════════════════════════════════════════════╝`);
  console.log(`  Tablas declaradas en SQL:       ${grandTotalSqlTables}`);
  console.log(`  Tablas existentes en DB:         ${grandTotalDbTables}`);
  console.log(`  Cobertura de Tablas:             ${((grandTotalDbTables / grandTotalSqlTables) * 100).toFixed(2)}%`);
  console.log(`  Total INSERT statements en SQL:  ${grandTotalSqlInserts}`);
  console.log(`  Tablas con datos cargados:       ${tablesWithData}`);
  console.log(`  Tablas con INSERT pero vacías:    ${tablesMissingData}`);
  console.log(`  Total filas cargadas en DB:      ${grandTotalDbRows}`);

  if (problems.length > 0) {
    console.log(`\n  ⚠️  PROBLEMAS DETECTADOS (${problems.length}):`);
    for (const p of problems) {
      console.log(`     - ${p}`);
    }
  } else {
    console.log(`\n  ✅ SIN PROBLEMAS DETECTADOS — MIGRACIÓN COMPLETA`);
  }

  console.log(`\n================================================================\n`);
  await client.end();
}

audit().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
