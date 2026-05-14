# Segunda Pasada: Huecos y Mejoras Faltantes

Fecha: 2026-05-14

## Resumen

El plan inicial va bien encaminado, pero faltaban detalles importantes para que Pino2 se sienta realmente rapido:

- Atajos de teclado en web.
- Modo escaner como flujo principal, no accesorio.
- Busqueda/comando global.
- Estados offline claros con confianza de guardado.
- Objetivos de velocidad medibles.
- Estados vacios/error/loading normalizados.
- Un criterio fuerte de que cosas no se deben volver a hacer.

## Hallazgos adicionales del codigo

### Ya existe base para velocidad

React ya tiene piezas que se pueden aprovechar:

- `web/src/components/ui/command.tsx` existe, asi que se puede construir comando global sin meter otra libreria.
- `web/src/components/pos/compact-dashboard.tsx` ya tiene atajos: `Del`, `F1`, `F2`, `F3`, `F10`.
- Hay soporte de barcode en productos, POS, inventario y ventas.
- Hay `billingMode` con `scan-and-add` y `scan-and-prompt`.
- Existe `barcode-scanner-dialog.tsx`, pero esta tratado como dialogo, no como modo principal de trabajo.

Flutter tambien tiene base fuerte:

- Drift/SQLite con indice para buscar barcode offline.
- `lookupByBarcode` en repositorio local.
- Cola local para pedidos/cobros/devoluciones.

### Lo que falta convertir en producto

La base tecnica existe, pero la experiencia no la pone al frente. El usuario no siente que el sistema fue diseñado alrededor de teclado, scanner, offline y siguiente accion.

## Mejora 1: Comando global

Agregar comando global en React:

- Atajo: `Ctrl+K` o `Alt+K`.
- Buscar producto, cliente, pedido, ticket, ruta, usuario.
- Ejecutar acciones sin navegar.

Acciones ejemplo:

- `Vender a Juan Perez`.
- `Abrir pedido 1042`.
- `Buscar ticket 000123`.
- `Ajustar Coca Cola`.
- `Cobrar cliente X`.
- `Ir a bodega`.

Esto reduce menus sin ocultar poder.

## Mejora 2: Atajos por puesto

### Puesto Caja

- `F2`: buscar producto.
- `F3`: seleccionar cliente.
- `F4`: abrir cobro.
- `F6`: devolucion.
- `F8`: ventas recientes.
- `F10`: cobrar.
- `Esc`: cancelar panel/dialog.
- `Del`: quitar item seleccionado.

### Puesto Bodega

- `F2`: buscar pedido.
- `F3`: preparar.
- `F4`: abrir picking.
- `F5`: refrescar.
- `F6`: cargar camion.
- `1-4`: cambiar columna.

### Centro Admin

- `F2`: buscar.
- `A`: autorizaciones.
- `S`: sync.
- `C`: cajas abiertas.

Regla: los atajos deben aparecer discretamente en tooltips, no como texto grande.

## Mejora 3: Modo scanner real

Para POS, inventario y bodega, el scanner debe ser el camino principal.

### React

Crear `ScanInput` comun:

- Siempre enfocado cuando el puesto esta activo.
- Detecta entrada rapida de scanner.
- Si encuentra producto, agrega o abre cantidad segun `billingMode`.
- Si no encuentra, muestra accion: crear codigo alterno o buscar manual.

### Flutter

Crear `ScanActionField`:

- Busca offline primero.
- Si hay red, puede validar despues.
- Si no hay producto, deja registrar pendiente de revision o buscar manual.

## Mejora 4: Offline como contrato de confianza

La investigacion confirma que en campo no basta con "tener cache". La app debe comunicar claramente:

- Guardado en este dispositivo.
- Pendiente de enviar.
- Enviado al servidor.
- Fallo que requiere accion.

### Cambios UX

