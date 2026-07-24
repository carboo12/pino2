-- F1: Correccion de constraints y tablas de sincronizacion
-- NO usar ADD CONSTRAINT IF NOT EXISTS (invalido en PG16)
-- Usar DO $$ blocks con verificacion explicita

-- 1. CHECK constraints faltantes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_stock_nonnegative') THEN
    ALTER TABLE products ADD CONSTRAINT products_stock_nonnegative CHECK (current_stock >= 0 AND stock_bulks >= 0 AND stock_units >= 0) NOT VALID;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_units_per_bulk_positive') THEN
    ALTER TABLE products ADD CONSTRAINT products_units_per_bulk_positive CHECK (units_per_bulk > 0) NOT VALID;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_quantity_positive') THEN
    ALTER TABLE order_items ADD CONSTRAINT order_items_quantity_positive CHECK (quantity > 0 AND unit_price >= 0 AND subtotal >= 0) NOT VALID;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_items_quantity_positive') THEN
    ALTER TABLE sale_items ADD CONSTRAINT sale_items_quantity_positive CHECK (quantity > 0 AND unit_price >= 0 AND subtotal >= 0) NOT VALID;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ar_balance_valid') THEN
    ALTER TABLE accounts_receivable ADD CONSTRAINT ar_balance_valid CHECK (total_amount >= 0 AND remaining_amount >= 0 AND remaining_amount <= total_amount) NOT VALID;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_type_valid') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_payment_type_valid CHECK (payment_type IN ('CONTADO', 'CREDITO')) NOT VALID;
  END IF;
END $$;

-- 2. Unicos indices
CREATE UNIQUE INDEX IF NOT EXISTS uq_cash_shift_open_user_store ON cash_shifts (store_id, opened_by) WHERE status = 'OPEN';
CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_delivery_order ON pending_deliveries (order_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_vendor_inventory_scope ON vendor_inventories (store_id, vendor_id, product_id);

-- 3. Validar constraints existentes
DO $$ BEGIN
  ALTER TABLE products VALIDATE CONSTRAINT products_stock_nonnegative;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- 4. Tablas de sincronizacion
CREATE TABLE IF NOT EXISTS sync_nodes (
  id uuid PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES stores(id),
  node_type varchar(10) NOT NULL CHECK (node_type IN ('EDGE', 'CLOUD')),
  name varchar(100) NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, id)
);

CREATE TABLE IF NOT EXISTS sync_inbox (
  id bigserial PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES stores(id),
  operation_id uuid NOT NULL,
  source_node_id uuid NOT NULL,
  operation_type varchar(80) NOT NULL,
  aggregate_type varchar(50) NOT NULL,
  aggregate_id uuid,
  expected_version bigint,
  payload jsonb NOT NULL,
  payload_hash varchar(64) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'RECEIVED',
  result jsonb,
  error_code varchar(80),
  error_message text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  UNIQUE (store_id, operation_id)
);

CREATE TABLE IF NOT EXISTS sync_outbox (
  id bigserial PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES stores(id),
  operation_id uuid NOT NULL,
  target_node_id uuid,
  event_type varchar(80) NOT NULL,
  aggregate_type varchar(50) NOT NULL,
  aggregate_id uuid NOT NULL,
  aggregate_version bigint NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  available_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  UNIQUE (store_id, operation_id, event_type, target_node_id)
);

CREATE INDEX IF NOT EXISTS sync_outbox_pending_idx
ON sync_outbox (available_at, id)
WHERE published_at IS NULL;

CREATE TABLE IF NOT EXISTS sync_cursors (
  node_id uuid NOT NULL,
  store_id uuid NOT NULL,
  stream varchar(50) NOT NULL,
  last_event_id bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (node_id, store_id, stream)
);

CREATE TABLE IF NOT EXISTS inventory_ledger (
  id bigserial PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES stores(id),
  operation_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES products(id),
  location_type varchar(20) NOT NULL,
  location_id uuid NOT NULL,
  movement_type varchar(40) NOT NULL,
  quantity integer NOT NULL CHECK (quantity <> 0),
  balance_after integer NOT NULL CHECK (balance_after >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, operation_id, product_id, location_type, location_id)
);
