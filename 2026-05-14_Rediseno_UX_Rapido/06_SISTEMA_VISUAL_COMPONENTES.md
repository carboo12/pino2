# Sistema Visual y Componentes

Fecha: 2026-05-14

## Direccion visual

Pino2 debe verse como una herramienta operativa moderna:

- Rapida.
- Clara.
- Ligera.
- Con buena densidad.
- Sin decoracion innecesaria.

## Lo que se elimina

- Neumorfismo pesado.
- Sombras grandes tipo relieve.
- Gradientes como fondo principal de cada pantalla.
- Cards gigantes para secciones completas.
- Titulos muy grandes en pantallas operativas.
- Bordes demasiado redondos.
- Iconos decorativos sin accion.

## Tokens propuestos React

Colores:

- Fondo app: `#F6F7F9`
- Superficie: `#FFFFFF`
- Borde: `#DDE2E8`
- Texto principal: `#17202A`
- Texto secundario: `#5B6673`
- Primario: `#0F766E`
- Info: `#2563EB`
- Pendiente: `#D97706`
- Error: `#DC2626`
- Exito: `#16A34A`

Radio:

- Inputs: 6 px
- Botones: 6 px
- Cards de item: 8 px
- Modals/paneles: 10 px

Sombras:

- Default: ninguna o muy leve.
- Popover/dialog: sombra media.

Tipografia:

- Mantener una sola familia.
- Titulos compactos.
- Evitar mayusculas con letter spacing alto en operacion.

## Tokens Flutter

Mantener Material 3, ajustar tema:

- `surface`: gris muy claro.
- `primary`: verde operacional.
- `secondary`: azul informacion o ambar pendiente.
- `error`: rojo claro y consistente.

Componentes:

- Cards compactas.
- List tiles con estado y accion.
- Bottom sheets con confirmacion.
- Segmented controls para modos.
- Steppers para cantidades.
- Banners compactos para sync.

## Componentes comunes React

### WorkspaceShell

Contenedor base para los puestos de trabajo.

Debe incluir:

- topbar compacta
- area principal
- panel contextual opcional
- action dock opcional

### CommandSearch

Busqueda global por rol.

Ejemplos:

- producto
- cliente
- pedido
- ticket
- ruta

Debe permitir acciones directas:

- abrir cliente
- agregar producto
- buscar ticket
- ir a pedido

### ContextPanel

Panel lateral para detalle y accion.

Reemplaza muchas pantallas/modal largos.

### ActionDock

Barra inferior fija para acciones primarias:

- cobrar
- guardar
- confirmar
- siguiente
- cerrar caja

### ExceptionInbox

Bandeja de alertas para admin:

- autorizaciones
- bloqueos
- stock critico
- sync fallido
- cajas abiertas

## Componentes comunes Flutter

### WorkdayScaffold

Base para jornada movil.

Incluye:

- appbar compacta
- sync banner
- bottom navigation
- area de tarea

### ClientWorkCard

Ficha operativa de cliente.

Muestra:

- nombre
- direccion
- credito
- mora
- acciones

### QuickActionSheet

Bottom sheet reusable para:

- cobrar
- devolver
- confirmar entrega
- visita sin venta

### SyncStatusStrip

Estado compacto:

- online
- pendiente
- fallo

## Reglas de UI

- El primer boton siempre debe ser la accion que el usuario probablemente necesita ahora.
- Los datos secundarios no deben competir con la accion primaria.
- Los filtros deben estar arriba de listas/tableros.
- Las acciones destructivas deben pedir confirmacion, pero sin dialogos largos.
- Los formularios deben mostrar solo campos necesarios.
- Los campos avanzados deben estar colapsados.
- El usuario nunca debe perder el carrito, cliente o pedido al cambiar de panel.

## Densidad recomendada

Desktop:

- topbar: 48 a 56 px
- filas de tabla: 40 a 48 px
- cards de pedido: 96 a 120 px
- panel lateral: 360 a 440 px

Mobile:

- bottom nav: 4 destinos maximo ideal
- botones principales: 48 a 52 px alto
- cards: 80 a 110 px segun contenido
- bottom sheets: 60 a 85% alto segun tarea
