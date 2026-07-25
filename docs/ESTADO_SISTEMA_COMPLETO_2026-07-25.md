# ESTADO COMPLETO DEL SISTEMA PINO2
## Fecha: 2026-07-25
## Propósito: Documentación para análisis por otro modelo de IA

---

## 1. DATOS GENERALES

| Campo | Valor |
|-------|-------|
| Proyecto | Pino2 - Sistema de Distribución |
| Repositorio | `git@github.com:galz35/pino2.git` |
| Rama principal | `main` |
| Último commit | `c9e9170` Gap analysis: 11 tablas nuevas + docs |
| API URL | `http://190.56.16.85:3035` |
| API Health | `healthy v1.0.0-mvp` |
| Base de datos | PostgreSQL 16 en Docker |
| DB Host | `190.56.16.85:5432` |
| DB Name | `multitienda_db` |
| DB User app | `pino_app` |
| DB User admin | `alacaja` |
| Node.js | 20.20.1 |
| NestJS | 11.x |
| React | 19.x |
| Flutter | No instalado (pendiente otra máquina) |

---

## 2. ARQUITECTURA

```
┌─────────────────────────────────────────────────────┐
│                   CLIENTES                           │
│  ┌─────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ React   │  │ Flutter  │  │ API endpoints     │   │
│  │ (Web)   │  │ (Mobile) │  │ (curl/Postman)    │   │
│  └────┬────┘  └────┬─────┘  └────────┬─────────┘   │
│       │            │                 │              │
├───────┴────────────┴─────────────────┴──────────────┤
│              NGINX / API GATEWAY                     │
├─────────────────────────────────────────────────────┤
│              BACKEND NESTJS (39 módulos)              │
│  ┌──────────────────────────────────────────────┐   │
│  │  Auth │ Products │ Orders │ Sales │ Inventory│   │
│  │  Cash │ Clients  │ Routes │ Sync  │ Reports  │   │
│  │  +29 módulos más                             │   │
│  └──────────────────────────────────────────────┘   │
│              OUTBOX WORKER (cada 5s)                  │
├─────────────────────────────────────────────────────┤
│              POSTGRESQL 16 (74 tablas)               │
│  ┌──────────────────────────────────────────────┐   │
│  │  products(116) │ orders │ sales │ clients     │   │
│  │  sync_inbox/outbox │ movements │ ledger       │   │
│  │  +66 tablas más                               │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 3. MÓDULOS DEL BACKEND (39)

### 3.1 Módulos Implementados

| Módulo | Endpoints | Estado | Tests |
|--------|-----------|--------|-------|
| auth | login, refresh, logout, profile | ✅ | 6 |
| products | CRUD + barcode + bulk/unit | ✅ | 7 |
| orders | CRUD + status transitions + version | ✅ | 8 |
| sales | process + return | ✅ | 7 |
| inventory | adjustments + movements + transfers | ✅ | 4 |
| cash-shifts | open + close + active | ✅ | 4 |
| clients | CRUD + grupos + reassign | ✅ | 3 |
| collections | create + list | ✅ | 2 |
| returns | create + sale returns | ✅ | 2 |
| accounts-receivable | list + payments | ✅ | 2 |
| accounts-payable | list + payments | ✅ | 2 |
| sync-engine | push/pull/ack/status | ✅ | 3 |
| routes | CRUD + assign | ✅ | 2 |
| users | CRUD | ✅ | 2 |
| stores | CRUD | ✅ | 2 |
| suppliers | CRUD | ✅ | 2 |
| departments | CRUD | ✅ | 2 |
| product-barcodes | manage barcodes | ✅ | 1 |
| vendor-inventories | manage vendor stock | ✅ | 2 |
| pending-deliveries | assign + status | ✅ | 2 |
| cargas-camion | create + despachar | ✅ | 2 |
| notifications | register + list | ✅ | 1 |
| health | health check + version | ✅ | 1 |
| config | system settings | ✅ | 1 |
| chains | manage chains | ✅ | 2 |
| zones | manage zones | ✅ | 2 |
| store-zones | store zone mapping | ✅ | 1 |
| visit-logs | log visits | ✅ | 1 |
| licenses | manage licenses | ✅ | 1 |
| errors | log + list errors | ✅ | 1 |
| daily-closings | create + list | ✅ | 2 |
| arqueos | cash audits | ✅ | 1 |
| liquidaciones-ruta | route settlements | ✅ | 1 |
| grupos-economicos | economic groups | ✅ | 2 |
| grupos-clientes | client groups | ✅ | 1 |
| authorizations | price auth workflow | ✅ | 2 |
| authorizations/dto | auth DTOs | ✅ | - |

### 3.2 Módulos con Tablas pero sin API (GAPS)

| Módulo faltante | Tablas creadas | Escenarios afectados |
|----------------|----------------|---------------------|
| purchase-orders | purchase_orders, purchase_order_items | PV-001 a PV-006 |
| promotions | promotions, promotion_products | PR-001 a PR-010 |
| vehicles | vehicles, vehicle_maintenance, vehicle_fuel_log, vehicle_accidents | VH-001 a VH-006 |
| commissions | commission_rates, sales_commissions | E-020, CR-001 |
| contracts | client_contracts | LG-001, LG-005 |
| expenses API | expenses (existente) | C-015, VH-001 |

---

## 4. BASE DE DATOS (74 tablas)

### 4.1 Tablas Core (Operativas)

| Tabla | Registros | Propósito |
|-------|-----------|-----------|
| products | 116 | Catálogo de productos con bulto/unidad |
| users | 20 | Usuarios del sistema |
| stores | 3 | Tiendas/sucursales |
| clients | ~20+ | Clientes |
| orders | ~30 | Pedidos |
| sales | ~200+ | Ventas |
| sale_items | 224 | Items de venta (0 mismatches) |
| order_items | 14 | Items de pedido (0 mismatches) |
| cash_shifts | ~10 | Turnos de caja |
| movements | ~200+ | Movimientos de inventario (kardex) |

### 4.2 Tablas de Sincronización

| Tabla | Registros | Propósito |
|-------|-----------|-----------|
| sync_inbox | ~10 | Operaciones entrantes (claim idempotente) |
| sync_outbox | 153 (0 pendientes) | Eventos salientes |
| sync_nodes | 0 | Nodos EDGE/CLOUD registrados |
| sync_cursors | 0 | Cursores por nodo/tienda |
| inventory_ledger | 0 | Libro mayor de inventario |
| outbox_events | 153 (migrados, 0 pendientes) | Outbox legacy |

### 4.3 Tablas de Apoyo

| Tabla | Propósito |
|-------|-----------|
| schema_migrations | Control de migraciones aplicadas |
| departments | Departamentos de productos |
| suppliers | Proveedores |
| routes | Rutas de entrega |
| vendor_inventories | Inventario de vendedores/ruteros |
| pending_deliveries | Entregas pendientes |
| accounts_receivable | Cuentas por cobrar |
| accounts_payable | Cuentas por pagar |
| collections | Cobros registrados |
| returns | Devoluciones |
| expenses | Gastos |
| promotions | **NUEVA** - Promociones |
| promotions_products | **NUEVA** - Productos en promoción |
| vehicles | **NUEVA** - Flota de vehículos |
| vehicle_maintenance | **NUEVA** - Mantenimiento |
| vehicle_fuel_log | **NUEVA** - Control combustible |
| vehicle_accidents | **NUEVA** - Accidentes |
| purchase_orders | **NUEVA** - Órdenes de compra |
| purchase_order_items | **NUEVA** - Items de orden de compra |
| client_contracts | **NUEVA** - Contratos con clientes |
| commission_rates | **NUEVA** - Tasas de comisión |
| sales_commissions | **NUEVA** - Comisiones generadas |

### 4.4 Constraints y Calidad

| Indicador | Valor |
|-----------|-------|
| Constraints totales | 175+ |
| NOT VALID | 0 ✅ |
| stock_negativo | 0 ✅ |
| sale_items mismatches | 0 ✅ |
| order_items mismatches | 0 ✅ |
| products con GENERATED columns | stock_bulks, stock_units |
| products con handles_bulk | 116/116 asignados |

---

## 5. ESCENARIOS DOCUMENTADOS (382)

### 5.1 Por Categoría

| Categoría | Escenarios | Rol Principal | Cobertura |
|-----------|-----------|---------------|-----------|
| sales/ventas | 38 | Cajero | 32 escenarios + 6 agregados |
| preventa/ | 25 | Vendedor callejero | Pedidos offline, promociones, crédito en ruta |
| inventory/ | 40 | Bodeguero | Recepción, ajustes, picking, FIFO, mermas |
| orders/pedidos | 30 | Vendedor/Admin | Contado, crédito, transiciones, version, cancelación |
| cash/caja | 25 | Cajero | Apertura, cierre, diferencias, arqueo |
| clients/clientes | 22 | Administrador | Crédito, mora, grupos, reclamos |
| routes/rutas | 35 | Rutero | Entregas, devoluciones, accidentes, offline |
| despacho/ | 15 | Despachador | Asignación rutas, camiones, incidencias |
| cobranza/ | 15 | Cobrador | Cobros, abonos, quitas, cheques |
| supervision/ | 15 | Supervisor | Auditoría, quejas, capacitación |
| employees/ | 25 | RRHH/Gerente | Fraude, accidentes, renuncia |
| creditos/ | 10 | Administrador | Límites, refinanciación, castigo |
| precios/ | 10 | Administrador | Promociones, cambio masivo, guerra precios |
| proveedores/ | 6 | Administrador | Órdenes de compra, recepción |
| vehiculos/ | 6 | Despachador | Mantenimiento, accidentes, combustible |
| reportes/ | 6 | Supervisor | Diario, semanal, auditoría |
| legales/ | 6 | Dueño | DGI, inspecciones, demandas |
| especiales/ | 8 | Dueño | Navidad, huracán, Semana Santa |
| tech/tecnología | 20 | Soporte | Cortes de luz, internet, backups |
| data/datos | 15 | Administrador | Duplicados, precios incorrectos |
| comprehensive/ | 10 | Sistema completo | Flujos multi-día, auditoría completa |
| **TOTAL** | **382** | | |

### 5.2 Escenarios por Rol de Negocio

| Rol | Escenarios Asociados |
|-----|---------------------|
| **Vendedor callejero** | PR-001 a PR-025 (25) |
| **Cajero** | V-001 a V-038, C-001 a C-025 (63) |
| **Bodeguero** | I-001 a I-040 (40) |
| **Despachador** | DE-001 a DE-015, VH-001 a VH-006 (21) |
| **Rutero** | R-001 a R-035 (35) |
| **Cobrador** | CO-001 a CO-015, CR-001 a CR-010 (25) |
| **Supervisor** | SU-001 a SU-015, RP-001 a RP-006 (21) |
| **Administrador** | CL-001 a CL-022, O-001 a O-030, PV-001 a PV-006, PR-001 a PR-010, D-001 a D-015, T-001 a T-020 (103) |
| **Dueño/Gerente** | LG-001 a LG-006, ES-001 a ES-008, RP-001 a RP-006 (20) |

---

## 6. TESTS (128 tests, 100% pasando)

### 6.1 Tests Unitarios Backend (18 tests)

| Archivo | Tests |
|---------|-------|
| auth.service.spec.ts | 4 |
| sales.service.spec.ts | 5 |
| orders.service.spec.ts | 5 |
| cash-shifts.service.spec.ts | 4 |

### 6.2 Tests E2E (94 tests)

| Archivo | Tests | Descripción |
|---------|-------|-------------|
| app.e2e-spec.ts | 2 | Smoke test básico |
| mvp-critical.e2e-spec.ts | 4 | Health, auth, secrets |
| tenant-isolation.e2e-spec.ts | 5 | Tienda A vs B, roles |
| concurrency-real.e2e-spec.ts | 1 | 3 ventas paralelas no sobregiran stock |
| load-basic.e2e-spec.ts | 2 | 50 health requests, 20 ventas rápidas |
| plan-f10.e2e-spec.ts | 6 | Idempotencia, 409, tenant, roles, cierre, 401 |
| scenarios-runner.e2e-spec.ts | 9 | Escenarios V-001 a O-003 |
| comprehensive.e2e-spec.ts | 71 | **TODOS los flujos: auth, products, orders, sales, inventory, cash, clients, sync, tenant, concurrency, error, full flow, SQL** |

### 6.3 Tests Web (16 tests)

| Archivo | Tests |
|---------|-------|
| stock-display.test.tsx | 10 |
| status-chip.test.tsx | 4 |
| cash-register-page.test.tsx | 2 |

---

## 7. SEGURIDAD

### 7.1 Autenticación

| Mecanismo | Estado |
|-----------|--------|
| JWT access token (15 min) | ✅ |
| JWT refresh token (7 días) con argon2 hash | ✅ |
| Rotación de refresh token | ✅ |
| Logout invalida refresh token | ✅ |
| Rate limiting global (2000/min) | ✅ |
| StoreAccessGuard en 37 controllers | ✅ |
| RolesGuard con @Roles() en 165 endpoints | ✅ |
| Socket.IO con JWT authentication | ✅ |
| Sin secretos en git | ✅ (trufflehog scan) |

### 7.2 Tenant Isolation

| Mecanismo | Estado |
|-----------|--------|
| StoreAccessGuard exige storeId | ✅ |
| store_id en todas las consultas SQL | ✅ |
| Usuario A no accede Tienda B | ✅ (5 tests) |
| Master-admin sin restricción de tienda | ✅ |

---

## 8. BULTOS/UNIDADES (Feature Principal)

### 8.1 Esquema

```
products.handles_bulk       boolean
products.units_per_bulk     integer
products.current_stock      integer (unidades base = fuente de verdad)
products.stock_bulks        GENERATED ALWAYS AS (current_stock / units_per_bulk)
products.stock_units        GENERATED ALWAYS AS (current_stock % units_per_bulk)
```

### 8.2 Conversión

```
totalUnits = bulkCount * unitsPerBulk + looseUnitCount
subtotal = bulkCount * bulkPrice + looseUnitCount * unitPrice
```

### 8.3 Validación

```
handles_bulk=false → units_per_bulk=1, bulkCount=0
handles_bulk=true  → units_per_bulk>=2, looseUnitCount < unitsPerBulk
```

### 8.4 Items Históricos

```
sale_items: quantity_bulks, quantity_units, units_per_bulk_snapshot, handles_bulk_snapshot, bulk_price
order_items: quantity_bulks, quantity_units, units_per_bulk_snapshot, handles_bulk_snapshot, bulk_price
movements: handles_bulk_snapshot, units_per_bulk_snapshot
inventory_ledger: handles_bulk_snapshot, units_per_bulk_snapshot
```

### 8.5 Mismatches

| Item | Antes | Después |
|------|-------|---------|
| sale_items mismatches | 221 | 0 ✅ |
| order_items mismatches | 14 | 0 ✅ |

---

## 9. SINCRONIZACIÓN (SYNC ENGINE)

### 9.1 Componentes

| Componente | Descripción |
|------------|-------------|
| sync_inbox | Claim idempotente (INSERT ON CONFLICT) |
| sync_outbox | Eventos salientes (worker cada 5s) |
| sync_nodes | Registro de nodos EDGE/CLOUD |
| sync_cursors | Cursores por nodo+tienda+stream |
| inventory_ledger | Libro mayor de inventario |

### 9.2 Endpoints Sync

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| /edge/sync/push | POST | Push de operaciones desde EDGE |
| /edge/sync/pull | GET | Pull de eventos pendientes (cursor) |
| /edge/sync/ack | POST | Confirmar recepción de eventos |
| /edge/sync/status | GET | Estado de sincronización |

### 9.3 Outbox Worker

```
- Cron cada 5 segundos
- FOR UPDATE SKIP LOCKED (máx 50 eventos)
- HTTP push al nodo destino (CLOUD_API_URL)
- Backoff exponencial: 2s, 4s, 8s... max 300s
- Commit ANTES de I/O remoto
```

---

## 10. GAPS DETECTADOS (Pendientes)

| Gap | Prioridad | Tablas BD | API | Tests |
|-----|-----------|-----------|-----|-------|
| Órdenes de Compra | Alta | ✅ Creadas | ❌ | ❌ |
| Promociones | Alta | ✅ Creadas | ❌ | ❌ |
| Vehículos/Flota | Media | ✅ Creadas | ❌ | ❌ |
| Comisiones | Media | ✅ Creadas | ❌ | ❌ |
| Gastos (Expenses API) | Media | ✅ Existe | ❌ | ❌ |
| Contratos | Baja | ✅ Creadas | ❌ | ❌ |
| Documentos Adjuntos | Baja | ❌ | ❌ | ❌ |
| Reportes/Dashboard | Media | 🔶 Parcial | 🔶 Parcial | ❌ |

---

## 11. FLUJO COMPLETO DE DISTRIBUCIÓN

```
VENDEDOR EN CALLE (preventa/)
  → Visita cliente, toma pedido (PR-001)
  → Verifica crédito (CR-001)
  → Ofrece promociones (PR-002)
  → Si no hay señal, guarda offline (PR-008)
  → Sincroniza al llegar a bodega (PR-009)
  
