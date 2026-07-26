BEGIN;

ALTER TABLE liquidaciones_ruta
  ADD COLUMN IF NOT EXISTS external_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS uq_liquidaciones_ruta_store_external
  ON liquidaciones_ruta (store_id, external_id)
  WHERE external_id IS NOT NULL;

COMMENT ON COLUMN liquidaciones_ruta.external_id IS
  'UUID estable generado por el cliente offline; reintentos devuelven la misma liquidación.';

COMMIT;
