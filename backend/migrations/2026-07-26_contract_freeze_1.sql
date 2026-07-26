BEGIN;

UPDATE routes
SET status = CASE LOWER(TRIM(status))
  WHEN 'pending' THEN 'PENDING'
  WHEN 'in_progress' THEN 'ACTIVE'
  WHEN 'active' THEN 'ACTIVE'
  WHEN 'completed' THEN 'COMPLETED'
  WHEN 'cancelled' THEN 'CANCELLED'
  WHEN 'canceled' THEN 'CANCELLED'
  ELSE UPPER(TRIM(status))
END;

UPDATE pending_deliveries
SET status = CASE LOWER(TRIM(status))
  WHEN 'pendiente' THEN 'PENDING'
  WHEN 'pending' THEN 'PENDING'
  WHEN 'assigned' THEN 'ASSIGNED'
  WHEN 'asignado' THEN 'ASSIGNED'
  WHEN 'en_ruta' THEN 'EN_RUTA'
  WHEN 'entregado' THEN 'ENTREGADO'
  WHEN 'parcial' THEN 'PARCIAL'
  WHEN 'rechazado' THEN 'RECHAZADO'
  WHEN 'devuelto' THEN 'DEVUELTO'
  WHEN 'cancelado' THEN 'CANCELADO'
  ELSE UPPER(TRIM(status))
END;

UPDATE orders
SET status = 'EN_RUTA'
WHERE UPPER(TRIM(status)) = 'EN_ENTREGA';

UPDATE liquidaciones_ruta
SET status = CASE UPPER(TRIM(status))
  WHEN 'PENDIENTE' THEN 'PENDING'
  WHEN 'LIQUIDADO' THEN 'BALANCED'
  WHEN 'CON_OBSERVACION' THEN 'WITH_DIFFERENCE'
  ELSE UPPER(TRIM(status))
END;

ALTER TABLE routes ALTER COLUMN status SET DEFAULT 'PENDING';
ALTER TABLE pending_deliveries ALTER COLUMN status SET DEFAULT 'PENDING';
ALTER TABLE liquidaciones_ruta ALTER COLUMN status SET DEFAULT 'PENDING';

ALTER TABLE routes DROP CONSTRAINT IF EXISTS routes_status_contract_check;
ALTER TABLE routes
  ADD CONSTRAINT routes_status_contract_check
  CHECK (status IN ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED')) NOT VALID;

ALTER TABLE pending_deliveries
  DROP CONSTRAINT IF EXISTS pending_deliveries_status_contract_check;
ALTER TABLE pending_deliveries
  ADD CONSTRAINT pending_deliveries_status_contract_check
  CHECK (status IN (
    'PENDING', 'ASSIGNED', 'EN_RUTA', 'ENTREGADO',
    'PARCIAL', 'RECHAZADO', 'DEVUELTO', 'CANCELADO'
  )) NOT VALID;

ALTER TABLE liquidaciones_ruta
  DROP CONSTRAINT IF EXISTS liquidaciones_ruta_status_contract_check;
ALTER TABLE liquidaciones_ruta
  ADD CONSTRAINT liquidaciones_ruta_status_contract_check
  CHECK (status IN (
    'PENDING', 'BALANCED', 'WITH_DIFFERENCE', 'APPROVED', 'CANCELLED'
  )) NOT VALID;

ALTER TABLE routes VALIDATE CONSTRAINT routes_status_contract_check;
ALTER TABLE pending_deliveries
  VALIDATE CONSTRAINT pending_deliveries_status_contract_check;
ALTER TABLE liquidaciones_ruta
  VALIDATE CONSTRAINT liquidaciones_ruta_status_contract_check;

CREATE UNIQUE INDEX IF NOT EXISTS uq_liquidaciones_ruta_store_rutero_fecha
  ON liquidaciones_ruta (store_id, rutero_id, fecha_ruta);

COMMIT;
