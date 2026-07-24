# 📖 MANUAL COMPLETO — Sistema MultiTienda Los Pinos
### Versión 1.1 · 13 de abril 2026

---

## 1. ¿Qué es este sistema?

MultiTienda es un **ecosistema de gestión empresarial** diseñado para distribuidoras que operan con:
- Una **bodega central** (almacén)
- Múltiples **puntos de venta** (tiendas)
- **Vendedores en la calle** (preventas y ruteros)

El sistema conecta en **tiempo real** la operación de bodega con la operación móvil.

---

## 2. Plataformas

| Plataforma | Tecnología | Puerto | Uso |
|---|---|---|---|
| **Backend API** | NestJS + Fastify | `3010` | Motor de datos y lógica |
| **Panel Web** | React + Vite | `5173` | Administración y bodega |
| **App Móvil** | Flutter (Android) | — | Preventa y rutero en calle |
| **Base de Datos** | PostgreSQL | `5432` | Almacenamiento central |

---

## 3. Cómo iniciar el sistema

### 3.1 Backend
```bash
cd d:\pino\sistema_final\backend
npm run start:dev
```
El servidor arranca en `http://localhost:3010`. La documentación Swagger está en `http://localhost:3010/docs`.

### 3.2 Frontend Web
```bash
cd d:\pino\sistema_final\web
npm run dev
```
El panel arranca en `http://localhost:5173`.

### 3.3 Flutter (Mobile)
```bash
cd d:\pino\sistema_final\flutter
flutter run
```
La app por defecto apunta a `https://www.rhclaroni.com/api-dev` (producción).
Para apuntar al backend local:
```bash
flutter run --dart-define=PINO_API_BASE_URL=http://TU_IP_LOCAL:3010/api
```

---

## 4. Usuarios del Sistema

| Rol | Email | Contraseña | Acceso |
|---|---|---|---|
| **Dueño General** | `admin@multitienda.com` | `admin123` | TODO el sistema, todas las tiendas |
| **Dueño** | `dueno@lospinos.com` | `admin123` | TODO el sistema |
| **Admin Tienda** | `admin_test@lospinos.com` | *(existente)* | Solo su tienda asignada |
| **Bodeguero** | `bodeg@lospinos.com` | `bodega123` | Inventario y despacho |
| **Cajero/Vendedor** | `vender@lospinos.com` | `ventas123` | Facturación y caja |
| **Gestor Ventas** | `gestor@lospinos.com` | `gestor123` | Reportes y seguimiento |
| **Rutero** | `rute@lospinos.com` | `ruta123` | App móvil: entregas y cobros |

---

## 5. Sucursales Registradas

| Sucursal | Ubicación | Función |
|---|---|---|
| **Los Pinos - Central** | Managua | Almacén principal + tienda |
| **Los Pinos - Norte** | Estelí | Punto de venta |
| **Los Pinos - Sur** | Rivas | Punto de venta |

---

## 6. Navegación por Rol

### 6.1 Master Admin (admin@multitienda.com)
1. Iniciar sesión → Llega al **Panel Maestro**
2. Menú lateral: Panel, Tiendas, Cadenas, Usuarios, Licencias, Monitor, Sync, Comparar, Zonas, Config
3. Clic en **"Tiendas"** → Lista de sucursales
4. Clic en **"Entrar a Tienda"** (botón verde) → Entra a la vista operativa de esa tienda
5. **"← Regresar a Tiendas"** (botón azul arriba) → Vuelve al nivel maestro

### 6.2 Store Admin (admin_test@lospinos.com)
- Entra directo a la vista de su tienda asignada
- Menú: Caja, Comandas, Facturación, Panel, Inventario, Finanzas, Reportes, Comercial, Equipo, Configuración

### 6.3 Bodeguero (bodeg@lospinos.com)
- Menú limitado: Bodega, Productos, Entrada, Movimientos, Ajustes, Proveedores

### 6.4 Cajero (vender@lospinos.com)
- Menú mínimo: Facturación, Comandas, Caja

### 6.5 Rutero (rute@lospinos.com) — Flutter
- Ruta de Hoy, Cobranzas, Devoluciones, Cierre de Caja

---

## 7. Flujo Operativo Completo (El Ciclo del Pedido)

### Paso 1: Preventa consulta inventario
El vendedor abre la app Flutter y ve el catálogo con existencias en tiempo real.

### Paso 2: Preventa levanta pedido
Selecciona productos, elige cliente, indica si es contado o crédito.

