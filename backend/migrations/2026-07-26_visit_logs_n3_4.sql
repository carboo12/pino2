BEGIN;

ALTER TABLE visit_logs
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'VISITED',
  ADD COLUMN IF NOT EXISTS external_id UUID NULL;

UPDATE visit_logs SET status = 'VISITED' WHERE status IS NULL OR TRIM(status) = '';

ALTER TABLE visit_logs DROP CONSTRAINT IF EXISTS visit_logs_status_check;
ALTER TABLE visit_logs ADD CONSTRAINT visit_logs_status_check CHECK (
  status IN ('PENDING', 'VISITED', 'NO_SALE', 'SALE', 'SKIPPED')
) NOT VALID;
ALTER TABLE visit_logs VALIDATE CONSTRAINT visit_logs_status_check;

CREATE UNIQUE INDEX IF NOT EXISTS uq_visit_logs_store_external
  ON visit_logs(store_id, external_id);
CREATE INDEX IF NOT EXISTS idx_visit_logs_vendor_created
  ON visit_logs(vendor_id, created_at DESC);

COMMIT;
