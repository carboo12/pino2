BEGIN;

ALTER TABLE cargas_camion
  ADD COLUMN IF NOT EXISTS returned_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS returned_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS closed_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP NULL;

ALTER TABLE liquidaciones_ruta
  ADD COLUMN IF NOT EXISTS carga_id UUID NULL REFERENCES cargas_camion(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS submitted_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS merchandise_received_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS merchandise_received_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS approved_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_notes TEXT NULL,
  ADD COLUMN IF NOT EXISTS merchandise_expected_units INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS merchandise_returned_units INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS merchandise_difference_units INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE liquidaciones_ruta
  DROP CONSTRAINT IF EXISTS liquidaciones_ruta_status_contract_check;
ALTER TABLE liquidaciones_ruta
  ADD CONSTRAINT liquidaciones_ruta_status_contract_check CHECK (status IN (
    'PENDING', 'SUBMITTED_BY_DRIVER', 'UNDER_REVIEW',
    'BALANCED', 'WITH_DIFFERENCE', 'APPROVED',
    'WITH_OBSERVATION', 'CLOSED', 'CANCELLED'
  )) NOT VALID;
ALTER TABLE liquidaciones_ruta
  VALIDATE CONSTRAINT liquidaciones_ruta_status_contract_check;

CREATE UNIQUE INDEX IF NOT EXISTS uq_liquidaciones_ruta_carga
  ON liquidaciones_ruta(carga_id)
  WHERE carga_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS liquidacion_ruta_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liquidacion_id UUID NOT NULL REFERENCES liquidaciones_ruta(id) ON DELETE CASCADE,
  carga_id UUID NOT NULL REFERENCES cargas_camion(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  expected_units INTEGER NOT NULL,
  returned_units INTEGER NOT NULL,
  difference_units INTEGER NOT NULL,
  units_per_bulk_snapshot INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(liquidacion_id, product_id),
  CHECK (expected_units >= 0),
  CHECK (returned_units >= 0),
  CHECK (returned_units <= expected_units),
  CHECK (difference_units = returned_units - expected_units),
  CHECK (units_per_bulk_snapshot > 0)
);

CREATE INDEX IF NOT EXISTS idx_liquidacion_items_carga
  ON liquidacion_ruta_items(carga_id);

COMMIT;
