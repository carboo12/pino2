BEGIN;

ALTER TABLE pending_deliveries
  ADD COLUMN IF NOT EXISTS carga_id UUID NULL REFERENCES cargas_camion(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stop_order INTEGER NULL,
  ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS receiver_name VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7) NULL,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7) NULL,
  ADD COLUMN IF NOT EXISTS proof_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS delivery_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES pending_deliveries(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  rutero_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  external_id UUID NOT NULL,
  operation_type VARCHAR(30) NOT NULL DEFAULT 'COMPLETE',
  result_status VARCHAR(30) NOT NULL,
  payment_method VARCHAR(30) NULL,
  total_delivered NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_rejected NUMERIC(14,2) NOT NULL DEFAULT 0,
  receiver_name VARCHAR(150) NULL,
  latitude NUMERIC(10,7) NULL,
  longitude NUMERIC(10,7) NULL,
  proof_url TEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, external_id)
);

CREATE TABLE IF NOT EXISTS delivery_item_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id UUID NOT NULL REFERENCES delivery_operations(id) ON DELETE CASCADE,
  delivery_id UUID NOT NULL REFERENCES pending_deliveries(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  planned_units INTEGER NOT NULL,
  delivered_units INTEGER NOT NULL,
  rejected_units INTEGER NOT NULL,
  units_per_bulk_snapshot INTEGER NOT NULL,
  unit_price_snapshot NUMERIC(14,4) NOT NULL,
  rejection_reason TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(operation_id, order_item_id),
  CHECK (planned_units > 0),
  CHECK (delivered_units >= 0),
  CHECK (rejected_units >= 0),
  CHECK (delivered_units + rejected_units = planned_units),
  CHECK (units_per_bulk_snapshot > 0)
);

ALTER TABLE returns
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'RECEIVED',
  ADD COLUMN IF NOT EXISTS return_type VARCHAR(20) NOT NULL DEFAULT 'POS',
  ADD COLUMN IF NOT EXISTS carga_id UUID NULL REFERENCES cargas_camion(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pending_delivery_id UUID NULL REFERENCES pending_deliveries(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS received_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS received_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

ALTER TABLE returns DROP CONSTRAINT IF EXISTS returns_status_check;
ALTER TABLE returns ADD CONSTRAINT returns_status_check
  CHECK (status IN ('IN_TRANSIT', 'RECEIVED', 'CANCELLED')) NOT VALID;
ALTER TABLE returns DROP CONSTRAINT IF EXISTS returns_type_check;
ALTER TABLE returns ADD CONSTRAINT returns_type_check
  CHECK (return_type IN ('POS', 'ROUTE')) NOT VALID;
ALTER TABLE returns VALIDATE CONSTRAINT returns_status_check;
ALTER TABLE returns VALIDATE CONSTRAINT returns_type_check;

CREATE INDEX IF NOT EXISTS idx_delivery_operations_delivery
  ON delivery_operations(delivery_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_results_delivery
  ON delivery_item_results(delivery_id);
CREATE INDEX IF NOT EXISTS idx_returns_status_store
  ON returns(store_id, status, created_at);

COMMIT;
