-- ======================================================================
-- FASE 3: CONTRATO DE DATOS E INTEGRIDAD
-- Ejecutar SOLO despues de pg_dump y validacion en staging.
-- ======================================================================

BEGIN;

-- 1. NORMALIZACION DE ROLES Y ESTADOS
-- Requiere aprobacion de negocio antes de COMMIT.

UPDATE users SET role = 'store-admin' WHERE lower(role) = 'admin' AND role <> 'store-admin';
UPDATE users SET role = 'inventory' WHERE lower(role) = 'warehouse';
UPDATE users SET role = 'rutero' WHERE lower(role) = 'rutero';

UPDATE orders SET status = 'ENTREGADO' WHERE status = 'COMPLETED';
UPDATE orders SET payment_type = 'CONTADO' WHERE payment_type IN ('CASH', 'cash');
UPDATE orders SET payment_type = 'CREDITO' WHERE payment_type IN ('CREDIT', 'credit');

-- 2. CORREGIR STOCK DE 2 PRODUCTOS DESCOMPUESTOS
UPDATE products
SET current_stock = COALESCE(stock_bulks, 0) * units_per_bulk + COALESCE(stock_units, 0)
WHERE units_per_bulk > 0
  AND current_stock IS DISTINCT FROM
      COALESCE(stock_bulks, 0) * units_per_bulk + COALESCE(stock_units, 0);

-- 3. CHECK CONSTRAINTS (NOT VALID para no bloquear)
ALTER TABLE products
  ADD CONSTRAINT IF NOT EXISTS products_stock_nonnegative
  CHECK (current_stock >= 0 AND stock_bulks >= 0 AND stock_units >= 0)
  NOT VALID;

ALTER TABLE products
  ADD CONSTRAINT IF NOT EXISTS products_units_per_bulk_positive
  CHECK (units_per_bulk > 0)
  NOT VALID;

ALTER TABLE order_items
  ADD CONSTRAINT IF NOT EXISTS order_items_quantity_positive
  CHECK (quantity > 0 AND unit_price >= 0 AND subtotal >= 0)
  NOT VALID;

ALTER TABLE sale_items
  ADD CONSTRAINT IF NOT EXISTS sale_items_quantity_positive
  CHECK (quantity > 0 AND unit_price >= 0 AND subtotal >= 0)
  NOT VALID;

ALTER TABLE accounts_receivable
  ADD CONSTRAINT IF NOT EXISTS ar_balance_valid
  CHECK (total_amount >= 0 AND remaining_amount >= 0 AND remaining_amount <= total_amount)
  NOT VALID;

ALTER TABLE accounts_payable
  ADD CONSTRAINT IF NOT EXISTS ap_balance_valid
  CHECK (total_amount >= 0 AND remaining_amount >= 0 AND remaining_amount <= total_amount)
  NOT VALID;

ALTER TABLE orders
  ADD CONSTRAINT IF NOT EXISTS orders_payment_type_valid
  CHECK (payment_type IN ('CONTADO', 'CREDITO'))
  NOT VALID;

-- 4. INDICES UNICOS
CREATE UNIQUE INDEX IF NOT EXISTS uq_cash_shift_open_user_store
ON cash_shifts (store_id, opened_by)
WHERE status = 'OPEN';

CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_delivery_order
ON pending_deliveries (order_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_vendor_inventory_scope
ON vendor_inventories (store_id, vendor_id, product_id);

-- 5. FK CRITICAS
ALTER TABLE accounts_receivable
  ADD CONSTRAINT IF NOT EXISTS ar_store_fk
  FOREIGN KEY (store_id) REFERENCES stores(id) NOT VALID,
  ADD CONSTRAINT IF NOT EXISTS ar_client_fk
  FOREIGN KEY (client_id) REFERENCES clients(id) NOT VALID,
  ADD CONSTRAINT IF NOT EXISTS ar_order_fk
  FOREIGN KEY (order_id) REFERENCES orders(id) NOT VALID;

ALTER TABLE invoices
  ADD CONSTRAINT IF NOT EXISTS invoices_store_fk
  FOREIGN KEY (store_id) REFERENCES stores(id) NOT VALID,
  ADD CONSTRAINT IF NOT EXISTS invoices_supplier_fk
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) NOT VALID;

ALTER TABLE pending_deliveries
  ADD CONSTRAINT IF NOT EXISTS pd_store_fk
  FOREIGN KEY (store_id) REFERENCES stores(id) NOT VALID,
  ADD CONSTRAINT IF NOT EXISTS pd_order_fk
  FOREIGN KEY (order_id) REFERENCES orders(id) NOT VALID,
  ADD CONSTRAINT IF NOT EXISTS pd_client_fk
  FOREIGN KEY (client_id) REFERENCES clients(id) NOT VALID,
  ADD CONSTRAINT IF NOT EXISTS pd_rutero_fk
  FOREIGN KEY (rutero_id) REFERENCES users(id) NOT VALID;

ALTER TABLE vendor_inventories
  ADD CONSTRAINT IF NOT EXISTS vi_store_fk
  FOREIGN KEY (store_id) REFERENCES stores(id) NOT VALID,
  ADD CONSTRAINT IF NOT EXISTS vi_vendor_fk
  FOREIGN KEY (vendor_id) REFERENCES users(id) NOT VALID,
  ADD CONSTRAINT IF NOT EXISTS vi_product_fk
  FOREIGN KEY (product_id) REFERENCES products(id) NOT VALID;

-- 6. LIMITE DE DEVOLUCIONES POR VENTA
ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS returned_quantity integer NOT NULL DEFAULT 0;

ALTER TABLE sale_items
  ADD CONSTRAINT IF NOT EXISTS sale_items_returned_valid
  CHECK (returned_quantity >= 0 AND returned_quantity <= quantity)
  NOT VALID;

-- 7. OUTBOX TRANSACCIONAL
CREATE TABLE IF NOT EXISTS outbox_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  aggregate_type varchar(50) NOT NULL,
  aggregate_id uuid NOT NULL,
  store_id uuid NOT NULL REFERENCES stores(id),
  event_type varchar(80) NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  last_error text
);

CREATE INDEX IF NOT EXISTS idx_outbox_pending
ON outbox_events (created_at)
WHERE published_at IS NULL;

COMMIT;

-- Validar constraints despues de limpiar datos
-- ALTER TABLE products VALIDATE CONSTRAINT products_stock_nonnegative;
-- ALTER TABLE products VALIDATE CONSTRAINT products_units_per_bulk_positive;
-- ALTER TABLE order_items VALIDATE CONSTRAINT order_items_quantity_positive;
-- ALTER TABLE sale_items VALIDATE CONSTRAINT sale_items_quantity_positive;
-- ALTER TABLE accounts_receivable VALIDATE CONSTRAINT ar_balance_valid;
-- ALTER TABLE accounts_payable VALIDATE CONSTRAINT ap_balance_valid;
-- ALTER TABLE orders VALIDATE CONSTRAINT orders_payment_type_valid;
-- ALTER TABLE sale_items VALIDATE CONSTRAINT sale_items_returned_valid;
