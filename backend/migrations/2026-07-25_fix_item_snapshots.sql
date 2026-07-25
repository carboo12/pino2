-- F3/F9: Poblar snapshots en items historicos
-- Correccion de 221 sale_items y n order_items sin split ni snapshots

-- 1. Sale items: derivar quantity_bulks/quantity_units desde producto
UPDATE sale_items si
SET
  quantity_bulks = si.quantity / NULLIF(p.units_per_bulk, 0),
  quantity_units = si.quantity % NULLIF(p.units_per_bulk, 0),
  units_per_bulk_snapshot = COALESCE(NULLIF(p.units_per_bulk, 0), 1),
  handles_bulk_snapshot = COALESCE(p.handles_bulk, false),
  bulk_price = CASE
    WHEN p.handles_bulk AND p.bulk_price_1 > 0 THEN p.bulk_price_1
    ELSE 0
  END
FROM products p
WHERE si.product_id = p.id
  AND (si.quantity_bulks = 0 AND si.quantity_units = 0);

-- 2. Order items: mismo tratamiento
UPDATE order_items oi
SET
  quantity_bulks = oi.quantity / NULLIF(p.units_per_bulk, 0),
  quantity_units = oi.quantity % NULLIF(p.units_per_bulk, 0),
  units_per_bulk_snapshot = COALESCE(NULLIF(p.units_per_bulk, 0), 1),
  handles_bulk_snapshot = COALESCE(p.handles_bulk, false),
  bulk_price = CASE
    WHEN p.handles_bulk AND p.bulk_price_1 > 0 THEN p.bulk_price_1
    ELSE 0
  END
FROM products p
WHERE oi.product_id = p.id
  AND (oi.quantity_bulks = 0 AND oi.quantity_units = 0);

-- 3. Verificar resultados
SELECT 'sale_items after fix' as tabla, count(*) as total,
  sum(CASE WHEN quantity_bulks * units_per_bulk_snapshot + quantity_units != quantity THEN 1 ELSE 0 END) as mismatches
FROM sale_items;

SELECT 'order_items after fix' as tabla, count(*) as total,
  sum(CASE WHEN quantity_bulks * units_per_bulk_snapshot + quantity_units != quantity THEN 1 ELSE 0 END) as mismatches
FROM order_items;
