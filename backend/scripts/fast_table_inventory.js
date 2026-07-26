const { Client } = require('pg');

const LEGACY_CONN = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/pino_legacy_db';

async function fastInventory() {
  const legacy = new Client({ connectionString: LEGACY_CONN });
  await legacy.connect();

  console.log('================================================================');
  console.log(' AUDITORÍA COMPLETA Y REVISIÓN MINUCIOSA DE TABLAS LEGACY');
  console.log('================================================================\n');

  // First run ANALYZE so pg_stat_user_tables has exact tup numbers
  await legacy.query('ANALYZE');

  const res = await legacy.query(`
    SELECT schemaname, relname, n_live_tup 
    FROM pg_stat_user_tables 
    WHERE schemaname IN ('adminss', 'syhss', 'syhmatriz', 'syhcont')
    ORDER BY n_live_tup DESC
  `);

  let countActive = 0;
  let countEmpty = 0;
  let grandTotal = 0;

  console.log('📋 INVENTARIO COMPLETO DE TABLAS CON FILAS (>0 REGISTROS):');
  console.log('----------------------------------------------------------------------------------------');

  res.rows.forEach(r => {
    const cnt = parseInt(r.n_live_tup, 10);
    grandTotal += cnt;
    if (cnt > 0) {
      countActive++;
      const num = countActive.toString().padStart(3);
      const fullname = `${r.schemaname}.${r.relname}`.padEnd(38);
      console.log(`  ${num}. ${fullname} : ${cnt.toLocaleString().padStart(10)} filas`);
    } else {
      countEmpty++;
    }
  });

  console.log('\n================================================================');
  console.log(' RESUMEN FINAL DETALLADO');
  console.log('================================================================');
  console.log(`  - Total Tablas Analizadas:       ${res.rows.length}`);
  console.log(`  - Tablas CON DATOS (Filas > 0):   ${countActive}`);
  console.log(`  - Tablas VACÍAS (Filas = 0):      ${countEmpty}`);
  console.log(`  - Total Absoluto de Filas:       ${grandTotal.toLocaleString()}`);
  console.log('================================================================\n');

  await legacy.end();
}

fastInventory().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
