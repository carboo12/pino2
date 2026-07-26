const { Client } = require('pg');

async function main() {
  // 1. Extract legacy schema
  const legacy = new Client({ connectionString: 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/pino_legacy_db' });
  await legacy.connect();

  const legacyTables = [
    { schema: 'adminss', table: 'cliempre' },
    { schema: 'adminss', table: 'articulo' },
    { schema: 'adminss', table: 'operclit' },
    { schema: 'adminss', table: 'operclim' },
    { schema: 'adminss', table: 'operti' },
    { schema: 'adminss', table: 'opermv' },
    { schema: 'adminss', table: 'kardex' },
    { schema: 'adminss', table: 'existenc' },
    { schema: 'adminss', table: 'suplidor' },
    { schema: 'adminss', table: 'listvend' },
    { schema: 'adminss', table: 'gastarti' },
    { schema: 'adminss', table: 'opergast' },
    { schema: 'adminss', table: 'devolti' },
    { schema: 'adminss', table: 'devolmv' },
    { schema: 'adminss', table: 'cargoenc' },
    { schema: 'adminss', table: 'cargodet' },
    { schema: 'adminss', table: 'tranuser' },
    { schema: 'adminss', table: 'usuarios' },
    { schema: 'adminss', table: 'bonifven' },
    { schema: 'adminss', table: 'tarifas' },
    { schema: 'adminss', table: 'grupos' },
    { schema: 'adminss', table: 'subgrupos' },
    { schema: 'adminss', table: 'invcodalternativo' },
    { schema: 'adminss', table: 'notascre_aplic' },
    { schema: 'adminss', table: 'artiprov' },
    { schema: 'adminss', table: 'monedas' },
    { schema: 'adminss', table: 'impuestos' },
    { schema: 'adminss', table: 'sectores' },
    { schema: 'adminss', table: 'operclit_ext' },
  ];

  console.log('='.repeat(80));
  console.log('LEGACY DATABASE SCHEMA (pino_legacy_db)');
  console.log('='.repeat(80));

  for (const lt of legacyTables) {
    const r = await legacy.query(
      `SELECT column_name, data_type, character_maximum_length, is_nullable
       FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = $2
       ORDER BY ordinal_position`,
      [lt.schema, lt.table]
    );
    const count = await legacy.query(`SELECT count(*) FROM "${lt.schema}"."${lt.table}"`);
    console.log(`\n--- ${lt.schema}.${lt.table} (${r.rows.length} columnas, ${count.rows[0].count} filas) ---`);
    r.rows.forEach(row => {
      const type = row.data_type + (row.character_maximum_length ? `(${row.character_maximum_length})` : '');
      console.log(`  ${row.column_name.padEnd(30)} ${type.padEnd(25)} nullable:${row.is_nullable}`);
    });
  }

  await legacy.end();

  // 2. Extract new Pino schema
  const pino = new Client({ connectionString: 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/multitienda_db' });
  await pino.connect();

  const pinoTables = await pino.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
  );

  console.log('\n\n' + '='.repeat(80));
  console.log('PINO DATABASE SCHEMA (multitienda_db)');
  console.log('='.repeat(80));

  for (const t of pinoTables.rows) {
    const r = await pino.query(
      `SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
       ORDER BY ordinal_position`,
      [t.table_name]
    );
    const count = await pino.query(`SELECT count(*) FROM public."${t.table_name}"`);
    console.log(`\n--- public.${t.table_name} (${r.rows.length} columnas, ${count.rows[0].count} filas) ---`);
    r.rows.forEach(row => {
      const type = row.data_type + (row.character_maximum_length ? `(${row.character_maximum_length})` : '');
      console.log(`  ${row.column_name.padEnd(30)} ${type.padEnd(25)} nullable:${row.is_nullable} default:${row.column_default || '-'}`);
    });
  }

  await pino.end();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
