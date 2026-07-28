# Pino2 — Sistema MultiTienda

> Sistema de gestión para distribuidoras y cadenas de tiendas con POS, inventario, logística y facturación.

## Arquitectura

```
┌─────────────┐      ┌───────────────┐      ┌──────────────┐
│  Flutter     │◄────►│  NestJS API   │◄────►│  PostgreSQL  │
│  (Mobile)    │      │  (Fastify)    │      │  (190.56...)  │
└─────────────┘      └───────┬───────┘      └──────────────┘
                             │
                     ┌───────▼───────┐
                     │   React Web   │
                     │   (Vite PWA)  │
                     └───────────────┘
```

## Stack Tecnológico

| Capa | Tecnología | Estado |
|------|-----------|--------|
| **Backend** | NestJS + Fastify + pg (raw SQL) | ✅ Producción |
| **Web** | React 18 + Vite + TanStack Query + ShadcnUI | ✅ Producción |
| **Mobile** | Flutter + Riverpod + Drift (SQLite) + Dio | ✅ Producción |
| **Base de Datos** | PostgreSQL 16 | ✅ Producción |
| **Hosting Web** | Firebase Hosting | ✅ Desplegado |
| **Push** | Firebase Cloud Messaging | ✅ Activo |

## Estructura del Proyecto

```
sistema_final/
├── backend/          # NestJS API (33 controladores, ~140 endpoints)
│   ├── src/modules/  # Módulos de negocio
│   ├── migrations/   # SQL migrations
│   └── test/active/  # E2E tests (Jest + Supertest)
├── web/              # React SPA + PWA
│   ├── src/pages/    # ~60 páginas (store-admin, master-admin, chain-admin)
│   ├── src/hooks/    # TanStack Query hooks (use-api.ts)
│   └── src/components/
├── flutter/          # App móvil (14 features)
│   ├── lib/features/ # Feature-based architecture
│   ├── lib/core/     # Network, DB, Config
│   └── lib/shared/   # Widgets compartidos
└── docs/             # Documentación técnica (25+ archivos)
```

## Inicio Rápido

### Backend
```bash
cd sistema_final/backend
npm ci
npm run build
node dist/main.js        # http://localhost:3010
```

### Web
```bash
cd sistema_final/web
npm ci
npm run dev              # http://localhost:5173
npm run build            # Producción
```

### Flutter
```bash
cd sistema_final/flutter
flutter pub get
flutter run              # Debug
flutter build apk --release  # APK release
```

## Patrones Clave

### Backend — Raw SQL con Pool de pg
```typescript
// Los services usan @Inject('PG_POOL') para queries directas
const result = await this.pool.query('SELECT * FROM products WHERE store_id = $1', [storeId]);
```

### Web — TanStack Query
```typescript
// Las páginas usan useQuery para caché automático y deduplicación
const { data, isLoading } = useQuery({
  queryKey: ['products', storeId],
  queryFn: () => apiClient.get('/products', { params: { storeId } }).then(r => r.data),
});
```

### Flutter — Riverpod + Repository Pattern
```dart
// Features usan appApiClientProvider para llamadas API
final repo = ref.read(catalogRepositoryProvider);
final products = await repo.getProducts(storeId);
```

## Testing

```bash
# Backend E2E (33 módulos verificados)
cd backend && npx jest --config test/jest-e2e.json

# Web type-check
cd web && npx tsc --noEmit
```

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [GUIA_INSTALACION_Y_EJECUCION_LOCAL.md](docs/GUIA_INSTALACION_Y_EJECUCION_LOCAL.md) | Guía de instalación y configuración local (NestJS + React) |
| [API_REFERENCE.md](docs/API_REFERENCE.md) | Referencia completa de ~140 endpoints |
| [06_BASE_DE_DATOS_ESTADO_ACTUAL.md](docs/06_BASE_DE_DATOS_ESTADO_ACTUAL.md) | Esquema de base de datos |
| [04_FLUJOS_DE_TRABAJO.md](docs/04_FLUJOS_DE_TRABAJO.md) | Flujos operativos del sistema |
| [19_USUARIOS_ROLES_Y_PERMISOS.md](docs/19_USUARIOS_ROLES_Y_PERMISOS.md) | Sistema de roles y permisos |

## Deploy

- **Web:** `firebase deploy --only hosting` (proyecto: pino-5fe44)
- **Backend:** VPS con `node dist/main.js` (puerto 3010)
- **Mobile:** `flutter build apk --release` → distribución manual

## Licencia
Propietario. Todos los derechos reservados.
