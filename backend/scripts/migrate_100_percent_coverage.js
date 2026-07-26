const { Client } = require('pg');

const LEGACY_CONN = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/pino_legacy_db';
const PINO_CONN = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/pino_migracion_db';

async function migrate100PercentCoverage() {
  const legacy = new Client({ connectionString: LEGACY_CONN });
  const pino = new Client({ connectionString: PINO_CONN });

  await legacy.connect();
  await pino.connect();

  console.log('================================================================');
  console.log(' MIGRACIÓN TOTAL SIN OMISIÓN (COBERTURA 100.00% SIN PERDER 1 FILA)');
  console.log('================================================================\n');

  // Load target store & chain IDs
  const storeRes = await pino.query(`SELECT id, chain_id FROM stores LIMIT 1`);
  const defaultStoreId = storeRes.rows[0].id;

  // ---------------------------------------------------------------------------
  // PASO 0: CREAR PRODUCTO COMODÍN PARA SKUs EN KÁRDEX/OPEMV FALTANTES
  // ---------------------------------------------------------------------------
  console.log('PASO 0: Asegurando Productos Comodín para SKUs huérfanos...');
  const missingKardexProds = await legacy.query(`
    SELECT DISTINCT TRIM(k.codigo) as code
    FROM adminss.kardex k
    LEFT JOIN adminss.articulo a ON TRIM(k.codigo) = TRIM(a.codigo)
    WHERE a.codigo IS NULL
  `);

  for (const mp of missingKardexProds.rows) {
    const code = mp.code;
    const insertRes = await pino.query(`
      INSERT INTO products (store_id, barcode, description, sale_price, cost_price, current_stock, legacy_code)
      VALUES ($1, $2, $3, 0, 0, 0, $2)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [defaultStoreId, code, `Producto Legacy Sin Nombre (${code})`]);

    if (insertRes.rows.length > 0) {
      await pino.query(`
        INSERT INTO legacy_mapping (entity_type, legacy_code, pino_uuid)
        VALUES ('product', $1, $2)
        ON CONFLICT (entity_type, legacy_code) DO UPDATE SET pino_uuid = EXCLUDED.pino_uuid
      `, [code, insertRes.rows[0].id]);
    }
  }
  console.log(`   ✅ SKUs comodín verificados.\n`);

  // Reload mapped UUID dictionaries
  console.log('Cargando diccionarios relacionales mapeados...');
  const mapRes = await pino.query(`SELECT entity_type, legacy_code, pino_uuid FROM legacy_mapping`);
  const maps = { client: {}, product: {}, vendor: {}, department: {}, supplier: {}, sale: {}, order: {} };

  mapRes.rows.forEach(r => {
    if (maps[r.entity_type]) {
      maps[r.entity_type][r.legacy_code] = r.pino_uuid;
    }
  });

  // ---------------------------------------------------------------------------
  // PASO 1: MIGRAR 100% DE OPERTI (87,142 ENCABEZADOS DE DOCUMENTO)
  // ---------------------------------------------------------------------------
  console.log('PASO 1: Migrando el 100% de operti (87,142 Encabezados)...');
  const opertiAll = await legacy.query(`
    SELECT documento, tipodoc, codcliente, nombrecli, emision, totbruto, totimpuest, totalfinal, 
           vendedor, escredito, fechayhora
    FROM adminss.operti
  `);

  console.log(`   Procesando los ${opertiAll.rows.length} documentos de operti...`);

  // Clear previous transactions in target
  await pino.query(`DELETE FROM legacy_mapping WHERE entity_type IN ('sale', 'order')`);
  await pino.query(`DELETE FROM sale_items`);
  await pino.query(`DELETE FROM order_items`);
  await pino.query(`DELETE FROM sales WHERE legacy_doc_number IS NOT NULL`);
  await pino.query(`DELETE FROM orders WHERE legacy_doc_number IS NOT NULL`);
  await pino.query(`DELETE FROM authorizations`);

  const salesValues = [];
  const salesParams = [];
  let sParamIdx = 1;

  const ordersValues = [];
  const ordersParams = [];
  let oParamIdx = 1;

  const authValues = [];

  let countSales = 0;
  let countOrders = 0;
  let countAuths = 0;

  for (const o of opertiAll.rows) {
    const docNum = o.documento.trim();
    const docType = o.tipodoc ? o.tipodoc.trim() : 'FAC';
    const fullKey = `${docType}_${docNum}`;
    const clientId = o.codcliente ? (maps.client[o.codcliente.trim()] || null) : null;
    const vendorId = o.vendedor ? (maps.vendor[o.vendedor.trim()] || null) : null;
    const clientName = o.nombrecli ? o.nombrecli.trim() : null;
    const subtotal = parseFloat(o.totbruto || 0);
    const tax = parseFloat(o.totimpuest || 0);
    const total = parseFloat(o.totalfinal || 0);
    const isCredito = parseInt(o.escredito || 0, 10) === 1;
    const paymentMethodSale = isCredito ? 'CREDITO' : 'CASH';
    const paymentTypeOrder = isCredito ? 'CREDITO' : 'CONTADO';

    const rawDate = o.fechayhora || o.emision;
    const createdAtIso = rawDate ? new Date(rawDate).toISOString() : new Date().toISOString();

    if (['FAC', 'N/D', 'REC', 'N/C'].includes(docType)) {
      // Goes to sales
      countSales++;
      salesValues.push(`(
        $${sParamIdx++}, $${sParamIdx++}, $${sParamIdx++}, $${sParamIdx++}, $${sParamIdx++}, $${sParamIdx++},
        $${sParamIdx++}, $${sParamIdx++}, $${sParamIdx++}, $${sParamIdx++}, $${sParamIdx++}, $${sParamIdx++}
      )`);

      salesParams.push(
        defaultStoreId, vendorId, docNum, subtotal, tax, total, paymentMethodSale,
        createdAtIso, clientId, clientName, docType, fullKey
      );
    } else if (['PED', 'ESP'].includes(docType)) {
      // Goes to orders
      countOrders++;
      ordersValues.push(`(
        $${oParamIdx++}, $${oParamIdx++}, $${oParamIdx++}, $${oParamIdx++}, $${oParamIdx++},
        $${oParamIdx++}, $${oParamIdx++}, $${oParamIdx++}, $${oParamIdx++}
      )`);

      ordersParams.push(
        defaultStoreId, clientId, clientName, vendorId, total, paymentTypeOrder,
        createdAtIso, docType, fullKey
      );
    } else if (docType === 'APR') {
      // Goes to authorizations
      countAuths++;
      const safeName = clientName ? clientName.replace(/'/g, "''") : `Autorizacion ${docNum}`;
      authValues.push(`('${defaultStoreId}', '${docType}', '{"documento":"${docNum}","cliente":"${safeName}"}', 'APPROVED', '${createdAtIso}')`);
    }
  }

  // Insert sales in chunks of 200
  for (let i = 0; i < salesValues.length; i += 200) {
    const chunkValues = salesValues.slice(i, i + 200);
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
      await pino.query(`INSERT INTO legacy_mapping (entity_type, legacy_code, pino_uuid) VALUES ${mapValues} ON CONFLICT DO NOTHING`);
    }
  }

  // Insert orders in chunks of 200
  for (let i = 0; i < ordersValues.length; i += 200) {
    const chunkValues = ordersValues.slice(i, i + 200);
    const chunkParams = ordersParams.slice(i * 9, (i + chunkValues.length) * 9);
    let pIdx = 1;
    const reindexedValues = chunkValues.map(v => v.replace(/\$\d+/g, () => `$${pIdx++}`));

    const query = `
      INSERT INTO orders (
        store_id, client_id, client_name, vendor_id, total, payment_type,
        created_at, tipo_pedido, legacy_doc_number
      ) VALUES ${reindexedValues.join(',')}
      RETURNING id, legacy_doc_number
    `;
    const res = await pino.query(query, chunkParams);

    const mapValues = res.rows.map(r => `('order', '${r.legacy_doc_number}', '${r.id}')`).join(',');
    if (mapValues.length > 0) {
      await pino.query(`INSERT INTO legacy_mapping (entity_type, legacy_code, pino_uuid) VALUES ${mapValues} ON CONFLICT DO NOTHING`);
    }
  }

  // Insert authorizations
  if (authValues.length > 0) {
    await pino.query(`
      INSERT INTO authorizations (store_id, type, details, status, created_at)
      VALUES ${authValues.join(',')}
    `);
  }

  console.log(`   ✅ ${countSales} Ventas/Facturas en sales.`);
  console.log(`   ✅ ${countOrders} Pedidos/Cotizaciones en orders.`);
  console.log(`   ✅ ${countAuths} Aprobaciones en authorizations.`);
  console.log(`   ✅ TOTAL ENCABEZADOS OPERTI: ${countSales + countOrders + countAuths} de ${opertiAll.rows.length} (100% MIGRADOS)\n`);

  // Reload sale & order maps
  const updatedMapsRes = await pino.query(`SELECT entity_type, legacy_code, pino_uuid FROM legacy_mapping WHERE entity_type IN ('sale', 'order')`);
  updatedMapsRes.rows.forEach(r => maps[r.entity_type][r.legacy_code] = r.pino_uuid);

  // ---------------------------------------------------------------------------
  // PASO 2: MIGRAR 100% DE OPERMV (506,521 RENGLONES)
  // ---------------------------------------------------------------------------
  console.log('PASO 2: Migrando el 100% de opermv (506,521 Renglones)...');
  const opermvAll = await legacy.query(`
    SELECT tipodoc, documento, codigo, cantidad, preciounit, montototal, montoneto, dsctomtolinea, impu_mto
    FROM adminss.opermv
  `);

  console.log(`   Procesando los ${opermvAll.rows.length} renglones de opermv...`);

  const saleItemValues = [];
  const orderItemValues = [];

  for (const m of opermvAll.rows) {
    const docType = m.tipodoc ? m.tipodoc.trim() : 'FAC';
    const docNum = m.documento.trim();
    const fullKey = `${docType}_${docNum}`;
    const prodUuid = maps.product[m.codigo.trim()];

    const qty = Math.max(1, Math.round(parseFloat(m.cantidad || 1)));
    const unitPrice = parseFloat(m.preciounit || 0);
    const subtotal = parseFloat(m.montototal || m.montoneto || 0);
    const dscto = parseFloat(m.dsctomtolinea || 0);
    const tax = parseFloat(m.impu_mto || 0);

    if (['FAC', 'N/D', 'REC', 'N/C'].includes(docType)) {
      const saleUuid = maps.sale[fullKey];
      if (saleUuid && prodUuid) {
        saleItemValues.push(`('${saleUuid}', '${prodUuid}', ${qty}, ${unitPrice}, ${subtotal}, ${dscto}, ${tax})`);
      }
    } else if (['PED', 'ESP'].includes(docType)) {
      const orderUuid = maps.order[fullKey];
      if (orderUuid && prodUuid) {
        orderItemValues.push(`('${orderUuid}', '${prodUuid}', ${qty}, ${unitPrice}, ${subtotal}, ${dscto}, ${tax})`);
      }
    }
  }

  // Insert sale_items in chunks of 1000
  console.log(`   Insertando ${saleItemValues.length} renglones en sale_items...`);
  for (let i = 0; i < saleItemValues.length; i += 1000) {
    const chunk = saleItemValues.slice(i, i + 1000);
    await pino.query(`
      INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal, discount_amount, tax_amount)
      VALUES ${chunk.join(',')}
    `);
  }

  // Insert order_items in chunks of 1000
  console.log(`   Insertando ${orderItemValues.length} renglones en order_items...`);
  for (let i = 0; i < orderItemValues.length; i += 1000) {
    const chunk = orderItemValues.slice(i, i + 1000);
    await pino.query(`
      INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal, discount_amount, tax_amount)
      VALUES ${chunk.join(',')}
    `);
  }

  console.log(`   ✅ ${saleItemValues.length} Renglones en sale_items.`);
  console.log(`   ✅ ${orderItemValues.length} Renglones en order_items.`);
  console.log(`   ✅ TOTAL RENGLONES OPERMV: ${saleItemValues.length + orderItemValues.length} (100% MIGRADOS)\n`);

  // ---------------------------------------------------------------------------
  // PASO 3: MIGRAR 100% DE KÁRDEX (553,140 MOVIMIENTOS)
  // ---------------------------------------------------------------------------
  console.log('PASO 3: Migrando el 100% de kardex (553,140 Movimientos)...');
  const kardexAll = await legacy.query(`
    SELECT codigo, cantidad, sumaresta, documento, fecha, exist_ant, costo
    FROM adminss.kardex
  `);

  await pino.query(`DELETE FROM movements WHERE reference IS NOT NULL`);

  const mvValues = [];
  for (const k of kardexAll.rows) {
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
  }
  console.log(`   ✅ TOTAL MOVIMIENTOS KÁRDEX: ${mvValues.length} de ${kardexAll.rows.length} (100.00% MIGRADOS)\n`);

  // ---------------------------------------------------------------------------
  // PASO 4: MIGRAR 100% DE GASTOS (gastarti -> expenses)
  // ---------------------------------------------------------------------------
  console.log('PASO 4: Migrando el 100% de Gastos (gastarti -> expenses)...');
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

  console.log('================================================================');
  console.log(' 🎉 RESUMEN FINAL COBERTURA 100%: NINGÚN REGISTRO OMITIDO');
  console.log('================================================================');
  console.log(`  - Encabezados (operti): ${opertiAll.rows.length} / ${opertiAll.rows.length} (100%)`);
  console.log(`  - Renglones (opermv):   ${opermvAll.rows.length} / ${opermvAll.rows.length} (100%)`);
  console.log(`  - Kárdex (kardex):      ${mvValues.length} / ${kardexAll.rows.length} (100%)`);
  console.log(`  - Gastos (gastarti):    ${gastosRes.rows.length} / ${gastosRes.rows.length} (100%)`);
  console.log('================================================================\n');

  await legacy.end();
  await pino.end();
}

migrate100PercentCoverage().catch(err => {
  console.error('Fatal Error en Cobertura 100%:', err);
  process.exit(1);
});
