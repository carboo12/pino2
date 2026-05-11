# PLAN MAESTRO DE CORRECCIÓN — PINO2 AL 100%
**Generado:** 10 de Mayo, 2026
**Basado en:** Análisis exhaustivo de código fuente (backend 38 módulos, web ~60 páginas, Flutter 14 features)
**Objetivo:** Plan detallado pieza por pieza para que cualquier IA (DeepSeek v4 Flash) resuelva TODO lo faltante o incorrecto.

---

## DIAGNÓSTICO GENERAL

| Capa | Estado Real | Problemas |
|------|-------------|-----------|
| Backend | ✅ 98% (38/38 módulos funcionales) | Solo 1 incidencia menor: `@Controller()` sin prefijo en departments |
| Web React | ⚠️ 88% (~53/60 páginas listas) | **7 piezas con datos mock/hardcodeados o funciones faltantes** |
| Flutter | ⚠️ 82% (12/14 features completas) | **3 piezas con datos mock/hardcodeados** |
| Base de Datos | ✅ 100% (52 tablas, 6 migraciones) | Sin problemas estructurales |
| APK Producción | ❌ 0% | No generado |
| Pruebas terreno | ❌ 0% | No realizadas |

---

## PIEZA 1 — BACKEND: Arreglar @Controller() sin prefijo en departments

**Archivo:** `backend/src/modules/departments/departments.controller.ts`
**Problema:** Usa `@Controller()` sin parámetro. Las rutas se registran como `/departments`, `/sub-departments` a nivel raíz en lugar de bajo un prefijo común.
**Gravedad:** Baja (funciona igual, pero inconsistente con el resto del sistema)

**Solución:**
1. Cambiar `@Controller()` por `@Controller('departments')`
2. Quitar `'departments'` y `'sub-departments'` de los decoradores de ruta individuales, dejando solo `''` y `'sub-departments'`

```typescript
// ANTES:
@Controller()
export class DepartmentsController {
  @Get('departments') ...
  @Get('sub-departments') ...
  @Post('departments') ...
  @Delete('departments/:id') ...
  @Patch('departments/:id') ...
}

// DESPUES:
@Controller('departments')
export class DepartmentsController {
  @Get() findAll(...)
  @Get('sub-departments') findSubAll(...)
  @Post() create(...)
  @Delete(':id') delete(...)
  @Patch(':id') update(...)
}
```

**Verificación:** GET /api/departments debe responder igual que antes.

---

## PIEZA 2 — WEB: Eliminar Math.random() y datos mock de LiquidationRoute

**Archivo:** `web/src/pages/store-admin/finance/liquidation-route-page.tsx`
**Problema:** Líneas 38-46 usan datos mock como fallback si el endpoint `/liquidaciones-ruta` falla. Valores inventados: `pedidos_entregados: 45`, `pedidos_rechazados: 2`, `cobros_contado: 12500`, `cobros_credito: 4500`, `devoluciones: 3`. Línea 60: `'Liquidacion automática prototipo'`.

**Solución:**
1. Eliminar el objeto `mockData` completo (líneas 38-46)
2. Si la API falla, mostrar estado de error con botón "Reintentar" en lugar de datos falsos
3. Eliminar el string `'Liquidacion automática prototipo'` — si no hay observaciones reales, dejar vacío

```tsx
// ELIMINAR esto:
const mockData = { pedidos_entregados: 45, pedidos_rechazados: 2, ... };

// REEMPLAZAR por:
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['liquidaciones-ruta', storeId, selectedDate],
  queryFn: () => api.get(`/liquidaciones-ruta?storeId=${storeId}&date=${selectedDate}`),
  enabled: !!selectedDate,
});
// Si error: mostrar mensaje de error + botón Reintentar
// Si isLoading: mostrar skeleton
// Si data: mostrar datos reales
```

**Verificación:** Ir a Finanzas > Liquidación de Ruta. Si la API falla, debe mostrar error, no datos inventados.

