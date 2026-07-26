-- P0: cerrar la migración financiera una vez normalizados los datos históricos.
-- VALIDATE CONSTRAINT comprueba las filas existentes; las filas nuevas ya estaban
-- protegidas desde que se crearon las restricciones NOT VALID.

ALTER TABLE accounts_receivable
  VALIDATE CONSTRAINT ar_credit_days_nonnegative;

ALTER TABLE accounts_receivable
  VALIDATE CONSTRAINT ar_credit_note_amount_valid;

ALTER TABLE accounts_receivable
  VALIDATE CONSTRAINT ar_status_canonical;

ALTER TABLE accounts_receivable
  VALIDATE CONSTRAINT ar_has_source;

ALTER TABLE accounts_payable
  VALIDATE CONSTRAINT ap_status_canonical;
