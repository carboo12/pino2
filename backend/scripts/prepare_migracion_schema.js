const { Client } = require('pg');

const CONNECTION_STRING = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/pino_migracion_db';

async function prepareMigracionSchema() {
  const client = new Client({ connectionString: CONNECTION_STRING });
  await client.connect();

  console.log('================================================================');
  console.log(' FASE 1 & FASE 2: PREPARACIÓN DE SCHEMA EN pino_migracion_db');
  console.log('================================================================\n');

  // 1. Alter Clients Table
  console.log('1. Extendiendo tabla clients...');
  await client.query(`
    ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS legacy_code varchar(50),
      ADD COLUMN IF NOT EXISTS tax_id varchar(50),
      ADD COLUMN IF NOT EXISTS mobile_phone varchar(150),
      ADD COLUMN IF NOT EXISTS default_discount numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS legacy_data jsonb DEFAULT '{}'::jsonb;
  `);

  // 2. Alter Products Table
  console.log('2. Extendiendo tabla products...');
  await client.query(`
    ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS legacy_code varchar(50),
      ADD COLUMN IF NOT EXISTS tax_rate numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS unit_of_measure varchar(30),
      ADD COLUMN IF NOT EXISTS reference varchar(50),
      ADD COLUMN IF NOT EXISTS average_cost numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS price6 numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS price7 numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS price8 numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS bulk_price_6 numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS bulk_price_7 numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS bulk_price_8 numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS legacy_data jsonb DEFAULT '{}'::jsonb;
  `);

  // 3. Alter Suppliers Table
  console.log('3. Extendiendo tabla suppliers...');
  await client.query(`
    ALTER TABLE suppliers 
      ADD COLUMN IF NOT EXISTS legacy_code varchar(50),
      ADD COLUMN IF NOT EXISTS tax_id varchar(50),
      ADD COLUMN IF NOT EXISTS legacy_data jsonb DEFAULT '{}'::jsonb;
  `);

  // 4. Alter Users Table
  console.log('4. Extendiendo tabla users...');
  await client.query(`
    ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS legacy_vendor_code varchar(20);
  `);

  // 5. Alter Sales & Orders Tables
  console.log('5. Extendiendo tablas sales, orders, sale_items, order_items, movements, returns, expenses...');
  await client.query(`
    ALTER TABLE sales 
      ADD COLUMN IF NOT EXISTS legacy_doc_number varchar(50),
      ADD COLUMN IF NOT EXISTS legacy_doc_type varchar(10);

    ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS legacy_doc_number varchar(50);

    ALTER TABLE sale_items 
      ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS tax_amount numeric DEFAULT 0;

    ALTER TABLE order_items 
      ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS tax_amount numeric DEFAULT 0;

    ALTER TABLE movements 
      ADD COLUMN IF NOT EXISTS cost_at_movement numeric DEFAULT 0;

    ALTER TABLE returns 
      ADD COLUMN IF NOT EXISTS legacy_doc_number varchar(50);

    ALTER TABLE expenses 
      ADD COLUMN IF NOT EXISTS receipt_number varchar(50);
  `);

  // 6. Create Legacy Mapping Bridge Table (FASE 2)
  console.log('6. Creando tabla puente legacy_mapping...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS legacy_mapping (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      entity_type varchar(50) NOT NULL,
      legacy_code varchar(50) NOT NULL,
      legacy_empresa varchar(10),
      legacy_agencia varchar(10),
      pino_uuid uuid NOT NULL,
      created_at timestamp DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_legacy_mapping ON legacy_mapping(entity_type, legacy_code);
  `);

  console.log('\n================================================================');
  console.log(' ✅ FASE 1 Y FASE 2 COMPLETADAS CON ÉXITO EN pino_migracion_db');
  console.log('================================================================\n');

  await client.end();
}

prepareMigracionSchema().catch(err => {
  console.error('Error al preparar el schema:', err);
  process.exit(1);
});