---

## PIEZA 3 — WEB: Eliminar datos mock del ControlTower chartData

**Archivo:** `web/src/pages/store-admin/control-tower/control-tower-page.tsx`
**Problema:** Líneas 20-29: `chartData` con datos hardcodeados de actividad por hora (08:00:12, 09:00:18, etc.). No vienen del backend.

**Solución:**
1. Eliminar el array `chartData` hardcodeado
2. Crear endpoint `GET /control-tower/activity?storeId=X&date=Y` en backend (o usar `/orders` + `/sales` filtrado por hora)
3. Procesar las órdenes/ventas reales para agrupar por hora y generar el chartData real

```tsx
// ELIMINAR:
const chartData = [
  { hour: '08:00', orders: 12, deliveries: 8 },
  { hour: '09:00', orders: 18, deliveries: 14 },
  // ...
];

// REEMPLAZAR por query real:
const { data: orders } = useQuery({
  queryKey: ['orders-today', storeId],
  queryFn: () => api.get(`/orders?storeId=${storeId}&fromDate=${today}`),
});
// Agrupar orders por hora de created_at
const chartData = groupByHour(orders);
```

Si implementar el endpoint backend es muy costoso, como mínimo quitar los datos hardcodeados y mostrar "Datos no disponibles" temporalmente.

**Verificación:** Ir a Torre de Control. El gráfico debe mostrar datos reales o indicar claramente que no hay datos.

---

## PIEZA 4 — WEB: Implementar onClick en botones de CashRegister

**Archivo:** `web/src/pages/store-admin/cash-register/cash-register-page.tsx`
**Problema:** Botones "IMPRIMIR CORTE X (LECTURA)" y "ÚLTIMAS 50 VENTAS" no tienen handler onClick implementado.

**Solución:**
1. Botón "CORTE X": Crear función que llame `GET /sales/report?storeId=X&shiftId=Y` y genere un PDF con jsPDF mostrando: total ventas efectivo, total ventas tarjeta, total general, fecha/hora
2. Botón "ÚLTIMAS 50 VENTAS": Crear función que llame `GET /sales?storeId=X&limit=50` y muestre un diálogo/modal con tabla de últimas ventas (producto, cantidad, total, hora)

```tsx
// A IMPLEMENTAR:
const handlePrintCorteX = async () => {
  const { data } = await api.get(`/sales/report?storeId=${storeId}&shiftId=${activeShift.id}`);
  // Generar PDF con jsPDF y abrirlo
};

const handleShowLastSales = () => {
  setShowLastSalesDialog(true);
  // El diálogo ya hace fetch de /sales?limit=50
};
```

**Verificación:** Ambos botones deben ejecutar una acción funcional.

---

## PIEZA 5 — WEB: Implementar botón Eliminar en ClientGroups

**Archivo:** `web/src/pages/store-admin/clients/client-groups-page.tsx`
**Problema:** Línea 75: Botón "Eliminar" no tiene handler onClick implementado.

**Solución:**
1. Crear función `handleDelete(groupId)` que llame `DELETE /grupos-clientes/:id`
2. Agregar confirmación con diálogo antes de eliminar
3. Invalidar query `grupos-clientes` para refrescar lista

```tsx
const handleDelete = async (groupId: string) => {
  if (!confirm('¿Eliminar este grupo?')) return;
  await api.delete(`/grupos-clientes/${groupId}`);
  queryClient.invalidateQueries({ queryKey: ['grupos-clientes'] });
};

// En el botón:
<Button onClick={() => handleDelete(group.id)} variant="destructive">Eliminar</Button>
```

**Verificación:** El botón Eliminar debe borrar el grupo y refrescar la lista.

---

## PIEZA 6 — WEB: Conectar EconomicGroups deuda con backend real

**Archivo:** `web/src/pages/store-admin/clients/economic-groups-page.tsx`
**Problema:** Línea 81: Deuda actual muestra "N/D" hardcodeado.

