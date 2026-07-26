BEGIN;

CREATE TABLE IF NOT EXISTS inventory_data_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correction_key VARCHAR(200) NOT NULL UNIQUE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  previous_stock INTEGER NOT NULL,
  corrected_stock INTEGER NOT NULL,
  adjustment_quantity INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TEMP TABLE negative_stock_targets ON COMMIT DROP AS
SELECT p.id AS product_id,
       p.store_id,
       p.current_stock::int AS previous_stock,
       GREATEST(COALESCE(p.units_per_bulk, 1), 1)::int AS units_per_bulk,
       COALESCE(p.handles_bulk, false) AS handles_bulk
FROM products p
WHERE p.current_stock < 0
  AND p.deleted_at IS NULL
FOR UPDATE;

INSERT INTO inventory_data_corrections (
  correction_key, store_id, product_id, previous_stock, corrected_stock,
  adjustment_quantity, reason
)
SELECT
  'negative-stock-zero:2026-07-26:' || product_id::text,
  store_id,
  product_id,
  previous_stock,
  0,
  -previous_stock,
  'Corrección auditable N4.2.4: stock legacy negativo llevado a cero'
FROM negative_stock_targets
ON CONFLICT (correction_key) DO NOTHING;

INSERT INTO movements (
  store_id, product_id, user_id, type, quantity,
  quantity_bulks, quantity_units, balance,
  balance_bulks, balance_units, reference,
  handles_bulk_snapshot, units_per_bulk_snapshot
)
SELECT
  store_id,
  product_id,
  NULL,
  'ADJUSTMENT',
  -previous_stock,
  (-previous_stock) / units_per_bulk,
  (-previous_stock) % units_per_bulk,
  0,
  0,
  0,
  'N4.2.4 corrección stock negativo: ' || previous_stock::text || ' -> 0',
  handles_bulk,
  units_per_bulk
FROM negative_stock_targets;

UPDATE products p
SET current_stock = 0,
    updated_at = NOW()
FROM negative_stock_targets t
WHERE p.id = t.product_id;

COMMIT;
