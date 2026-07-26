-- P0/P1: contrato financiero canónico para CxC, CxP y notas de crédito.
-- Migración aditiva e idempotente. No reconstruye deuda histórica.

ALTER TABLE accounts_receivable
  ADD COLUMN IF NOT EXISTS sale_id uuid REFERENCES sales(id),
  ADD COLUMN IF NOT EXISTS invoice_number varchar(80),
  ADD COLUMN IF NOT EXISTS issued_at timestamptz,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS credit_days_snapshot integer,
  ADD COLUMN IF NOT EXISTS credit_note_amount numeric(14,2) NOT NULL DEFAULT 0;

UPDATE accounts_receivable
SET status = CASE upper(coalesce(status, ''))
  WHEN 'ACTIVE' THEN 'PENDING'
  WHEN 'PAID_IN_FULL' THEN 'PAID'
  WHEN 'OVERDUE' THEN 'PENDING'
  WHEN '' THEN 'PENDING'
  ELSE upper(status)
END;

UPDATE accounts_receivable
SET issued_at = COALESCE(issued_at, created_at, now()),
    credit_days_snapshot = COALESCE(credit_days_snapshot, 8),
    due_date = COALESCE(
      due_date,
      (COALESCE(issued_at, created_at, now())::date
        + COALESCE(credit_days_snapshot, 8))
    );

ALTER TABLE accounts_receivable
  ALTER COLUMN status SET DEFAULT 'PENDING';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'accounts_receivable'::regclass
      AND conname = 'ar_credit_days_nonnegative'
  ) THEN
    ALTER TABLE accounts_receivable
      ADD CONSTRAINT ar_credit_days_nonnegative
      CHECK (credit_days_snapshot IS NULL OR credit_days_snapshot >= 0)
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'accounts_receivable'::regclass
      AND conname = 'ar_credit_note_amount_valid'
  ) THEN
    ALTER TABLE accounts_receivable
      ADD CONSTRAINT ar_credit_note_amount_valid
      CHECK (
        credit_note_amount >= 0
        AND credit_note_amount <= total_amount
      )
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'accounts_receivable'::regclass
      AND conname = 'ar_status_canonical'
  ) THEN
    ALTER TABLE accounts_receivable
      ADD CONSTRAINT ar_status_canonical
      CHECK (status IN ('PENDING', 'PARTIAL', 'PAID', 'CANCELLED'))
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'accounts_receivable'::regclass
      AND conname = 'ar_has_source'
  ) THEN
    ALTER TABLE accounts_receivable
      ADD CONSTRAINT ar_has_source
      CHECK (sale_id IS NOT NULL OR order_id IS NOT NULL)
      NOT VALID;
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_ar_sale
  ON accounts_receivable(sale_id)
  WHERE sale_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_ar_order
  ON accounts_receivable(order_id)
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ar_store_due_pending
  ON accounts_receivable(store_id, due_date)
  WHERE remaining_amount > 0;

CREATE INDEX IF NOT EXISTS idx_ar_client_pending
  ON accounts_receivable(client_id, due_date)
  WHERE remaining_amount > 0;

UPDATE accounts_payable
SET status = CASE upper(coalesce(status, ''))
  WHEN 'ACTIVE' THEN 'PENDING'
  WHEN 'PAID_IN_FULL' THEN 'PAID'
  WHEN '' THEN 'PENDING'
  ELSE upper(status)
END;

ALTER TABLE accounts_payable
  ALTER COLUMN status SET DEFAULT 'PENDING';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'accounts_payable'::regclass
      AND conname = 'ap_status_canonical'
  ) THEN
    ALTER TABLE accounts_payable
      ADD CONSTRAINT ap_status_canonical
      CHECK (status IN ('PENDING', 'PARTIAL', 'PAID', 'CANCELLED'))
      NOT VALID;
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_accounts_payable_invoice
  ON accounts_payable(invoice_id)
  WHERE invoice_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_invoice_supplier_number
  ON invoices(store_id, supplier_id, lower(btrim(invoice_number)))
  WHERE invoice_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_store_created
  ON invoices(store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_accounts_payable_store_due_pending
  ON accounts_payable(store_id, due_date)
  WHERE remaining_amount > 0;

CREATE TABLE IF NOT EXISTS supplier_credit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id),
  supplier_id uuid NOT NULL REFERENCES suppliers(id),
  invoice_id uuid NOT NULL REFERENCES invoices(id),
  account_payable_id uuid NOT NULL REFERENCES accounts_payable(id),
  credit_note_number varchar(80) NOT NULL,
  issue_date date NOT NULL DEFAULT current_date,
  total_amount numeric(14,2) NOT NULL,
  applied_amount numeric(14,2) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'APPLIED',
  reason text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT supplier_credit_note_amount_valid
    CHECK (
      total_amount > 0
      AND applied_amount >= 0
      AND applied_amount <= total_amount
    ),
  CONSTRAINT supplier_credit_note_status_valid
    CHECK (status IN ('DRAFT', 'POSTED', 'APPLIED', 'CANCELLED'))
);

CREATE TABLE IF NOT EXISTS supplier_credit_note_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_id uuid NOT NULL
    REFERENCES supplier_credit_notes(id) ON DELETE RESTRICT,
  invoice_item_id uuid NOT NULL REFERENCES invoice_items(id),
  product_id uuid NOT NULL REFERENCES products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_cost numeric(14,2) NOT NULL CHECK (unit_cost >= 0),
  subtotal numeric(14,2) NOT NULL CHECK (subtotal >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payable_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_payable_id uuid NOT NULL REFERENCES accounts_payable(id),
  source_type varchar(30) NOT NULL,
  source_id uuid NOT NULL,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payable_adjustment_source_valid
    CHECK (source_type IN ('SUPPLIER_CREDIT_NOTE'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_supplier_credit_note_number
  ON supplier_credit_notes(
    store_id,
    supplier_id,
    lower(btrim(credit_note_number))
  );

CREATE INDEX IF NOT EXISTS idx_supplier_credit_note_invoice
  ON supplier_credit_notes(invoice_id);

CREATE INDEX IF NOT EXISTS idx_supplier_credit_note_payable_status
  ON supplier_credit_notes(account_payable_id, status);

CREATE INDEX IF NOT EXISTS idx_supplier_credit_note_item_invoice_item
  ON supplier_credit_note_items(invoice_item_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payable_adjustment_source
  ON payable_adjustments(account_payable_id, source_type, source_id);
