# Diagnostico Actual React y Flutter

Fecha: 2026-05-14

## Resumen ejecutivo

Pino2 no esta flojo por falta de funciones. Esta pesado porque muchas funciones estan expuestas como pantallas separadas, menus largos y modulos aislados. El usuario tiene que "buscar donde hacer la tarea" en vez de encontrar la tarea lista segun su rol.

El problema principal es experiencia, no backend.

## Evidencia del codigo

React:

- Rutas principales en `web/src/App.tsx`.
- Layout y menus por rol en `web/src/components/app-layout.tsx`.
- Pantallas en `web/src/pages`.
- Se encontraron mas de 60 paginas TSX solo en `web/src/pages`.
- Store admin acumula caja, facturacion, dashboard, productos, usuarios, inventario, proveedores, caja, autorizaciones, pedidos, despacho, bodega, ruta, finanzas, ventas en calle, reportes, clientes, configuracion y ayuda.

Flutter:

- Rutas moviles en `flutter/lib/app/router/app_router.dart`.
- Tema en `flutter/lib/app/theme/app_theme.dart`.
- Features en `flutter/lib/features`.
- Se encontraron flujos para login, home, catalogo, clientes, cobros, ruta, bodega, preventa, devoluciones, historial, inventario de vendedor y cierre diario.

## Problemas React Web

### 1. Menu demasiado grande

El rol `store-admin` ve un mapa completo del sistema. Aunque hay grupos, sigue siendo una lista mental larga. Para una tarea diaria como cobrar, despachar, cargar o revisar cartera, el usuario primero debe decidir en que modulo entrar.

Efecto:

- Mas clics.
- Mas dudas.
- Mas capacitacion.
- Mayor riesgo de entrar a la pantalla incorrecta.

### 2. Muchas pantallas para tareas que deberian ser una estacion

Ejemplos:

- Caja y facturacion viven separadas, aunque para cajero son parte del mismo trabajo.
- Pedidos pendientes, dispatcher, warehouse, dispatch y cargas se sienten como piezas de un mismo flujo, pero estan separados.
- Vendedores, clientes, zonas, rutas, cobranza, devoluciones e inventario se muestran como modulos distintos, aunque para campo son una sola jornada.

### 3. Estilos mezclados

Hay paginas sobrias y modernas, paginas con neumorfismo pesado, paginas tipo dashboard, tablas clasicas y tableros kanban. No se siente un solo producto.

Problema visual:

- Sombras muy fuertes.
- Bordes muy redondos en pantallas operativas.
- Gradientes grandes que ocupan atencion.
- Cards usadas como contenedores de secciones completas.
- Mucha decoracion donde el usuario necesita velocidad.

### 4. Densidad mal distribuida

Algunas pantallas tienen mucho aire y poca informacion util arriba del fold. Otras son densas pero sin una jerarquia clara.

En un sistema de operacion, el primer viewport debe responder:

- Que tengo pendiente.
- Que debo hacer ahora.
- Cual es la proxima accion.
- Donde busco rapido.

### 5. Acciones frecuentes escondidas

El dashboard ya intenta mejorar con acciones rapidas, pero eso no esta aplicado como regla global. Cada rol necesita su home operativo real.

## Problemas Flutter

### 1. Flutter esta mejor enfocado, pero aun puede ser mas directo

La app movil tiene una regla mas correcta: tocar, resolver y seguir. Aun asi, el home mezcla metricas, sync, tienda, realtime y accesos. Para un usuario de calle, lo primero debe ser la siguiente parada, siguiente cliente o tarea pendiente.

### 2. Hay duplicidad conceptual

Existen flujos `orders/quick_order` y `preventa/preventa_order`. Eso puede confundir arquitectura y experiencia si no se define cual es el flujo canonico.

### 3. Falta modo jornada

El movil deberia funcionar alrededor de una jornada:

- iniciar ruta
- cliente actual
- vender/cobrar/devolver
- siguiente cliente
- cierre

Ahora existen pantallas para eso, pero falta una experiencia continua.

### 4. Feedback offline mejorable

Ya existe cola local, reintento y estado de red. Falta que se vea como parte natural del flujo, no como informacion tecnica. El usuario necesita saber:

- Guardado local.
- Pendiente por enviar.
- Enviado.
- Fallo que requiere accion.

## Diagnostico por tipo de usuario

### Cajero

Necesita:

- Abrir caja.
- Escanear/buscar producto.
- Cobrar.
- Imprimir o registrar.
- Hacer devolucion.
- Ver ventas recientes.

Hoy: caja y facturacion se sienten como dos lugares.

Nuevo enfoque: una estacion de caja con paneles: Venta, Caja, Devolucion, Ultimas ventas.

### Bodega

Necesita:

- Ver pedidos que entraron.
- Preparar.
- Validar productos.
- Alistar.
- Cargar camion.

Hoy: hay warehouse, dispatch, pending orders, cargas. Funciona, pero fragmenta.

Nuevo enfoque: una estacion de bodega con columnas y panel lateral de accion.

### Rutero

Necesita:

- Ver ruta del dia.
- Entrar cliente.
- Entregar.
- Cobrar.
- Registrar devolucion.
- Cerrar dia.

Hoy: rutas, cobros, devoluciones y cierre son pantallas separadas.

Nuevo enfoque: jornada de ruta en una pantalla, con acciones por parada.

### Vendedor / Preventa

Necesita:

- Ver clientes del dia.
- Entrar cliente.
- Tomar pedido.
- Registrar visita sin venta.
- Ver credito/mora.
- Siguiente cliente.

Hoy: hay pantallas, pero falta continuidad.

Nuevo enfoque: jornada comercial con cliente actual y pedido compacto.

### Store Admin

Necesita:

- Pulso del negocio.
- Excepciones.
- Autorizar.
- Resolver bloqueos.
- Entrar a areas operativas si hace falta.

Hoy: ve casi todo como menu.

Nuevo enfoque: centro de control con alertas y acciones, no lista completa.

## Conclusion

La aplicacion debe pasar de "menu de modulos" a "puestos de trabajo por rol". El usuario no debe pensar en rutas. Debe ver acciones listas, datos relevantes y una forma directa de completar la tarea.
