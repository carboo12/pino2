# Rediseno Flutter Movil

Fecha: 2026-05-14

## Objetivo

Flutter debe ser la app de jornada. El usuario movil no debe navegar por modulos; debe avanzar por su dia.

## Principio

El movil responde siempre:

- Que hago ahora.
- Con quien.
- Que falta.
- Que quedo pendiente de sincronizar.

## Nueva estructura movil

### Home por jornada

Pantalla inicial despues de login:

- Tarjeta compacta de tienda/jornada.
- Siguiente tarea grande.
- Lista corta de pendientes.
- Estado offline/sync como banda discreta.
- Bottom nav por rol.

No debe abrir con demasiadas metricas. Las metricas quedan secundarias.

## Vendedor / Preventa

Bottom nav:

- Ruta
- Pedido
- Clientes
- Sync

Flujo nuevo:

1. Home muestra proximo cliente.
2. Tap en cliente abre ficha operativa.
3. Desde ficha: Pedido, Visita sin venta, Cobro, Nota.
4. Pedido se hace en una pantalla con catalogo + carrito.
5. Guardar vuelve al proximo cliente.

Ficha de cliente:

- Nombre.
- Direccion.
- Credito disponible.
- Mora/bloqueo.
- Ultima compra.
- Acciones: Pedido, Cobrar, No venta, Mapa.

## Rutero

Bottom nav:

- Ruta
- Cobros
- Devolucion
- Cierre

Flujo nuevo:

1. Home muestra parada actual.
2. Entrar parada.
3. Acciones: Entregar, Cobrar, Devolver, No entregado.
4. Confirmar deja la parada resuelta.
5. Boton siguiente.

No hacer que el rutero cambie entre varias pantallas para el mismo cliente.

## Bodega movil

Bottom nav:

- Pedidos
- Picking
- Carga
- Ajustes

Flujo:

1. Lista por estados.
2. Tap pedido.
3. Checklist.
4. Alistar.
5. Cargar camion.

## Cobros

Nuevo patron:

- Lista de cuentas pendientes.
- Filtro por cliente/ruta.
- Tap abre bottom sheet.
- Campo monto prellenado con saldo.
- Metodo de pago default efectivo.
- Guardar.
- PDF opcional como accion posterior.

## Devoluciones

Nuevo patron:

- Buscar ticket o cliente.
- Seleccionar items.
- Cantidad con stepper.
- Motivo opcional.
- Guardar local si no hay red.

## Offline y sync

El lenguaje debe ser operativo, no tecnico.

Estados:

- Guardado.
- Pendiente de enviar.
- Enviado.
- Requiere revisar.

Ubicacion:

- Banner compacto arriba si hay pendientes/fallos.
- Pantalla `Sync` solo para detalle.
- Cada accion critica muestra confirmacion de guardado local o enviado.

## Visual Flutter

Mantener Material 3, pero bajar decoracion:

- Menos gradientes grandes.
- Menos sombras.
- Cards compactas.
- Botones de alto 48 a 52.
- Bottom sheets para acciones.
- FAB solo cuando hay una accion primaria clara.

Colores:

- Verde para exito/operacion.
- Azul para informacion.
- Ambar para pendiente.
- Rojo para bloqueo/error.
- Grises neutrales para estructura.

## Pantallas a consolidar

Revisar duplicidad:

- `features/orders/presentation/screens/quick_order_screen.dart`
- `features/preventa/presentation/screens/preventa_order_screen.dart`

Debe existir un solo motor de pedido movil, con variantes por rol si hace falta.

## Rutas nuevas sugeridas

- `/workday`
- `/workday/route`
- `/workday/client/:clientId`
- `/workday/order`
- `/workday/collections`
- `/workday/returns`
- `/workday/closing`
- `/sync`

Las rutas actuales pueden seguir apuntando internamente a estas pantallas hasta migrar.
