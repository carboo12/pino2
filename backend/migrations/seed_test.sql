-- Minimal seed for CI / E2E test database (pino_mvp_test)
INSERT INTO stores (id, name, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Tienda Central Test', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO departments (id, name, store_id)
VALUES ('00000000-0000-0000-0000-000000000002', 'Abarrotes Test', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, store_id, department_id, barcode, description, sale_price, cost_price, current_stock, units_per_bulk, handles_bulk)
VALUES 
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '770000000001', 'Producto Bulto Test 10x', 100.00, 70.00, 100, 10, true),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '770000000002', 'Producto Unidad Test', 20.00, 12.00, 50, 1, false)
ON CONFLICT (id) DO NOTHING;
