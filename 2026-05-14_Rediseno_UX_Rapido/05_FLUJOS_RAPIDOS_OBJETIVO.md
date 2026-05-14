# Flujos Rapidos Objetivo

Fecha: 2026-05-14

## Regla de medicion

Cada flujo se mide por:

- pantallas visitadas
- clics/taps
- campos visibles
- decisiones necesarias
- posibilidad de volver al trabajo sin perder contexto

## Venta mostrador

Actual aproximado:

- Entrar a caja o facturacion.
- Validar turno.
- Buscar producto.
- Seleccionar cliente si aplica.
- Agregar productos.
- Abrir pago.
- Confirmar.
- Imprimir o volver.

Nuevo:

1. Abrir Puesto Caja.
2. Escanear o buscar.
3. Cobrar.

Objetivo:

- 1 pantalla.
- Cliente mostrador default.
- Metodo de pago default.
- Total siempre visible.
- Cobro como panel lateral.

## Apertura de caja

Nuevo:

1. Si no hay caja abierta, Puesto Caja muestra boton `Abrir caja`.
2. Dialog de denominaciones o monto inicial.
3. Confirmar.

Objetivo:

- No navegar a otra pantalla.
- Monto puede ser simple o detallado.

## Cierre de caja

Nuevo:

1. Desde Puesto Caja, tab `Caja`.
2. Ver esperado.
3. Ingresar conteo.
4. Confirmar diferencia.

Objetivo:

- Diferencia visible en tiempo real.
- Corte X disponible sin salir.

## Preparar pedido en bodega

Actual:

- Ir a pending orders/warehouse.
- Identificar pedido.
- Cambiar estado.
- Abrir detalle.
- Validar productos.
- Cambiar estado.
- Cargar camion desde otra zona.

Nuevo:

1. Abrir Puesto Bodega.
2. Seleccionar pedido en columna Recibidos.
3. Click `Preparar`.
4. Checklist en panel.
5. Click `Alistar`.
6. Seleccionar camion/rutero.
7. Click `Cargar`.

Objetivo:

- Todo en una pantalla.
- Panel lateral conserva contexto.
- Sin saltos entre modulos.

## Ruta del rutero

Actual:

- Ruta.
- Entregas.
- Cobros.
- Devoluciones.
- Cierre.

Nuevo:

1. Abrir Jornada.
2. Ver proxima parada.
3. Entrar cliente.
4. Entregar, cobrar o devolver.
5. Siguiente parada.

Objetivo:

- Cliente como unidad de trabajo.
- Acciones alrededor del cliente.
- No saltar entre pantallas por cada accion.

## Preventa

Nuevo:

1. Abrir Jornada Preventa.
2. Proximo cliente.
3. Pedido o visita sin venta.
4. Guardar.
5. Siguiente cliente.

Objetivo:

- Pedido en una sola pantalla.
- Carrito persistente.
- Credito/mora visible antes de confirmar.
- Guardado offline transparente.

## Cobro en campo

Nuevo:

1. Desde cliente o lista de cartera.
2. Tap `Cobrar`.
3. Monto prellenado.
4. Confirmar.

Objetivo:

- 1 bottom sheet.
- PDF opcional despues.
- Offline permitido.

## Alta rapida de cliente

Nuevo:

1. Boton `Nuevo cliente`.
2. Nombre, telefono, direccion.
3. Guardar.

Campos avanzados:

- Se ocultan en "Mas datos".

Objetivo:

- No bloquear la venta por datos administrativos.

## Autorizacion de precio

Nuevo:

1. Admin ve alerta.
2. Abre detalle.
3. Aprobar/rechazar.

Objetivo:

- Bandeja de excepciones.
- Accion directa.

## Indicadores de exito UX

- Cajero vende sin abrir menu lateral.
- Bodeguero no cambia de pantalla para mover un pedido.
- Rutero resuelve cliente desde una ficha.
- Vendedor no vuelve al home para pasar al siguiente cliente.
- Admin resuelve alertas desde una bandeja.
