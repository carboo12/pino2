-- Normalize routes.client_ids JSONB array into a proper route_clients table
-- This should be run AFTER verifying the application code supports the new table

-- Step 1: Create the normalized table
CREATE TABLE IF NOT EXISTS route_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    visit_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(route_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_route_clients_route ON route_clients(route_id);
CREATE INDEX IF NOT EXISTS idx_route_clients_client ON route_clients(client_id);

-- Step 2: Migrate existing data from routes.client_ids JSONB
INSERT INTO route_clients (route_id, client_id, visit_order)
SELECT 
    r.id,
    client_id::UUID,
    row_number() OVER (PARTITION BY r.id ORDER BY ordinality) - 1
FROM routes r,
LATERAL jsonb_array_elements_text(r.client_ids) WITH ORDINALITY AS t(client_id, ordinality)
WHERE r.client_ids IS NOT NULL 
  AND r.client_ids != '[]'::jsonb
  AND client_id::UUID IN (SELECT id FROM clients)
ON CONFLICT (route_id, client_id) DO NOTHING;

-- Step 3: Repeat for vendor_routes
CREATE TABLE IF NOT EXISTS vendor_route_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_route_id UUID NOT NULL REFERENCES vendor_routes(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    visit_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vendor_route_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_vendor_route_clients_route ON vendor_route_clients(vendor_route_id);
CREATE INDEX IF NOT EXISTS idx_vendor_route_clients_client ON vendor_route_clients(client_id);

INSERT INTO vendor_route_clients (vendor_route_id, client_id, visit_order)
SELECT 
    vr.id,
    client_id::UUID,
    row_number() OVER (PARTITION BY vr.id ORDER BY ordinality) - 1
FROM vendor_routes vr,
LATERAL jsonb_array_elements_text(vr.client_ids) WITH ORDINALITY AS t(client_id, ordinality)
WHERE vr.client_ids IS NOT NULL 
  AND vr.client_ids != '[]'::jsonb
  AND client_id::UUID IN (SELECT id FROM clients)
ON CONFLICT (vendor_route_id, client_id) DO NOTHING;

-- Migration tracking
INSERT INTO schema_migrations (filename) VALUES ('2026-07-25_normalize_route_clients.sql')
ON CONFLICT (filename) DO NOTHING;
