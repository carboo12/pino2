# Nuevo Modelo de Experiencia

Fecha: 2026-05-14

## Principio central

Pino2 debe organizarse por trabajo real, no por tablas ni modulos tecnicos.

Modelo nuevo:

- Menos pantallas principales.
- Mas paneles contextuales.
- Mas acciones directas.
- Menos campos visibles.
- Menos navegacion lateral.

## Nuevo concepto: Puestos de trabajo

Cada rol entra a un puesto de trabajo. El puesto muestra solo lo que esa persona necesita hoy.

### Puesto Caja

Usuarios: cajero, supervisor caja, store admin.

Acciones visibles:

- Vender.
- Abrir/cerrar caja.
- Devolucion.
- Ultimas ventas.
- Corte X.

Pantallas actuales que absorbe:

- `/cash-register`
- `/facturacion`
- parte de `/billing`
- returns de POS
- daily sales

### Puesto Bodega

Usuarios: inventario, bodeguero, dispatcher, store admin.

Acciones visibles:

- Recibidos.
- En preparacion.
- Alistados.
- Cargar camion.
- Ajustar inventario rapido.

Pantallas actuales que absorbe:

- `/warehouse`
- `/pending-orders`
- `/dispatch`
- `/dispatch/cargas`
- `/inventory/entry`
- parte de `/inventory/movements`

### Puesto Ruta

Usuarios: rutero.

Acciones visibles:

- Proxima parada.
- Entregar.
- Cobrar.
- Devolver.
- No entregado.
- Cierre diario.

Pantallas actuales que absorbe:

- `/delivery-route`
- `/vendors/collections`
- `/vendors/returns`
- `/daily-closing`

### Puesto Preventa

Usuarios: vendedor, sales-manager.

Acciones visibles:

- Ruta del dia.
- Cliente actual.
- Nuevo pedido.
- Visita sin venta.
- Cobrar si aplica.
- Nuevo cliente rapido.

Pantallas actuales que absorbe:

- `/vendors/quick-sale`
- `/vendors/clients`
- `/vendors/sales`
- `/vendors/collections`
- Flutter preventa route/clients/order

### Centro de Control

Usuarios: store admin, chain admin, master admin.

Acciones visibles:

- Alertas.
- Autorizaciones.
- Pedidos trabados.
- Cajas abiertas.
- Stock critico.
- Ventas del dia.
- Sync/offline.

Pantallas actuales que absorbe:

- dashboard
- authorizations
- orders pipeline
- sync monitor
- reports resumidos
- master monitor

## Navegacion nueva

### Web desktop

Usar una barra lateral compacta con 4 a 7 destinos maximos:

- Inicio
- Caja
- Bodega
- Ruta/Ventas
- Finanzas
- Catalogo
- Admin

Los submodulos no deben estar todos visibles. Deben abrirse dentro del puesto como tabs, filtros, paneles o comandos.

### Web movil/tablet

Usar barra inferior por rol con 3 a 5 destinos:

- Caja: Venta, Caja, Buscar, Mas.
- Rutero: Ruta, Cobros, Devolucion, Cierre.
- Admin: Pulso, Alertas, Operacion, Mas.

### Flutter

Usar jornada como estructura:

- Home = siguiente accion.
- Bottom nav solo para 3 a 5 tareas.
- Bottom sheets para acciones cortas.
- Pantallas completas solo para tareas largas.

## Patron de pantalla nuevo

Cada puesto debe tener esta estructura:

1. Barra superior compacta:
   - tienda
   - estado de red/sync
   - usuario
   - busqueda/comando

2. Zona de trabajo:
   - lista, tablero o venta actual
   - datos relevantes visibles
   - accion primaria siempre cerca

3. Panel lateral o inferior:
   - detalle del item seleccionado
   - formulario corto
   - confirmar/cancelar

4. Barra de acciones:
   - accion primaria
   - acciones secundarias
   - total/resumen si aplica

## Regla de oro

Una tarea frecuente debe terminar en:

- 1 pantalla.
- 0 a 1 modal.
- 3 a 5 decisiones maximas.
- Sin volver al menu.

## Que se mantiene

No se elimina la funcionalidad actual. Se reorganiza.

Las rutas viejas pueden quedar como compatibilidad interna, pero el usuario debe entrar por los nuevos puestos de trabajo.
