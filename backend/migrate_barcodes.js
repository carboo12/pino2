const { Client } = require('pg');

async function migrate() {
  const c = new Client({ connectionString: 'postgresql://alacaja:__DB_PASSWORD_PLACEHOLDER__@190.56.16.85:5432/multitienda_db' });
  await c.connect();
  console.log('Conectado a la base de datos.\n');

  // ═══════════════════════════════════════════════
  // FASE 1: MIGRACIÓN — Códigos Alternativos
  // ═══════════════════════════════════════════════

  // 1.1 Crear tabla product_barcodes
  console.log('[1/4] Creando tabla product_barcodes...');
  await c.query(`
    CREATE TABLE IF NOT EXISTS product_barcodes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      store_id UUID NOT NULL REFERENCES stores(id),
      barcode VARCHAR(100) NOT NULL,
      label VARCHAR(100),
      is_primary BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('  ✅ Tabla creada.');

  // 1.2 Índice único compuesto (barcode + store_id)
  console.log('[2/4] Creando índice único (barcode, store_id)...');
  await c.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_pb_barcode_store
      ON product_barcodes (barcode, store_id);
  `);
  console.log('  ✅ Índice único creado.');

  // 1.3 Índice de búsqueda rápida por product_id
  console.log('[3/4] Creando índice por product_id...');
  await c.query(`
    CREATE INDEX IF NOT EXISTS idx_pb_product
      ON product_barcodes (product_id);
  `);
  console.log('  ✅ Índice de producto creado.');

  // 1.4 Migrar barcodes existentes como "principales"
  console.log('[4/4] Migrando barcodes existentes como is_primary = true...');
  const migResult = await c.query(`
    INSERT INTO product_barcodes (product_id, store_id, barcode, label, is_primary)
    SELECT id, store_id, barcode, 'Código Principal', true
    FROM products
    WHERE barcode IS NOT NULL AND barcode != ''
    ON CONFLICT (barcode, store_id) DO NOTHING
  `);
  console.log(`  ✅ ${migResult.rowCount} barcodes migrados.`);

  // Verificación final
  const total = await c.query('SELECT COUNT(*) FROM product_barcodes');
  console.log(`\n🏆 MIGRACIÓN COMPLETA. Total registros en product_barcodes: ${total.rows[0].count}`);

  await c.end();
}

migrate().catch(e => { console.error('❌ ERROR:', e.message); process.exit(1); });
