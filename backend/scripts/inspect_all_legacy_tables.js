const { Client } = require('pg');

const LEGACY_CONN = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/pino_legacy_db';

async function inspectFast() {
  const legacy = new Client({ connectionString: LEGACY_CONN });
  await legacy.connect();

  console.log('================================================================');
  console.log(' INVENTARIO EXACTO Y ANÁLISIS DE LAS 706 TABLAS (pino_legacy_db)');
  console.log('================================================================\n');

  // Fetch all table names
  const tablesRes = await legacy.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema IN ('adminss', 'syhss', 'syhmatriz', 'syhcont')
    ORDER BY table_schema, table_name
  `);

  console.log(`Total tablas registradas en el motor: ${tablesRes.rows.length}\n`);

  const results = [];
  const chunkSize = 25;

  for (let i = 0; i < tablesRes.rows.length; i += chunkSize) {
    const chunk = tablesRes.rows.slice(i, i + chunkSize);
    const promises = chunk.map(async (t) => {
      try {
        const c = await legacy.query(`SELECT count(*) FROM "${t.table_schema}"."${t.table_name}"`);
        return { schema: t.table_schema, table: t.table_name, count: parseInt(c.rows[0].count, 10) };
      } catch (e) {
        return { schema: t.table_schema, table: t.table_name, count: 0, error: true };
      }
    });

    const chunkResults = await Promise.all(promises);
    results.push(...chunkResults);
  }

  const nonZero = results.filter(r => r.count > 0).sort((a, b) => b.count - a.count);
  const zero = results.filter(r => r.count === 0);

  console.log(`📌 TABLAS QUE CONTIENEN INFORMACIÓN (${nonZero.length} TABLAS ACTIVAS):`);
  console.log('----------------------------------------------------------------------------------------');

  nonZero.forEach((item, idx) => {
    const num = (idx + 1).toString().padStart(3);
    const fullname = `${item.schema}.${item.table}`.padEnd(38);
    const cnt = item.count.toLocaleString().padStart(10);
    console.log(`  ${num}. ${fullname} : ${cnt} filas`);
  });

  console.log(`\n📌 TABLAS COMPLETAMENTE VACÍAS (0 REGISTROS): ${zero.length} TABLAS`);
  console.log('----------------------------------------------------------------------------------------');
  console.log(`  Ejemplos de tablas vacías en el ERP legacy:`);
  console.log(`  - ${zero.slice(0, 15).map(z => z.schema + '.' + z.table).join('\n  - ')}`);
  console.log(`  ... y ${zero.length - 15} tablas vacías más.\n`);

  console.log('================================================================');
  console.log(' RESUMEN FINAL');
  console.log('================================================================');
  console.log(`  - Total Tablas en Legacy:        ${tablesRes.rows.length}`);
  console.log(`  - Tablas Con Registros (>0):     ${nonZero.length}`);
  console.log(`  - Tablas Vacías (=0):            ${zero.length}`);
  console.log(`  - Total Registros en el Sistema: ${nonZero.reduce((a,b) => a + b.count, 0).toLocaleString()} filas`);
  console.log('================================================================\n');

  await legacy.end();
}

inspectFast().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
