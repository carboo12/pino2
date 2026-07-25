# Análisis de Gaps — Pino2 Los Pinos Central

## Resumen

| Métrica | Valor |
|---------|-------|
| Escenarios documentados | 382 |
| API endpoints | ~200 (39 módulos) |
| Tablas en BD | 61 + 13 nuevas = 74 |
| Tests E2E | 128/128 pasan |
| Módulos sin API | 6 (vehicles, purchase_orders, contracts, promotions, commissions, expenses) |

## Gaps Detectados

### GAP 1: Vehículos/Flota ⚠️
**Escenarios que lo requieren:** VH-001 a VH-006 (6 escenarios)
**Estado:** ❌ No implementado
**Tablas creadas:** ✅ `vehicles`, `vehicle_maintenance`, `vehicle_fuel_log`, `vehicle_accidents`
**Falta:** Módulo NestJS con API CRUD + endpoints específicos
**Prioridad:** Media

### GAP 2: Órdenes de Compra a Proveedores ⚠️
**Escenarios que lo requieren:** PV-001 a PV-006 (6 escenarios)
**Estado:** ❌ No implementado
**Tablas creadas:** ✅ `purchase_orders`, `purchase_order_items`
**Falta:** Módulo NestJS con API CRUD + flujo de aprobación
**Prioridad:** Alta

### GAP 3: Contratos con Clientes ⚠️
**Escenarios que lo requieren:** LG-001, LG-005 (crédito, contratos)
**Estado:** ❌ No implementado
**Tablas creadas:** ✅ `client_contracts`
**Falta:** Módulo NestJS con API CRUD + vinculación a clientes
**Prioridad:** Media

### GAP 4: Promociones y Descuentos ⚠️
**Escenarios que lo requieren:** PR-001 a PR-010 (10 escenarios)
**Estado:** ❌ No implementado  
**Tablas creadas:** ✅ `promotions`, `promotion_products`
**Falta:** Módulo NestJS con API CRUD + aplicación automática en ventas
**Prioridad:** Alta

### GAP 5: Comisiones de Vendedores ⚠️
**Escenarios que lo requieren:** E-020, CR-001 (comisiones, incentivos)
**Estado:** ❌ No implementado
**Tablas creadas:** ✅ `commission_rates`, `sales_commissions`
**Falta:** Módulo NestJS con API CRUD + cálculo automático
**Prioridad:** Media

### GAP 6: Gastos (Expenses) ⚠️
**Escenarios que lo requieren:** C-015, VH-001 (gastos menores, mantenimiento)
**Estado:** 🔶 Tabla existe, sin API dedicada
**Tablas:** ✅ `expenses` (existente)
**Falta:** Módulo NestJS con API CRUD + categorización
**Prioridad:** Media

### GAP 7: Documentos Adjuntos ⚠️
**Escenarios que lo requieren:** LG-001 a LG-006 (contratos, inspecciones, actas)
**Estado:** ❌ No implementado
**Falta:** Sistema de archivos adjuntos para contratos, facturas, actas
**Prioridad:** Baja

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
