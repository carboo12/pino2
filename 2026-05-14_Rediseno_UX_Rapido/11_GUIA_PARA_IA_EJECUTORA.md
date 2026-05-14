# Guia Para IA Ejecutora

Fecha: 2026-05-14

## Objetivo de esta guia

Este documento esta escrito para que cualquier IA o desarrollador pueda implementar el rediseño rapido sin volver a analizar todo desde cero.

La meta no es cambiar colores. La meta es que Pino2 sea mas rapido:

- Menos pantallas.
- Menos clics.
- Mas scanner.
- Mas teclado.
- Mas acciones directas.
- Offline claro.
- Cada rol abre en su trabajo real.

## Stack real detectado

### React Web

Usar lo que ya existe:

- React 19.
- Vite.
- TypeScript.
- Tailwind CSS.
- Radix/shadcn components en `web/src/components/ui`.
- `cmdk` ya instalado y wrapper en `web/src/components/ui/command.tsx`.
- `lucide-react` para iconos.
- `@tanstack/react-query` para datos.
- `axios` via `web/src/services/api-client.ts`.
- `react-router-dom`.
- `@zxing/library` para scanner/codigo de barras.

No meter librerias nuevas salvo necesidad real.

### Flutter

Usar lo que ya existe:

- Flutter Material 3.
- Riverpod.
- GoRouter.
- Dio.
- Drift/SQLite.
- connectivity_plus.
- socket_io_client.
- pdf/share_plus.
- cache local y cola en `flutter/lib/core/database` y `flutter/lib/core/network`.

No cambiar arquitectura completa. Crear capa nueva de jornada y reutilizar repositorios.

## Reglas antes de tocar codigo

1. Leer primero:
   - `web/src/App.tsx`
   - `web/src/components/app-layout.tsx`
   - `web/src/components/ui/command.tsx`
   - `web/src/services/api-client.ts`
   - `flutter/lib/app/router/app_router.dart`
   - `flutter/lib/app/theme/app_theme.dart`
   - `flutter/lib/core/database/local_cache_repository.dart`
   - `flutter/lib/core/network/sync_queue_processor.dart`

2. No borrar rutas viejas en la primera version.

3. Crear workspaces nuevos y apuntar menus principales a ellos.

4. Reutilizar componentes existentes si sirven, pero extraer logica cuando una pagina actual es demasiado grande.

5. Implementar por piezas pequeñas y verificables.

## Orden obligatorio recomendado

### Paso 1: Base visual y shell

Crear:

- `web/src/components/workspace/workspace-shell.tsx`
- `web/src/components/workspace/workspace-topbar.tsx`
- `web/src/components/workspace/context-panel.tsx`
- `web/src/components/workspace/action-dock.tsx`
- `web/src/components/workspace/empty-state.tsx`
- `web/src/components/workspace/error-state.tsx`
- `web/src/components/workspace/loading-rows.tsx`

Objetivo:

- Todas las pantallas nuevas se ven iguales.
- Nada de neumorfismo.
- Nada de headers gigantes.

### Paso 2: Comando global

Crear:

- `web/src/components/workspace/command-search.tsx`

Usar:

- `cmdk`
- `apiClient`
- `react-router-dom`
- `lucide-react`

Atajo:

- `Ctrl+K`
- `Alt+K` como alternativa si hace falta.

Debe buscar:

- productos
- clientes
- pedidos
- tickets
- rutas

Primera version puede empezar con acciones locales/rutas conocidas aunque todavia no busque todo en API.

### Paso 3: ScanInput

Crear:

- `web/src/components/workspace/scan-input.tsx`

Responsabilidad:

- Campo invisible/compacto siempre listo para scanner.
- Detectar Enter.
- Enviar codigo a handler.
- Mostrar ultimo codigo y resultado.

Usar despues en:

- caja
- inventario
- bodega

### Paso 4: Workspaces React

Crear rutas nuevas:

- `/store/:storeId/work`
- `/store/:storeId/work/cash`
- `/store/:storeId/work/warehouse`
- `/store/:storeId/work/sales`
- `/store/:storeId/work/finance`
- `/store/:storeId/work/catalog`
- `/store/:storeId/work/admin`

Crear paginas:

- `web/src/pages/work/work-home-page.tsx`
- `web/src/pages/work/cash-workspace-page.tsx`
- `web/src/pages/work/warehouse-workspace-page.tsx`
- `web/src/pages/work/sales-workspace-page.tsx`
- `web/src/pages/work/finance-workspace-page.tsx`
- `web/src/pages/work/catalog-workspace-page.tsx`
- `web/src/pages/work/admin-control-center-page.tsx`

### Paso 5: Cambiar navegacion

Editar:

- `web/src/components/app-layout.tsx`

Cambio:

- `getStoreAdminNav` debe mostrar 6 a 7 links maximo.
- Roles operativos deben mostrar 3 a 4 links maximo.
- Links deben apuntar a workspaces nuevos.

No eliminar funciones viejas todavia.

### Paso 6: Flutter Workday

Crear:

- `flutter/lib/features/workday/presentation/widgets/workday_scaffold.dart`
- `flutter/lib/features/workday/presentation/widgets/sync_status_strip.dart`
- `flutter/lib/features/workday/presentation/widgets/client_work_card.dart`
- `flutter/lib/features/workday/presentation/screens/workday_home_screen.dart`
- `flutter/lib/features/workday/presentation/screens/route_workday_screen.dart`
- `flutter/lib/features/workday/presentation/screens/client_work_screen.dart`

Editar:

- `flutter/lib/app/router/app_router.dart`
- redirigir `/home` o crear `/workday`.

## Como debe pensar la IA

Antes de implementar una pantalla, responder:

- Que rol usa esto.
- Cual es la accion primaria.
- Que datos necesita arriba.
- Que accion debe quedar en panel/bottom sheet.
- Que pasa offline.
- Que pasa si no hay datos.
- Que pasa si falla API.
- Cuantos clics/taps toma terminar.

Si no puede responder, la pantalla no esta lista para codificarse.

## Tecnologia por problema

### Navegacion rapida

React:

- `react-router-dom`.
- `cmdk`.
- `lucide-react`.

Flutter:

- `go_router`.
- `NavigationBar`.
- `showModalBottomSheet`.

### Datos y cache

React:

- `@tanstack/react-query`.
- `apiClient`.
- `queryClient.invalidateQueries`.

Flutter:

- Riverpod providers.
- repositorios existentes.
- Drift cache local.
- sync queue.

### Estados visuales

React:

- componentes comunes en `workspace`.
- Tailwind.

Flutter:

- widgets comunes.
- Material 3.

### Scanner

React:

- scanner de teclado como input principal.
- `@zxing/library` solo si se usa camara.

Flutter:

- buscar por codigo con cache local.
- si se necesita camara, evaluar plugin despues; primera fase puede soportar scanner fisico/entrada manual.

## Definicion de terminado

Una pieza esta terminada cuando:

- Compila.
- No rompe rutas viejas.
- Tiene loading, empty y error.
- Funciona con teclado/touch segun rol.
- Tiene accion primaria clara.
- Reduce clics contra flujo viejo.
- Mantiene permisos existentes.

## Comandos de verificacion

React:

```bash
cd /opt/apps/pino2/web
npm run build
npm run lint
npm run test
```

Flutter:

```bash
cd /opt/apps/pino2/flutter
flutter analyze
flutter test
```

Si una verificacion falla por algo preexistente, documentar el fallo exacto y no ocultarlo.
