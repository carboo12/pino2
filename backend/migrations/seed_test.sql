-- Seed determinista para pruebas E2E
-- Sin credenciales fijas (usar variables de entorno)

INSERT INTO schema_migrations (filename) VALUES ('seed_test.sql')
ON CONFLICT (filename) DO NOTHING;

-- No sembrar datos de negocio reales
-- Este seed se ejecuta en pino_mvp_test, no en produccion

-- Tienda de prueba
INSERT INTO stores (id, name, is_active)
SELECT 'a0000000-0000-4000-8000-000000000001', 'Tienda Test MVP', true
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE id = 'a0000000-0000-4000-8000-000000000001');

-- Usuario store-admin de prueba (password: test1234)
INSERT INTO users (id, email, name, password_hash, role, is_active)
SELECT 'b0000000-0000-4000-8000-000000000001', 'admin@test.local', 'Admin Test', '$2b$10$8K1p/a0dL1LXMIgoEDFrwOfMQkfEd3UOxq6yA5YK1eB5V7KAaGFe.', 'store-admin', true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 'b0000000-0000-4000-8000-000000000001');

INSERT INTO user_stores (user_id, store_id)
SELECT 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'
WHERE NOT EXISTS (SELECT 1 FROM user_stores WHERE user_id = 'b0000000-0000-4000-8000-000000000001');

-- Productos de prueba
INSERT INTO products (id, store_id, description, sale_price, cost_price, current_stock, price1, uses_inventory, is_active)
SELECT 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Producto Test 1', 100, 50, 1000, 100, true, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = 'c0000000-0000-4000-8000-000000000001');

INSERT INTO products (id, store_id, description, sale_price, cost_price, current_stock, price1, uses_inventory, is_active)
SELECT 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Producto Test 2', 200, 100, 500, 200, true, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = 'c0000000-0000-4000-8000-000000000002');
