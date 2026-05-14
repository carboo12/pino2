# Backlog Tecnico Por Piezas

Fecha: 2026-05-14

## Como usar este backlog

Cada pieza debe poder asignarse a una IA distinta. No mezclar piezas grandes. Cada tarea tiene:

- objetivo
- archivos
- tecnologia
- pasos
- aceptacion

## Pieza R0: Workspace Shell React

Objetivo:

Crear base comun para todas las nuevas pantallas rapidas.

Archivos a crear:

- `web/src/components/workspace/workspace-shell.tsx`
- `web/src/components/workspace/workspace-topbar.tsx`
- `web/src/components/workspace/context-panel.tsx`
- `web/src/components/workspace/action-dock.tsx`

Tecnologia:

- React.
- Tailwind.
- lucide-react.
- componentes UI existentes.

Pasos:

1. Crear carpeta `web/src/components/workspace`.
2. Crear `WorkspaceShell` con slots: topbar, children, contextPanel, actionDock.
3. Crear `WorkspaceTopBar` con titulo compacto, tienda, estado sync, acciones.
4. Crear `ContextPanel` con ancho fijo desktop y drawer/sheet en mobile.
5. Crear `ActionDock` fijo abajo solo si hay accion activa.

Aceptacion:

- Layout responsive.
- Sin cards anidadas.
- Radios 6-10 px.
- No usa sombras grandes.
- Puede envolver cualquier pantalla.

## Pieza R1: Estados comunes React

Archivos a crear:

- `web/src/components/workspace/empty-state.tsx`
- `web/src/components/workspace/error-state.tsx`
- `web/src/components/workspace/loading-rows.tsx`
- `web/src/components/workspace/status-chip.tsx`

Tecnologia:

- React.
- Tailwind.
- lucide-react.

Pasos:

1. Crear `EmptyState` con titulo, descripcion corta y accion opcional.
2. Crear `ErrorState` con mensaje y boton reintentar.
3. Crear `LoadingRows` para listas/tablas.
4. Crear `StatusChip` para pendiente, listo, error, sync, offline.

Aceptacion:

- Se puede usar en caja/bodega/admin.
- No bloquea pantalla completa si hay datos viejos.

## Pieza R2: CommandSearch React

Archivos:

- crear `web/src/components/workspace/command-search.tsx`
- integrar en `web/src/components/app-layout.tsx` o `WorkspaceTopBar`

Tecnologia:

- `cmdk`
- `CommandDialog` existente
- `apiClient`
- `useNavigate`
- `lucide-react`

Pasos:

1. Abrir dialog con `Ctrl+K`.
2. Mostrar acciones rapidas fijas: Caja, Bodega, Clientes, Productos, Pedidos.
3. Agregar busqueda remota debounced para productos/clientes si endpoints estan disponibles.
4. Enter navega o ejecuta accion.
5. Mostrar atajos en `CommandShortcut`.

Aceptacion:

- `Ctrl+K` funciona en desktop.
- No se abre dentro de inputs cuando interfiere con escritura normal.
- Navega a workspace correcto.

## Pieza R3: ScanInput React

Archivos:

- `web/src/components/workspace/scan-input.tsx`

Tecnologia:

- React.
- input controlado.
- opcional `@zxing/library` solo para camara despues.

Pasos:

1. Crear input compacto con auto-focus opcional.
2. Capturar Enter.
3. Normalizar codigo.
4. Llamar `onScan(code)`.
5. Mostrar ultimo resultado.
6. Exponer metodo `focus`.

Aceptacion:

- Funciona con scanner USB tipo teclado.
- Permite entrada manual.
- No roba foco cuando un modal esta abierto.

## Pieza R4: Rutas Work React

Archivos:

- `web/src/App.tsx`
- crear carpeta `web/src/pages/work`

Paginas a crear:

- `work-home-page.tsx`
- `cash-workspace-page.tsx`
- `warehouse-workspace-page.tsx`
- `sales-workspace-page.tsx`
- `finance-workspace-page.tsx`
- `catalog-workspace-page.tsx`
- `admin-control-center-page.tsx`

Pasos:

1. Crear paginas placeholder con `WorkspaceShell`.
2. Agregar lazy imports.
3. Agregar rutas protegidas.
4. No quitar rutas viejas.

Aceptacion:

- Todas las rutas nuevas cargan.
- Permisos equivalentes a rutas antiguas.

## Pieza R5: Menu compacto React

Archivo:

- `web/src/components/app-layout.tsx`

Pasos:

1. Cambiar `getStoreAdminNav` para apuntar a workspaces.
2. Mantener grupos solo si son maximo 2 y realmente necesarios.
3. Ajustar roles operativos:
   - cashier: Caja.
   - inventory: Bodega, Catalogo.
   - rutero: Ruta.
   - vendor: Ventas/Ruta.
   - sales-manager: Ventas/Ruta, Admin comercial.
4. Mantener master admin compacto.

Aceptacion:

- Store admin ve maximo 7 destinos.
- Roles operativos ven maximo 4.
- No hay perdida de permisos, solo menos destinos visibles.

## Pieza R6: CashWorkspacePage

Archivo:

- `web/src/pages/work/cash-workspace-page.tsx`

