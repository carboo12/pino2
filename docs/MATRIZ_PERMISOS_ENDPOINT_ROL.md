# Matriz de Permisos: Endpoint × Rol

## Roles del sistema

| Rol | Descripción |
|-----|-------------|
| `master-admin` | Acceso total a todas las tiendas y configuración global |
| `store-admin` | Administración completa de una tienda |
| `cashier` | Punto de venta (cobro, devoluciones) |
| `inventory` | Gestión de bodega e inventario |
| `rutero` | Rutas de entrega y cobro en ruta |
| `vendor` | Vendedor ambulante (pedidos, cobros) |
| `sales-manager` | Supervisión de ventas y administración |

## Convención

- ✅ = Acceso permitido
- ❌ = Acceso denegado (403)
- Lectura = GET
- Escritura = POST, PATCH, PUT, DELETE

---

## 1. Autenticación (`/auth`)

| Endpoint | master-admin | store-admin | cashier | inventory | rutero | vendor | sales-manager |
|----------|:-----------:|:-----------:|:------:|:---------:|:-----:|:-----:|:-------------:|
| `POST /login` | ✅ Público | ✅ Público | ✅ Público | ✅ Público | ✅ Público | ✅ Público | ✅ Público |
| `POST /refresh` | ✅ Público | ✅ Público | ✅ Público | ✅ Público | ✅ Público | ✅ Público | ✅ Público |
| `POST /logout` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /me` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /register` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST /forgot-password` | ✅ Público | ✅ Público | ✅ Público | ✅ Público | ✅ Público | ✅ Público | ✅ Público |

## 2. Ventas (`/sales`)

| Endpoint | master-admin | store-admin | cashier | inventory | rutero | vendor | sales-manager |
|----------|:-----------:|:-----------:|:------:|:---------:|:-----:|:-----:|:-------------:|
| `POST /process` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `GET /` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| `GET /:id` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| `POST /:id/return` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `GET /dashboard-stats` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `GET /report` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |

## 3. Pedidos (`/orders`)

| Endpoint | master-admin | store-admin | cashier | inventory | rutero | vendor | sales-manager |
|----------|:-----------:|:-----------:|:------:|:---------:|:-----:|:-----:|:-------------:|
| `POST /` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `GET /` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| `GET /:id` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| `PATCH /:id/status` | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| `POST /:id/autorizar-precio` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

## 4. Productos (`/products`)

| Endpoint | master-admin | store-admin | cashier | inventory | rutero | vendor | sales-manager |
|----------|:-----------:|:-----------:|:------:|:---------:|:-----:|:-----:|:-------------:|
| `GET /` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /:id` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `PATCH /:id` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `DELETE /:id` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST /:id/adjust-stock` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `POST /barcode` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |

## 5. Caja (`/cash-shifts`)

| Endpoint | master-admin | store-admin | cashier | inventory | rutero | vendor | sales-manager |
|----------|:-----------:|:-----------:|:------:|:---------:|:-----:|:-----:|:-------------:|
| `POST /` (open) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `POST /close` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `GET /active` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| `GET /` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `GET /:id` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |

## 6. Clientes (`/clients`)

| Endpoint | master-admin | store-admin | cashier | inventory | rutero | vendor | sales-manager |
|----------|:-----------:|:-----------:|:------:|:---------:|:-----:|:-----:|:-------------:|
| `GET /` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| `GET /:id` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| `POST /` | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `PATCH /:id` | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `DELETE /:id` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

## 7. Inventario (`/inventory`)

| Endpoint | master-admin | store-admin | cashier | inventory | rutero | vendor | sales-manager |
|----------|:-----------:|:-----------:|:------:|:---------:|:-----:|:-----:|:-------------:|
| `GET /warehouse` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| `GET /movements` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| `POST /adjustments` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `GET /stock` | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |

## 8. Cargas Camión (`/cargas-camion`)

| Endpoint | master-admin | store-admin | cashier | inventory | rutero | vendor | sales-manager |
|----------|:-----------:|:-----------:|:------:|:---------:|:-----:|:-----:|:-------------:|
| `POST /` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| `GET /` | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| `GET /:id` | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| `POST /:id/despachar` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |

## 9. Cuentas por Cobrar (`/accounts-receivable`)

| Endpoint | master-admin | store-admin | cashier | inventory | rutero | vendor | sales-manager |
|----------|:-----------:|:-----------:|:------:|:---------:|:-----:|:-----:|:-------------:|
| `GET /` | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `GET /:id` | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `POST /payment` | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |

## 10. Cobros (`/collections`)

| Endpoint | master-admin | store-admin | cashier | inventory | rutero | vendor | sales-manager |
|----------|:-----------:|:-----------:|:------:|:---------:|:-----:|:-----:|:-------------:|
| `POST /` | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `GET /` | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |

## 11. Devoluciones (`/returns`)

| Endpoint | master-admin | store-admin | cashier | inventory | rutero | vendor | sales-manager |
|----------|:-----------:|:-----------:|:------:|:---------:|:-----:|:-----:|:-------------:|
| `POST /` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## 12. Sincronización (`/sync`)

| Endpoint | master-admin | store-admin | cashier | inventory | rutero | vendor | sales-manager |
|----------|:-----------:|:-----------:|:------:|:---------:|:-----:|:-----:|:-------------:|
| `POST /batch` | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `GET /data` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /statuses` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `POST /force/:storeId` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

## 13. Usuarios (`/users`)

| Endpoint | master-admin | store-admin | cashier | inventory | rutero | vendor | sales-manager |
|----------|:-----------:|:-----------:|:------:|:---------:|:-----:|:-----:|:-------------:|
| `GET /` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /:id` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `PATCH /:id` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

## 14. Tiendas (`/stores`)

| Endpoint | master-admin | store-admin | cashier | inventory | rutero | vendor | sales-manager |
|----------|:-----------:|:-----------:|:------:|:---------:|:-----:|:-----:|:-------------:|
| `GET /` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /:id` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST /` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `PATCH /:id` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

## 15. Dashboard y Reportes

| Endpoint | master-admin | store-admin | cashier | inventory | rutero | vendor | sales-manager |
|----------|:-----------:|:-----------:|:------:|:---------:|:-----:|:-----:|:-------------:|
| `GET /health` | ✅ Público | ✅ Público | ✅ Público | ✅ Público | ✅ Público | ✅ Público | ✅ Público |
| `GET /dashboard` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `GET /reports/*` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Implementación actual

- El `RolesGuard` verifica `@Roles('master-admin', 'store-admin')` en cada endpoint
- El `StoreAccessGuard` verifica que `storeId` pertenezca al usuario
- Falta aplicar `@Roles()` en algunos endpoints críticos para restringir a roles específicos

## Próximos pasos

1. Agregar decorador `@Roles()` a endpoints que actualmente no lo tienen
2. Verificar que cashier solo tenga acceso a `/sales/process`, `/returns`, `/cash-shifts`
3. Verificar que inventory solo tenga acceso a `/inventory/*`, `/orders`, `/products`
4. Verificar que rutero solo tenga acceso a `/cargas-camion/*`, `/accounts-receivable`, `/collections`
5. Verificar que vendor solo tenga acceso a `/orders`, `/clients`, `/collections`, `/returns`