### Paso 3: Bodega recibe pedido
En el panel web aparece el pedido nuevo en **"Comandas"** (Pending Orders).

### Paso 4: Bodeguero prepara
Desde **"Bodega"** (Warehouse), marca los productos como preparados.

### Paso 5: Bodeguero despacha
Desde **"Despacho"** (Dispatcher), carga los productos al camión del rutero. En este momento el inventario SALE de bodega y ENTRA al inventario del rutero.

### Paso 6: Rutero entrega
En la app Flutter, el rutero ve su **"Ruta de Hoy"** con los pedidos asignados. Marca cada entrega como completada.

### Paso 7: Rutero cobra
Si el pedido es al contado, cobra inmediatamente. Si es a crédito, el cobro se hace después desde **"Cobranzas"**.

### Paso 8: Cierre de caja
Al final del día, el rutero hace su cierre desde la app. El administrador lo ve en el panel web.

### Paso 9: Devolución (si aplica)
Si hay producto rechazado, el rutero lo registra como devolución. El producto regresa automáticamente al inventario de bodega.

---

## 8. Módulos del Panel Web

| Módulo | Ruta | Función |
|---|---|---|
| Dashboard | `/store/:id/dashboard` | Resumen de ventas, inventario, alerts |
| Facturación | `/store/:id/facturacion` | Punto de venta presencial |
| Caja | `/store/:id/cash-register` | Apertura/cierre turnos de caja |
| Productos | `/store/:id/products` | CRUD de catálogo |
| Departamentos | `/store/:id/products/departments` | Categorías de productos |
| Entrada Inventario | `/store/:id/inventory/entry` | Registro de mercancía nueva |
| Movimientos | `/store/:id/inventory/movements` | Historial de entradas/salidas |
| Ajustes | `/store/:id/inventory/adjustments` | Rectificaciones de stock |
| Bodega | `/store/:id/warehouse` | Dashboard del bodeguero |
| Proveedores | `/store/:id/suppliers` | CRUD de proveedores |
| Facturas Proveedor | `/store/:id/suppliers/invoice` | Ingreso de facturas |
| Comandas | `/store/:id/pending-orders` | Pedidos entrantes |
| Despacho | `/store/:id/dispatcher` | Preparación y carga |
| Pipeline Pedidos | `/store/:id/orders-pipeline` | Visualización de estados |
| Cuentas por Cobrar | `/store/:id/finance/receivables` | Cartera de clientes |
| Aging Cartera | `/store/:id/finance/aging` | Antigüedad de deuda |
| Cuentas por Pagar | `/store/:id/finance/payables` | Obligaciones a proveedores |
| Vendedores | `/store/:id/vendors` | Gestión de equipo de calle |
| Rutas | `/store/:id/vendors/routes` | Asignación de rutas |
| Clientes | `/store/:id/vendors/clients` | Cartera de clientes |
| Inventario Vendedor | `/store/:id/vendors/inventory` | Stock asignado a ruteros |
| Zonas | `/store/:id/vendors/zones` | Zonas y barrios |
| Reportes | `/store/:id/reports` | Análisis de data |
| Cierres de Caja | `/store/:id/daily-closings` | Historial de cierres rutero |
| Usuarios | `/store/:id/users` | Gestión de empleados |
| Autorizaciones | `/store/:id/authorizations` | Aprobaciones pendientes |
| Configuración | `/store/:id/settings` | Ajustes de tienda |

---

## 9. Módulos de la App Flutter

| Módulo | Pantalla | Función |
|---|---|---|
| Auth | `login_screen.dart` | Inicio de sesión |
| Home | `home_screen.dart` | Dashboard del vendedor/rutero |
| Catálogo | `product_catalog_screen.dart` | Inventario en tiempo real |
| Pedidos | `quick_order_screen.dart` | Levantamiento de pedidos |
| Entregas | `route_board_screen.dart` | Tablero de ruta del rutero |
| Cobranzas | `collections_screen.dart` | Cobro a clientes |
| Devoluciones | `returns_screen.dart` | Registro de devoluciones |
| Inventario | `vendor_inventory_screen.dart` | Stock asignado al vendedor |
| Clientes | `client_portfolio_screen.dart` | Cartera de clientes |
| Cierre Caja | `daily_closing_screen.dart` | Cierre de caja diario |
| Historial | `sales_history_screen.dart` | Ventas realizadas |
| Bodega | `warehouse_board_screen.dart` | Vista de bodega |
| Splash | `splash_screen.dart` | Pantalla de carga inicial |

