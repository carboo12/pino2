const { Client } = require('pg');

const LEGACY_CONN = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/pino_legacy_db';
const PINO_CONN = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/pino_migracion_db';

async function migrateMasterCatalogsUltraFast() {
  const legacy = new Client({ connectionString: LEGACY_CONN });
  const pino = new Client({ connectionString: PINO_CONN });

  await legacy.connect();
  await pino.connect();

  console.log('================================================================');
  console.log(' FASE 3 (ULTRA-FAST MULTI-ROW BATCH): CATÁLOGOS MAESTROS');
  console.log('================================================================\n');

  // Clear previous master data in pino_migracion_db
  console.log('Limpiando datos maestros en pino_migracion_db...');
  await pino.query(`DELETE FROM legacy_mapping WHERE entity_type IN ('department', 'supplier', 'vendor', 'product', 'client')`);
  await pino.query(`DELETE FROM product_barcodes WHERE label = 'Alternativo Legacy'`);
  await pino.query(`DELETE FROM products WHERE legacy_code IS NOT NULL`);
  await pino.query(`DELETE FROM clients WHERE legacy_code IS NOT NULL`);
  await pino.query(`DELETE FROM suppliers WHERE legacy_code IS NOT NULL`);
  await pino.query(`DELETE FROM departments WHERE description LIKE 'Migrado desde grupo legacy%'`);
  await pino.query(`DELETE FROM users WHERE legacy_vendor_code IS NOT NULL`);

  // Target store and chain IDs
  const storeRes = await pino.query(`SELECT id, chain_id FROM stores LIMIT 1`);
  const defaultStoreId = storeRes.rows[0].id;
  const defaultChainId = storeRes.rows[0].chain_id;

  console.log(`📌 Tienda de destino: ${defaultStoreId}`);
  console.log(`📌 Cadena de destino: ${defaultChainId}\n`);

  // 1. DEPARTAMENTOS
  console.log('1. Migrando Grupos -> departments...');
  const gruposRes = await legacy.query(`SELECT codigo, nombre FROM adminss.grupos`);
  for (const g of gruposRes.rows) {
    const code = g.codigo.trim();
    const name = (g.nombre || code).trim();
    const res = await pino.query(`
      INSERT INTO departments (store_id, name, description, is_active)
      VALUES ($1, $2, $3, true) RETURNING id
    `, [defaultStoreId, name, `Migrado desde grupo legacy ${code}`]);
    await pino.query(`
      INSERT INTO legacy_mapping (entity_type, legacy_code, pino_uuid) VALUES ('department', $1, $2)
    `, [code, res.rows[0].id]);
  }
  console.log(`   ✅ ${gruposRes.rows.length} Departamentos migrados.\n`);

  // 2. PROVEEDORES
  console.log('2. Migrando Suplidores -> suppliers...');
  const suplidoresRes = await legacy.query(`SELECT codigo, nombre, perscont, nrorif, cedula, direccion, telefonos, email FROM adminss.suplidor`);
  for (const s of suplidoresRes.rows) {
    const code = s.codigo.trim();
    const name = (s.nombre || code).trim();
    const contact = s.perscont ? s.perscont.trim() : null;
    const taxId = s.nrorif ? s.nrorif.trim() : (s.cedula ? s.cedula.trim() : null);
    const address = s.direccion ? s.direccion.trim() : null;
    const phone = s.telefonos ? s.telefonos.trim().substring(0, 20) : null;
    const email = s.email ? s.email.trim().substring(0, 150) : null;

    const res = await pino.query(`
      INSERT INTO suppliers (chain_id, name, contact_name, email, phone, address, legacy_code, tax_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
    `, [defaultChainId, name, contact, email, phone, address, code, taxId]);

    await pino.query(`
      INSERT INTO legacy_mapping (entity_type, legacy_code, pino_uuid) VALUES ('supplier', $1, $2)
    `, [code, res.rows[0].id]);
  }
  console.log(`   ✅ ${suplidoresRes.rows.length} Proveedores migrados.\n`);

  // 3. VENDEDORES
  console.log('3. Migrando Vendedores -> users (role: vendor)...');
  const vendedoresRes = await legacy.query(`SELECT codigo, nombre, comision, email FROM adminss.listvend`);
  for (const v of vendedoresRes.rows) {
    const code = v.codigo.trim();
    const name = (v.nombre || `Vendedor ${code}`).trim();
    const email = (v.email && v.email.trim()) ? v.email.trim() : `vendedor_${code}@pino.com`;
    const comision = parseFloat(v.comision || 0);

    const userCheck = await pino.query(`SELECT id FROM users WHERE email = $1`, [email]);
    let userUuid;
    if (userCheck.rows.length > 0) {
      userUuid = userCheck.rows[0].id;
      await pino.query(`UPDATE users SET legacy_vendor_code = $1, comision_porcentaje = $2 WHERE id = $3`, [code, comision, userUuid]);
    } else {
      const res = await pino.query(`
        INSERT INTO users (name, email, password_hash, role, is_active, comision_porcentaje, legacy_vendor_code)
        VALUES ($1, $2, '$2b$10$legacyPasswordHashPlaceholder1234567890', 'vendor', true, $3, $4) RETURNING id
      `, [name, email, comision, code]);
      userUuid = res.rows[0].id;
      await pino.query(`INSERT INTO user_stores (user_id, store_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [userUuid, defaultStoreId]);
    }
    await pino.query(`
      INSERT INTO legacy_mapping (entity_type, legacy_code, pino_uuid) VALUES ('vendor', $1, $2)
    `, [code, userUuid]);
  }
  console.log(`   ✅ ${vendedoresRes.rows.length} Vendedores migrados.\n`);

  // Dict mappings for fast lookup
  const deptDictRes = await pino.query(`SELECT legacy_code, pino_uuid FROM legacy_mapping WHERE entity_type='department'`);
  const deptMap = {};
  deptDictRes.rows.forEach(r => deptMap[r.legacy_code] = r.pino_uuid);

  const vendorDictRes = await pino.query(`SELECT legacy_code, pino_uuid FROM legacy_mapping WHERE entity_type='vendor'`);
  const vendorMap = {};
  vendorDictRes.rows.forEach(r => vendorMap[r.legacy_code] = r.pino_uuid);

  // 4. PRODUCTOS (MULTI-ROW BATCH)
  console.log('4. Migrando Productos (articulo -> products) en Multi-row Batch...');
  const articulosRes = await legacy.query(`
    SELECT codigo, grupo, subgrupo, nombre, marca, unidad, costo, precio1, precio2, precio3, precio4, 
           precio5, precio6, precio7, precio8, existencia, minimo, impuesto, usabulto, cantbulto, 
           precio1grp, precio2grp, precio3grp, precio4grp, precio5grp, precio6grp, precio7grp, precio8grp,
           inactiva, usaexist, referencia, costo_prom
    FROM adminss.articulo
  `);

  console.log(`   Insertando ${articulosRes.rows.length} productos...`);
  
  // Single query returning generated UUIDs for products
  const prodParams = [];
  const prodValueStrings = [];
  let paramIdx = 1;

  for (const a of articulosRes.rows) {
    const code = a.codigo.trim();
    const name = (a.nombre || code).trim();
    const brand = a.marca ? a.marca.trim() : null;
    const subDept = a.subgrupo ? a.subgrupo.trim() : null;
    const deptId = a.grupo ? (deptMap[a.grupo.trim()] || null) : null;

    prodValueStrings.push(`(
      $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++},
      $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++},
      $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++},
      $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++},
      $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}
    )`);

    prodParams.push(
      defaultStoreId, deptId, code, name, parseFloat(a.precio1||0), parseFloat(a.costo||0),
      Math.round(parseFloat(a.existencia||0)), parseInt(a.inactiva||0,10)===0, parseInt(a.usaexist||0,10)===1,
      Math.round(parseFloat(a.minimo||0)), brand, parseFloat(a.precio2||0), parseFloat(a.precio1||0),
      parseFloat(a.precio2||0), parseFloat(a.precio3||0), parseFloat(a.precio4||0), parseFloat(a.precio5||0),
      parseFloat(a.precio6||0), parseFloat(a.precio7||0), parseFloat(a.precio8||0), subDept,
      Math.max(1, parseInt(a.cantbulto||1,10)), parseInt(a.usabulto||0,10)===1,
      parseFloat(a.precio1grp||0), parseFloat(a.precio2grp||0), parseFloat(a.precio3grp||0), parseFloat(a.precio4grp||0),
      parseFloat(a.precio5grp||0), parseFloat(a.precio6grp||0), parseFloat(a.precio7grp||0), parseFloat(a.precio8grp||0),
      code, parseFloat(a.impuesto||0), a.unidad ? a.unidad.trim() : null, a.referencia ? a.referencia.trim() : null,
      parseFloat(a.costo_prom||0)
    );
  }

  // Chunk prod inserts into batches of 200 items (7200 params per query)
  const prodBatchSize = 200;
  for (let i = 0; i < articulosRes.rows.length; i += prodBatchSize) {
    const chunkValues = prodValueStrings.slice(i, i + prodBatchSize);
    const chunkParams = prodParams.slice(i * 36, (i + chunkValues.length) * 36);

    // Re-index params 1..N for chunk query
    let chunkParamIdx = 1;
    const reindexedValues = chunkValues.map(v => v.replace(/\$\d+/g, () => `$${chunkParamIdx++}`));

    const prodQuery = `
      INSERT INTO products (
        store_id, department_id, barcode, description, sale_price, cost_price, current_stock,
        is_active, uses_inventory, min_stock, brand, wholesale_price, price1, price2, price3,
        price4, price5, price6, price7, price8, sub_department, units_per_bulk, handles_bulk,
        bulk_price_1, bulk_price_2, bulk_price_3, bulk_price_4, bulk_price_5, bulk_price_6,
        bulk_price_7, bulk_price_8, legacy_code, tax_rate, unit_of_measure, reference, average_cost
      ) VALUES ${reindexedValues.join(',')}
      RETURNING id, legacy_code
    `;

    const res = await pino.query(prodQuery, chunkParams);
    
    // Batch insert mapping
    const mapValues = res.rows.map((r, idx) => `('product', '${r.legacy_code}', '${r.id}')`).join(',');
    await pino.query(`INSERT INTO legacy_mapping (entity_type, legacy_code, pino_uuid) VALUES ${mapValues}`);
  }

  console.log(`   ✅ ${articulosRes.rows.length} Productos migrados.\n`);

  // Barcodes alternativos
  console.log('4.1 Migrando Códigos Alternativos...');
  const barcodesRes = await legacy.query(`SELECT codigo, codalternativo FROM adminss.invcodalternativo`);
  const prodDictRes = await pino.query(`SELECT legacy_code, pino_uuid FROM legacy_mapping WHERE entity_type='product'`);
  const prodMap = {};
  prodDictRes.rows.forEach(r => prodMap[r.legacy_code] = r.pino_uuid);

  const bcValues = [];
  for (const b of barcodesRes.rows) {
    const prodUuid = prodMap[b.codigo.trim()];
    if (prodUuid) {
      const safeBc = b.codalternativo.trim().replace(/'/g, "''");
      bcValues.push(`('${prodUuid}', '${defaultStoreId}', '${safeBc}', 'Alternativo Legacy', false)`);
    }
  }

  if (bcValues.length > 0) {
    // Insert in batches of 500
    for (let i = 0; i < bcValues.length; i += 500) {
      const chunk = bcValues.slice(i, i + 500);
      await pino.query(`
        INSERT INTO product_barcodes (product_id, store_id, barcode, label, is_primary)
        VALUES ${chunk.join(',')} ON CONFLICT DO NOTHING
      `);
    }
  }
  console.log(`   ✅ ${bcValues.length} Códigos alternativos migrados.\n`);

  // 5. CLIENTES (MULTI-ROW BATCH)
  console.log('5. Migrando Catálogo de Clientes (cliempre -> clients) en Multi-row Batch...');
  const clientesRes = await legacy.query(`
    SELECT codigo, nombre, cedula, nrorif, direccion, telefonos, telefono_movil, email, 
           limite, dias, status, credito, sector, vendedor, latitud, longitud, descuento
    FROM adminss.cliempre
  `);

  console.log(`   Insertando ${clientesRes.rows.length} clientes...`);

  const clientParams = [];
  const clientValueStrings = [];
  let cParamIdx = 1;

  for (const c of clientesRes.rows) {
    const code = c.codigo.trim();
    const name = (c.nombre || code).trim();
    const taxId = c.nrorif ? c.nrorif.trim() : (c.cedula ? c.cedula.trim() : null);
    const address = c.direccion ? c.direccion.trim() : null;
    const phone = c.telefonos ? c.telefonos.trim().substring(0, 20) : null;
    const mobilePhone = c.telefono_movil ? c.telefono_movil.trim() : null;
    const email = c.email ? c.email.trim().substring(0, 150) : null;
    const limiteCredito = parseFloat(c.limite || 0);
    const diasCredito = Math.round(parseFloat(c.dias || 8));
    const isActive = parseInt(c.status || 0, 10) === 0;
    const clientType = (c.credito && c.credito.trim() === 'S') ? 'CREDITO' : 'NORMAL';
    const zona = c.sector ? c.sector.trim() : null;
    const descuento = parseFloat(c.descuento || 0);
    const preventaId = c.vendedor ? (vendorMap[c.vendedor.trim()] || null) : null;

    let lat = null;
    let lng = null;
    if (c.latitud && !isNaN(parseFloat(c.latitud))) lat = parseFloat(c.latitud);
    if (c.longitud && !isNaN(parseFloat(c.longitud))) lng = parseFloat(c.longitud);

    clientValueStrings.push(`(
      $${cParamIdx++}, $${cParamIdx++}, $${cParamIdx++}, $${cParamIdx++}, $${cParamIdx++}, $${cParamIdx++}, $${cParamIdx++},
      $${cParamIdx++}, $${cParamIdx++}, $${cParamIdx++}, $${cParamIdx++}, $${cParamIdx++}, $${cParamIdx++}, $${cParamIdx++},
      $${cParamIdx++}, $${cParamIdx++}, $${cParamIdx++}
    )`);

    clientParams.push(
      defaultStoreId, name, email, phone, address, preventaId, zona, limiteCredito,
      diasCredito, isActive, lat, lng, clientType, code, taxId, mobilePhone, descuento
    );
  }

  const clientBatchSize = 200;
  for (let i = 0; i < clientesRes.rows.length; i += clientBatchSize) {
    const chunkValues = clientValueStrings.slice(i, i + clientBatchSize);
    const chunkParams = clientParams.slice(i * 17, (i + chunkValues.length) * 17);

    let chunkParamIdx = 1;
    const reindexedValues = chunkValues.map(v => v.replace(/\$\d+/g, () => `$${chunkParamIdx++}`));

    const clientQuery = `
      INSERT INTO clients (
        store_id, name, email, phone, address, preventa_id, zona, limite_credito, 
        dias_credito, is_active, lat, lng, type, legacy_code, tax_id, mobile_phone, default_discount
      ) VALUES ${reindexedValues.join(',')}
      RETURNING id, legacy_code
    `;

    const res = await pino.query(clientQuery, chunkParams);

    const mapValues = res.rows.map((r) => `('client', '${r.legacy_code}', '${r.id}')`).join(',');
    await pino.query(`INSERT INTO legacy_mapping (entity_type, legacy_code, pino_uuid) VALUES ${mapValues}`);
  }

  console.log(`   ✅ ${clientesRes.rows.length} Clientes migrados.\n`);

  console.log('================================================================');
  console.log(' 🎉 RESUMEN FASE 3 ULTRA-FAST COMPLETADA EXITOSAMENTE');
  console.log('================================================================');
  console.log(`  - Departamentos: ${gruposRes.rows.length}`);
  console.log(`  - Proveedores:   ${suplidoresRes.rows.length}`);
  console.log(`  - Vendedores:    ${vendedoresRes.rows.length}`);
  console.log(`  - Productos:     ${articulosRes.rows.length}`);
  console.log(`  - Cód. Alternos: ${bcValues.length}`);
  console.log(`  - Clientes:      ${clientesRes.rows.length}`);
  console.log('================================================================\n');

  await legacy.end();
  await pino.end();
}

migrateMasterCatalogsUltraFast().catch(err => {
  console.error('Fatal Error en Fase 3 Multi-row:', err);
  process.exit(1);
});