**Solución:**
1. Obtener `saldo_total` del endpoint `GET /grupos-economicos/:id` (ya existe en backend, verificar `economic-groups.service.ts`)
2. Mostrar el valor real formateado como moneda

```tsx
// ANTES: Deuda actual: N/D
// DESPUES:
<TableCell>{formatCurrency(group.saldoTotal)}</TableCell>
```

**Verificación:** La columna Deuda debe mostrar el valor real del grupo económico.

---

## PIEZA 7 — WEB: Eliminar genericClient hardcodeado de Billing y Dispatcher

**Archivos:**
- `web/src/pages/store-admin/billing/billing-page.tsx` (línea 79-86)
- `web/src/pages/store-admin/dispatcher/dispatcher-page.tsx` (línea 26)

**Problema:** Cliente genérico `{ id: 'generic', name: 'CLIENTE GENERAL' }` hardcodeado para ventas al mostrador.

**Solución:**
1. Crear endpoint `GET /clients/default?storeId=X` en backend que retorne el cliente por defecto de la tienda
2. O alternativamente, en settings de tienda permitir seleccionar un cliente default y guardarlo en `stores.settings.default_client_id`
3. Cargar el cliente default desde la API en lugar de hardcodearlo

Si el cliente genérico es intencional para ventas sin cliente, al menos guardarlo en DB como un cliente real tipo "VENTA MOSTRADOR" en vez de un string mágico `'generic'`.

```tsx
// REEMPLAZAR:
const { data: defaultClient } = useQuery({
  queryKey: ['default-client', storeId],
  queryFn: () => api.get(`/stores/${storeId}/settings`).then(r => r.defaultClient),
});
```

**Verificación:** El POS debe seguir funcionando con el cliente mostrador pero obtenido de la configuración real.

---

## PIEZA 8 — FLUTTER: Eliminar KPIs hardcodeados de PreventaHomeScreen

**Archivo:** `flutter/lib/features/preventa/presentation/screens/preventa_home_screen.dart`
**Problema:** Líneas 117, 140-165: KPIs inventados ("Visitas: 8 de 15", "Vendido: C$ 12k", "Pedidos: 5", "Pendientes: 2", "Sincronizado hace 5min") y pedidos recientes con nombres inventados ("Pulp. Doña María C$450", "Mini Súper El Sol C$1,200").

**Solución:**
1. Eliminar todos los datos hardcodeados
2. Cargar KPIs desde endpoints reales del backend:
   - Visitas del día: `GET /visit-logs?vendorId=X&date=Y`
   - Total vendido: `GET /orders?vendorId=X&fromDate=Y&status=ENTREGADO`
   - Pedidos del día: `GET /orders?vendorId=X&fromDate=Y`
   - Pendientes: `GET /orders?vendorId=X&status=PENDIENTE`
3. Calcular valores reales y mostrarlos

```dart
// Usar FutureBuilder o Riverpod provider:
final visitasHoy = ref.watch(visitasDelDiaProvider);
final totalVendido = ref.watch(totalVendidoProvider);
final pedidosHoy = ref.watch(pedidosDelDiaProvider);
final pendientes = ref.watch(pedidosPendientesProvider);

// En el build:
KpiCard(title: 'Visitas', value: '${visitasHoy?.length ?? 0} de ${rutaClientes?.length ?? 0}'),
KpiCard(title: 'Vendido', value: formatCurrency(totalVendido ?? 0)),
KpiCard(title: 'Pedidos', value: '${pedidosHoy?.length ?? 0}'),
KpiCard(title: 'Pendientes', value: '${pendientes?.length ?? 0}'),
```

**Verificación:** La pantalla de inicio de Preventa debe mostrar datos reales del usuario logueado.

---

## PIEZA 9 — FLUTTER: Eliminar creditLimit hardcodeado de PreventaOrderScreen

