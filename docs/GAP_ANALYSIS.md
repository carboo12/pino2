# Análisis de Gaps — Pino2 Los Pinos Central

## Resumen

| Métrica | Valor |
|---------|-------|
| Escenarios documentados | 382 |
| API endpoints | ~220 (43 módulos) |
| Tablas en BD | 74 tablas creadas |
| Tests E2E & Unit | 128/128 pasan |
| Módulos sin API | 2 (contracts, commissions) |

## Gaps Resueltos y Detectados

### GAP 1: Vehículos/Flota ✅
**Escenarios que lo requieren:** VH-001 a VH-006 (6 escenarios)
**Estado:** ✅ **Implementado** (Módulo `vehicles` en NestJS)
**Tablas:** `vehicles`, `vehicle_maintenance`, `vehicle_fuel_log`, `vehicle_accidents`
**API Endpoints:** `/vehicles`, `/vehicles/maintenance`, `/vehicles/fuel`

### GAP 2: Órdenes de Compra a Proveedores ✅
**Escenarios que lo requieren:** PV-001 a PV-006 (6 escenarios)
**Estado:** ✅ **Implementado** (Módulo `purchase-orders` en NestJS)
**Tablas:** `purchase_orders`, `purchase_order_items`
**API Endpoints:** `/purchase-orders`, `/purchase-orders/:id/status`

### GAP 3: Promociones y Descuentos ✅
**Escenarios que lo requieren:** PR-001 a PR-010 (10 escenarios)
**Estado:** ✅ **Implementado** (Módulo `promotions` en NestJS)
**Tablas:** `promotions`, `promotion_products`
**API Endpoints:** `/promotions`, `/promotions/active`

### GAP 4: Gastos (Expenses) ✅
**Escenarios que lo requieren:** C-015, VH-001 (gastos menores, mantenimiento)
**Estado:** ✅ **Implementado** (Módulo `expenses` en NestJS)
**Tablas:** `expenses`
**API Endpoints:** `/expenses`

### GAP 5: Comisiones de Vendedores ⚠️
**Escenarios que lo requieren:** E-020, CR-001 (comisiones, incentivos)
**Estado:** 🔶 Tablas creadas (`commission_rates`, `sales_commissions`), API pendiente
**Prioridad:** Media

### GAP 6: Contratos con Clientes ⚠️
**Escenarios que lo requieren:** LG-001, LG-005 (crédito, contratos)
**Estado:** 🔶 Tabla creada (`client_contracts`), API pendiente
**Prioridad:** Baja

### GAP 7: Documentos Adjuntos ⚠️
**Escenarios que lo requieren:** LG-001 a LG-006 (contratos, inspecciones, actas)
**Estado:** ❌ No implementado
**Falta:** Sistema de archivos adjuntos para contratos, facturas, actas

### GAP 8: Reportes y Dashboard ⚠️
**Escenarios que lo requieren:** RP-001 a RP-006 (6 escenarios)
**Estado:** 🔶 Parcial (existen endpoints sueltos)
**Falta:** Módulo de reportes consolidado con exportación a PDF/Excel
**Prioridad:** Media

## Mapa de Cobertura por Escenario

| Categoría | Escenarios | API existe | BD completa | Tests |
|-----------|-----------|-----------|-------------|-------|
| Ventas | 38 | ✅ | ✅ | ✅ |
| Preventa | 25 | ✅ | ✅ | ✅ |
| Inventario | 40 | ✅ | ✅ | ✅ |
| Pedidos | 30 | ✅ | ✅ | ✅ |
| Despacho | 15 | ✅ | ✅ | 🔶 |
| Rutas | 35 | ✅ | ✅ | 🔶 |
| Cobranza | 15 | ✅ | ✅ | 🔶 |
| Caja | 25 | ✅ | ✅ | ✅ |
| Clientes | 22 | ✅ | ✅ | ✅ |
| Créditos | 10 | ✅ | ✅ | 🔶 |
| Precios | 10 | ✅ | ✅ | 🔶 |
| Proveedores | 6 | ❌ | ✅ | ❌ |
| Vehículos | 6 | ❌ | ✅ | ❌ |
| Reportes | 6 | 🔶 | 🔶 | ❌ |
| Supervisión | 15 | 🔶 | 🔶 | ❌ |
| Empleados | 25 | ✅ | ✅ | 🔶 |
| Legales | 6 | ❌ | ✅ | ❌ |
| Especiales | 8 | 🔶 | 🔶 | ❌ |
| Tecnología | 20 | 🔶 | 🔶 | ❌ |
| Datos | 15 | ✅ | ✅ | ✅ |
| Sync/Outbox | - | ✅ | ✅ | ✅ |

## Recomendaciones

**Alta prioridad (implementar ahora):**

1. Módulo `purchase-orders` — API CRUD para órdenes de compra
2. Módulo `promotions` — API para promociones y descuentos
3. Tests para rutas, despacho, cobranza (conversión de escenarios)

**Media prioridad (próximo sprint):**

4. Módulo `expenses` — API CRUD para gastos
5. Módulo `vehicles` — API CRUD para flota
6. Módulo `commissions` — API para comisiones
7. Reportes consolidados con exportación

**Baja prioridad (backlog):**

8. Sistema de adjuntos de documentos
9. Módulo de contratos
10. Dashboard ejecutivo
