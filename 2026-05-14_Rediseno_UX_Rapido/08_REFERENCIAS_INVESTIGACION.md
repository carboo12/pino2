# Referencias de Investigacion

Fecha: 2026-05-14

## Fuentes consultadas

### Baymard Institute: minimizar esfuerzo y campos

Fuente:

- https://baymard.com/blog/checkout-flow-average-form-fields
- https://baymard.com/learn/checkout-flow-ux-optimization

Aplicacion a Pino2:

- El problema no es solo cantidad de pasos; es la cantidad de campos, decisiones y esfuerzo percibido.
- Para venta, cobro, cliente y devolucion, Pino2 debe mostrar solo campos necesarios.
- Defaults inteligentes: cliente mostrador, efectivo, tienda actual, saldo completo, fecha actual.
- Editar directo desde resumen, sin obligar al usuario a volver pantalla por pantalla.

Principios usados:

- Reducir campos visibles.
- Hacer el flujo manejable y lineal.
- Preservar datos si hay error.
- Mostrar costos/totales temprano.
- Usar etiquetas de accion precisas.

### Nielsen Norman Group: personalizacion por rol y foco en acciones criticas

Fuente:

- https://media.nngroup.com/media/reports/free/Intranet_Portals-_UX_Design_Experience_from_Real-Life_Projects.pdf
- https://www.nngroup.com/videos/mobile-images/

Aplicacion a Pino2:

- La pantalla inicial debe estar curada por rol y ubicacion/tienda.
- Las acciones criticas deben estar al frente.
- La personalizacion util es la que ayuda a trabajar, no temas decorativos.
- En movil, evitar decoracion que alarga y pesa pantallas si no aporta informacion.

Principios usados:

- Home por rol.
- Puestos de trabajo.
- Menos contenido decorativo.
- Acceso rapido a herramientas utiles.

### Apple Human Interface Guidelines: navegacion y busqueda

Fuente:

- https://developer.apple.com/design/human-interface-guidelines/navigation-and-search

Aplicacion a Pino2:

- La navegacion no debe dominar la tarea.
- Buscar debe ayudar a saltar directo a objetos de trabajo: cliente, pedido, producto, ticket.
- En movil se debe favorecer una navegacion familiar y enfocada.

### Material Design 3: navegacion por destinos principales

Fuente:

- https://m3.material.io/components/navigation-bar/overview
- https://m3.material.io/components/navigation-rail/overview

Aplicacion a Pino2:

- Web/tablet puede usar rail o sidebar compacto con pocos destinos principales.
- Movil debe usar bottom navigation solo para los destinos principales del rol.
- Los submodulos deben ir dentro de la pantalla, no como una lista interminable.

## Traduccion practica a Pino2

1. Menus cortos por rol.
2. Puestos de trabajo en vez de modulos.
3. Acciones primarias visibles.
4. Formularios cortos con defaults.
5. Paneles contextuales en vez de saltos de pantalla.
6. Estado offline como feedback operativo.
7. Estilo visual sobrio y rapido.

## Comparacion con sistemas POS/distribucion modernos

Un POS/distribucion moderno no fuerza al cajero, bodeguero o rutero a pensar en arquitectura. La interfaz debe seguir la tarea:

- Cajero: vender y cobrar.
- Bodega: mover pedidos.
- Rutero: resolver parada.
- Vendedor: vender al cliente actual.
- Admin: resolver excepciones.

Pino2 ya tiene los datos y endpoints para acercarse a esto. El rediseño debe reorganizar la experiencia alrededor de esas tareas.