Reutilizar:

- `web/src/pages/store-admin/billing/billing-page.tsx`
- `web/src/pages/store-admin/cash-register/cash-register-page.tsx`
- `web/src/components/pos/*`

Pasos:

1. Montar shell con tabs: Venta, Caja, Devolucion, Historial.
2. Venta usa catalogo + ticket + pago.
3. Si no hay turno activo, mostrar apertura inline.
4. Integrar `ScanInput`.
5. Agregar action dock con total y cobrar.
6. Cobro en panel lateral/dialog corto.

Aceptacion:

- Venta mostrador no requiere salir de pantalla.
- Abrir caja no requiere ruta separada.
- Scan agrega producto.
- Cobrar queda siempre visible.

## Pieza R7: WarehouseWorkspacePage

Archivo:

- `web/src/pages/work/warehouse-workspace-page.tsx`

Reutilizar:

- APIs usadas por `warehouse-dashboard-page.tsx`.
- `pending-orders`.
- `dispatch`.

Pasos:

1. Obtener pedidos activos.
2. Renderizar columnas por estado.
3. Al seleccionar pedido, abrir `ContextPanel`.
4. Acciones segun estado: preparar, checklist, alistar, cargar.
5. Cargar camion pide rutero/vendor.
6. Agregar filtros arriba.

Aceptacion:

- Pedido se mueve de Recibido a Cargado sin cambiar pagina.
- El detalle siempre se ve en panel.
- Estados actualizan con invalidate/refetch.

## Pieza R8: AdminControlCenterPage

Archivo:

- `web/src/pages/work/admin-control-center-page.tsx`

Pasos:

1. Crear bandeja de excepciones.
2. Mostrar tarjetas/lista de: autorizaciones, cajas abiertas, stock critico, sync, pedidos trabados.
3. Cada item tiene accion directa.

Aceptacion:

- No es dashboard decorativo.
- Admin puede resolver algo desde la primera pantalla.

## Pieza F0: Workday Flutter base

Archivos a crear:

- `flutter/lib/features/workday/presentation/widgets/workday_scaffold.dart`
- `flutter/lib/features/workday/presentation/widgets/sync_status_strip.dart`
- `flutter/lib/features/workday/presentation/widgets/workday_action_button.dart`

Tecnologia:

- Flutter Material 3.
- Riverpod.

Pasos:

1. Crear scaffold con appbar compacta.
2. Agregar `NavigationBar` por rol.
3. Agregar `SyncStatusStrip`.
4. Crear slots para body y action footer.

Aceptacion:

- Compila.
- Sirve para vendedor/rutero/bodega.

## Pieza F1: WorkdayHome Flutter

Archivo:

- `flutter/lib/features/workday/presentation/screens/workday_home_screen.dart`

Pasos:

1. Leer sesion desde `authControllerProvider`.
2. Identificar rol.
3. Mostrar siguiente accion:
   - vendedor: proximo cliente.
   - rutero: proxima parada.
   - bodega: pedidos recibidos.
   - admin: alertas.
4. Mostrar sync strip.
5. Boton principal entra al flujo.

Aceptacion:

- No abre con metricas como prioridad.
- El primer tap lleva a trabajo real.

## Pieza F2: ClientWork Flutter

Archivos:

- `flutter/lib/features/workday/presentation/widgets/client_work_card.dart`
- `flutter/lib/features/workday/presentation/screens/client_work_screen.dart`

Pasos:

1. Mostrar cliente/parada.
2. Acciones: pedido, cobrar, devolver, visita sin venta, mapa.
3. Acciones cortas por bottom sheet.
4. Al guardar, volver a siguiente cliente/parada.

Aceptacion:

- Rutero/vendedor resuelve cliente sin saltar por menus.

## Pieza F3: Pedido movil canonico

Archivo nuevo sugerido:

- `flutter/lib/features/workday/presentation/screens/mobile_order_screen.dart`

Revisar y consolidar:

- `features/orders/presentation/screens/quick_order_screen.dart`
- `features/preventa/presentation/screens/preventa_order_screen.dart`

Pasos:

1. Elegir un solo flujo base.
2. Catalogo busca local primero.
3. Carrito siempre visible.
4. Guardar usa repositorio existente con cola offline.
5. PDF queda accion posterior.

Aceptacion:

- Un pedido se guarda offline sin bloquear.
- Vuelve al cliente/parada.

## Pieza F4: Sync operativo Flutter

Archivos:

- `flutter/lib/features/workday/presentation/screens/sync_status_screen.dart`
- `sync_status_strip.dart`

Pasos:

1. Mostrar pendientes por tipo.
2. Mostrar fallidos con accion.
3. Reintentar.
4. Ver detalle.
5. Mostrar ultima sincronizacion.

Aceptacion:

- Usuario entiende si esta guardado, pendiente, enviado o fallido.

## Pieza QA1: Pruebas minimas

React:

- render de shell.
- command search abre con atajo.
- scan input llama `onScan`.

Flutter:

- widget test para WorkdayScaffold.
- provider test si aplica para rol.

Aceptacion:

- `npm run build`.
- `npm run test`.
- `flutter analyze`.
- `flutter test`.
