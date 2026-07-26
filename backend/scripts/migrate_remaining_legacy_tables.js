const { Client } = require('pg');

const LEGACY_CONN = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/pino_legacy_db';
const PINO_CONN = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/pino_migracion_db';

async function migrateRemainingLegacyTables() {
  const legacy = new Client({ connectionString: LEGACY_CONN });
  const pino = new Client({ connectionString: PINO_CONN });

  await legacy.connect();
  await pino.connect();

  console.log('================================================================');
  console.log(' MIGRACIÓN DE TABLAS DE DATOS EXPENDIDOS / LEGACY ADICIONALES');
  console.log('================================================================\n');

  // 1. CARGOS Y SERVICIOS (cargodet -> legacy_cargos)
  console.log('1. Migrando adminss.cargodet (18,434 filas) -> legacy_cargos...');
  await pino.query(`DROP TABLE IF EXISTS legacy_cargos`);
  await pino.query(`
    CREATE TABLE legacy_cargos (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      documento varchar(50),
      codigo_item varchar(50),
      descripcion text,
      created_at timestamp DEFAULT now()
    );
  `);

  const cargodetRes = await legacy.query(`
    SELECT documento, codigo, nombre
    FROM adminss.cargodet
  `);

  const cargoValues = [];
  for (const c of cargodetRes.rows) {
    const doc = c.documento.trim();
    const item = c.codigo ? c.codigo.trim() : '';
    const desc = c.nombre ? c.nombre.trim().replace(/'/g, "''") : '';

    cargoValues.push(`('${doc}', '${item}', '${desc}')`);
  }

  for (let i = 0; i < cargoValues.length; i += 1000) {
    const chunk = cargoValues.slice(i, i + 1000);
    await pino.query(`
      INSERT INTO legacy_cargos (documento, codigo_item, descripcion)
      VALUES ${chunk.join(',')}
    `);
  }
  console.log(`   ✅ ${cargoValues.length} Cargos migrados a legacy_cargos.\n`);

  // 2. EXTENSIÓN DE FACTURAS (operclit_ext -> legacy_operclit_ext)
  console.log('2. Migrando adminss.operclit_ext (41,162 filas) -> legacy_operclit_ext...');
  await pino.query(`DROP TABLE IF EXISTS legacy_operclit_ext`);
  await pino.query(`
    CREATE TABLE legacy_operclit_ext (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      recibo varchar(50),
      codigo varchar(50),
      monto numeric,
      forma_pago varchar(100),
      created_at timestamp DEFAULT now()
    );
  `);

  const extRes = await legacy.query(`
    SELECT recibo, codigo, monto, nomforma
    FROM adminss.operclit_ext
  `);

  const extValues = [];
  for (const e of extRes.rows) {
    const rec = e.recibo ? e.recibo.trim() : '';
    const cod = e.codigo ? e.codigo.trim() : '';
    const mto = parseFloat(e.monto || 0);
    const forma = e.nomforma ? e.nomforma.trim().replace(/'/g, "''") : '';

    extValues.push(`('${rec}', '${cod}', ${mto}, '${forma}')`);
  }

  for (let i = 0; i < extValues.length; i += 1000) {
    const chunk = extValues.slice(i, i + 1000);
    await pino.query(`
      INSERT INTO legacy_operclit_ext (recibo, codigo, monto, forma_pago)
      VALUES ${chunk.join(',')}
    `);
  }
  console.log(`   ✅ ${extValues.length} Registros migrados a legacy_operclit_ext.\n`);

  // 3. CUADRES DE CAJA (syh_cuadre_caja -> legacy_cuadres_caja)
  console.log('3. Migrando syhss.syh_cuadre_caja (2,438 filas) -> legacy_cuadres_caja...');
  await pino.query(`DROP TABLE IF EXISTS legacy_cuadres_caja`);
  await pino.query(`
    CREATE TABLE legacy_cuadres_caja (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      relacion varchar(50),
      usuario varchar(50),
      estacion varchar(20),
      monto_efectivo numeric,
      created_at timestamp DEFAULT now()
    );
  `);

  const cuadreRes = await legacy.query(`
    SELECT relacion, usuario, estacion, efectivo
    FROM syhss.syh_cuadre_caja
  `);

  const cuadreValues = [];
  for (const c of cuadreRes.rows) {
    const rel = c.relacion ? c.relacion.trim() : '';
    const usr = c.usuario ? c.usuario.trim() : '';
    const est = c.estacion ? c.estacion.trim() : '';
    const efec = parseFloat(c.efectivo || 0);

    cuadreValues.push(`('${rel}', '${usr}', '${est}', ${efec})`);
  }

  if (cuadreValues.length > 0) {
    for (let i = 0; i < cuadreValues.length; i += 500) {
      const chunk = cuadreValues.slice(i, i + 500);
      await pino.query(`
        INSERT INTO legacy_cuadres_caja (relacion, usuario, estacion, monto_efectivo)
        VALUES ${chunk.join(',')}
      `);
    }
  }
  console.log(`   ✅ ${cuadreValues.length} Cuadres migrados a legacy_cuadres_caja.\n`);

  // 4. NOTAS DE CRÉDITO APLICADAS (notascre_aplic -> legacy_notas_credito)
  console.log('4. Migrando adminss.notascre_aplic (1,768 filas) -> legacy_notas_credito...');
  await pino.query(`DROP TABLE IF EXISTS legacy_notas_credito`);
  await pino.query(`
    CREATE TABLE legacy_notas_credito (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      documento_nc varchar(50),
      documento_factura varchar(50),
      monto numeric,
      fecha date,
      created_at timestamp DEFAULT now()
    );
  `);

  const ncRes = await legacy.query(`
    SELECT documento, documento_h, monto_aplic, fecha_aplic
    FROM adminss.notascre_aplic
  `);

  const ncValues = [];
  for (const n of ncRes.rows) {
    const nc = n.documento ? n.documento.trim() : '';
    const fac = n.documento_h ? n.documento_h.trim() : '';
    const mto = parseFloat(n.monto_aplic || 0);
    const f = n.fecha_aplic ? `'${new Date(n.fecha_aplic).toISOString().substring(0, 10)}'` : 'NULL';

    ncValues.push(`('${nc}', '${fac}', ${mto}, ${f})`);
  }

  if (ncValues.length > 0) {
    for (let i = 0; i < ncValues.length; i += 500) {
      const chunk = ncValues.slice(i, i + 500);
      await pino.query(`
        INSERT INTO legacy_notas_credito (documento_nc, documento_factura, monto, fecha)
        VALUES ${chunk.join(',')}
      `);
    }
  }
  console.log(`   ✅ ${ncValues.length} Notas de crédito migradas a legacy_notas_credito.\n`);

  // 5. AUDITORÍA HISTÓRICA DE USUARIOS (tranuser -> legacy_audit_logs)
  console.log('5. Migrando adminss.tranuser (322,110 filas) -> legacy_audit_logs...');
  await pino.query(`DROP TABLE IF EXISTS legacy_audit_logs`);
  await pino.query(`
    CREATE TABLE legacy_audit_logs (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      usuario varchar(50),
      operacion text,
      estacion varchar(50),
      fecha date,
      created_at timestamp DEFAULT now()
    );
  `);

  const tranuserRes = await legacy.query(`
    SELECT usuario, operacion, estacion, fecha
    FROM adminss.tranuser
  `);

  console.log(`   Insertando ${tranuserRes.rows.length} logs de auditoría...`);
  const logValues = [];
  for (const t of tranuserRes.rows) {
    const usr = t.usuario ? t.usuario.trim().replace(/'/g, "''") : '';
    const op = t.operacion ? t.operacion.trim().replace(/'/g, "''") : '';
    const est = t.estacion ? t.estacion.trim().replace(/'/g, "''") : '';
    const f = t.fecha ? `'${new Date(t.fecha).toISOString().substring(0, 10)}'` : 'NULL';

    logValues.push(`('${usr}', '${op}', '${est}', ${f})`);
  }

  for (let i = 0; i < logValues.length; i += 1000) {
    const chunk = logValues.slice(i, i + 1000);
    await pino.query(`
      INSERT INTO legacy_audit_logs (usuario, operacion, estacion, fecha)
      VALUES ${chunk.join(',')}
    `);
  }
  console.log(`   ✅ ${logValues.length} Logs migrados a legacy_audit_logs.\n`);

  console.log('================================================================');
  console.log(' 🎉 RESUMEN FINAL: 100% DE TODAS LAS TABLAS DEL SISTEMA MIGRADAS');
  console.log('================================================================\n');

  await legacy.end();
  await pino.end();
}

migrateRemainingLegacyTables().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
