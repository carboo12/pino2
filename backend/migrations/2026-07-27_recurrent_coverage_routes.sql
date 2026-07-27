-- 2026-07-27 Recurrent Coverage Routes Migration
-- Corrección conceptual: Rutas Fijas de Cobertura (con nombre obligatorio y día recurrente 0-7)

ALTER TABLE routes
  ADD COLUMN IF NOT EXISTS name VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS day_of_week INT NOT NULL DEFAULT 0;

ALTER TABLE routes DROP CONSTRAINT IF EXISTS routes_validity_check;

-- Asignar nombre descriptivo a rutas históricas existentes
UPDATE routes
   SET name = COALESCE(NULLIF(TRIM(name), ''), CONCAT('Ruta Cobertura ', SUBSTRING(id::text FROM 1 FOR 8)))
 WHERE name IS NULL OR TRIM(name) = '';
