const { Client } = require('pg');

const LEGACY_CONN = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/pino_legacy_db';
const PINO_CONN = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/pino_migracion_db';

async function migrateHistoricalTransactions() {
  const legacy = new Client({ connectionString: LEGACY_CONN });
  const pino = new Client({ connectionString: PINO_CONN });

  await legacy.connect();
  await pino.connect();

  console.log('================================================================');
  console.log(' FASE 4 (MULTI-ROW BATCH CON UNIQUE KEYS): TRANSACCIONES HISTÓRICAS');
  console.log('================================================================\n');

  // Load target store ID
  const storeRes = await pino.query(`SELECT id FROM stores LIMIT 1`);
  const defaultStoreId = storeRes.rows[0].id;

  // Load mapped UUID dictionaries
  console.log('Cargando diccionarios de IDs mapeados desde legacy_mapping...');
  const mapRes = await pino.query(`SELECT entity_type, legacy_code, pino_uuid FROM legacy_mapping`);
  const maps = { client: {}, product: {}, vendor: {}, department: {}, supplier: {} };

  mapRes.rows.forEach(r => {
    if (maps[r.entity_type]) {
      maps[r.entity_type][r.legacy_code] = r.pino_uuid;
    }
  });

  console.log(`   - Productos mapeados: ${Object.keys(maps.product).length}`);
  console.log(`   - Clientes mapeados:  ${Object.keys(maps.client).length}`);
  console.log(`   - Vendedores mapeados: ${Object.keys(maps.vendor).length}\n`);

  // Check if sales headers are already migrated (83,785)
  const existingSales = await pino.query(`SELECT count(*) FROM sales WHERE legacy_doc_number IS NOT NULL`);
  const salesCount = parseInt(existingSales.rows[0].count, 10);

  if (salesCount < 80000) {
    console.log('4.1 Migrando Encabezados de Ventas (operti -> sales)...');
    const opertiRes = await legacy.query(`
      SELECT documento, tipodoc, codcliente, nombrecli, emision, totbruto, totimpuest, totalfinal, 
             vendedor, escredito, fechayhora
      FROM adminss.operti
      WHERE tipodoc IN ('FAC', 'NV', 'PAG', 'REC')
    `);

    console.log(`   Filtrados ${opertiRes.rows.length} documentos de ventas...`);

    await pino.query(`DELETE FROM legacy_mapping WHERE entity_type = 'sale'`);
    await pino.query(`DELETE FROM sales WHERE legacy_doc_number IS NOT NULL`);

    const salesValues = [];
    const salesParams = [];
    let paramIdx = 1;

    for (const o of opertiRes.rows) {
      const docNum = o.documento.trim();
      const docType = o.tipodoc ? o.tipodoc.trim() : 'FAC';
      const fullKey = `${docType}_${docNum}`;
      const clientId = o.codcliente ? (maps.client[o.codcliente.trim()] || null) : null;
      const cashierId = o.vendedor ? (maps.vendor[o.vendedor.trim()] || null) : null;
      const clientName = o.nombrecli ? o.nombrecli.trim() : null;
      const subtotal = parseFloat(o.totbruto || 0);
      const tax = parseFloat(o.totimpuest || 0);
      const total = parseFloat(o.totalfinal || 0);
      const paymentMethod = parseInt(o.escredito || 0, 10) === 1 ? 'CREDITO' : 'CASH';
      const createdAt = o.fechayhora || o.emision;

      salesValues.push(`(
        $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++},
        $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}
      )`);

      salesParams.push(
        defaultStoreId, cashierId, docNum, subtotal, tax, total, paymentMethod,
        createdAt, clientId, clientName, docType, fullKey
      );
    }

    const batchSize = 200;
    for (let i = 0; i < opertiRes.rows.length; i += batchSize) {
      const chunkValues = salesValues.slice(i, i + batchSize);
      const chunkParams = salesParams.slice(i * 12, (i + chunkValues.length) * 12);

      let pIdx = 1;
      const reindexedValues = chunkValues.map(v => v.replace(/\$\d+/g, () => `$${pIdx++}`));

      const query = `
        INSERT INTO sales (
          store_id, cashier_id, ticket_number, subtotal, tax, total, payment_method,
          created_at, client_id, client_name, legacy_doc_type, legacy_doc_number
        ) VALUES ${reindexedValues.join(',')}
        RETURNING id, legacy_doc_number
      `;

      const res = await pino.query(query, chunkParams);

      const mapValues = res.rows.map(r => `('sale', '${r.legacy_doc_number}', '${r.id}')`).join(',');
      if (mapValues.length > 0) {
        await pino.query(`
          INSERT INTO legacy_mapping (entity_type, legacy_code, pino_uuid)
          VALUES ${mapValues}
          ON CONFLICT (entity_type, legacy_code) DO NOTHING
        `);
      }
    }
    console.log(`   ✅ Facturas y Ventas migradas a sales.\n`);
  } else {
    console.log(`4.1 Encabezados de Ventas ya migrados (${salesCount} registros).\n`);
  }

  // Load mapped sales dictionary
  const saleMapRes = await pino.query(`SELECT legacy_code, pino_uuid FROM legacy_mapping WHERE entity_type='sale'`);
  const saleMap = {};
  saleMapRes.rows.forEach(r => saleMap[r.legacy_code] = r.pino_uuid);

  // ---------------------------------------------------------------------------
  // 4.2 DETALLE RENGLONES VENTA (opermv -> sale_items)
  // ---------------------------------------------------------------------------
  console.log('4.2 Migrando Detalle de Renglones (opermv -> sale_items)...');
  const opermvRes = await legacy.query(`
    SELECT tipodoc, documento, codigo, cantidad, preciounit, montototal, montoneto, dsctomtolinea, impu_mto
    FROM adminss.opermv
    WHERE tipodoc IN ('FAC', 'NV', 'PAG', 'REC')
  `);

  console.log(`   Insertando ${opermvRes.rows.length} renglones de venta...`);
  await pino.query(`DELETE FROM sale_items`);

  const itemValues = [];
  for (const m of opermvRes.rows) {
    const docType = m.tipodoc ? m.tipodoc.trim() : 'FAC';
    const docNum = m.documento.trim();
    const fullKey = `${docType}_${docNum}`;
    const saleUuid = saleMap[fullKey];
    const prodUuid = maps.product[m.codigo.trim()];

    if (saleUuid && prodUuid) {
      const qty = Math.round(parseFloat(m.cantidad || 0));
      const unitPrice = parseFloat(m.preciounit || 0);
      const subtotal = parseFloat(m.montototal || m.montoneto || 0);
      const dscto = parseFloat(m.dsctomtolinea || 0);
      const tax = parseFloat(m.impu_mto || 0);

      itemValues.push(`('${saleUuid}', '${prodUuid}', ${qty}, ${unitPrice}, ${subtotal}, ${dscto}, ${tax})`);
    }
  }

  const itemBatchSize = 1000;
  for (let i = 0; i < itemValues.length; i += itemBatchSize) {
    const chunk = itemValues.slice(i, i + itemBatchSize);
    await pino.query(`
      INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal, discount_amount, tax_amount)
      VALUES ${chunk.join(',')}
    `);
    if ((i + itemBatchSize) % 50000 === 0) {
      console.log(`   -> ${i + itemBatchSize} de ${itemValues.length} renglones insertados...`);
    }
  }
  console.log(`   ✅ ${itemValues.length} Renglones migrados a sale_items.\n`);

  // ---------------------------------------------------------------------------
  // 4.3 GASTOS OPERATIVOS (gastarti / opergast -> expenses)
  // ---------------------------------------------------------------------------
  console.log('4.3 Migrando Gastos Operativos (gastarti -> expenses)...');
  const gastosRes = await legacy.query(`
    SELECT documento, totalfinal, notas, emision, vendedor
    FROM adminss.gastarti
  `);

  await pino.query(`DELETE FROM expenses WHERE receipt_number IS NOT NULL`);
  const expenseValues = [];
  for (const g of gastosRes.rows) {
    const docNum = g.documento.trim();
    const amount = parseFloat(g.totalfinal || 0);
    const desc = g.notas ? g.notas.trim().replace(/'/g, "''") : `Gasto ${docNum}`;
    const vendorId = g.vendedor ? (maps.vendor[g.vendedor.trim()] || null) : null;
    const vendorClause = vendorId ? `'${vendorId}'` : 'NULL';

    expenseValues.push(`('${defaultStoreId}', ${amount}, '${desc}', 'OPERATIVO', ${vendorClause}, '${docNum}')`);
  }

  if (expenseValues.length > 0) {
    for (let i = 0; i < expenseValues.length; i += 500) {
      const chunk = expenseValues.slice(i, i + 500);
      await pino.query(`
        INSERT INTO expenses (store_id, amount, description, category, created_by, receipt_number)
        VALUES ${chunk.join(',')}
      `);
    }
  }
  console.log(`   ✅ ${gastosRes.rows.length} Gastos migrados a expenses.\n`);

  // ---------------------------------------------------------------------------
  // 4.4 DEVOLUCIONES (devolti / devolmv -> returns & return_items)
  // ---------------------------------------------------------------------------
  console.log('4.4 Migrando Devoluciones (devolti -> returns)...');
  const devolRes = await legacy.query(`
    SELECT documento, totalfinal, emision, vendedor, codcliente
    FROM adminss.devolti
  `);

  await pino.query(`DELETE FROM returns WHERE legacy_doc_number IS NOT NULL`);
  const returnValues = [];
  for (const d of devolRes.rows) {
    const docNum = d.documento.trim();
    const total = parseFloat(d.totalfinal || 0);
    const vendorId = d.vendedor ? (maps.vendor[d.vendedor.trim()] || null) : null;
    const vendorClause = vendorId ? `'${vendorId}'` : 'NULL';

    returnValues.push(`('${defaultStoreId}', ${vendorClause}, ${total}, '${docNum}')`);
  }

  if (returnValues.length > 0) {
    for (let i = 0; i < returnValues.length; i += 500) {
      const chunk = returnValues.slice(i, i + 500);
      await pino.query(`
        INSERT INTO returns (store_id, rutero_id, total, legacy_doc_number)
        VALUES ${chunk.join(',')}
      `);
    }
  }
  console.log(`   ✅ ${devolRes.rows.length} Devoluciones migradas a returns.\n`);

  // ---------------------------------------------------------------------------
  // 4.5 HISTÓRICO DE KÁRDEX E INVENTARIOS (kardex -> movements)
  // ---------------------------------------------------------------------------
  console.log('4.5 Migrando Movimientos de Kárdex (kardex -> movements)...');
  const kardexRes = await legacy.query(`
    SELECT codigo, cantidad, sumaresta, documento, fecha, exist_ant, costo
    FROM adminss.kardex
  `);

  console.log(`   Procesando ${kardexRes.rows.length} movimientos de kárdex...`);
  await pino.query(`DELETE FROM movements WHERE reference IS NOT NULL`);

  const mvValues = [];
  for (const k of kardexRes.rows) {
    const prodUuid = maps.product[k.codigo.trim()];
    if (prodUuid) {
      const qty = Math.round(parseFloat(k.cantidad || 0));
      const type = parseInt(k.sumaresta || 1, 10) === 1 ? 'IN' : 'OUT';
      const doc = k.documento.trim();
      const balance = Math.round(parseFloat(k.exist_ant || 0));
      const cost = parseFloat(k.costo || 0);

      mvValues.push(`('${defaultStoreId}', '${prodUuid}', '${type}', ${qty}, ${balance}, '${doc}', ${cost})`);
    }
  }

  console.log(`   Insertando ${mvValues.length} registros en movements...`);
  for (let i = 0; i < mvValues.length; i += 1000) {
    const chunk = mvValues.slice(i, i + 1000);
    await pino.query(`
      INSERT INTO movements (store_id, product_id, type, quantity, balance, reference, cost_at_movement)
      VALUES ${chunk.join(',')}
    `);
    if ((i + 1000) % 100000 === 0) {
      console.log(`   -> ${i + 1000} de ${mvValues.length} movimientos insertados...`);
    }
  }
  console.log(`   ✅ ${mvValues.length} Movimientos de Kárdex migrados a movements.\n`);

  console.log('================================================================');
  console.log(' 🎉 RESUMEN FINAL FASE 4: TRANSACCIONES HISTÓRICAS COMPLETADAS');
  console.log('================================================================');
  console.log(`  - Ventas / Facturas: ${salesCount || opertiRes.rows.length}`);
  console.log(`  - Renglones Venta:   ${itemValues.length}`);
  console.log(`  - Gastos Operativos: ${gastosRes.rows.length}`);
  console.log(`  - Devoluciones:      ${devolRes.rows.length}`);
  console.log(`  - Movimientos Kárdex: ${mvValues.length}`);
  console.log('================================================================\n');

  await legacy.end();
  await pino.end();
}

migrateHistoricalTransactions().catch(err => {
  console.error('Fatal Error en Fase 4:', err);
  process.exit(1);
});
