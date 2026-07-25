-- Post-test cleanup: fix sale_items mismatches
-- Ejecutar despues de cada run de tests E2E
UPDATE sale_items si
SET
  quantity_bulks = si.quantity / NULLIF(p.units_per_bulk, 0),
  quantity_units = si.quantity % NULLIF(p.units_per_bulk, 0),
  units_per_bulk_snapshot = COALESCE(NULLIF(p.units_per_bulk, 0), 1),
  handles_bulk_snapshot = COALESCE(p.handles_bulk, false)
FROM products p
WHERE si.product_id = p.id
  AND (si.quantity_bulks * si.units_per_bulk_snapshot + si.quantity_units != si.quantity
       OR (si.quantity_bulks = 0 AND si.quantity_units = 0 AND si.quantity > 0));
