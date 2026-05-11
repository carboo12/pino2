# PLAN MAESTRO DE IMPLEMENTACIÓN — PINO2
**Generado:** 4 Mayo 2026  
**Alcance:** Web + Backend + Flutter — Análisis archivo por archivo

---

## INVENTARIO DEL SISTEMA

| Capa | Cantidad | Estado General |
|---|---|---|
| Backend NestJS modules | 38 módulos | 90% funcional, falta lógica de negocio en cash-shifts y arqueos |
| Web React pages | ~60 páginas | 85% UI hecha, faltan validaciones y campos de negocio |
| Flutter features | 14 features | 75% funcional, falta paridad con web en clientes/inventario |
| Tablas BD (PostgreSQL) | 52+ tablas | Falta `bulk_price_1..5`, `denomination_detail`, roles nuevos |

---

## DATOS SIMULADOS ENCONTRADOS (URGENTE ELIMINAR)

| Archivo | Línea | Problema |
|---|---|---|
| [arqueos-page.tsx](file:///d:/pino/sistema_final/web/src/pages/store-admin/finance/arqueos-page.tsx#L55) | 55 | `Math.random() * 50000` — monto esperado inventado |
| [sidebar.tsx](file:///d:/pino/sistema_final/web/src/components/ui/sidebar.tsx#L654) | 654 | `Math.random()` en skeleton width |
| [inventory-movements-page.tsx](file:///d:/pino/sistema_final/web/src/pages/store-admin/inventory/inventory-movements-page.tsx#L69) | 69 | `Math.random()` como fallback de ID |

---

## FASE 1 — FIXES RÁPIDOS (30 min total)

### T1: Quitar "T" del inventario
- **Archivo:** [products-page.tsx L243](file:///d:/pino/sistema_final/web/src/pages/store-admin/products/products-page.tsx#L243)
- **Cambio:** `{product.currentStock} T` → `{product.currentStock}`
- **Esfuerzo:** 2 min

### T2: Habilitar edición de barcode
- **Archivo:** [edit-product-page.tsx L284-293](file:///d:/pino/sistema_final/web/src/pages/store-admin/products/edit-product-page.tsx#L284)
- **Cambio:** Quitar `disabled` del input barcode
- **Esfuerzo:** 5 min

### T3: Eliminar Math.random() del arqueo
- **Archivo:** [arqueos-page.tsx L55](file:///d:/pino/sistema_final/web/src/pages/store-admin/finance/arqueos-page.tsx#L55)
- **Cambio:** Llamar `GET /cash-shifts/active?storeId=X` o endpoint real para monto esperado
- **Esfuerzo:** 15 min

### T4: Eliminar Math.random() en inventory-movements
- **Archivo:** [inventory-movements-page.tsx L69](file:///d:/pino/sistema_final/web/src/pages/store-admin/inventory/inventory-movements-page.tsx#L69)
- **Cambio:** Usar `m.id || crypto.randomUUID()`
- **Esfuerzo:** 2 min

---

## FASE 2 — CAJA REGISTRADORA (1-2 sesiones)

### T5: Validar cajero = dueño del turno
**Backend:**
- [cash-shifts.service.ts L52-58](file:///d:/pino/sistema_final/backend/src/modules/cash-shifts/cash-shifts.service.ts#L52): `openShift` → permitir múltiples turnos (uno por cajero) o validar `opened_by`
- [cash-shifts.service.ts L95-98](file:///d:/pino/sistema_final/backend/src/modules/cash-shifts/cash-shifts.service.ts#L95): `closeShift` → agregar `AND opened_by = $userId`
- [cash-shifts.service.ts L114-123](file:///d:/pino/sistema_final/backend/src/modules/cash-shifts/cash-shifts.service.ts#L114): `getActiveShift` → filtrar por `userId`

**Frontend:**
- [cash-register-page.tsx](file:///d:/pino/sistema_final/web/src/pages/store-admin/cash-register/cash-register-page.tsx): Pasar `userId` en GET active shift

### T6: Arqueo por denominaciones en apertura/cierre
**BD:** Agregar `opening_denominations JSONB, closing_denominations JSONB` a tabla `cash_shifts`

**Backend:**
- [cash-shifts.service.ts](file:///d:/pino/sistema_final/backend/src/modules/cash-shifts/cash-shifts.service.ts): Aceptar `denominations` en openShift y closeShift

**Frontend:**
- [cash-register-page.tsx](file:///d:/pino/sistema_final/web/src/pages/store-admin/cash-register/cash-register-page.tsx): Agregar grid denominaciones (B.1000, B.500, B.200, B.100, B.50, Monedas) en diálogos de apertura y cierre
- Reusar lógica de [arqueos-page.tsx L121-158](file:///d:/pino/sistema_final/web/src/pages/store-admin/finance/arqueos-page.tsx#L121) como componente compartido `DenominationGrid`

---

## FASE 3 — PRECIOS Y PRODUCTOS (2-3 sesiones)

### T7: Agregar precios por bulto (bulk_price_1..5)
**BD (migración SQL):**
```sql
ALTER TABLE products
ADD COLUMN bulk_price_1 NUMERIC(12,2) DEFAULT 0,
ADD COLUMN bulk_price_2 NUMERIC(12,2) DEFAULT 0,
ADD COLUMN bulk_price_3 NUMERIC(12,2) DEFAULT 0,
ADD COLUMN bulk_price_4 NUMERIC(12,2) DEFAULT 0,
ADD COLUMN bulk_price_5 NUMERIC(12,2) DEFAULT 0;
```

**Backend:**
- `backend/src/modules/products/products.service.ts` — UPDATE queries para incluir `bulk_price_1..5`
- `backend/src/modules/products/products.dto.ts` — Agregar campos DTO

**Frontend:**
- [add-product-page.tsx](file:///d:/pino/sistema_final/web/src/pages/store-admin/products/add-product-page.tsx): Agregar sección "Precios por Bulto" debajo de precios por unidad
- [edit-product-page.tsx](file:///d:/pino/sistema_final/web/src/pages/store-admin/products/edit-product-page.tsx): Igual
- POS/billing: Opción de vender por unidad o por bulto

**Flutter:**
- `features/catalog/presentation/screens/product_catalog_screen.dart` — Mostrar precios bulto
- `features/orders/presentation/screens/quick_order_screen.dart` — Selección unidad/bulto

---

## FASE 4 — CLIENTES Y PROVEEDORES (1-2 sesiones)

### T8: Gestión completa de clientes
**Frontend:**
- [vendor-clients-page.tsx](file:///d:/pino/sistema_final/web/src/pages/store-admin/vendors/vendor-clients-page.tsx): Agregar columnas `Límite Crédito`, `Días Crédito`, botón "Editar"
- Crear `EditClientDialog` o `edit-client-page.tsx` con campos: `limiteCredito`, `diasCredito`, `frecuenciaVisita`, `diaVisita`, `notasEntrega`, `lat`, `lng`

**Backend:** Ya tiene `PATCH /clients/:id` con todos los campos — OK ✅

**Flutter:**
- `features/clients/presentation/screens/client_portfolio_screen.dart` — Agregar vista de crédito y edición

### T9: Link directo "Facturas Proveedor" en menú
- [app-layout.tsx L205-209](file:///d:/pino/sistema_final/web/src/components/app-layout.tsx#L205): Ya existe dentro del grupo Inventario cuando `enableSupplierManagement = true` — **VERIFICAR** que el setting esté activado en las tiendas. Si no, es un problema de configuración, no de código.

### T10: Reporte de inventario valorizado
**Frontend:** Crear `inventory-valuation-page.tsx` en `web/src/pages/store-admin/reports/`
- Tabla: Producto | Stock | Costo Unit | Valor C$ | Valor US$ (usando tasa de cambio)
- Exportar a Excel
- Ruta: `/store/:storeId/reports/inventory-valuation`

**Backend:** Crear endpoint `GET /products/valuation?storeId=X` que retorne stock × costo

---

## FASE 5 — ROLES Y PERMISOS (3-4 sesiones)

### T11: Agregar roles faltantes al sistema

**Web [user-role.ts](file:///d:/pino/sistema_final/web/src/lib/user-role.ts):**
Agregar al type y switch:
- `auxiliar` → mapear desde 'auxiliar', 'auxiliar-administrativo'
- `supervisor-caja` → mapear desde 'supervisor-caja', 'supervisor-de-caja'
- `supervisor-pasillo` → mapear desde 'supervisor-pasillo', 'supervisor-de-pasillo'

**Flutter [role_utils.dart](file:///d:/pino/sistema_final/flutter/lib/core/utils/role_utils.dart):**
Agregar al enum y switch los mismos 3 roles

**Backend:**
- `backend/src/modules/users/` — Aceptar los nuevos roles en creación/edición

### T12: Menú condicional por store_type
- [app-layout.tsx](file:///d:/pino/sistema_final/web/src/components/app-layout.tsx): Leer `store_type` del store y condicionar:
  - Supermercado: Ocultar CxC, Mostrar Supervisor Caja/Pasillo
  - Distribuidora: Mostrar CxC, Despacho, Ruteros
  - Bodega: Mostrar Bodeguero, Rutero, Preventista

### T13: Menú y acciones por rol en Flutter
- [home_screen.dart L555-800](file:///d:/pino/sistema_final/flutter/lib/features/home/presentation/screens/home_screen.dart#L555): `_actionsForRole` ya existe y es robusta. Agregar los 3 nuevos roles al switch.

### T14: Dashboards diferenciados por rol de bodega
- `warehouse-dashboard-page.tsx` — Crear vistas condicionales según rol:
  - Bodeguero: Pedidos por alistar, stock bajo
  - Auxiliar: Tareas del día
  - Gerente: KPIs y eficiencia

---

## FASE 6 — PARIDAD FLUTTER ↔ WEB

### T15: Flutter — Falta gestión de clientes completa
- `features/clients/` — Tiene `client_portfolio_screen.dart` pero falta:
  - Edición de cliente (límite crédito, días crédito)
  - Crear cliente desde app (existe `preventa_add_client_screen.dart` pero solo para preventa)

### T16: Flutter — Falta arqueo por denominaciones
- No existe pantalla de arqueo en Flutter
- Crear `features/daily_closing/presentation/screens/denomination_input_screen.dart`

### T17: Flutter — Falta catálogo con precios por bulto
- `features/catalog/` — Actualmente solo muestra precios unitarios
- Agregar cuando T7 esté listo (depende de backend)

### T18: Flutter — Falta inventario valorizado
- No existe reporte. El Flutter es para operarios de campo, no para gerentes con reportes bancarios.
- **Decisión:** ¿Se necesita en móvil? Probablemente NO. Solo web.

---

## ANÁLISIS ARCHIVO POR ARCHIVO — PROBLEMAS ESPECÍFICOS

### BACKEND (38 módulos)

| Módulo | Archivos | Estado | Problema |
|---|---|---|---|
| auth | 3 | ✅ OK | — |
| products | 4 | ⚠️ | Falta bulk_price_1..5 |
| product-barcodes | 3 | ✅ OK | — |
| cash-shifts | 3 | 🔴 | No valida opened_by en close, no almacena denominaciones |
| clients | 4 | ✅ OK | Backend completo, frontend incompleto |
| suppliers | 4 | ✅ OK | — |
| invoices | 3 | ✅ OK | — |
| sales | 3 | ✅ OK | — |
| orders | 3 | ✅ OK | — |
| inventory | 3 | ✅ OK | — |
| accounts-receivable | 3 | ✅ OK | — |
| accounts-payable | 3 | ✅ OK | — |
| arqueos | 3 | ⚠️ | Existe módulo pero frontend usa Math.random |
| collections | 3 | ✅ OK | — |
| daily-closings | 3 | ✅ OK | — |
| routes | 3 | ✅ OK | — |
| users | 3 | ⚠️ | No tiene roles auxiliar/supervisor |
| stores | 3 | ✅ OK | store_type existe pero no se usa para filtrar |
| departments | 3 | ✅ OK | — |
| chains | 3 | ✅ OK | — |
| config | 3 | ⚠️ | Falta campo tasa de cambio USD/NIO |
| zones/store-zones | 4 | ✅ OK | — |
| vendor-inventories | 3 | ✅ OK | — |
| grupos-clientes | 3 | ✅ OK | — |
| grupos-economicos | 3 | ✅ OK | — |
| cargas-camion | 3 | ✅ OK | — |
| liquidaciones-ruta | 3 | ✅ OK | — |
| pending-deliveries | 3 | ✅ OK | — |
| pending-orders | 3 | ✅ OK | — |
| returns | 3 | ✅ OK | — |
| visit-logs | 3 | ✅ OK | — |
| notifications | 3 | ✅ OK | — |
| sync | 3 | ✅ OK | — |
| authorizations | 3 | ✅ OK | — |
| licenses | 3 | ✅ OK | — |
| errors | 2 | ✅ OK | — |
| health | 2 | ✅ OK | — |

### WEB FRONTEND — ÁREAS PROBLEMÁTICAS

| Página | Tamaño | Estado | Problema Específico |
|---|---|---|---|
| cash-register-page.tsx | 17.9KB | 🔴 | Sin denominaciones, sin validación de cajero |
| arqueos-page.tsx | 10.2KB | 🔴 | Math.random() en monto esperado |
| products-page.tsx | 18.8KB | ⚠️ | "T" en stock badge |
| add-product-page.tsx | 23.6KB | ⚠️ | Falta bulkPrice1..5 |
| edit-product-page.tsx | 17.2KB | ⚠️ | Barcode disabled, falta bulkPrice1..5 |
| vendor-clients-page.tsx | 8.7KB | ⚠️ | Falta columnas crédito y edición |
| reports-page.tsx | 7.6KB | ⚠️ | Solo ventas, falta inventario valorizado |
| app-layout.tsx | 32.8KB | ⚠️ | No filtra por store_type |
| user-role.ts | 1.7KB | ⚠️ | Faltan 3 roles |
| Todas las demás | — | ✅ OK | Funcionales |

### FLUTTER — ANÁLISIS POR FEATURE

| Feature | Pantallas | Estado | Problema |
|---|---|---|---|
| auth | login, splash | ✅ OK | — |
| home | home_screen (1350 líneas) | ✅ OK | Robusta, roles bien mapeados |
| catalog | product_catalog_screen | ⚠️ | Sin precios bulto |
| clients | client_portfolio_screen | ⚠️ | Sin edición de crédito |
| collections | collections_screen | ✅ OK | — |
| deliveries | route_board, delivery_detail | ✅ OK | — |
| orders | quick_order_screen | ✅ OK | — |
| preventa | 4 pantallas (route, order, clients, add_client) | ✅ OK | — |
| returns | returns_screen, route_returns | ✅ OK | — |
| warehouse | board, picking, carga_camion, adjustment | ✅ OK | — |
| daily_closing | daily_closing_screen | ⚠️ | Sin denominaciones |
| vendor_inventory | vendor_inventory_screen | ✅ OK | — |
| sales_history | sales_history_screen | ✅ OK | — |
| startup | splash_screen | ✅ OK | — |
| core/config | app_config.dart | ✅ OK | URL prod configurada |
| core/network | api_client.dart | ✅ OK | Dio bien configurado |
| core/utils | role_utils.dart | ⚠️ | Faltan 3 roles nuevos |

---

## RESUMEN DE TRABAJO PENDIENTE

| Fase | Tareas | Tiempo Estimado | Prioridad |
|---|---|---|---|
| 1 — Fixes rápidos | T1, T2, T3, T4 | 30 min | 🔴 Hacer ya |
| 2 — Caja | T5, T6 | 1-2 sesiones | 🔴 Crítico |
| 3 — Precios bulto | T7 | 2-3 sesiones | 🔴 Crítico |
| 4 — Clientes/Proveedores | T8, T9, T10 | 1-2 sesiones | 🟠 Importante |
| 5 — Roles | T11, T12, T13, T14 | 3-4 sesiones | 🟡 Planificar |
| 6 — Paridad Flutter | T15, T16, T17 | 2-3 sesiones | 🟡 Después de web |

**TOTAL ESTIMADO:** 10-15 sesiones para llegar al 100%

---

## ¿QUÉ ESTÁ BIEN Y NO HAY QUE TOCAR?

- ✅ Auth (login, JWT, Firebase, session) — Sólido en web, backend y Flutter
- ✅ POS / Facturación — Funcional
- ✅ Proveedores y facturas — Backend completo
- ✅ Despacho y rutas — Completo
- ✅ Cobros y CxC/CxP — Funcional
- ✅ Bodega y warehouse — Web y Flutter OK
- ✅ Sincronización offline (Flutter) — Drift + sync queue
- ✅ WebSocket realtime — Conectado y operativo
- ✅ Master admin / Chain admin — Completo
- ✅ Grupos económicos y de clientes — Backend y frontend OK
- ✅ Preventa (Flutter exclusivo) — 4 pantallas completas
