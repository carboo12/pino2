# Matriz de Migracion de Pantallas

Fecha: 2026-05-14

## Objetivo

Evitar que el rediseño sea solo visual. Esta matriz dice donde debe vivir cada grupo actual dentro de la nueva experiencia rapida.

## React Web

### Acceso y sesion

Actual:

- `login-page.tsx`
- `forgot-password-page.tsx`
- `pos-page.tsx`

Nuevo:

- Mantener login.
- Rediseñar login mas sobrio y rapido.
- `pos-page.tsx` debe redirigir al puesto principal del rol, no a un cargador generico largo.

### Caja y venta

Actual:

- `billing/billing-page.tsx`
- `cash-register/cash-register-page.tsx`
- `components/pos/*`

Nuevo:

- `CashWorkspacePage`
- Tabs: Venta, Caja, Devolucion, Historial.
- Componentes POS existentes se reutilizan dentro de una sola pantalla.

### Bodega, pedidos y despacho

Actual:

- `warehouse/warehouse-dashboard-page.tsx`
- `pending-orders/pending-orders-page.tsx`
- `pending-orders/orders-pipeline-page.tsx`
- `dispatcher/dispatcher-page.tsx`
- `dispatch/dispatch-page.tsx`
- `dispatch/dispatch-cargas-page.tsx`

Nuevo:

- `WarehouseWorkspacePage`
- Vista tablero: Recibido, Preparando, Alistado, Cargado.
- Panel lateral para detalle, picking y carga.
- Pipeline queda como vista de supervisor dentro del mismo workspace.

### Ventas en calle y clientes

Actual:

- `vendors/vendor-dashboard-page.tsx`
- `vendors/vendor-quick-sale-page.tsx`
- `vendors/vendor-clients-page.tsx`
- `vendors/vendor-sales-page.tsx`
- `vendors/vendor-collections-page.tsx`
- `vendors/vendor-returns-page.tsx`
- `vendors/vendor-routes-page.tsx`
- `vendors/vendor-zones-page.tsx`
- `vendors/vendors-page.tsx`
- `vendors/assign-route-page.tsx`
- `clients/client-groups-page.tsx`
- `clients/economic-groups-page.tsx`
- `clients/client-reassign-page.tsx`

Nuevo:

- `RouteSalesWorkspacePage`
- Contexto principal: cliente/ruta.
- Tabs: Ruta, Clientes, Pedido, Cobros, Devoluciones, Configuracion Comercial.
- Grupos, zonas y reasignacion quedan como herramientas de admin comercial, no como destinos diarios.

### Finanzas

Actual:

- `finance/receivables-page.tsx`
- `finance/payables-page.tsx`
- `finance/aging-report-page.tsx`
- `finance/arqueos-page.tsx`
- `finance/liquidation-route-page.tsx`

Nuevo:

- `FinanceWorkspacePage`
- Home por excepciones: vencidas, por pagar, liquidaciones con diferencia, arqueos pendientes.
- Acciones rapidas: registrar pago, conciliar, ver cliente.

### Catalogo e inventario

Actual:

- `products/products-page.tsx`
- `products/add-product-page.tsx`
- `products/edit-product-page.tsx`
- `products/departments-page.tsx`
- `products/sub-departments-page.tsx`
- `products/alternative-barcodes.tsx`
- `inventory/inventory-entry-page.tsx`
- `inventory/inventory-movements-page.tsx`
- `inventory/inventory-adjustments-page.tsx`
- `suppliers/*`

Nuevo:

- `CatalogWorkspacePage`
- Busqueda global de SKU.
- Tabs: Productos, Stock, Entradas, Movimientos, Proveedores.
- Crear/editar producto debe abrir panel o pantalla compacta segun complejidad.

### Admin tienda

Actual:

- `dashboard/dashboard-page.tsx`
- `users/*`
- `settings/settings-page.tsx`
- `authorizations/*`
- `reports/*`
- `help/help-page.tsx`

Nuevo:

- `AdminControlCenterPage`
- Bandeja de excepciones: autorizaciones, cajas, sync, pedidos trabados, stock critico.
- Usuarios y configuracion quedan bajo Admin, no en navegacion primaria de operacion.

### Master y chain admin

Actual:

- `master-admin/*`
- `chain-admin/chain-dashboard-page.tsx`

Nuevo:

- Mantener estructura pero compactar:
  - Resumen
  - Tiendas
  - Cadenas
  - Usuarios
  - Licencias
  - Monitor
  - Config
- El resumen debe priorizar alertas y tiendas con problema.

## Flutter

### Login y startup

Actual:

- `startup/splash_screen.dart`
- `auth/login_screen.dart`
- `home/home_screen.dart`

Nuevo:

- Mantener splash/login.
- Home debe convertirse en `WorkdayHome`.
- Menos metricas decorativas; mas "siguiente accion".

### Preventa

Actual:

- `preventa/preventa_home_screen.dart`
- `preventa/preventa_route_screen.dart`
- `preventa/preventa_clients_screen.dart`
- `preventa/preventa_add_client_screen.dart`
- `preventa/preventa_order_screen.dart`
- `orders/quick_order_screen.dart`

Nuevo:

- Unificar pedido movil en un solo flujo canonico.
- `WorkdayRouteScreen`
- `ClientWorkScreen`
- `MobileOrderScreen`
- Alta de cliente como bottom sheet o pantalla corta.

### Ruta y entrega

Actual:

- `deliveries/route_board_screen.dart`
- `deliveries/delivery_detail_screen.dart`

Nuevo:

- `RouteWorkdayScreen`
- Parada actual con acciones: entregar, cobrar, devolver, no entregado.
- Detalle se abre dentro de la parada.

### Cobros

Actual:

- `collections/collections_screen.dart`

Nuevo:

- Sigue existiendo, pero tambien se invoca desde ficha de cliente/parada.
- Cobro como bottom sheet con monto default.

### Devoluciones

Actual:

- `returns/returns_screen.dart`
- `returns/route_returns_screen.dart`

Nuevo:

- Unificar patron: buscar ticket/cliente, seleccionar items, guardar.
- Desde ruta se abre con cliente/parada precargado.

### Bodega movil

Actual:

- `warehouse/warehouse_board_screen.dart`
- `warehouse/picking_checklist_screen.dart`
- `warehouse/carga_camion_screen.dart`
- `warehouse/inventory_adjustment_screen.dart`

Nuevo:

- Mantener como modulo movil, pero con `WorkdayScaffold`.
- Picking y carga deben parecer pasos de un mismo trabajo.

### Inventario vendedor e historial

Actual:

- `vendor_inventory/vendor_inventory_screen.dart`
- `sales_history/sales_history_screen.dart`
- `catalog/product_catalog_screen.dart`
- `clients/client_portfolio_screen.dart`

Nuevo:

- Acceso desde jornada.
- Catalogo y clientes no deben ser destinos principales si el usuario esta en ruta; deben abrirse como busqueda/herramienta.

## Regla de migracion

No borrar pantallas actuales de inmediato. Primero:

1. Crear workspaces nuevos.
2. Reutilizar componentes actuales.
3. Cambiar menu para apuntar a workspaces.
4. Mantener rutas viejas para compatibilidad.
5. Eliminar o archivar pantallas duplicadas solo cuando el flujo nuevo este probado.
