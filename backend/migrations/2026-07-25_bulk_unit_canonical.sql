-- F2: Migracion canonica bulto/unidad
-- Sigue el plan PLAN_DEEPSEEK_PINO2_BULTOS_UNIDADES_MVP_10_2026-07-25.txt F2

-- F2.1: handles_bulk
ALTER TABLE products ADD COLUMN IF NOT EXISTS handles_bulk boolean;
UPDATE products SET handles_bulk = (units_per_bulk > 1) WHERE handles_bulk IS NULL;
ALTER TABLE products ALTER COLUMN handles_bulk SET DEFAULT false;
ALTER TABLE products ALTER COLUMN handles_bulk SET NOT NULL;

-- F2.2: Normalizar factor
UPDATE products SET units_per_bulk = 1 WHERE handles_bulk = false;

-- F2.3: Constraints y defaults
ALTER TABLE products ALTER COLUMN current_stock SET DEFAULT 0;
ALTER TABLE products ALTER COLUMN current_stock SET NOT NULL;
ALTER TABLE products ALTER COLUMN units_per_bulk SET DEFAULT 1;
ALTER TABLE products ALTER COLUMN units_per_bulk SET NOT NULL;
ALTER TABLE products ALTER COLUMN min_stock SET DEFAULT 0;
ALTER TABLE products ALTER COLUMN min_stock SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_packaging_valid') THEN
    ALTER TABLE products ADD CONSTRAINT products_packaging_valid CHECK (
      (handles_bulk = false AND units_per_bulk = 1)
      OR
      (handles_bulk = true AND units_per_bulk >= 2)
    );
  END IF;
END $$;

-- F2.4: stock_bulks y stock_units a GENERATED
-- Corregir primero los 4 mismatches: usar current_stock como fuente unica
UPDATE products SET current_stock = stock_bulks * units_per_bulk + stock_units
WHERE current_stock IS DISTINCT FROM (stock_bulks * units_per_bulk + stock_units)
  AND units_per_bulk > 0;

-- Los seed products sin split: actualizar stock_bulks/stock_units derivados
UPDATE products SET stock_bulks = current_stock / units_per_bulk,
                    stock_units = current_stock % units_per_bulk
WHERE units_per_bulk > 0;

ALTER TABLE products DROP COLUMN IF EXISTS stock_bulks;
ALTER TABLE products DROP COLUMN IF EXISTS stock_units;

ALTER TABLE products ADD COLUMN stock_bulks integer GENERATED ALWAYS AS (
  CASE WHEN handles_bulk THEN current_stock / units_per_bulk ELSE 0 END
) STORED;

ALTER TABLE products ADD COLUMN stock_units integer GENERATED ALWAYS AS (
  CASE WHEN handles_bulk THEN current_stock % units_per_bulk ELSE current_stock END
) STORED;

-- F2.5: Comentarios
COMMENT ON COLUMN products.current_stock IS 'Canonical stock in base units. Only source of inventory truth.';
COMMENT ON COLUMN products.stock_bulks IS 'Generated display value. Never write directly.';
COMMENT ON COLUMN products.stock_units IS 'Generated display value. Never write directly.';

-- F2.6: Items historicos
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS quantity_bulks integer NOT NULL DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS quantity_units integer NOT NULL DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS units_per_bulk_snapshot integer NOT NULL DEFAULT 1;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS handles_bulk_snapshot boolean NOT NULL DEFAULT false;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS bulk_price numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS quantity_bulks integer NOT NULL DEFAULT 0;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS quantity_units integer NOT NULL DEFAULT 0;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS units_per_bulk_snapshot integer NOT NULL DEFAULT 1;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS handles_bulk_snapshot boolean NOT NULL DEFAULT false;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS bulk_price numeric(12,2) NOT NULL DEFAULT 0;

-- F2.7: Movements
ALTER TABLE movements ADD COLUMN IF NOT EXISTS handles_bulk_snapshot boolean;
ALTER TABLE movements ADD COLUMN IF NOT EXISTS units_per_bulk_snapshot integer;

-- F2.9: Inventory ledger
ALTER TABLE inventory_ledger ADD COLUMN IF NOT EXISTS handles_bulk_snapshot boolean;
ALTER TABLE inventory_ledger ADD COLUMN IF NOT EXISTS units_per_bulk_snapshot integer;
