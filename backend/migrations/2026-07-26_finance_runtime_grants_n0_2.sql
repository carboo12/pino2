BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pino_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE
      ON TABLE
        supplier_credit_notes,
        supplier_credit_note_items,
        payable_adjustments
      TO pino_app;
  END IF;
END
$$;

COMMIT;
