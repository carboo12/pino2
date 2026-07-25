-- Retention Policy for Operational Tables
-- Run via: PGPASSWORD=xxx psql -h 127.0.0.1 -U pino_app -d multitienda_db -f migrations/2026-07-25_retention_policy.sql

-- Sync outbox: mantener 7 días, limpiar eventos publicados
DELETE FROM sync_outbox WHERE published_at IS NOT NULL AND published_at < NOW() - INTERVAL '7 days';

-- Sync inbox: mantener 30 días
DELETE FROM sync_inbox WHERE processed_at IS NOT NULL AND processed_at < NOW() - INTERVAL '30 days';

-- Outbox events: mantener 7 días después de procesados
DELETE FROM outbox_events WHERE status = 'processed' AND processed_at IS NOT NULL AND processed_at < NOW() - INTERVAL '7 days';

-- Consultas lentas: mantener 90 días
DELETE FROM consultasql_historial WHERE created_at < NOW() - INTERVAL '90 days';

-- Error logs: mantener 90 días
DELETE FROM error_logs WHERE created_at < NOW() - INTERVAL '90 days';

-- Sync logs: mantener 30 días
DELETE FROM sync_logs WHERE created_at < NOW() - INTERVAL '30 days';

-- Sync status: mantener registro de la última semana solamente
DELETE FROM sync_status WHERE last_sync < NOW() - INTERVAL '7 days';

-- Notifications: mantener 60 días
DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '60 days';

-- Order status history: mantener 1 año (auditoría)
DELETE FROM order_status_history WHERE created_at < NOW() - INTERVAL '365 days';

-- Schema migrations ledger: solo mantener el registro (NUNCA borrar)
-- Esta tabla es muy pequeña, no necesita limpieza.

-- Create a function for automated cleanup (run via pg_cron or scheduled task)
CREATE OR REPLACE FUNCTION cleanup_retention_policy()
RETURNS void AS $$
BEGIN
  DELETE FROM sync_outbox WHERE published_at IS NOT NULL AND published_at < NOW() - INTERVAL '7 days';
  DELETE FROM sync_inbox WHERE processed_at IS NOT NULL AND processed_at < NOW() - INTERVAL '30 days';
  DELETE FROM outbox_events WHERE status = 'processed' AND processed_at IS NOT NULL AND processed_at < NOW() - INTERVAL '7 days';
  DELETE FROM consultasql_historial WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM error_logs WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM sync_logs WHERE created_at < NOW() - INTERVAL '30 days';
  DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '60 days';
  DELETE FROM order_status_history WHERE created_at < NOW() - INTERVAL '365 days';
END;
$$ LANGUAGE plpgsql;
