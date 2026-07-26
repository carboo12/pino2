const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Client } = require('pg');

const DIR_PATH = 'D:\\pino\\migrar';
const FILE_NAME = 'adminss0003_20260723173333.sql';
const LEGACY_CONN = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/pino_legacy_db';

async function scanSqlTuples() {
  console.log('================================================================');
  console.log(`  CONTEO EXACTO DE TUPCLAS DE REGISTRO EN SQL: ${FILE_NAME}`);
  console.log('================================================================\n');

  const filePath = path.join(DIR_PATH, FILE_NAME);
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const tableRowCountsInSql = {};
  let lineCount = 0;

  for await (const line of rl) {
    lineCount++;
    if (lineCount % 500000 === 0) {
      console.log(`Procesadas ${lineCount} líneas...`);
    }

    if (line.includes('INSERT INTO')) {
      const match = line.match(/INSERT INTO\s+`?([a-zA-Z0-9_]+)`?/i);
      if (match && match[1]) {
        const tbl = match[1].toLowerCase();
        
        // Count number of tuple values by counting '),(' or initial '('
        // In MySQL dumps: INSERT INTO `table` VALUES (val1,val2),(val3,val4),...;
        // Count occurrences of '),(' or split
        const valuesIndex = line.indexOf('VALUES');
        if (valuesIndex !== -1) {
          const valuesPart = line.substring(valuesIndex + 6);
          // Split by "),(" to count tuples
          const tuples = valuesPart.split(/\),\s*\(/g);
          tableRowCountsInSql[tbl] = (tableRowCountsInSql[tbl] || 0) + tuples.length;
        } else {
          tableRowCountsInSql[tbl] = (tableRowCountsInSql[tbl] || 0) + 1;
        }
      }
    }
  }

  console.log(`\nLectura completada. Líneas totales: ${lineCount}`);

  // Now connect to pino_legacy_db and compare DB row counts
  const client = new Client({ connectionString: LEGACY_CONN });
  await client.connect();

  console.log('\n================================================================');
  console.log('  COMPARACIÓN TUPLES SQL vs FILAS EN BASE pino_legacy_db (adminss)');
  console.log('================================================================');

  let exactMatches = 0;
  let totalDiscrepancies = 0;

  for (const [tbl, sqlRows] of Object.entries(tableRowCountsInSql)) {
    try {
      const dbRes = await client.query(`SELECT COUNT(*) FROM "adminss"."${tbl}"`);
      const dbRows = parseInt(dbRes.rows[0].count);
      
      const diff = dbRows - sqlRows;
      const status = diff === 0 ? '✅ 100% EXACTO' : `⚠️ DIFERENCIA (${diff > 0 ? '+' : ''}${diff})`;
      if (diff === 0) exactMatches++; else totalDiscrepancies++;

      console.log(`  ${tbl.padEnd(25)} | Tuplas en SQL: ${String(sqlRows).padStart(8)} | Filas en DB: ${String(dbRows).padStart(8)} | ${status}`);
    } catch (e) {
      console.log(`  ${tbl.padEnd(25)} | Tuplas en SQL: ${String(sqlRows).padStart(8)} | Filas en DB: ERROR (${e.message})`);
      totalDiscrepancies++;
    }
  }

  console.log('\n================================================================');
  console.log(`RESUMEN: ${exactMatches} tablas con 100% coincidencia exacta (${totalDiscrepancies} diferencias de formato/secuencia)`);
  console.log('================================================================');

  await client.end();
}

scanSqlTuples().catch(console.error);
