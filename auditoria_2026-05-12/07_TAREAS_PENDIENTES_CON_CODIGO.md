# 🔧 TAREAS PENDIENTES — Guía con Código

## TAREA 1: Generar APK Release 🔴 CRÍTICO

Ver guía completa en `06_INFRAESTRUCTURA_DEPLOY.md` sección "Flutter Deploy".

**Resumen rápido:**
```bash
cd sistema_final/flutter
flutter analyze          # Verificar 0 errores
flutter build apk --release
# → build/app/outputs/flutter-apk/app-release.apk
```

**Esfuerzo:** 1-2 horas (incluye signing key si es primera vez)

---

## TAREA 2: Verificar Migraciones en Producción 🔴 CRÍTICO

```bash
# Conectar a PostgreSQL de producción:
psql -h 190.56.16.85 -U postgres -d multitienda_db

# Verificar columnas bulk_price:
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'products' AND column_name LIKE 'bulk%'
ORDER BY column_name;
-- Debe mostrar: bulk_price_1, bulk_price_2, bulk_price_3, bulk_price_4, bulk_price_5

# Verificar denominaciones:
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'cash_shifts' AND column_name LIKE '%denominations'
ORDER BY column_name;
-- Debe mostrar: closing_denominations, opening_denominations

# Verificar historial:
SELECT * FROM migration_history ORDER BY executed_at;

# SI FALTA algo, ejecutar:
# cd sistema_final/backend && node migrations/run_all_migrations.js
```

**Esfuerzo:** 15 minutos

---

## TAREA 3: Probar Endpoints en Producción 🔴 CRÍTICO

Ver sección completa en `06_INFRAESTRUCTURA_DEPLOY.md`.

**Esfuerzo:** 30 minutos

---

## TAREA 4: Refactorizar genericClient 🟡 OPCIONAL

### Paso 1 — Backend: Endpoint default-client

Agregar en `backend/src/modules/stores/stores.controller.ts`:

```typescript
@Get(':id/default-client')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Obtener o crear cliente por defecto de la tienda' })
async getDefaultClient(@Param('id') storeId: string) {
  // Buscar cliente tipo MOSTRADOR existente
  const existing = await this.db.query(
    "SELECT * FROM clients WHERE store_id = $1 AND type = 'MOSTRADOR' LIMIT 1",
    [storeId]
  );
  
  if (existing.rowCount > 0) {
    return existing.rows[0];
  }
  
  // Crear automáticamente si no existe
  const created = await this.db.query(
    `INSERT INTO clients (store_id, name, phone, address, email, type)
     VALUES ($1, 'VENTA MOSTRADOR', '', '', '', 'MOSTRADOR') RETURNING *`,
    [storeId]
  );
  return created.rows[0];
}
```

### Paso 2 — Web: billing-page.tsx

Reemplazar líneas 79-86 y 186-193:

```tsx
// ELIMINAR estas líneas (79-86):
// const genericClient: Client = {
//   id: 'generic',
//   storeId: '',
//   name: 'Cliente Genérico',
//   ...
// };

// REEMPLAZAR fetchDefaultClient (líneas 186-193):
const fetchDefaultClient = async () => {
  try {
    const res = await apiClient.get(`/stores/${storeId}/default-client`);
    if (res.data) {
      setSelectedClient(res.data);
    }
  } catch {
    // Fallback: crear un objeto temporal (nunca se guarda en BD)
    setSelectedClient({
      id: 'temp-mostrador',
      storeId: storeId,
      name: 'VENTA MOSTRADOR',
      phone: '', address: '', email: ''
    });
  }
};
fetchDefaultClient();
```

### Paso 3 — Repetir en dispatcher-page.tsx y vendor-quick-sale-page.tsx

Mismo patrón: cargar cliente default desde API en vez de usar hardcoded.

**Esfuerzo:** 2 horas

---

## TAREA 5: Mejorar LiquidationRoute Empty State 🟢 OPCIONAL

**Archivo:** `web/src/pages/store-admin/finance/liquidation-route-page.tsx`

Reemplazar líneas 39-47:

```tsx
// ACTUAL:
setData({
  pedidos_entregados: 0,
  pedidos_rechazados: 0,
  cobros_contado: 0,
  cobros_credito: 0,
  devoluciones: 0,
  diferencia_arqueo: 0,
  status: 'SIN_DATOS'
});

// MEJOR:
setData(null);
```

Y agregar en el JSX debajo del componente de datos:

```tsx
{!data && !loading && selectedRutero && (
  <div className="text-center py-12 text-muted-foreground bg-muted/20 border rounded-xl border-dashed">
    <p className="text-lg font-medium">Sin datos de liquidación</p>
    <p className="text-sm mt-1">No se encontraron operaciones del rutero para esta fecha.</p>
  </div>
)}
```

**Esfuerzo:** 15 minutos

---

## TAREA 6: Definir Roles Nuevos 🟡 DECISIÓN DE NEGOCIO

**Roles propuestos pendientes:**
- `supervisor-caja` — ¿Qué permisos tendría?
- `auxiliar` — ¿Qué módulos accedería?
- `supervisor-pasillo` — ¿Qué acciones podría hacer?

**Implementación cuando se defina:**

### Backend: No requiere cambios (role es varchar libre)

### Web — App.tsx: Agregar al array correspondiente
```typescript
// Ejemplo si supervisor-caja necesita acceso a billing + cash + reports:
const SUPERVISOR_CAJA_ROLES: NormalizedUserRole[] = ['supervisor-caja', 'store-admin'];

// Y agregar en las rutas:
<Route path="/store/:storeId/billing" 
  element={<ProtectedRoute allowedRoles={[...CASHIER_ROLES, 'supervisor-caja']}>...}
/>
```

### Web — redirect-logic.ts: Agregar ruta default
```typescript
case 'supervisor-caja':
  return `/store/${storeIds[0]}/cash-register`;
```

### Web — user-role.ts: Agregar normalización
```typescript
case 'supervisor-caja':
case 'supervisor_caja':
  return 'supervisor-caja';
```

**Esfuerzo:** Variable (depende de definición de negocio)

---

## TAREA 7: Pruebas Piloto en Terreno 🔴 CRÍTICO

### Checklist de validación:

1. **Instalar APK** en 1-2 dispositivos de ruteros
2. **Login** con credenciales reales
3. **Iniciar ruta** — verificar que cargue clientes
4. **Crear pedido offline** — apagar datos móviles → crear pedido → confirmar que se guarda local
5. **Sincronizar** — encender datos → verificar que el pedido aparece en el panel web
6. **Cobro** — realizar cobro en ruta → verificar en CxC del panel web
7. **Devolución** — devolver producto → verificar que se actualiza inventario
8. **Cierre diario** — cerrar día → verificar liquidación en panel web
9. **Arqueo** — cajero en web hace arqueo → comparar valores

### Métricas de éxito:
- 0 pedidos perdidos durante sync
- Tiempo de sync < 5 segundos en 3G
- 0 crashes durante operación normal
- Coincidencia 100% entre totales Flutter vs Panel Web

---

## RESUMEN EJECUTIVO DE ESFUERZO

| Tarea | Esfuerzo | Prioridad |
|-------|----------|-----------|
| APK release | 1-2h | 🔴 Hacer primero |
| Verificar migraciones | 15min | 🔴 Hacer segundo |
| Probar endpoints prod | 30min | 🔴 Hacer tercero |
| Pruebas piloto | 2-3 días | 🔴 Hacer después del APK |
| genericClient | 2h | 🟡 Cuando haya tiempo |
| LiquidationRoute | 15min | 🟢 Cuando haya tiempo |
| Roles nuevos | Variable | 🟡 Cuando negocio defina |

**Total esfuerzo técnico restante: ~4 horas de código + 2-3 días de pruebas piloto.**

---

## LO QUE NO SE DEBE TOCAR (CÓDIGO ESTABLE VERIFICADO)

- ✅ Todos los 38 módulos del backend
- ✅ Sistema de autenticación JWT completo
- ✅ Cash-shifts con denominaciones
- ✅ POS/Facturación con Corte X y últimas 50 ventas
- ✅ Inventario completo (kardex, ajustes, valuación)
- ✅ Todas las 14 features de Flutter
- ✅ Sincronización offline con cola
- ✅ Delta sync con idempotencia
- ✅ WebSocket realtime
- ✅ Grupos económicos con mora cruzada
- ✅ Torre de control con datos reales
- ✅ Preventa con KPIs reales
- ✅ Devoluciones con inventario real
- ✅ Máquina de estados de pedidos
- ✅ 10 niveles de precio (5 unidad + 5 bulto)
- ✅ Autorizaciones de precio
- ✅ Cierre diario de rutero
- ✅ Arqueos con datos del backend

**REGLA DE ORO: No tocar lo que funciona. Solo completar las piezas listadas arriba.**