DESPACHADOR (despacho/)
  → Asigna rutas del día (DE-001)
  → Asigna camión disponible (VH-006)
  → Imprime hoja de ruta (DE-015)
  
BODEGUERO (inventory/)
  → Prepara pedido según picking list (I-033)
  → Carga camión (I-006)
  → Reporta producto dañado si existe (I-003)
  
RUTERO (routes/)
  → Realiza entregas (R-001 a R-005)
  → Cobra en efectivo o tarjeta (R-006)
  → Procesa devoluciones (R-007, R-008)
  → Reporta incidencias (R-021 a R-035)
  → Cierra ruta y entrega efectivo (R-035)
  
COBRADOR (cobranza/)
  → Visita clientes morosos (CO-001)
  → Recibe pagos parciales (CO-002)
  → Concilia al final del día (CO-006)
  
CAJERO (cash/)
  → Abre caja (C-001)
  → Procesa ventas del día (V-001 a V-038)
  → Cierra caja con diferencias (C-003)
  
ADMINISTRADOR
  → Revisa reportes (RP-001 a RP-006)
  → Gestiona créditos (CR-001 a CR-010)
  → Coordina proveedores (PV-001 a PV-006)
  → Atiende inspecciones (LG-001 a LG-006)
  
SUPERVISOR
  → Revisa rutas (SU-001)
  → Atiende quejas (SU-002)
  → Capacita personal (SU-011)
