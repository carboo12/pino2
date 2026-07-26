const { Client } = require('pg');

const LEGACY_CONN = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/pino_legacy_db';
const PINO_CONN = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/pino_migracion_db';

async function diagnoseMissingRecords() {
  const legacy = new Client({ connectionString: LEGACY_CONN });
  const pino = new Client({ connectionString: PINO_CONN });

  await legacy.connect();
  await pino.connect();

  console.log('================================================================');
  console.log(' DIAGNÓSTICO EXHAUSTIVO DE REGISTROS NO MIGRADOS Y DIFERENCIAS');
  console.log('================================================================\n');

  // 1. Check ALL tipodoc values in operti
  console.log('1. Análisis de Tipos de Documento en operti (Encabezados):');
  const tipodocRes = await legacy.query(`
    SELECT tipodoc, COUNT(*) as count 
    FROM adminss.operti 
    GROUP BY tipodoc 
    ORDER BY count DESC
  `);
  tipodocRes.rows.forEach(r => console.log(`   - Tipodoc '${r.tipodoc}': ${parseInt(r.count, 10).toLocaleString()} registros`));

  // 2. Check ALL tipodoc values in opermv
  console.log('\n2. Análisis de Tipos de Documento en opermv (Renglones):');
  const opermvTipos = await legacy.query(`
    SELECT tipodoc, COUNT(*) as count 
    FROM adminss.opermv 
    GROUP BY tipodoc 
    ORDER BY count DESC
  `);
  opermvTipos.rows.forEach(r => console.log(`   - Tipodoc '${r.tipodoc}': ${parseInt(r.count, 10).toLocaleString()} renglones`));

  // 3. Find missing products referenced in kardex but absent in articulo
  console.log('\n3. Productos en Kárdex que NO estaban en el Catálogo de Productos (articulo):');
  const missingProdsKardex = await legacy.query(`
    SELECT DISTINCT TRIM(k.codigo) as code
    FROM adminss.kardex k
    LEFT JOIN adminss.articulo a ON TRIM(k.codigo) = TRIM(a.codigo)
    WHERE a.codigo IS NULL
  `);
  console.log(`   - Productos faltantes en catálogo: ${missingProdsKardex.rows.length} códigos`);
  if (missingProdsKardex.rows.length > 0) {
    console.log(`     Ejemplos: ${missingProdsKardex.rows.slice(0, 10).map(r => r.code).join(', ')}`);
  }

  // 4. Find missing products referenced in opermv but absent in articulo
  console.log('\n4. Productos en Renglones (opermv) que NO estaban en el Catálogo (articulo):');
  const missingProdsOpermv = await legacy.query(`
    SELECT DISTINCT TRIM(m.codigo) as code
    FROM adminss.opermv m
    LEFT JOIN adminss.articulo a ON TRIM(m.codigo) = TRIM(a.codigo)
    WHERE a.codigo IS NULL
  `);
  console.log(`   - Productos faltantes en catálogo: ${missingProdsOpermv.rows.length} códigos`);

  // 5. Check opergast (Operaciones de Gastos) vs gastarti
  console.log('\n5. Análisis de Gastos (opergast vs gastarti):');
  const opergastCount = await legacy.query(`SELECT COUNT(*) FROM adminss.opergast`);
  const gastartiCount = await legacy.query(`SELECT COUNT(*) FROM adminss.gastarti`);
  const gastarmvCount = await legacy.query(`SELECT COUNT(*) FROM adminss.gastarmv`);
  console.log(`   - opergast: ${opergastCount.rows[0].count} encabezados`);
  console.log(`   - gastarti: ${gastartiCount.rows[0].count} renglones de gasto`);
  console.log(`   - gastarmv: ${gastarmvCount.rows[0].count} detalles de gasto`);

  console.log('\n================================================================');

  await legacy.end();
  await pino.end();
}

diagnoseMissingRecords().catch(err => {
  console.error('Error en diagnóstico:', err);
  process.exit(1);
});
