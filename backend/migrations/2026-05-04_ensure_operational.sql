-- Migración para estructurar lo que estaba en ensureOperationalTables

-- 1. Consultas SQL (Performance Monitoring)
CREATE TABLE IF NOT EXISTS consultasql (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  activo BOOLEAN NOT NULL DEFAULT FALSE,
  umbral_ms INTEGER NOT NULL DEFAULT 200 CHECK (umbral_ms >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO consultasql (id, activo, umbral_ms)
VALUES (1, FALSE, 200)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS consultasql_historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operacion VARCHAR(20),
  origen VARCHAR(30) NOT NULL DEFAULT 'pool',
  duracion_ms INTEGER NOT NULL,
  row_count INTEGER,
  consulta TEXT NOT NULL,
  parametros JSONB,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consultasql_historial_created_at
ON consultasql_historial(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_consultasql_historial_duracion
ON consultasql_historial(duracion_ms DESC);


-- 2. Asegurar columnas de Idempotencia (Id para Offline Sync)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'external_id') THEN
    ALTER TABLE sales ADD COLUMN external_id UUID UNIQUE;
  END IF;
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'external_id') THEN
    ALTER TABLE orders ADD COLUMN external_id UUID UNIQUE;
  END IF;
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'external_id') THEN
    ALTER TABLE collections ADD COLUMN external_id UUID UNIQUE;
  END IF;
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'returns' AND column_name = 'external_id') THEN
    ALTER TABLE returns ADD COLUMN external_id UUID UNIQUE;
  END IF;
END $$;


-- 3. Asegurar store_type para arquitectura multi-tienda corporativa
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'store_type') THEN
    ALTER TABLE stores ADD COLUMN store_type VARCHAR(50) DEFAULT 'SUPERMERCADO';
  END IF;
END $$;

-- 3.5 Columnas de denominaciones para arqueos en cash_shifts
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cash_shifts' AND column_name = 'opening_denominations') THEN
    ALTER TABLE cash_shifts ADD COLUMN opening_denominations JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cash_shifts' AND column_name = 'closing_denominations') THEN
    ALTER TABLE cash_shifts ADD COLUMN closing_denominations JSONB;
  END IF;
END $$;


-- 4. Tabla de estado de sincronización por tienda
CREATE TABLE IF NOT EXISTS sync_status (
  store_id UUID PRIMARY KEY REFERENCES stores(id) ON DELETE CASCADE,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'IDLE',
  last_error TEXT,
  ops_count INTEGER DEFAULT 0,
  duplicates_avoided INTEGER DEFAULT 0
);


-- 5. Tabla de departamentos (asegurar columnas para sub-departamentos)
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'departments' AND column_name = 'parent_id') THEN
    ALTER TABLE departments ADD COLUMN parent_id UUID REFERENCES departments(id) ON DELETE SET NULL;
  END IF;
END $$;


-- 6. Tabla para Tokens de Dispositivos (FCM)
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
