BEGIN;

ALTER TABLE purchase_order_items
  ALTER COLUMN received_quantity SET DEFAULT 0;
UPDATE purchase_order_items
SET received_quantity = 0
WHERE received_quantity IS NULL;
ALTER TABLE purchase_order_items
  ALTER COLUMN received_quantity SET NOT NULL;

ALTER TABLE purchase_order_items
  ADD COLUMN IF NOT EXISTS units_per_bulk_snapshot INTEGER NOT NULL DEFAULT 1;

ALTER TABLE purchase_order_items
  DROP CONSTRAINT IF EXISTS purchase_order_items_received_range_check;
ALTER TABLE purchase_order_items
  ADD CONSTRAINT purchase_order_items_received_range_check CHECK (
    received_quantity >= 0 AND received_quantity <= ordered_quantity
  ) NOT VALID;
ALTER TABLE purchase_order_items
  VALIDATE CONSTRAINT purchase_order_items_received_range_check;

CREATE TABLE IF NOT EXISTS purchase_order_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  supplier_id UUID NULL REFERENCES suppliers(id) ON DELETE SET NULL,
  external_id UUID NOT NULL,
  invoice_number VARCHAR(100) NULL,
  invoice_date DATE NULL,
  notes TEXT NULL,
  received_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  received_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, external_id)
);

CREATE TABLE IF NOT EXISTS purchase_order_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES purchase_order_receipts(id) ON DELETE CASCADE,
  purchase_order_item_id UUID NOT NULL REFERENCES purchase_order_items(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  received_quantity INTEGER NOT NULL,
  quantity_bulks INTEGER NOT NULL DEFAULT 0,
  quantity_units INTEGER NOT NULL DEFAULT 0,
  units_per_bulk_snapshot INTEGER NOT NULL,
  unit_cost_snapshot NUMERIC(14,4) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(receipt_id, purchase_order_item_id),
  CHECK (received_quantity > 0),
  CHECK (quantity_bulks >= 0),
  CHECK (quantity_units >= 0),
  CHECK (units_per_bulk_snapshot > 0)
);

CREATE INDEX IF NOT EXISTS idx_purchase_receipts_order
  ON purchase_order_receipts(purchase_order_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_receipt_items_product
  ON purchase_order_receipt_items(product_id);

COMMIT;
