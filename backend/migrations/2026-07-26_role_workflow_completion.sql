BEGIN;

ALTER TABLE authorizations
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS resolution_note TEXT;

CREATE TABLE IF NOT EXISTS inventory_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  name VARCHAR(160) NOT NULL,
  zone_label VARCHAR(160),
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN', 'CLOSED', 'CANCELLED')),
  created_by UUID NOT NULL REFERENCES users(id),
  closed_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_count_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_id UUID NOT NULL REFERENCES inventory_counts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  counted_units INTEGER NOT NULL CHECK (counted_units >= 0),
  expected_units INTEGER,
  discrepancy_units INTEGER,
  counted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (count_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_counts_store_status
  ON inventory_counts(store_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_count_items_count
  ON inventory_count_items(count_id, product_id);

GRANT SELECT, INSERT, UPDATE, DELETE
  ON inventory_counts, inventory_count_items TO pino_app;

COMMIT;