---

## 10. API Backend — Endpoints Principales (31 Controllers)

| Controller | Ruta Base | Endpoints |
|---|---|---|
| Auth | `/api/auth` | login, profile, refresh, forgot-password |
| Users | `/api/users` | CRUD usuarios |
| Stores | `/api/stores` | CRUD tiendas |
| Chains | `/api/chains` | CRUD cadenas |
| Products | `/api/products` | CRUD productos |
| Departments | `/api/departments` | CRUD departamentos |
| Sales | `/api/sales` | Registro de ventas |
| Inventory | `/api/inventory` | Movimientos, ajustes, entrada |
| Cash Shifts | `/api/cash-shifts` | Turnos de caja |
| Clients | `/api/clients` | CRUD clientes |
| Orders | `/api/orders` | Pedidos y estados |
| Suppliers | `/api/suppliers` | CRUD proveedores |
| Invoices | `/api/invoices` | Facturas proveedor |
| Accounts Receivable | `/api/accounts-receivable` | Cuentas por cobrar |
| Collections | `/api/collections` | Cobros |
| Accounts Payable | `/api/accounts-payable` | Cuentas por pagar |
| Returns | `/api/returns` | Devoluciones |
| Routes | `/api/routes` | Rutas |
| Vendor Inventories | `/api/vendor-inventories` | Inventario del vendedor |
| Daily Closings | `/api/daily-closings` | Cierres de caja |
| Pending Orders | `/api/pending-orders` | Comandas |
| Pending Deliveries | `/api/pending-deliveries` | Entregas pendientes |
| Authorizations | `/api/authorizations` | Autorizaciones |
| Notifications | `/api/notifications` | Push notifications |
| Sync | `/api/sync` | Sincronización offline |
| Zones | `/api/zones` | Zonas globales |
| Store Zones | `/api/store-zones` | Sub-zonas por tienda |
| Visit Logs | `/api/visit-logs` | Registro de visitas |
| Licenses | `/api/licenses` | Licencias |
| Config | `/api/config` | Configuración global |
| Errors | `/api/errors` | Registro de errores |

---

## 11. Base de Datos — 47 Tablas

### Core
`users`, `stores`, `chains`, `user_stores`, `config`

### Catálogo
`products`, `departments`

### Inventario
`movements`, `inventory_adjustments`, `vendor_inventories`

### Pedidos
`orders`, `order_items`, `order_status_history`, `pending_orders`, `pending_deliveries`

### Ventas
`sales`, `sale_items`

### Financiero
`accounts_receivable`, `account_payments`, `accounts_payable`, `payable_payments`, `invoices`, `invoice_items`, `expenses`, `collections`

### Logística
`routes`, `vendor_routes`, `store_zones`, `zones`, `sub_zones`

### Operativo
`returns`, `return_items`, `cash_shifts`, `daily_closings`, `authorizations`

### Infraestructura
`sync_status`, `sync_logs`, `sync_idempotency_log`, `error_logs`, `notifications`, `device_tokens`, `visit_logs`

### Auditoría
`consultasql`, `consultasql_historial`

---

## 12. Seguridad

| Capa | Implementación |
|---|---|
| Autenticación | JWT (12h) + Refresh Token (7d) |
| Headers HTTP | Helmet |
| Rate Limiting | 2000 req/min |
| CORS | Whitelist de orígenes |
| Roles | 9 niveles granulares |
| Validación | ValidationPipe global (whitelist) |
| Push Notifications | Firebase Admin SDK |
| Almacenamiento móvil | Flutter Secure Storage |

---

## 13. Configuración de Entorno (.env)

```env
# Base de Datos
DATABASE_HOST=190.56.16.85
DATABASE_PORT=5432
DATABASE_USER=alacaja
DATABASE_PASSWORD=__DB_PASSWORD_PLACEHOLDER__
DATABASE_NAME=multitienda_db

# Servidor
PORT=3010
API_PREFIX=api

# JWT
JWT_SECRET=secreto_super_seguro_cambiame_123
JWT_EXPIRES_IN=12h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:9002

# Firebase
FIREBASE_CREDENTIALS_PATH=pino-5fe44-firebase-adminsdk-fbsvc-23206ab8a2.json
```

> ⚠️ **IMPORTANTE:** Cambiar JWT_SECRET y DATABASE_PASSWORD antes de producción.