**Archivo:** `flutter/lib/features/preventa/presentation/screens/preventa_order_screen.dart`
**Problema:** Línea 21: `_creditLimit = 2000.0` hardcodeado.

**Solución:**
1. Obtener `limite_credito` del cliente seleccionado desde `GET /clients?storeId=X` (ya se cargan clientes)
2. Usar el valor real del cliente: `clienteSeleccionado.limiteCredito`
3. Calcular si el pedido excede el límite basado en el saldo pendiente + monto del pedido actual

```dart
// ANTES: final _creditLimit = 2000.0;
// DESPUES: Obtener del cliente real
final cliente = ref.watch(clienteSeleccionadoProvider);
final creditLimit = cliente?.limiteCredito ?? 0;
final saldoPendiente = cliente?.saldoPendiente ?? 0;
final disponible = creditLimit - saldoPendiente;
```

**Verificación:** Al crear pedido a crédito, debe validar contra el límite real del cliente.

---

## PIEZA 10 — FLUTTER: Reimplementar RouteReturnsScreen con backend real

**Archivo:** `flutter/lib/features/returns/presentation/screens/route_returns_screen.dart`
**Problema:** Toda la pantalla es mock. Items hardcodeados ("Coca Cola 600ml x24", "Aceite Ideal 1L x2", "Galleta María x12") y usa `Future.delayed` de 1 segundo simulando operación. No llama ningún endpoint real.

**Solución:**
1. Eliminar TODOS los datos hardcodeados
2. Cargar inventario del rutero desde `GET /vendor-inventories/:vendorId` (productos asignados al camión)
3. Permitir seleccionar productos y cantidades a devolver
4. Enviar devolución a `POST /returns` con tipo=`rutero`
5. Usar el mismo patrón que `ReturnsScreen` (que SÍ está implementado correctamente)

```dart
// Implementar similar a ReturnsScreen existente:
// 1. Cargar vendor-inventories
final inventario = ref.watch(vendorInventoryProvider);
// 2. Mostrar lista de productos con cantidades
// 3. Seleccionar cantidades a devolver
// 4. POST /returns
// 5. Offline queue si no hay conexión
```

**Verificación:** La pantalla de devoluciones de rutero debe cargar datos reales del inventario asignado.

---

## PIEZA 11 — BASE DE DATOS / BACKEND: Verificar migración pendiente para bulk_price_1..5

**Archivos a verificar:**
- `backend/migrations/` — Ver si existe migración SQL para `bulk_price_1..5`
- `backend/src/modules/products/products.service.ts` — Ya tiene código para bulk_price_1..5 en INSERT/SELECT/UPDATE

**Problema:** El código backend y DTOs ya manejan `bulkPrice1..5`, pero podría faltar la migración SQL en PostgreSQL.

**Solución:**
1. Verificar si las columnas existen en la tabla `products` en producción con: `SELECT column_name FROM information_schema.columns WHERE table_name = 'products' AND column_name LIKE 'bulk%';`
2. Si no existen, ejecutar migración:
```sql
ALTER TABLE products
ADD COLUMN IF NOT EXISTS bulk_price_1 NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS bulk_price_2 NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS bulk_price_3 NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS bulk_price_4 NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS bulk_price_5 NUMERIC(12,2) DEFAULT 0;
```

**Verificación:** `SELECT bulk_price_1, bulk_price_2 FROM products LIMIT 1;` debe devolver columnas.

---

## PIEZA 12 — BASE DE DATOS: Verificar tablas de denominaciones en cash_shifts

**Archivos a verificar:**
- `backend/src/modules/cash-shifts/` — Ver si `denominations` se persiste en la tabla
- Tabla `cash_shifts` en PostgreSQL

**Problema:** Puede que la UI de caja registradora esté enviando denominaciones pero el backend no las persiste, o viceversa.

