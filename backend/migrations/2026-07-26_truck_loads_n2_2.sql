BEGIN;

ALTER TABLE cargas_camion
  ADD COLUMN IF NOT EXISTS external_id UUID NULL,
  ADD COLUMN IF NOT EXISTS created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS loaded_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS loaded_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS accepted_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

UPDATE cargas_camion
SET status = CASE UPPER(TRIM(status))
  WHEN 'ALISTANDO' THEN 'PLANNED'
  WHEN 'CARGADO' THEN 'LOADED'
  WHEN 'EN_RUTA' THEN 'EN_ROUTE'
  ELSE UPPER(TRIM(status))
END;

ALTER TABLE cargas_camion ALTER COLUMN status SET DEFAULT 'PLANNED';
ALTER TABLE cargas_camion DROP CONSTRAINT IF EXISTS cargas_camion_status_check;
ALTER TABLE cargas_camion
  ADD CONSTRAINT cargas_camion_status_check CHECK (status IN (
    'PLANNED', 'PICKING', 'LOADED', 'PENDING_ACCEPTANCE',
    'ACCEPTED', 'EN_ROUTE', 'RETURNED', 'CLOSED', 'CANCELLED'
  )) NOT VALID;
ALTER TABLE cargas_camion VALIDATE CONSTRAINT cargas_camion_status_check;

CREATE UNIQUE INDEX IF NOT EXISTS uq_cargas_camion_external_id
  ON cargas_camion(external_id) WHERE external_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS carga_camion_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carga_id UUID NOT NULL REFERENCES cargas_camion(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  loaded_at TIMESTAMP NULL,
  UNIQUE(carga_id, order_id),
  UNIQUE(order_id)
);

CREATE TABLE IF NOT EXISTS carga_camion_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carga_id UUID NOT NULL REFERENCES cargas_camion(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  planned_units INTEGER NOT NULL,
  loaded_units INTEGER NOT NULL DEFAULT 0,
  accepted_units INTEGER NOT NULL DEFAULT 0,
  discrepancy_units INTEGER NOT NULL DEFAULT 0,
  units_per_bulk_snapshot INTEGER NOT NULL,
  handles_bulk_snapshot BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(carga_id, product_id),
  CHECK (planned_units > 0),
  CHECK (loaded_units >= 0 AND loaded_units <= planned_units),
  CHECK (accepted_units >= 0 AND accepted_units <= loaded_units),
  CHECK (discrepancy_units = loaded_units - accepted_units),
  CHECK (units_per_bulk_snapshot > 0)
);

CREATE TABLE IF NOT EXISTS carga_camion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carga_id UUID NOT NULL REFERENCES cargas_camion(id) ON DELETE CASCADE,
  event_type VARCHAR(40) NOT NULL,
  external_id UUID NULL,
  actor_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(carga_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_carga_orders_carga
  ON carga_camion_orders(carga_id);
CREATE INDEX IF NOT EXISTS idx_carga_items_carga
  ON carga_camion_items(carga_id);
CREATE INDEX IF NOT EXISTS idx_cargas_rutero_status
  ON cargas_camion(rutero_id, status, fecha_carga);

COMMIT;
