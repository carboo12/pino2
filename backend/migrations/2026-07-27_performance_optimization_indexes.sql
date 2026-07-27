-- 2026-07-27 Performance Optimization Indexes
-- Índices compuestos estratégicos para búsquedas ultra-rápidas (<10ms) en PostgreSQL

CREATE INDEX IF NOT EXISTS idx_products_dept
  ON products (store_id, department_id, sub_department)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_vendor_inventories_vendor_store
  ON vendor_inventories (vendor_id, store_id);

CREATE INDEX IF NOT EXISTS idx_sales_store_date
  ON sales (store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sales_cashier_date
  ON sales (store_id, cashier_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_store_date
  ON purchase_orders (store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_store_rutero_status
  ON orders (store_id, rutero_id, status);

CREATE INDEX IF NOT EXISTS idx_clients_store_preventa_active
  ON clients (store_id, preventa_id)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_product_barcodes_store_barcode
  ON product_barcodes (store_id, barcode);