**Solución:**
1. Verificar el DTO de `cash-shifts` si acepta `openingDenominations` y `closingDenominations`
2. Verificar la tabla `cash_shifts` si tiene columnas `opening_denominations JSONB` y `closing_denominations JSONB`
3. Si faltan, agregar:
```sql
ALTER TABLE cash_shifts
ADD COLUMN IF NOT EXISTS opening_denominations JSONB,
ADD COLUMN IF NOT EXISTS closing_denominations JSONB;
```
4. Actualizar el servicio para persistir y leer estos campos

**Verificación:** Abrir caja con denominaciones, cerrar sesión, volver a entrar — los datos deben persistir.

---

## PIEZA 13 — WEB: Arqueos — Verificar Math.random() eliminado

**Archivo:** `web/src/pages/store-admin/finance/arqueos-page.tsx`
**Referencia:** El plan maestro del 4-Mayo indicaba `Math.random() * 50000` en línea 55. El estado del 8-Mayo dice que ya fue corregido.

**Acción:**
1. Verificar que `Math.random()` NO exista más en este archivo
2. Verificar que el monto esperado venga de `GET /daily-closings/summary?storeId=X&ruteroId=Y`
3. Si aún existe `Math.random()`, aplicar fix:
```tsx
// ELIMINAR: const expectedAmount = Math.random() * 50000;
// USAR:
const { data: summary } = useQuery({
  queryKey: ['daily-closings-summary', storeId, selectedRutero],
  queryFn: () => api.get(`/daily-closings/summary?storeId=${storeId}&ruteroId=${selectedRutero}`),
});
```

**Verificación:** La página de arqueos debe mostrar datos reales del backend.

---

## PIEZA 14 — WEB: Verificar edición de barcode en EditProduct

**Archivo:** `web/src/pages/store-admin/products/edit-product-page.tsx`
**Referencia:** El plan maestro del 4-Mayo indicaba que el campo barcode estaba `disabled`. El estado del 8-Mayo dice que ya fue corregido.

**Acción:**
1. Verificar que el input de barcode NO tenga el atributo `disabled`
2. Si aún está disabled, quitar el atributo
3. Verificar que el backend acepte `PATCH /products/:id` con actualización de barcode

**Verificación:** Poder editar el código de barras de un producto existente.

---

## PIEZA 15 — WEB: Verificar "T" eliminada de existencias

**Archivo:** `web/src/pages/store-admin/products/products-page.tsx`
**Referencia:** El plan maestro del 4-Mayo indicaba `{product.currentStock} T` en badge. El estado del 8-Mayo dice que ya fue corregido.

**Acción:**
1. Verificar que NO exista ` T` o `T` en el badge de existencias
2. Debe mostrar solo el número y debajo "X Bultos, Y Unidades"

**Verificación:** Listado de productos muestra existencias limpias sin "T".

---

## PIEZA 16 — VERIFICACIÓN: Endpoints fallando (500)

**Archivo:** `tests/reporte_auditoria_errores.md`
**Problema reportado:** `/users`, `/orders`, `/inventory`, `/finance` devuelven error 500.

**Acción:**
1. Probar manualmente cada endpoint con curl o Postman:
```bash
curl -H "Authorization: Bearer $TOKEN" https://www.rhclaroni.com/api-dev/users
curl -H "Authorization: Bearer $TOKEN" https://www.rhclaroni.com/api-dev/orders?storeId=1
curl -H "Authorization: Bearer $TOKEN" https://www.rhclaroni.com/api-dev/inventory/movements?storeId=1
curl -H "Authorization: Bearer $TOKEN" https://www.rhclaroni.com/api-dev/accounts-receivable?storeId=1
```
2. Si fallan, revisar logs del backend: `pm2 logs pino-api-dev --lines 50`
3. Posibles causas: datos corruptos, foreign keys faltantes, migraciones no ejecutadas
4. Corregir uno por uno según el error específico

**Verificación:** Los 4 endpoints deben responder 200 con datos.

---

