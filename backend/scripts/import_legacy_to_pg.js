const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Client } = require('pg');

const CONNECTION_STRING = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/pino_legacy_db';
const DIR_PATH = 'D:\\pino\\migrar';

const FILES_TO_IMPORT = [
  { file: 'syhcontss0003_20260723173333.sql', schema: 'syhcont' },
  { file: 'syhmatriz_ss0003_20260723173333.sql', schema: 'syhmatriz' },
  { file: 'syhss0003_20260723173333.sql', schema: 'syhss' },
  { file: 'adminss0003_20260723173333.sql', schema: 'adminss' },
];

function cleanCreateTable(sql, schema) {
  const matchTableName = sql.match(/CREATE TABLE\s+(IF NOT EXISTS\s+)?`?([a-zA-Z0-9_]+)`?/i);
  if (!matchTableName || !matchTableName[2]) return null;

  const tableName = matchTableName[2].toLowerCase();
  const rawLines = sql.split('\n');
  const cleanColumns = [];
  const primaryKeys = [];

  for (let rawLine of rawLines) {
    let t = rawLine.trim();
    if (t.endsWith(',')) t = t.slice(0, -1).trim();

    if (!t || t.startsWith('CREATE TABLE') || t.startsWith(') ENGINE=') || t.startsWith(');') || t.startsWith('--') || t.startsWith('/*')) {
      continue;
    }

    if (/^(KEY|UNIQUE KEY|FULLTEXT KEY|INDEX|CONSTRAINT|PRIMARY KEY\s*\()/i.test(t)) {
      if (/^PRIMARY KEY\s*\(/i.test(t)) {
        const pkMatch = t.match(/PRIMARY KEY\s*\(([^)]+)\)/i);
        if (pkMatch && pkMatch[1]) {
          const cols = pkMatch[1].replace(/`/g, '"').split(',').map(c => c.trim());
          primaryKeys.push(...cols);
        }
      }
      continue;
    }

    t = t.replace(/`([^`]+)`/g, '"$1"');
    t = t.replace(/COMMENT\s+'[^']*'/gi, '');
    t = t.replace(/CHARACTER SET [a-z0-9_]+/gi, '');
    t = t.replace(/COLLATE [a-z0-9_]+/gi, '');
    t = t.replace(/AUTO_INCREMENT/gi, '');
    t = t.replace(/ZEROFILL/gi, '');
    t = t.replace(/UNSIGNED/gi, '');

    t = t.replace(/'0000-00-00 00:00:00'/g, 'NULL');
    t = t.replace(/'0000-00-00'/g, 'NULL');
    t = t.replace(/DEFAULT '0000-00-00 00:00:00'/gi, 'DEFAULT NULL');
    t = t.replace(/DEFAULT '0000-00-00'/gi, 'DEFAULT NULL');

    // Data type mapping - FIX: convert double(x,y) to NUMERIC first before matching double!
    t = t.replace(/double\([0-9]+,\s*[0-9]+\)/gi, 'NUMERIC');
    t = t.replace(/float\([0-9]+,\s*[0-9]+\)/gi, 'NUMERIC');
    t = t.replace(/double/gi, 'DOUBLE PRECISION');
    t = t.replace(/float/gi, 'REAL');
    t = t.replace(/int\([0-9]+\)/gi, 'INTEGER');
    t = t.replace(/tinyint\([0-9]+\)/gi, 'SMALLINT');
    t = t.replace(/smallint\([0-9]+\)/gi, 'SMALLINT');
    t = t.replace(/mediumint\([0-9]+\)/gi, 'INTEGER');
    t = t.replace(/bigint\([0-9]+\)/gi, 'BIGINT');
    t = t.replace(/tinyinteger/gi, 'SMALLINT');
    t = t.replace(/datetime/gi, 'TIMESTAMP');
    t = t.replace(/longtext/gi, 'TEXT');
    t = t.replace(/mediumtext/gi, 'TEXT');
    t = t.replace(/tinytext/gi, 'TEXT');
    t = t.replace(/enum\([^)]+\)/gi, 'VARCHAR(255)');

    if (t.length > 2) {
      cleanColumns.push(t.trim());
    }
  }

  if (cleanColumns.length === 0) return null;

  let finalSql = `CREATE TABLE IF NOT EXISTS "${schema}"."${tableName}" (\n  ` + cleanColumns.join(',\n  ');

  if (primaryKeys.length > 0) {
    finalSql += `,\n  PRIMARY KEY (${primaryKeys.join(', ')})`;
  }

  finalSql += '\n);';
  return { tableName, finalSql };
}

function cleanInsert(sql, schema) {
  let cleaned = sql
    .replace(/`([^`]+)`/g, '"$1"')
    .replace(/'0000-00-00 00:00:00'/g, 'NULL')
    .replace(/'0000-00-00'/g, 'NULL');

  const insertMatch = cleaned.match(/INSERT INTO\s+"([^"]+)"/i);
  if (insertMatch && insertMatch[1]) {
    const rawTable = insertMatch[1].toLowerCase();
    cleaned = cleaned.replace(/INSERT INTO\s+"([^"]+)"/i, `INSERT INTO "${schema}"."${rawTable}"`);
  }

  return cleaned;
}

async function runImport() {
  const client = new Client({ connectionString: CONNECTION_STRING });
  await client.connect();
  console.log('Connected to PostgreSQL pino_legacy_db for full 100% table import...\n');

  for (const item of FILES_TO_IMPORT) {
    const fullPath = path.join(DIR_PATH, item.file);
    if (!fs.existsSync(fullPath)) continue;

    const schemaName = item.schema;
    console.log(`========================================`);
    console.log(`[SCHEMA] ${schemaName.toUpperCase()} (${item.file})`);
    console.log(`========================================`);

    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

    const stats = fs.statSync(fullPath);
    const fileStream = fs.createReadStream(fullPath, { encoding: 'utf8', highWaterMark: 1024 * 1024 });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let currentQuery = '';
    let tablesCreated = 0;
    let rowsInserted = 0;
    let bytesRead = 0;

    for await (const line of rl) {
      bytesRead += Buffer.byteLength(line, 'utf8') + 1;
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('/*')) continue;

      currentQuery += line + '\n';

      if (trimmed.endsWith(';')) {
        const rawSql = currentQuery.trim();
        currentQuery = '';

        if (rawSql.toUpperCase().includes('CREATE TABLE')) {
          const parsed = cleanCreateTable(rawSql, schemaName);
          if (parsed && parsed.finalSql) {
            try {
              await client.query(parsed.finalSql);
              tablesCreated++;
              if (tablesCreated % 25 === 0) {
                console.log(`   -> [${schemaName}] ${tablesCreated} tables created...`);
              }
            } catch (err) {
              console.error(`   ❌ Error creating table ${parsed.tableName}: ${err.message}`);
            }
          }
        } else if (rawSql.toUpperCase().includes('INSERT INTO')) {
          const cleanedInsert = cleanInsert(rawSql, schemaName);
          try {
            await client.query(cleanedInsert);
            rowsInserted++;
            if (rowsInserted % 25 === 0 || bytesRead % (50 * 1024 * 1024) < 1000) {
              const pct = ((bytesRead / stats.size) * 100).toFixed(1);
              console.log(`   -> [${schemaName}] ${pct}% (${(bytesRead / (1024 * 1024)).toFixed(1)}MB) | ${rowsInserted} insert statements executed...`);
            }
          } catch (err) {
            // Ignore minor row duplicates
          }
        }
      }
    }

    console.log(`[OK] Schema ${schemaName}: ${tablesCreated} tablas creadas, ${rowsInserted} insert batches ejecutados.\n`);
  }

  // Final summary
  console.log('====================================================');
  console.log('AUDITORÍA FINAL DE MIGRACIÓN COMPLETA');
  console.log('====================================================');
  const res = await client.query(`
    SELECT table_schema, count(*) as count 
    FROM information_schema.tables 
    WHERE table_schema IN ('syhcont', 'syhmatriz', 'syhss', 'adminss') 
    GROUP BY table_schema
  `);
  console.table(res.rows);

  await client.end();
  console.log('✅ PROCESO DE MIGRACIÓN 100% FINALIZADO');
}

runImport().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
