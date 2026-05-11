-- Migration: Precios por bulto (bulk_price_1..5) en products
-- Fecha: 2026-05-10
-- Agrega columnas para precio por bulto (5 niveles, igual que precio por unidad)

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'bulk_price_1') THEN
    ALTER TABLE products ADD COLUMN bulk_price_1 DECIMAL(12,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'bulk_price_2') THEN
    ALTER TABLE products ADD COLUMN bulk_price_2 DECIMAL(12,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'bulk_price_3') THEN
    ALTER TABLE products ADD COLUMN bulk_price_3 DECIMAL(12,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'bulk_price_4') THEN
    ALTER TABLE products ADD COLUMN bulk_price_4 DECIMAL(12,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'bulk_price_5') THEN
    ALTER TABLE products ADD COLUMN bulk_price_5 DECIMAL(12,2) DEFAULT 0;
  END IF;
END $$;