## RESUMEN DE EJECUCIÓN (ORDEN RECOMENDADO)

| Orden | Pieza | Capa | Tiempo Est. | Dificultad |
|-------|-------|------|-------------|------------|
| **1** | Departments @Controller() prefix | Backend | 5 min | 🟢 Trivial |
| **2** | Arqueos Math.random() (verificar) | Web | 10 min | 🟢 Bajo |
| **3** | "T" en existencias (verificar) | Web | 5 min | 🟢 Trivial |
| **4** | Edición barcode (verificar) | Web | 5 min | 🟢 Trivial |
| **5** | Botón Eliminar ClientGroups | Web | 10 min | 🟢 Bajo |
| **6** | Liquidación Route mock data | Web | 30 min | 🟡 Medio |
| **7** | CashRegister botones sin onClick | Web | 45 min | 🟡 Medio |
| **8** | EconomicGroups deuda N/D | Web | 10 min | 🟢 Bajo |
| **9** | ControlTower chartData mock | Web | 45 min | 🟡 Medio |
| **10** | Billing/Dispatcher genericClient | Web | 30 min | 🟡 Medio |
| **11** | bulk_price_1..5 migración BD | BD | 15 min | 🟢 Bajo |
| **12** | Denominaciones en cash_shifts BD | BD+Backend | 30 min | 🟡 Medio |
| **13** | PreventaHomeScreen KPIs mock | Flutter | 1 hora | 🟡 Medio |
| **14** | PreventaOrderScreen creditLimit | Flutter | 20 min | 🟢 Bajo |
| **15** | RouteReturnsScreen completa | Flutter | 2 horas | 🔴 Alto |
| **16** | Verificar endpoints fallando 500 | Backend+BD | Variable | 🔴 Variable |
| **17** | Generar APK producción | Flutter | 1 hora | 🟡 Medio |

**TOTAL ESTIMADO:** ~8-10 horas de trabajo

---

## LO QUE YA ESTÁ BIEN (NO TOCAR)

- ✅ Auth JWT (login, refresh, roles) — Sólido en 3 capas
- ✅ CRUD productos con 10 precios (5 unidad + 5 bulto) — Backend y DTOs listos
- ✅ Máquina de estados de pedidos (RECIBIDO→EN_PREPARACION→ALISTADO→CARGADO→EN_ENTREGA→ENTREGADO)
- ✅ POS / Facturación — Funcional
- ✅ Inventario con kardex, ajustes, transferencias — Completo
- ✅ Proveedores, facturas, CxC, CxP — Backend y frontend OK
- ✅ Despacho, carga camión, rutas — Implementado
- ✅ Warehouse/Bodega kanban — Web y Flutter OK
- ✅ Sincronización offline (Flutter Drift + sync queue)
- ✅ WebSocket realtime (Socket.IO)
- ✅ Delta sync con idempotencia
- ✅ Grupos económicos (mora cruzada)
- ✅ Autorizaciones de precio (P4, P5)
- ✅ Cierre diario de rutero (daily-closings)
- ✅ Devoluciones (returns.service.ts 533 líneas)
- ✅ Roles: master-admin, store-admin, cashier, inventory, dispatcher, rutero, vendor, sales-manager
- ✅ Denominaciones en arqueo (ya con UI real)

---

## INSTRUCCIONES PARA LA IA (DeepSeek v4 Flash)

1. **Trabajar pieza por pieza**, en el orden indicado arriba
2. **NO eliminar nada** que ya exista y funcione
3. **Leer el archivo completo** antes de editar
4. **Usar los mismos patrones** del código existente (mismos imports, mismos hooks, mismo estilo)
5. **Verificar tipos** — todos los archivos son TypeScript/Dart tipados
6. **Probar cada pieza** después de implementarla (si hay servidor disponible)
7. **NO hacer refactors masivos** — solo corregir lo puntual
8. Las piezas 1-12 son web/backend, las piezas 13-15 son Flutter
