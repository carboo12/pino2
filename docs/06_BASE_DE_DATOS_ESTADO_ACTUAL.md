# Base De Datos: Estado Actual

Fecha de snapshot: 2026-04-01

## 1. Motor y ubicacion

Estado actual:

- motor: PostgreSQL 16
- contenedor Docker: `postgres_alacaja`
- host logico para el backend: `127.0.0.1`
- puerto: `5432`
- base: `multitienda_db`
- usuario configurado en `.env.example`: `alacaja`

Nota:

- la clave no se documenta aqui
- la configuracion base esta en `backend/.env.example`

## 2. Fuente estructural

DDL base del repo:

- `backend/src/database/schema.sql`

Pero la fuente real de runtime es:

- la BD viva `multitienda_db`

Eso importa porque la BD viva ya incluye tablas operativas adicionales que no nacen solo del DDL base.

## 3. Conteo total de tablas

Snapshot real:

- tablas en esquema `public`: **43**

## 4. Tablas actuales por nombre

Listado real en la BD al 2026-04-01:

- `account_payments`
- `accounts_payable`
- `accounts_receivable`
- `authorizations`
- `cash_shifts`
- `chains`
- `clients`
- `collections`
- `config`
- `consultasql`
- `consultasql_historial`
- `daily_closings`
- `departments`
- `error_logs`
- `expenses`
- `inventory_adjustments`
- `invoice_items`
- `invoices`
- `licenses`
- `movements`
- `notifications`
- `order_items`
- `orders`
- `payable_payments`
- `pending_deliveries`
- `pending_orders`
- `products`
- `return_items`
- `returns`
- `routes`
- `sale_items`
- `sales`
- `store_zones`
- `stores`
- `sub_zones`
- `suppliers`
- `sync_logs`
- `user_stores`
- `users`
- `vendor_inventories`
- `vendor_routes`
- `visit_logs`
- `zones`

## 5. Snapshot de volumen actual

Conteos reales tomados al 2026-04-01:

| Tabla | Registros |
|---|---:|
| `users` | 10 |
| `stores` | 3 |
| `products` | 5 |
| `clients` | 2 |
| `orders` | 0 |
| `sales` | 0 |
| `suppliers` | 0 |
| `invoices` | 0 |
| `accounts_receivable` | 0 |
| `accounts_payable` | 0 |
| `collections` | 0 |
| `routes` | 0 |
| `visit_logs` | 1 |
| `sync_logs` | 1 |

Este corte refleja una base con estructura ya madura, pero con poca carga operativa de negocio.

## 6. Agrupacion funcional de tablas

### 6.1 Contexto y seguridad

- `chains`
- `stores`
- `users`
- `user_stores`
- `licenses`
- `config`

### 6.2 Catalogo y stock

- `departments`
- `products`
- `movements`
- `inventory_adjustments`

### 6.3 Caja y ventas

- `cash_shifts`
- `sales`
- `sale_items`

### 6.4 Clientes, pedidos y entrega

- `clients`
- `orders`
- `order_items`
- `pending_orders`
- `pending_deliveries`
- `routes`
- `vendor_routes`

### 6.5 Ruta comercial y vendedores

- `store_zones`
- `zones`
- `sub_zones`
- `visit_logs`
- `vendor_inventories`

### 6.6 Finanzas

- `accounts_receivable`
- `account_payments`
- `collections`
- `accounts_payable`
- `payable_payments`
- `daily_closings`
- `expenses`

### 6.7 Compras y devoluciones

- `suppliers`
- `invoices`
- `invoice_items`
- `returns`
- `return_items`

### 6.8 Operacion y soporte

- `authorizations`
- `notifications`
- `sync_logs`
- `error_logs`
- `consultasql`
- `consultasql_historial`

## 7. Hallazgos importantes para IA y mantenimiento

### 7.1 `vendor_routes` existe, pero el backend activo usa `routes`

Esto es clave:

- la tabla `vendor_routes` existe en la BD
- pero el backend y el frontend actual operan sobre `routes`

No asumir que ambas estan activas por igual.

### 7.2 Existe slow query profiling optativo

Tablas:

- `consultasql`
- `consultasql_historial`

Regla actual:

- si `consultasql.activo = true`
- y la consulta supera `umbral_ms`
- `DatabaseService` guarda el evento en `consultasql_historial`

Valor base esperado:

- `umbral_ms = 200`

### 7.3 La BD viva tiene mas cosas que el modelo minimo inicial

Ejemplos:

- `consultasql`
- `consultasql_historial`
- `expenses`
- `inventory_adjustments`
- `vendor_routes`

Por eso:

- no tomar solo `schema.sql` como foto completa del runtime
- combinar `schema.sql` + servicios + BD real

## 8. Archivos que mandan sobre la BD

Primero:

- `backend/src/database/database.service.ts`
- `backend/src/database/schema.sql`

Despues:

- servicios por dominio dentro de `backend/src/modules/`

## 10. Estandarización Canónica de Empaque (25 Julio 2026)

Migraciones aplicadas en producción (`190.56.16.85:5432/multitienda_db`):

1. **Tabla `products`**:
   - `handles_bulk` (`boolean NOT NULL DEFAULT false`): Control de empaque por bulto.
   - `units_per_bulk` (`integer NOT NULL DEFAULT 1`): Unidades por empaque.
   - `stock_bulks` (`integer GENERATED ALWAYS AS (CASE WHEN units_per_bulk > 1 THEN current_stock / units_per_bulk ELSE 0 END) STORED`): Columna calculada.
   - `stock_units` (`integer GENERATED ALWAYS AS (CASE WHEN units_per_bulk > 1 THEN current_stock % units_per_bulk ELSE current_stock END) STORED`): Columna calculada.
   - Constraint `products_packaging_valid`: `CHECK ((handles_bulk = true AND units_per_bulk >= 2) OR (handles_bulk = false AND units_per_bulk = 1))`.

2. **Snapshots de Auditoría y Kárdex**:
   - `order_items`, `sale_items`, `movements`: Incluyen `handles_bulk_snapshot` y `units_per_bulk_snapshot`.

3. **Índices de Rendimiento**:
   - `idx_order_items_product_units`: Indexa `(product_id, units_per_bulk_snapshot)` en ítems de orden.
   - `idx_sale_items_product_units`: Indexa `(product_id, units_per_bulk_snapshot)` en ítems de venta.
   - `idx_inventory_movements_perf`: Indexa `(store_id, product_id, created_at DESC)`.
   - `idx_outbox_pending_perf`: Indexa `(published_at) WHERE published_at IS NULL`.
   - `idx_general_ledger_store_date`: Indexa `(store_id, entry_date DESC)`.

