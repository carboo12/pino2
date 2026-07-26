BEGIN;

ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS discount NUMERIC(14, 2) NOT NULL DEFAULT 0;

ALTER TABLE sales
  DROP CONSTRAINT IF EXISTS sales_discount_nonnegative;

ALTER TABLE sales
  ADD CONSTRAINT sales_discount_nonnegative
  CHECK (discount >= 0) NOT VALID;

ALTER TABLE sales
  VALIDATE CONSTRAINT sales_discount_nonnegative;

COMMIT;
