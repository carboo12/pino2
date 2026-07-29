const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: '34.31.112.238',
    user: 'postgres',
    password: 'Pino2CloudSQL2026!',
    database: 'studio-9680180520-dbbe0-db',
  });
  await client.connect();
  console.log('🔌 Conectando a Cloud SQL para migrar tabla stores y crear chains...');

  // 1. Crear tabla chains si no existe
  await client.query(`
    CREATE TABLE IF NOT EXISTS chains (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      created_at TEXT NOT NULL DEFAULT NOW()::text
    );
  `);
  console.log('✅ Tabla chains asegurada.');

  // 2. Insertar cadena por defecto si está vacía
  const existingChains = await client.query('SELECT * FROM chains');
  if (existingChains.rowCount === 0) {
    await client.query(`
      INSERT INTO chains (id, name, code)
      VALUES ('1', 'Grupo Los Pinos', 'PINO-DEFAULT')
    `);
    console.log('✅ Cadena por defecto (Grupo Los Pinos) creada en Cloud SQL.');
  }

  // 3. Agregar columnas faltantes a la tabla stores
  const alterQueries = [
    `ALTER TABLE stores ADD COLUMN IF NOT EXISTS chain_id TEXT;`,
    `ALTER TABLE stores ADD COLUMN IF NOT EXISTS store_type TEXT DEFAULT 'SUPERMERCADO';`,
    `ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;`,
    `ALTER TABLE stores ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;`,
    `ALTER TABLE stores ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();`,
  ];

  for (const q of alterQueries) {
    await client.query(q);
  }
  console.log('✅ Columnas faltantes agregadas a la tabla stores.');

  // 4. Asegurar id y code automáticos si son nulos en inserts futuros
  await client.query(`UPDATE stores SET is_active = active WHERE is_active IS NULL;`);
  await client.query(`UPDATE stores SET store_type = 'SUPERMERCADO' WHERE store_type IS NULL;`);

  console.log('🎉 Migración de tabla stores en Cloud SQL completada con éxito.');
  await client.end();
}

main().catch(err => {
  console.error('❌ Error migrando Cloud SQL:', err);
  process.exit(1);
});
