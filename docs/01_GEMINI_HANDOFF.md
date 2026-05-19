# Handoff Para IA — Sistema Multi-Tienda "Los Pinos"
**Última actualización:** 6 de Mayo, 2026

Este documento es la **fuente de verdad rápida** para que cualquier IA entienda el proyecto sin descubrirlo desde cero.

---

## 1. Qué es este proyecto

`pino` (alias "pino") es un sistema de distribución multi-tienda con:

- **Backend:** NestJS + Fastify + Socket.IO + PostgreSQL (38 módulos)
- **Web Admin:** React + Vite + Tailwind + Radix UI (desplegado en rhclaroni.com/dev)
- **Web Página:** Next.js (en `pagina/`, desplegado en Firebase Hosting)
- **App Móvil:** Flutter + Riverpod + Drift/SQLite (offline-first)

## 2. Arquitectura de despliegue

| Componente | Ubicación | Acceso |
|---|---|---|
| Backend API | VPS rhclaroni.com, PM2 `pino-api-dev` | `/api-dev` (puerto 3035 interno) |
| Web Admin (Vite) | VPS `/var/www/dev` | `rhclaroni.com/dev` |
| Web Página (Next.js) | Firebase Hosting | `pino-5fe44.web.app` |
| Base de datos | PostgreSQL `190.56.16.85:5432` | DB: `multitienda_db`, User: `alacaja` |
DATABASE_URL="postgresql://alacaja:TuClaveFuerte@190.56.16.85:5432/multitienda_db"

| Git | github.com/galz35/pino2.git | Rama `main` |

**Despliegue:** Push a GitHub → SSH al VPS → `./manual_update_dev.sh all` (o `backend` / `web`).

## 3. Estructura de carpetas clave

```
sistema_final/
├── backend/          # NestJS API (src/modules/ tiene 38 módulos)
├── web/              # React Vite Admin Panel
├── flutter/          # App móvil Flutter
├── docs/             # Documentación consolidada
└── manual_update_dev.sh  # Script de despliegue
```

También existe `pagina/` (hermano de `sistema_final/`) que es el sitio Next.js con Firebase.

## 4. Autenticación y Roles

- **Método:** JWT (access_token 12h + refresh_token 7d)
- **Token payload:** `{ sub, email, role, storeIds[] }`
- **Tabla de asignación:** `user_stores` vincula usuarios a tiendas

### Roles del sistema y sus rutas

| Rol en BD | Rol normalizado | Dashboard Web | Dashboard Flutter |
|---|---|---|---|
| `master-admin` | master-admin | `/master-admin/dashboard` | N/A |
| `store-admin` | store-admin | `/store/{id}/dashboard` | N/A |
| `cashier` | cashier | `/store/{id}/billing` | N/A |
| `inventory` / `warehouse` | inventory | `/store/{id}/warehouse` | Bodega |
| `sales-manager` | sales-manager | `/store/{id}/vendors/dashboard` | N/A |
| `rutero` | rutero | `/store/{id}/delivery-route` | Entregas/Cobros |
| `vendor` | vendor | `/store/{id}/vendors/quick-sale` | Preventa |

**⚠️ IMPORTANTE:** Todo rol que no sea `master-admin` necesita tener una entrada en `user_stores`. Sin ella, el login queda atrapado en "Preparando tu espacio de trabajo..." porque `storeIds` viene vacío.

### Usuarios operativos actuales

| Email | Clave | Rol |
|---|---|---|
| `admin@multitienda.com` | `admin123` o `123` | master-admin |
| `dueno@lospinos.com` | `123` | master-admin |
| `gerente@tienda.com` | `admin123` | store-admin |
| `admin_test@lospinos.com` | `123` | store-admin |
| `cajero@tienda.com` | `admin123` | cashier |
| `bodeguero@tienda.com` | `admin123` | warehouse |
| `bodeg@lospinos.com` | `123` | inventory |
| `vendedor@tienda.com` | `admin123` | vendor |
| `vender@lospinos.com` | `123` | cashier |
| `gestor@lospinos.com` | `123` | sales-manager |
| `rute@lospinos.com` | `123` | Rutero |

## 5. Dónde empezar según la tarea

**Backend:**
1. `backend/src/app.module.ts`
2. `backend/src/modules/` (38 módulos)
3. `backend/src/database/database.service.ts`

**Web Admin (Vite/React):**
1. `web/src/App.tsx` (rutas y guards)
2. `web/src/lib/redirect-logic.ts` y `web/src/lib/user-role.ts` (roles)
3. `web/src/services/api-client.ts`

**Web Página (Next.js):**
1. `pagina/src/context/auth-context.tsx`
2. `pagina/src/lib/redirect-logic.ts`
3. `pagina/src/lib/api-client.ts`

**Flutter:**
1. `flutter/lib/features/` (14 módulos)
2. `flutter/lib/core/network/api_client.dart`
3. `flutter/lib/core/database/local_cache_repository.dart`

**Base de datos:**
1. `backend/src/database/schema.sql`
2. `backend/migrations/`

## 6. Reglas para tocar el proyecto

- Si cambias contratos de API, revisar consumers en web Y flutter
- Si cambias roles/guards, revisar `redirect-logic.ts` en web Y pagina
- Si cambias la BD, actualizar `schema.sql` y correr migración
- Si necesitas desplegar, hacer push a GitHub y correr `manual_update_dev.sh` en el VPS
- Flutter usa offline-first con SQLite + cola de sync; no es sync offline integral aún

## 7. Estado actual (Mayo 2026)

### ✅ Completado
- Auth JWT con refresh tokens
- 38 módulos backend operativos
- POS web, caja, catálogo, inventario
- Pedidos, despacho, bodega (Kanban)
- Vendedores, rutas, visitas, cobros
- Cuentas por cobrar / pagar
- Autorizaciones de precio
- Sync y realtime (Socket.IO)
- Flutter: preventa, bodega, rutero, cierre diario, cobros, devoluciones
- Delta sync service para Flutter
- Despliegue automatizado con PM2

### 🟡 Pendiente
- Generar APK de producción
- Pruebas en terreno con usuarios reales
- Offline avanzado e integraciones de hardware móvil

## 8. Bugs conocidos / gotchas

- Usuarios sin entrada en `user_stores` no pueden hacer login (se queda en spinner infinito)
- El role `warehouse` y `inventory` son equivalentes pero coexisten en la BD; ambos se normalizan a `inventory` en el frontend
- Las contraseñas pueden ser `admin123` (seed original) o `123` (reset posterior); probar ambas
