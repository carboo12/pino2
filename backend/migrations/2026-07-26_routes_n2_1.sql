BEGIN;

ALTER TABLE routes
  ADD COLUMN IF NOT EXISTS route_type VARCHAR(20) NOT NULL DEFAULT 'SALES',
  ADD COLUMN IF NOT EXISTS zone_id UUID NULL,
  ADD COLUMN IF NOT EXISTS assigned_by UUID NULL,
  ADD COLUMN IF NOT EXISTS valid_from DATE NULL,
  ADD COLUMN IF NOT EXISTS valid_to DATE NULL,
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

UPDATE routes
SET valid_from = COALESCE(valid_from, route_date::date);

ALTER TABLE routes DROP CONSTRAINT IF EXISTS routes_route_type_check;
ALTER TABLE routes
  ADD CONSTRAINT routes_route_type_check
  CHECK (route_type IN ('SALES', 'DELIVERY')) NOT VALID;

ALTER TABLE routes DROP CONSTRAINT IF EXISTS routes_validity_check;
ALTER TABLE routes
  ADD CONSTRAINT routes_validity_check
  CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to >= valid_from)
  NOT VALID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'routes_zone_id_fkey'
      AND conrelid = 'routes'::regclass
  ) THEN
    ALTER TABLE routes
      ADD CONSTRAINT routes_zone_id_fkey
      FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'routes_assigned_by_fkey'
      AND conrelid = 'routes'::regclass
  ) THEN
    ALTER TABLE routes
      ADD CONSTRAINT routes_assigned_by_fkey
      FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE routes VALIDATE CONSTRAINT routes_route_type_check;
ALTER TABLE routes VALIDATE CONSTRAINT routes_validity_check;

INSERT INTO route_clients (route_id, client_id, visit_order)
SELECT r.id,
       value::uuid,
       ordinality::integer
FROM routes r
CROSS JOIN LATERAL jsonb_array_elements_text(
  COALESCE(r.client_ids, '[]'::jsonb)
) WITH ORDINALITY AS item(value, ordinality)
JOIN clients c
  ON c.id = value::uuid
 AND c.store_id = r.store_id
ON CONFLICT (route_id, client_id) DO UPDATE
SET visit_order = EXCLUDED.visit_order;

CREATE TABLE IF NOT EXISTS route_assignment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  event_type VARCHAR(30) NOT NULL,
  previous_vendor_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  new_vendor_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  client_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  reason TEXT NULL,
  changed_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT route_assignment_history_event_check CHECK (
    event_type IN (
      'CREATED', 'REASSIGNED', 'CLIENTS_REPLACED', 'STATUS_CHANGED'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_routes_store_vendor_date
  ON routes (store_id, vendor_id, route_date);
CREATE INDEX IF NOT EXISTS idx_routes_store_type_status
  ON routes (store_id, route_type, status);
CREATE INDEX IF NOT EXISTS idx_route_clients_route_order
  ON route_clients (route_id, visit_order);
CREATE INDEX IF NOT EXISTS idx_route_history_route_created
  ON route_assignment_history (route_id, created_at DESC);

COMMENT ON TABLE vendor_routes IS
  'DEPRECATED N2.1: use routes + route_clients. Read-only legacy table.';

COMMIT;
