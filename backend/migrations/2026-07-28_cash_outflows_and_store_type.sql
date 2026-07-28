-- Migración: Soporte store_type en stores y extensión de caja con egresos/outflows
-- Fecha: 2026-07-28

-- 1. Agregar store_type a stores
ALTER TABLE stores 
  ADD COLUMN IF NOT EXISTS store_type VARCHAR(50) DEFAULT 'SUPERMERCADO';

-- 2. Asegurar campos en cash_shifts para doble moneda y totales
ALTER TABLE cash_shifts
  ADD COLUMN IF NOT EXISTS sales_cash NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sales_card NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sales_usd NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS actual_usd NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_returns NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_sales NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS difference NUMERIC(12,2) DEFAULT 0;

-- 3. Crear tabla cash_outflows para egresos / recibos de caja
CREATE TABLE IF NOT EXISTS cash_outflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES cash_shifts(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  reason TEXT NOT NULL,
  receipt_number SERIAL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Índice para búsquedas rápidas de egresos por sesión
CREATE INDEX IF NOT EXISTS idx_cash_outflows_session_id ON cash_outflows(session_id);
