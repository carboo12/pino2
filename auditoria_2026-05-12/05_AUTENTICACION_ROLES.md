# 🔐 AUDITORÍA AUTENTICACIÓN Y ROLES

## Sistema JWT — Verificado

| Parámetro | Valor |
|-----------|-------|
| Access Token TTL | 12 horas |
| Refresh Token TTL | 7 días |
| Algoritmo | HS256 |
| Payload | `{ sub, email, role, storeIds[] }` |
| Almacenamiento (Web) | localStorage via AuthContext |
| Almacenamiento (Flutter) | flutter_secure_storage |

## Guards del Backend

| Guard | Función |
|-------|---------|
| `JwtAuthGuard` | Verifica token válido y no expirado |
| `StoreAccessGuard` | Verifica que el usuario tenga acceso a la tienda solicitada |

## Flujo de Login (Web)

```
1. POST /api/auth/login { email, password }
2. Backend valida bcrypt → genera JWT
3. Response: { accessToken, refreshToken, user: { id, name, email, role, storeIds[] } }
4. AuthContext guarda en localStorage
5. redirect-logic.ts determina ruta según role:
   - master-admin / owner → /master-admin/dashboard
   - chain-admin → /chain-admin/dashboard
   - store-admin → /store/:storeId/dashboard
   - cashier → /store/:storeId/billing
   - inventory → /store/:storeId/warehouse
   - rutero → /store/:storeId/delivery-route
   - vendor → /store/:storeId/vendors/dashboard
   - dispatcher → /store/:storeId/pending-orders
```

## Flujo de Login (Flutter)

```
1. POST /api/auth/login { email, password }
2. authControllerProvider guarda session
3. GoRouter redirige según role:
   - rutero → /preventa-home
   - vendor → /preventa-home
   - otros → /home
```

## Roles en el Router Web — App.tsx (líneas 111-118)

```typescript
MASTER_ROLES = ['master-admin', 'owner']
STORE_ADMIN_ROLES = ['store-admin']
CASHIER_ROLES = ['cashier', 'store-admin']
INVENTORY_ROLES = ['inventory', 'store-admin']
DISPATCH_ROLES = ['dispatcher', 'store-admin', 'sales-manager']
DELIVERY_ROLES = ['rutero', 'store-admin', 'sales-manager']
SALES_TEAM_ROLES = ['vendor', 'sales-manager', 'store-admin']
SALES_ADMIN_ROLES = ['sales-manager', 'store-admin']
```

## ProtectedRoute — App.tsx (líneas 120-152)

- Verifica `isAuthenticated`
- Verifica `requireStoreAccess` contra `user.storeIds[]`
- Verifica `allowedRoles` contra `normalizeUserRole(user.role)`
- `isGlobalAdminRole()` bypassa checks de role y store
- Envuelve en `<AppLayout>` automáticamente

## Roles Soportados Actualmente (8)

| Role | Acceso Web | Acceso Flutter |
|------|-----------|---------------|
| `master-admin` | Panel master completo | N/A |
| `owner` | Panel master completo | N/A |
| `chain-admin` | Panel cadena + tiendas | N/A |
| `store-admin` | TODO en la tienda | N/A |
| `cashier` | Facturación + Caja | N/A |
| `inventory` | Bodega + Productos | N/A |
| `rutero` | Entregas + Cobros + Devoluciones | ✅ Preventa + Entrega |
| `vendor` | Ventas + Clientes | ✅ Preventa |
| `sales-manager` | Vendedores + Despacho | N/A |
| `dispatcher` | Despacho + Pedidos | N/A |

## Roles Pendientes (Decisión de Negocio)

| Role Propuesto | Función | Estado |
|----------------|---------|--------|
| `supervisor-caja` | Supervisión de caja, autorizaciones | 🟡 Requiere definición |
| `auxiliar` | Apoyo en bodega/despacho | 🟡 Requiere definición |
| `supervisor-pasillo` | Control de pasillo en tienda | 🟡 Requiere definición |

**Nota:** El esquema de BD ya soporta roles adicionales (campo `role` varchar). Solo requiere:
1. Definir permisos de negocio
2. Agregar al array de roles en `App.tsx`
3. Agregar lógica de redirect en `redirect-logic.ts`

## Seguridad Verificada

- ✅ bcrypt para hash de contraseñas
- ✅ Helmet para headers HTTP seguros
- ✅ Rate limiting (2000/min)
- ✅ CORS restringido a orígenes conocidos
- ✅ ValidationPipe con whitelist (rechaza campos no declarados)
- ✅ Guard por tienda (no se puede acceder a datos de otra tienda)
- ✅ Validación opened_by en cierre de caja
- ✅ Swagger deshabilitado en producción