```

---

## 12. COMANDOS ÚTILES

```bash
# Tests
cd /opt/apps/pino2/backend && npx jest src/modules/ --no-cache --forceExit
cd /opt/apps/pino2/backend && npx jest test/active/ --config test/jest-e2e.json --no-cache --forceExit
cd /opt/apps/pino2/web && npx vitest run

# Runner completo
bash /opt/apps/pino2/test-results/run.sh

# Ver resultados
ls -la /opt/apps/pino2/test-results/latest/
cat /opt/apps/pino2/test-results/latest/SUMMARY.md
cat /opt/apps/pino2/test-results/latest/BUGS.md

# API Health
curl -s http://127.0.0.1:3035/api/health

# Login de prueba
curl -s http://127.0.0.1:3035/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test-audit@pino.com","password":"Password123!"}'
```

---

## 13. PARA EL PRÓXIMO MODELO DE IA

Este documento contiene el estado completo del sistema Pino2 al 25 de julio de 2026. Para continuar el trabajo, se recomienda:

1. **Leer este documento completo** para entender la arquitectura
2. **Revisar docs/GAP_ANALYSIS.md** para los 8 gaps identificados
3. **Implementar módulos faltantes** en orden de prioridad:
   - purchase-orders (API CRUD para órdenes de compra)
   - promotions (API CRUD para promociones)
   - expenses (API CRUD para gastos)
   - vehicles (API CRUD para flota)
4. **Convertir más escenarios** de las carpetas `scenarios/` a tests E2E
5. **Flutter** está pendiente (requiere SDK en otra máquina)
6. **Edge node** está pendiente (requiere servidor en tienda)

---
*Documento generado el 2026-07-25 para análisis por IA*
*Repositorio: https://github.com/galz35/pino2*
