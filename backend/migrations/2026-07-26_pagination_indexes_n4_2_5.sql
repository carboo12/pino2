-- N4.2.5: índices para listados paginados de alto volumen.
-- CONCURRENTLY evita bloquear escrituras durante la construcción; por ello
-- este archivo no debe envolverse en BEGIN/COMMIT.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_active_store_name_page
  ON clients (store_id, name, id)
  WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_store_description_page
  ON products (store_id, description, id)
  WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_store_created_page
  ON sales (store_id, created_at DESC, id DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_shift_created_page
  ON sales (cash_shift_id, created_at DESC, id DESC)
  WHERE cash_shift_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_cashier_created_page
  ON sales (cashier_id, created_at DESC, id DESC)
  WHERE cashier_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_movements_store_created_page
  ON movements (store_id, created_at DESC, id DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_movements_store_type_created_page
  ON movements (store_id, type, created_at DESC, id DESC);
