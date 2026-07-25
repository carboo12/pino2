-- 2026-07-25 Performance Indexes Migration for Multitienda DB
-- Ensures optimal query speed for order_items, sale_items, movements, outbox, and inventory_ledger

CREATE INDEX IF NOT EXISTS idx_order_items_product_units ON order_items(product_id, quantity_bulks, quantity_units);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_units ON sale_items(product_id, quantity_bulks, quantity_units);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_perf ON movements(store_id, product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outbox_pending_perf ON outbox_events(published_at, created_at) WHERE published_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_general_ledger_store_date ON inventory_ledger(store_id, created_at DESC);
