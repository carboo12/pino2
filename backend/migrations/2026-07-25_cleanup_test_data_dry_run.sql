-- F0.9: Limpieza de datos de prueba
-- DRY RUN: Solo consulta, no modifica datos
-- Ejecutar solo despues de aprobacion del responsable

BEGIN;

-- 1. Identificar productos seed (creados por seed_test.sql)
SELECT 'PRODUCTOS SEED' as categoria, id, description, store_id, current_stock
FROM products
WHERE id IN ('c0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002');

-- 2. Identificar tienda seed
SELECT 'TIENDA SEED' as categoria, id, name
FROM stores
WHERE id = 'a0000000-0000-4000-8000-000000000001';

-- 3. Identificar usuarios seed
SELECT 'USUARIOS SEED' as categoria, id, email, role
FROM users
WHERE id = 'b0000000-0000-4000-8000-000000000001';

-- 4. Productos con current_stock inconsistente vs split (seed sin split inicial)
SELECT 'STOCK MISMATCH' as categoria, id, description, current_stock, units_per_bulk,
  CASE WHEN handles_bulk THEN current_stock / units_per_bulk ELSE 0 END as calc_bulks,
  CASE WHEN handles_bulk THEN current_stock % units_per_bulk ELSE current_stock END as calc_units
FROM products
WHERE current_stock != (
  CASE WHEN handles_bulk THEN (current_stock / units_per_bulk) * units_per_bulk + (current_stock % units_per_bulk)
  ELSE current_stock END
);

ROLLBACK;
