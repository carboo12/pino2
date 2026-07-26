const { Client } = require('pg');

const LEGACY_CONN = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/pino_legacy_db';
const PINO_CONN = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/pino_migracion_db';

async function fixOrphanOpermvRows() {
  const legacy = new Client({ connectionString: LEGACY_CONN });
  const pino = new Client({ connectionString: PINO_CONN });

  await legacy.connect();
  await pino.connect();

  console.log('================================================================');
  console.log(' CORRIGIENDO LAS 11 FILAS HUÉRFANAS DE OPERMV PARA ALCANZAR 506,521');
  console.log('================================================================\n');

  const storeRes = await pino.query(`SELECT id FROM stores LIMIT 1`);
  const defaultStoreId = storeRes.rows[0].id;

  // 1. Find orphan documents in opermv that lack an operti parent header
  const orphanDocs = await legacy.query(`
    SELECT DISTINCT m.tipodoc, m.documento
    FROM adminss.opermv m
    LEFT JOIN adminss.operti t ON m.documento = t.documento AND m.tipodoc = t.tipodoc
    WHERE t.documento IS NULL
  `);

  console.log(`Documentos huérfanos sin encabezado en legacy: ${orphanDocs.rows.length}`);

  for (const od of orphanDocs.rows) {
    const docNum = od.documento.trim();
    const docType = od.tipodoc.trim();
    const fullKey = `${docType}_${docNum}`;

    console.log(` -> Creando encabezado automático para '${fullKey}' en orders...`);
    const insertRes = await pino.query(`
      INSERT INTO orders (
        store_id, client_name, total, payment_type, tipo_pedido, legacy_doc_number
      ) VALUES ($1, 'Cliente Documento Huérfano Legacy', 0, 'CONTADO', $2, $3)
      RETURNING id
    `, [defaultStoreId, docType, fullKey]);

    await pino.query(`
      INSERT INTO legacy_mapping (entity_type, legacy_code, pino_uuid)
      VALUES ('order', $1, $2)
      ON CONFLICT (entity_type, legacy_code) DO NOTHING
    `, [fullKey, insertRes.rows[0].id]);
  }

  // Reload maps
  const mapRes = await pino.query(`SELECT entity_type, legacy_code, pino_uuid FROM legacy_mapping`);
  const maps = { product: {}, order: {} };
  mapRes.rows.forEach(r => {
    if (maps[r.entity_type]) maps[r.entity_type][r.legacy_code] = r.pino_uuid;
  });

  // Re-insert the 11 orphan rows into order_items
  const orphanRows = await legacy.query(`
    SELECT m.tipodoc, m.documento, m.codigo, m.cantidad, m.preciounit, m.montototal, m.montoneto, m.dsctomtolinea, m.impu_mto
    FROM adminss.opermv m
    LEFT JOIN adminss.operti t ON m.documento = t.documento AND m.tipodoc = t.tipodoc
    WHERE t.documento IS NULL
  `);

  console.log(`Insertando las ${orphanRows.rows.length} filas huérfanas en order_items...`);
  for (const m of orphanRows.rows) {
    const docType = m.tipodoc.trim();
    const docNum = m.documento.trim();
    const fullKey = `${docType}_${docNum}`;
    const orderUuid = maps.order[fullKey];
    const prodUuid = maps.product[m.codigo.trim()];

    if (orderUuid && prodUuid) {
      const qty = Math.max(1, Math.round(parseFloat(m.cantidad || 1)));
      const unitPrice = parseFloat(m.preciounit || 0);
      const subtotal = parseFloat(m.montototal || m.montoneto || 0);
      const dscto = parseFloat(m.dsctomtolinea || 0);
      const tax = parseFloat(m.impu_mto || 0);

      await pino.query(`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal, discount_amount, tax_amount)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [orderUuid, prodUuid, qty, unitPrice, subtotal, dscto, tax]);
    }
  }

  // Verify total sums
  const sRes = await pino.query(`SELECT count(*) FROM sale_items`);
  const oRes = await pino.query(`SELECT count(*) FROM order_items`);
  const totalInPino = parseInt(sRes.rows[0].count, 10) + parseInt(oRes.rows[0].count, 10);

  console.log('\n================================================================');
  console.log(` VERIFICACIÓN FINAL: Total sale_items + order_items = ${totalInPino.toLocaleString()} / 506,521`);
  console.log('================================================================\n');

  await legacy.end();
  await pino.end();
}

fixOrphanOpermvRows().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
