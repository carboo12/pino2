# 🗄️ AUDITORÍA BASE DE DATOS — PostgreSQL 16

## Conexión Producción

| Campo | Valor |
|-------|-------|
| Host | `190.56.16.85` |
| Puerto | `5432` |
| Base de Datos | `multitienda_db` |
| Schema | `public` |
| Tablas | 43+ |

## Migraciones SQL — 7 Archivos

| Migración | Fecha | Contenido | Estado |
|-----------|-------|-----------|--------|
| `002_vendor_modules.sql` | Pre-abril | Módulos de vendedores, inventarios, visitas | ✅ Existe |
| `2026-04-20_distribucion.sql` | 20 Abr | Distribución, rutas, cargas, liquidaciones | ✅ Existe |
| `2026-04-21_barcode_refactor.sql` | 21 Abr | Refactor de barcodes | ✅ Existe |
| `2026-04-30_product_barcodes_create.sql` | 30 Abr | Tabla product_barcodes | ✅ Existe |
| `2026-04-30_sync_idempotency_log.sql` | 30 Abr | Log de idempotencia sync | ✅ Existe |
| `2026-05-04_ensure_operational.sql` | 4 May | Denominaciones cash_shifts + campos operativos | ✅ Existe |
| `2026-05-10_bulk_prices.sql` | 10 May | Precios por bulto bulk_price_1..5 | ✅ Existe |

### Runner: `run_all_migrations.js`
Ejecuta todas las migraciones en orden, usando tabla `migration_history` para idempotencia.

## Detalle: 2026-05-04_ensure_operational.sql

Líneas 76-80 — Denominaciones en cash_shifts:
```sql
IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'cash_shifts' AND column_name = 'opening_denominations') THEN
    ALTER TABLE cash_shifts ADD COLUMN opening_denominations JSONB;
END IF;
IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'cash_shifts' AND column_name = 'closing_denominations') THEN
    ALTER TABLE cash_shifts ADD COLUMN closing_denominations JSONB;
END IF;
```

## Detalle: 2026-05-10_bulk_prices.sql

```sql
IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'products' AND column_name = 'bulk_price_1') THEN
    ALTER TABLE products ADD COLUMN bulk_price_1 DECIMAL(12,2) DEFAULT 0;
END IF;
-- Repite para bulk_price_2, bulk_price_3, bulk_price_4, bulk_price_5
```

## Agrupación Funcional de Tablas

| Grupo | Tablas Principales |
|-------|-------------------|
| Seguridad | users, user_stores, auth_tokens, roles, permissions, migration_history |
| Catálogo | products, departments, product_barcodes, suppliers |
| Caja/Ventas | sales, sale_items, cash_shifts |
| Pedidos/Entrega | orders, order_items, pending_orders, pending_deliveries, cargas_camion, routes, delivery_logs |
| Ruta Comercial | clients, grupos_clientes, grupos_economicos, visit_logs, vendor_inventories |
| Finanzas | accounts_receivable, accounts_payable, collections, invoices, invoice_items, daily_closings, arqueos |
| Compras/Devoluciones | returns, return_items, liquidaciones_ruta, authorizations |
| Operación | stores, chains, zones, store_zones, notifications, sync_idempotency_log |
| Profiling | consultasql, consultasql_historial (umbral 200ms) |

## ⚠️ PENDIENTE: Verificar ejecución en producción

Las migraciones existen en código pero **no hay certeza** de que se ejecutaron en el servidor de producción.

### Comando de verificación:
```bash
psql -h 190.56.16.85 -U postgres -d multitienda_db -c "
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'products' AND column_name LIKE 'bulk%'
ORDER BY column_name;

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'cash_shifts' AND column_name LIKE '%denominations'
ORDER BY column_name;

SELECT * FROM migration_history ORDER BY executed_at;
"
```

### Si las columnas NO existen:
```bash
cd sistema_final/backend
node migrations/run_all_migrations.js
```

## Conclusión

✅ Estructura de migraciones completa y bien organizada con idempotencia (`IF NOT EXISTS`).
⚠️ Requiere verificación manual de que las migraciones recientes se ejecutaron en producción.
