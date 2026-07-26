const { Client } = require('pg');

const LEGACY_CONN = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/pino_legacy_db';
const PINO_CONN = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/pino_migracion_db';

async function auditDiscrepancies() {
  const legacy = new Client({ connectionString: LEGACY_CONN });
  const pino = new Client({ connectionString: PINO_CONN });

  await legacy.connect();
  await pino.connect();

  console.log('================================================================');
  console.log(' AUDITORÍA MATEMÁTICA EXACTA DE LAS 2 OBSERVACIONES DEL USUARIO');
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // EXPLICACIÓN 1: PRODUCTOS (3,556 vs 3,730)
  // ---------------------------------------------------------------------------
  const legacyProdCount = await legacy.query(`SELECT count(*) FROM adminss.articulo`);
  const pinoLegacyProds = await pino.query(`SELECT count(*) FROM products WHERE legacy_code IS NOT NULL`);
  const pinoOriginalProds = await pino.query(`SELECT count(*) FROM products WHERE legacy_code IS NULL`);

  console.log('1. DESGLOSE EXACTO DE PRODUCTOS (products):');
  console.log(`   - Productos traídos del ERP Legacy (articulo):       ${legacyProdCount.rows[0].count}`);
  console.log(`   - Productos con legacy_code en pino_migracion_db:   ${pinoLegacyProds.rows[0].count}`);
  console.log(`   - Productos Semilla originales que ya tenía Pino:     ${pinoOriginalProds.rows[0].count}`);
  console.log(`   - TOTAL EN LA TABLA products:                        ${parseInt(pinoLegacyProds.rows[0].count, 10) + parseInt(pinoOriginalProds.rows[0].count, 10)}`);

  // ---------------------------------------------------------------------------
  // EXPLICACIÓN 2: RENGLONES DE OPERMV (506,521 vs 506,510 -> BUSCAR LAS 11 FILAS)
  // ---------------------------------------------------------------------------
  console.log('\n2. BUSCANDO LAS EXACTAS 11 FILAS DE OPERMV EN EL ERP LEGACY:');
  const opermvByTipo = await legacy.query(`
    SELECT tipodoc, count(*) 
    FROM adminss.opermv 
    GROUP BY tipodoc
  `);
  console.log('   Desglose de opermv por tipodoc en MySQL Legacy:');
  opermvByTipo.rows.forEach(r => console.log(`     - tipodoc '${r.tipodoc}': ${parseInt(r.count, 10).toLocaleString()} filas`));

  const saleItemsCount = await pino.query(`SELECT count(*) FROM sale_items`);
  const orderItemsCount = await pino.query(`SELECT count(*) FROM order_items`);

  console.log(`\n   Desglose en Pino (` + PINO_CONN.split('/').pop() + `):`);
  console.log(`     - Renglones en sale_items (FAC, N/D, REC, N/C): ${saleItemsCount.rows[0].count}`);
  console.log(`     - Renglones en order_items (PED, ESP):           ${orderItemsCount.rows[0].count}`);
  console.log(`     - SUMA ACTUAL:                                    ${parseInt(saleItemsCount.rows[0].count, 10) + parseInt(orderItemsCount.rows[0].count, 10)}`);

  // Find exact orphan rows in opermv where document is missing in operti
  const orphanRows = await legacy.query(`
    SELECT m.tipodoc, m.documento, m.codigo, m.cantidad
    FROM adminss.opermv m
    LEFT JOIN adminss.operti t ON m.documento = t.documento AND m.tipodoc = t.tipodoc
    WHERE t.documento IS NULL
  `);

  console.log(`\n   - Renglones en opermv cuyo encabezado en operti FUE BORRADO/NO EXISTÍA en el ERP viejo: ${orphanRows.rows.length} filas`);
  if (orphanRows.rows.length > 0) {
    orphanRows.rows.forEach(r => console.log(`     -> Renglón huérfano en legacy: Documento '${r.documento}', Tipodoc '${r.tipodoc}', SKU '${r.codigo}', Cantidad ${r.cantidad}`));
  }

  console.log('\n================================================================');

  await legacy.end();
  await pino.end();
}

auditDiscrepancies().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