- Cada pedido/cobro/devolucion debe mostrar un chip de estado.
- La pantalla de sync debe agrupar por tipo: pedidos, cobros, devoluciones, clientes.
- Cada item fallido debe tener: reintentar, ver detalle, descartar solo con permiso.
- Mostrar `Ultima sincronizacion: hora`.

## Mejora 5: Objetivos de tiempo

Definir metas medibles:

- Abrir pantalla principal del rol: menos de 1.5 s con cache.
- Buscar producto local: menos de 100 ms.
- Agregar producto por scanner: menos de 300 ms percibidos.
- Guardar pedido offline: menos de 500 ms.
- Cobro movil: menos de 20 s desde ficha de cliente.
- Venta mostrador simple: menos de 30 s desde primer scan a cobro.

## Mejora 6: Estados vacios y error

Ahora hay muchos patrones distintos: skeleton, spinner, alertas, textos sueltos, snackbars.

Crear componentes estandar:

- `EmptyState`
- `ErrorState`
- `LoadingRows`
- `OfflineSavedToast`
- `BlockingBanner`
- `InlineFieldError`

Regla:

- Loading no debe bloquear toda la pantalla si ya hay datos cacheados.
- Error debe decir que paso y que puede hacer el usuario.
- Empty state debe ofrecer accion directa.

Ejemplo:

- Malo: `No hay productos`.
- Mejor: `No hay productos para este filtro` + `Limpiar filtro` + `Crear producto`.

## Mejora 7: No usar dashboard como estacion de trabajo

Los dashboards sirven para observar, pero no para operar. En Pino2, cada rol debe abrir en trabajo activo:

- Cajero abre en venta.
- Bodeguero abre en pedidos recibidos.
- Rutero abre en proxima parada.
- Vendedor abre en proximo cliente.
- Admin abre en alertas.

Metricas quedan abajo o en tab secundaria.

## Mejora 8: Lista "No hacer"

No hacer:

- No meter mas pantallas sueltas al menu principal.
- No crear otro dashboard con cards grandes.
- No usar gradientes como solucion visual.
- No meter formularios largos en modales pequeños.
- No obligar al usuario movil a esperar red para guardar una accion critica.
- No separar cobro/devolucion/entrega cuando pertenecen al mismo cliente/parada.
- No hacer que un cajero salga de venta para abrir caja.
- No mostrar 10 opciones cuando el usuario necesita 1 accion principal.

## Mejora 9: Accesibilidad operativa

No basta con que se vea moderno.

Requisitos:

- Contraste fuerte para bodegas y exteriores.
- Texto legible sin depender de color.
- Targets tactiles minimos 44 px.
- Estados con icono + texto.
- Focus visible en web.
- Navegacion por teclado en POS.
- Confirmaciones claras para acciones irreversibles.

## Mejora 10: Reduccion de destinos visibles

La meta no es esconder todo. La meta es que el usuario vea maximo:

- 4 destinos para rol operativo.
- 6 destinos para admin tienda.
- 7 destinos para master.

Todo lo demas debe ser:

- comando global
- tab interna
- panel contextual
- accion desde objeto

## Ajuste al plan de implementacion

Agregar una Fase 0.5 antes de Caja:

### Fase 0.5: Velocidad transversal

Entregables:

- `CommandSearch`.
- `ScanInput`.
- `EmptyState/ErrorState/LoadingRows`.
- Mapa de atajos.
- `SyncStatusStrip`.

Razon:

Si esto se hace primero, Caja, Bodega y Flutter nacen rapidos desde el inicio.

## Prioridad final revisada

1. Fase 0: shell y tokens.
2. Fase 0.5: comando, scanner, estados y sync.
3. Puesto Caja.
4. Puesto Bodega.
5. Jornada Flutter.
6. Centro Admin.
7. Catalogo/Finanzas.
8. Limpieza visual global.

## Conclusion de segunda pasada

El plan original estaba correcto, pero para que Pino2 se sienta "rapido y facil" hay que tratar teclado, scanner, offline y estados como parte central del diseño. Sin eso, solo seria un rediseño visual mas ordenado.
