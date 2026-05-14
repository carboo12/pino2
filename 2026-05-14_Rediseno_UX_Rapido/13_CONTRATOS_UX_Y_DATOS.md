# Contratos UX y Datos

Fecha: 2026-05-14

## Objetivo

Evitar que cada IA implemente estados, colores, acciones y nombres de forma diferente.

## Contrato de estados operativos

Usar estos estados en React y Flutter:

- `idle`: listo para trabajar.
- `loading`: cargando datos iniciales.
- `refreshing`: actualizando sin bloquear.
- `empty`: no hay datos para el filtro/contexto.
- `error`: fallo recuperable.
- `blocked`: usuario no puede continuar sin resolver algo.
- `offline_saved`: accion guardada localmente.
- `sync_pending`: pendiente de enviar.
- `synced`: enviado/confirmado.
- `sync_failed`: requiere accion.

## Contrato visual de estados

- Exito: verde.
- Pendiente: ambar.
- Error/bloqueo: rojo.
- Info/sync: azul.
- Neutral: gris.

Cada estado debe tener:

- icono
- texto corto
- accion si aplica

No depender solo del color.

## Contrato de accion primaria

Cada pantalla/workspace debe declarar una accion primaria.

Ejemplos:

- Caja: `Cobrar`.
- Bodega recibido: `Preparar`.
- Bodega preparando: `Alistar`.
- Bodega alistado: `Cargar`.
- Ruta: `Resolver parada`.
- Cliente preventa: `Crear pedido`.
- Admin: `Resolver alerta`.

Si una pantalla tiene dos acciones principales compitiendo, esta mal diseñada.

## Contrato de objeto seleccionado

Los workspaces deben girar alrededor de un objeto seleccionado:

- Caja: ticket actual.
- Bodega: pedido seleccionado.
- Ruta: parada seleccionada.
- Preventa: cliente seleccionado.
- Finanzas: cuenta/cliente seleccionado.
- Catalogo: producto seleccionado.
- Admin: excepcion seleccionada.

El detalle va en `ContextPanel` o bottom sheet.

## Contrato de busqueda

Toda busqueda debe soportar:

- texto parcial
- codigo/barcode si aplica
- limpiar filtro
- empty state accionable

Busqueda global:

- producto
- cliente
- pedido
- ticket
- usuario
- ruta

## Contrato scanner

Scanner en React:

- scanner USB = entrada de teclado.
- Enter confirma scan.
- No requiere abrir camara.
- Si hay modal activo, no robar foco.

Scanner en Flutter:

- primera fase: entrada manual/scanner fisico si aplica.
- busqueda offline primero.
- camara solo como mejora posterior si se define plugin.

Resultado scanner:

- encontrado
- no encontrado
- duplicado
- sin stock
- requiere cantidad

## Contrato offline

Toda accion critica en Flutter debe responder:

- guardado localmente
- enviado
- fallo

Acciones criticas:

- pedido
- cobro
- devolucion
- visita
- cierre

No mostrar lenguaje tecnico como `queue`, `payload`, `batch`. Usar:

- Pendiente de enviar.
- Enviado.
- Requiere revisar.

## Contrato de errores

Error debe incluir:

- que paso
- que puede hacer el usuario
- boton reintentar si aplica

Ejemplo:

- Malo: `Error 500`.
- Mejor: `No se pudo cargar la cartera. Puedes reintentar o seguir con datos guardados.`

## Contrato de loading

Regla:

- Si no hay datos: skeleton/loading.
- Si hay cache: mostrar cache y refrescar discreto.
- No bloquear toda la pantalla por refresco.

## Contrato de navegacion

Destinos maximos:

- rol operativo: 3 a 4.
- store admin: 6 a 7.
- master admin: 7.

Submodulos:

- tabs internas
- comando global
- panel contextual
- menu secundario `Mas`

## Contrato de nombres

Usar palabras de operacion, no de sistema:

- `Caja`, no `Cash Register`.
- `Bodega`, no `Warehouse`.
- `Ruta`, no `Delivery Route`.
- `Pendiente de enviar`, no `sync pending`.
- `Preparar`, `Alistar`, `Cargar`, no nombres tecnicos.

## Contrato de rendimiento percibido

Metas:

- Accion local responde visualmente en menos de 100 ms.
- Guardado offline muestra confirmacion en menos de 500 ms.
- Pantalla con cache abre en menos de 1.5 s.
- Scanner agrega producto sin animacion lenta.

## Contrato de no regresion UX

No aceptar una pieza si:

- aumenta clics para la tarea principal.
- mete otra ruta al menu principal sin justificar.
- exige red para tarea que antes podia quedar local.
- pierde cliente/ticket/pedido al cambiar panel.
- oculta total, estado o accion principal.
- rompe permisos por rol.
