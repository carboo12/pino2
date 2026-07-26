BEGIN;

CREATE TABLE IF NOT EXISTS product_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  external_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PREVIEWED',
  total_rows INTEGER NOT NULL DEFAULT 0,
  valid_rows INTEGER NOT NULL DEFAULT 0,
  warning_rows INTEGER NOT NULL DEFAULT 0,
  invalid_rows INTEGER NOT NULL DEFAULT 0,
  imported_rows INTEGER NOT NULL DEFAULT 0,
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  applied_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  applied_at TIMESTAMP NULL,
  UNIQUE(store_id, external_id),
  CHECK (status IN ('PREVIEWED', 'APPLYING', 'COMPLETED', 'CANCELLED'))
);

CREATE TABLE IF NOT EXISTS product_import_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES product_import_batches(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL,
  raw_payload JSONB NOT NULL,
  normalized_payload JSONB NULL,
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  product_id UUID NULL REFERENCES products(id) ON DELETE SET NULL,
  imported_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(batch_id, row_number),
  CHECK (status IN ('VALID', 'WARNING', 'INVALID', 'IMPORTED'))
);

CREATE INDEX IF NOT EXISTS idx_product_import_rows_batch_status
  ON product_import_rows(batch_id, status, row_number);

COMMIT;
