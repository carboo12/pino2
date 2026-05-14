# Plan de Implementacion Priorizado

Fecha: 2026-05-14

## Estrategia

No reescribir todo. Crear primero una capa nueva de experiencia rapida y reutilizar las pantallas/componentes existentes donde sirvan.

## Fase 0: Preparacion

Duracion: 1 a 2 dias.

Entregables:

- Definir rutas nuevas de workspaces.
- Crear `WorkspaceShell`.
- Crear tokens visuales nuevos.
- Crear componentes base: topbar, action dock, context panel.

Riesgo:

- Bajo. No cambia logica de negocio.

## Fase 0.5: Velocidad transversal

Duracion: 2 a 3 dias.

Objetivo:

- Crear las piezas que haran que todos los puestos se sientan rapidos desde el inicio.

Entregables:

- `CommandSearch` con `cmdk` y atajo `Ctrl+K`.
- `ScanInput` para scanner USB/entrada manual.
- Estados comunes: `EmptyState`, `ErrorState`, `LoadingRows`, `StatusChip`.
- Mapa de atajos de teclado por puesto.
- `SyncStatusStrip` para offline/sync.

Archivos base:

- `web/src/components/ui/command.tsx`
- `web/src/components/pos/compact-dashboard.tsx`
- `web/src/components/pos/barcode-scanner-dialog.tsx`
- `flutter/lib/core/database/local_cache_repository.dart`
- `flutter/lib/core/network/sync_queue_processor.dart`

Riesgo:

- Bajo/medio. Toca UI compartida, pero no cambia negocio.

## Fase 1: Puesto Caja

Duracion: 3 a 5 dias.

Objetivo:

- Unificar venta, apertura/cierre de caja, devolucion e historial.

Archivos base a reutilizar:

- `web/src/pages/store-admin/billing/billing-page.tsx`
- `web/src/pages/store-admin/cash-register/cash-register-page.tsx`
- `web/src/components/pos/*`

Entregables:

- `CashWorkspacePage`.
- Panel de cobro rapido.
- Apertura/cierre dentro del mismo flujo.
- Historial de ventas en tab.

Impacto:

- Alto para percepcion de velocidad.

## Fase 2: Puesto Bodega

Duracion: 4 a 6 dias.

Objetivo:

- Unificar pedidos pendientes, bodega, despacho y carga.

Archivos base:

- `web/src/pages/store-admin/warehouse/warehouse-dashboard-page.tsx`
- `web/src/pages/store-admin/pending-orders/pending-orders-page.tsx`
- `web/src/pages/store-admin/dispatch/dispatch-page.tsx`
- `web/src/pages/store-admin/dispatch/dispatch-cargas-page.tsx`

Entregables:

- `WarehouseWorkspacePage`.
- Columnas por estado.
- Panel lateral de picking.
- Carga de camion en el mismo panel.

Impacto:

- Alto para operacion diaria.

## Fase 3: Flutter Jornada Ruta/Preventa

Duracion: 5 a 8 dias.

Objetivo:

- Crear experiencia continua por cliente/parada.

Archivos base:

- `flutter/lib/features/home/presentation/screens/home_screen.dart`
- `flutter/lib/features/preventa/presentation/screens/*`
- `flutter/lib/features/orders/presentation/screens/quick_order_screen.dart`
- `flutter/lib/features/deliveries/presentation/screens/route_board_screen.dart`
- `flutter/lib/features/collections/presentation/screens/collections_screen.dart`
- `flutter/lib/features/returns/presentation/screens/returns_screen.dart`

Entregables:

- `WorkdayScaffold`.
- `ClientWorkCard`.
- Jornada vendedor.
- Jornada rutero.
- Bottom nav por rol.

Impacto:

- Muy alto para campo.

## Fase 4: Centro de Control Admin

Duracion: 3 a 5 dias.

Objetivo:

- Cambiar dashboard de metricas a bandeja de excepciones.

Entregables:

- `AdminControlCenterPage`.
- `ExceptionInbox`.
- Acciones directas para autorizaciones, pedidos trabados, cajas, sync y stock.

Impacto:

- Alto para gerencia y soporte.

## Fase 5: Catalogo y Finanzas

Duracion: 5 a 8 dias.

Objetivo:

- Consolidar catalogo/inventario y finanzas.

Entregables:

- `CatalogWorkspacePage`.
- `FinanceWorkspacePage`.
- Busqueda global de producto/cliente.
- Acciones rapidas de ajuste, entrada, pago, cartera.

Impacto:

- Medio/alto.

## Fase 6: Limpieza visual global

Duracion: 3 a 6 dias.

Objetivo:

- Quitar estilos viejos y dejar una identidad unica.

Tareas:

- Reemplazar sombras fuertes.
- Normalizar radios.
- Normalizar headers.
- Normalizar estados empty/loading/error.
- Revisar responsive.

Impacto:

- Alto en percepcion profesional.

## Orden recomendado

1. Fase 0: shell y tokens.
2. Fase 0.5: comando, scanner, estados y sync.
3. Caja.
4. Bodega.
5. Flutter jornada.
6. Centro de control.
7. Finanzas/catalogo.
8. Limpieza visual.

## Criterios de aceptacion UX

- Una venta mostrador se completa sin salir de Puesto Caja.
- Un pedido se prepara y carga sin salir de Puesto Bodega.
- Un rutero resuelve entrega, cobro o devolucion desde la misma parada.
- Un vendedor crea pedido desde cliente y vuelve al siguiente cliente.
- Un admin resuelve alertas desde una bandeja sin buscar en menus.

## Riesgos tecnicos

- Duplicidad temporal de rutas viejas y nuevas.
- Componentes actuales con logica mezclada pueden requerir extraccion.
- Diferencias entre estados backend (`OPEN/open`, `CLOSED/closed`) deben normalizarse.
- Flutter tiene dos flujos de pedido; conviene decidir un flujo canonico antes de migrar completo.

## Guia de ejecucion detallada

Para implementar pieza por pieza, usar:

- `11_GUIA_PARA_IA_EJECUTORA.md`
- `12_BACKLOG_TECNICO_POR_PIEZAS.md`
- `13_CONTRATOS_UX_Y_DATOS.md`
