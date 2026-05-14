# Rediseno React Web

Fecha: 2026-05-14

## Objetivo

Hacer que la web sea una consola operativa rapida. Debe sentirse como sistema de trabajo diario, no como panel administrativo generico.

## Cambio principal

Crear una capa nueva de pantallas principales:

- `WorkHomePage`
- `CashWorkspacePage`
- `WarehouseWorkspacePage`
- `RouteSalesWorkspacePage`
- `FinanceWorkspacePage`
- `CatalogWorkspacePage`
- `AdminControlCenterPage`

Las pantallas actuales quedan como componentes o vistas internas.

## Nueva navegacion React

### Store admin

Menu principal propuesto:

- Pulso
- Caja
- Bodega
- Ventas/Ruta
- Finanzas
- Catalogo
- Admin

Esto reemplaza la exposicion directa de:

- Productos
- Entrada
- Movimientos
- Proveedores
- Facturas
- Cuentas por cobrar
- Aging
- Cuentas por pagar
- Reportes
- Vendedores
- Rutas
- Zonas
- Clientes
- Despacho
- Usuarios
- Autorizaciones
- Configuracion

Todos siguen existiendo, pero se acceden desde tabs/paneles dentro del puesto.

### Cajero

Menu:

- Vender
- Caja
- Devolucion
- Historial

### Bodeguero

Menu:

- Bodega
- Entrada
- Ajustes
- Catalogo

### Rutero

Menu:

- Ruta
- Cobros
- Devolucion
- Cierre

### Master admin

Menu:

- Resumen
- Tiendas
- Cadenas
- Usuarios
- Licencias
- Monitor
- Config

Pero el resumen debe abrir con alertas y excepciones, no metricas decorativas.

## CashWorkspacePage

Pantalla unica para caja.

Layout desktop:

- Izquierda: busqueda/scan y lista de productos.
- Centro: ticket actual.
- Derecha: cliente, pago, totales, acciones.
- Abajo fijo: total, cobrar, guardar pendiente, cancelar.

Tabs internas:

- Venta
- Caja
- Devoluciones
- Historial

Mejoras:

- Si no hay caja abierta, la misma pantalla muestra apertura rapida.
- El cajero no debe salir de venta para abrir caja.
- Cobro debe ser panel lateral o dialog corto.
- Cliente default `VENTA MOSTRADOR` ya preseleccionado.
- Descuentos, moneda y metodo de pago con defaults.

Meta:

- Venta mostrador: 1 pantalla.
- Abrir caja: 1 dialog.
- Cierre caja: 1 dialog con denominaciones.
- Devolucion: buscar ticket y confirmar en la misma pantalla.

## WarehouseWorkspacePage

Pantalla unica para bodega/despacho.

Layout:

- Columnas compactas por estado: Recibido, Preparando, Alistado, Cargado.
- Panel lateral al seleccionar pedido.
- Acciones directas segun estado.

Mejoras:

- Pending orders, dispatch y warehouse se unifican visualmente.
- Picking abre checklist en panel lateral.
- Cargar camion pide responsable en el mismo panel.
- Mostrar prioridad, hora, vendedor, cliente, total y cantidad de items.
- Filtro superior: urgente, ruta, vendedor, cliente.

Meta:

- Preparar pedido: 1 clic.
- Validar picking: panel lateral.
- Cargar camion: seleccionar responsable y confirmar.

## RouteSalesWorkspacePage

Para ventas en calle desde web.

Tabs:

- Clientes
- Pedido rapido
- Cobros
- Devoluciones
- Rutas

Mejoras:

- Cliente seleccionado permanece como contexto.
- Desde cliente se puede vender, cobrar, devolver, ver historial.
- No separar "clientes", "quick sale", "collections" y "returns" como lugares distintos para el usuario.

## FinanceWorkspacePage

Finanzas debe organizarse por excepciones:

- Por cobrar.
- Por pagar.
- Aging.
- Liquidacion de ruta.
- Arqueos.

Home de finanzas:

- Cuentas vencidas.
- Cobros del dia.
- Diferencias de ruta.
- Pagos pendientes.

Accion rapida:

- Registrar pago.
- Ver cliente.
- Conciliar ruta.

## CatalogWorkspacePage

Unificar:

- Productos.
- Departamentos.
- Subdepartamentos.
- Codigos alternos.
- Entrada.
- Movimientos.
- Ajustes.

Home:

- Busqueda global de producto.
- Stock critico.
- Ultimos movimientos.
- Crear producto.
- Ajustar stock.

## AdminControlCenterPage

No debe ser otro dashboard pesado. Debe ser una bandeja de excepciones:

- Autorizaciones pendientes.
- Precios pendientes.
- Pedidos sin avanzar.
- Cajas abiertas hace mucho.
- Sync con errores.
- Tiendas sin ventas hoy.
- Usuarios bloqueados/inactivos.

Cada alerta debe tener accion directa.

## Estilo visual React

Eliminar:

- Neumorfismo fuerte.
- Sombras enormes.
- Gradientes grandes por defecto.
- Headers altos sin informacion operativa.
- Cards dentro de cards.

Adoptar:

- Fondo gris claro neutral.
- Paneles blancos con borde fino.
- Radio 6 a 8 px.
- Sombras minimas.
- Tipografia compacta.
- Estados por color funcional: pendiente, listo, error, cobrado.
- Botones primarios claros y constantes.

## Componentes nuevos sugeridos

- `WorkspaceShell`
- `WorkspaceTopBar`
- `CommandSearch`
- `ActionDock`
- `ContextPanel`
- `StatusBoard`
- `CompactMetric`
- `ExceptionInbox`
- `QuickEntityPicker`
- `InlineConfirmBar`

## Implementacion tecnica recomendada

Primero crear los workspaces sin borrar rutas viejas.

Ruta nueva sugerida:

- `/store/:storeId/work`
- `/store/:storeId/work/cash`
- `/store/:storeId/work/warehouse`
- `/store/:storeId/work/sales`
- `/store/:storeId/work/finance`
- `/store/:storeId/work/catalog`
- `/store/:storeId/work/admin`

Luego modificar `getStoreAdminNav` para apuntar a estos destinos principales.
