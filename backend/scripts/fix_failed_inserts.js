const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Client } = require('pg');

const CONNECTION_STRING = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/pino_legacy_db';
const DIR_PATH = 'D:\\pino\\migrar';

// Only re-import tables that had 0 rows
const FAILED_TABLES = [
  'articulo', 'artiprov', 'avisoshotel', 'bonifven', 'cambio',
  'cargodet', 'cliempre', 'config', 'config2', 'devolti', 'devoltic',
  'existenc', 'gastarti', 'grupos', 'huesped', 'listbanc',
  'monedas_varianza', 'operclit', 'opergast', 'opermv', 'operti',
  'recepciti', 'subgrupos', 'suplidor', 'tcretab', 'tdebtab', 'usuarios',
  // syhmatriz
  'syh_articulo_dat_adic', 'syh_cuadre_caja', 'syh_errores',
];

const FILES_TO_FIX = [
  { file: 'syhcontss0003_20260723173333.sql', schema: 'syhcont' },
  { file: 'syhmatriz_ss0003_20260723173333.sql', schema: 'syhmatriz' },
  { file: 'syhss0003_20260723173333.sql', schema: 'syhss' },
  { file: 'adminss0003_20260723173333.sql', schema: 'adminss' },
];

function fixInsert(sql, schema) {
  let cleaned = sql;
  
  // Replace backticks with nothing for table/column names
  cleaned = cleaned.replace(/`([^`]+)`/g, '"$1"');
  
  // FIX: Replace zero-dates with epoch date '1970-01-01' instead of NULL
  // This avoids NOT NULL constraint violations
  cleaned = cleaned.replace(/'0000-00-00 00:00:00'/g, "'1970-01-01 00:00:00'");
  cleaned = cleaned.replace(/'0000-00-00'/g, "'1970-01-01'");
  
  // Add schema prefix
  const insertMatch = cleaned.match(/INSERT INTO\s+"([^"]+)"/i);
  if (insertMatch && insertMatch[1]) {
    const rawTable = insertMatch[1].toLowerCase();
    cleaned = cleaned.replace(/INSERT INTO\s+"([^"]+)"/i, `INSERT INTO "${schema}"."${rawTable}"`);
    return { table: rawTable, sql: cleaned };
  }
  
  return null;
}

async function fixFailedInserts() {
  const client = new Client({ connectionString: CONNECTION_STRING });
  await client.connect();
  console.log('Connected to pino_legacy_db — Fixing 32 tables with failed INSERTs...\n');

  for (const item of FILES_TO_FIX) {
    const fullPath = path.join(DIR_PATH, item.file);
    if (!fs.existsSync(fullPath)) continue;

    const schemaName = item.schema;
    const stats = fs.statSync(fullPath);
    const fileStream = fs.createReadStream(fullPath, { encoding: 'utf8', highWaterMark: 1024 * 1024 });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let currentQuery = '';
    let fixed = 0;
    let bytesRead = 0;

    console.log(`[${schemaName.toUpperCase()}] Scanning ${item.file} (${(stats.size / (1024*1024)).toFixed(1)} MB)...`);

    for await (const line of rl) {
      bytesRead += Buffer.byteLength(line, 'utf8') + 1;
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('/*')) continue;

      currentQuery += line + '\n';

      if (trimmed.endsWith(';')) {
        const rawSql = currentQuery.trim();
        currentQuery = '';

        if (rawSql.toUpperCase().includes('INSERT INTO')) {
          // Check if this INSERT is for a failed table
          const tableMatch = rawSql.match(/INSERT INTO\s+`?([a-zA-Z0-9_]+)`?/i);
          if (tableMatch && FAILED_TABLES.includes(tableMatch[1].toLowerCase())) {
            const parsed = fixInsert(rawSql, schemaName);
            if (parsed) {
              try {
                await client.query(parsed.sql);
                fixed++;
                if (fixed % 25 === 0) {
                  const pct = ((bytesRead / stats.size) * 100).toFixed(1);
                  console.log(`   -> [${schemaName}] ${pct}% | ${fixed} INSERT statements fixed for failed tables...`);
                }
              } catch (err) {
                console.error(`   ❌ ${schemaName}.${parsed.table}: ${err.message.slice(0, 80)}`);
              }
            }
          }
        }
      }
    }

    console.log(`[OK] ${schemaName}: ${fixed} INSERT statements re-executed.\n`);
  }

  // Verify results
  console.log('====================================================');
  console.log('VERIFICACIÓN POST-FIX:');
  console.log('====================================================');

  for (const tbl of FAILED_TABLES) {
    for (const schema of ['adminss', 'syhss', 'syhmatriz', 'syhcont']) {
      try {
        const res = await client.query(`SELECT count(*) FROM "${schema}"."${tbl}"`);
        const count = parseInt(res.rows[0].count, 10);
        if (count > 0) {
          console.log(`  ✅ ${schema}.${tbl}: ${count} filas cargadas`);
        }
      } catch (err) {
        // Table doesn't exist in this schema, skip
      }
    }
  }

  await client.end();
  console.log('\n✅ FIX COMPLETADO');
}

fixFailedInserts().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
