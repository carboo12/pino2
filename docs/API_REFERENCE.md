# API Reference — Pino2 MultiTienda

> Generado: 2026-05-01 | Base URL: `https://api.pino2.com/api` | Autenticación: Bearer JWT

---

## 🔑 Auth (`/auth`)
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `POST` | `/auth/login` | Público | Iniciar sesión |
| `POST` | `/auth/register` | Admin | Registrar nuevo usuario |
| `POST` | `/auth/refresh` | Auth | Renovar token de acceso |
| `POST` | `/auth/forgot-password` | Público | Solicitar recuperación de contraseña |
| `GET` | `/auth/me` | Auth | Obtener perfil del usuario autenticado |
| `GET` | `/auth/profile` | Auth | Alias de `/auth/me` |

## 👤 Users (`/users`)
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `POST` | `/users` | Admin | Crear usuario |
| `GET` | `/users` | Auth | Listar usuarios (filtrable por storeId) |
| `GET` | `/users/:id` | Auth | Obtener usuario por ID |
| `PATCH` | `/users/:id` | Admin | Actualizar usuario |
| `POST` | `/users/:id/assign/:storeId` | Admin | Asignar usuario a tienda |
| `GET` | `/users/:id/stores` | Auth | Listar tiendas del usuario |
| `DELETE` | `/users/:id` | Admin | Eliminar usuario |

## 🏪 Stores (`/stores`)
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `POST` | `/stores` | Master | Crear tienda |
| `GET` | `/stores` | Auth | Listar tiendas |
| `GET` | `/stores/:id` | Auth | Obtener tienda por ID |
| `PATCH` | `/stores/:id` | Admin | Actualizar tienda |
| `PATCH` | `/stores/:id/settings` | Admin | Actualizar configuración de tienda |
| `DELETE` | `/stores/:id` | Master | Eliminar tienda |

## 🔗 Chains (`/chains`)
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `POST` | `/chains` | Master | Crear cadena |
| `GET` | `/chains` | Auth | Listar cadenas |
| `GET` | `/chains/:id` | Auth | Obtener cadena por ID |
| `PATCH` | `/chains/:id` | Master | Actualizar cadena |
| `DELETE` | `/chains/:id` | Master | Eliminar cadena |

## 📦 Products (`/products`)
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `POST` | `/products` | Admin | Crear producto |
| `POST` | `/products/import` | Admin | Importar productos en lote |
| `GET` | `/products` | Auth | Listar productos (filtrable por storeId) |
| `GET` | `/products/barcode/:barcode` | Auth | Buscar producto por código de barras |
| `GET` | `/products/:id` | Auth | Obtener producto por ID |
| `PATCH` | `/products/:id` | Admin | Actualizar producto |
| `DELETE` | `/products/:id` | Admin | Eliminar producto |
| `POST` | `/products/:id/barcodes` | Admin | Agregar código de barras alternativo |
| `GET` | `/products/:id/barcodes` | Auth | Listar códigos de barras del producto |
| `DELETE` | `/products/barcodes/:barcodeId` | Admin | Eliminar código de barras |
| `PATCH` | `/products/barcodes/:barcodeId/primary` | Admin | Marcar como código primario |

## 🏷️ Departments (`/departments`, `/sub-departments`)
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `POST` | `/departments` | Admin | Crear departamento |
| `GET` | `/departments` | Auth | Listar departamentos |
| `PATCH` | `/departments/:id` | Admin | Actualizar departamento |
| `DELETE` | `/departments/:id` | Admin | Eliminar departamento |
| `GET` | `/sub-departments` | Auth | Listar subdepartamentos |

## 🛒 Sales (`/sales`)
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `POST` | `/sales/process` | Auth | Procesar venta (transaccional) |
| `GET` | `/sales` | Auth | Listar ventas (filtrable por tienda, turno, fecha) |
| `GET` | `/sales/dashboard-stats` | Auth | Métricas del dashboard (server-aggregated) |
| `GET` | `/sales/report` | Auth | Reporte consolidado de ventas |
| `GET` | `/sales/:id` | Auth | Detalle de una venta |
| `POST` | `/sales/:id/return` | Auth | Procesar devolución |

## 📋 Inventory (`/inventory`)
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `POST` | `/inventory/adjust` | Admin | Ajustar inventario |
| `GET` | `/inventory/movements` | Auth | Historial de movimientos |
| `GET` | `/inventory/warehouse` | Auth | Inventario de almacén |
| `GET` | `/inventory/vendor` | Auth | Inventario por vendedor |
| `POST` | `/inventory/transfer` | Admin | Transferir inventario entre tiendas |
| `POST` | `/inventory/quick-entry` | Admin | Entrada rápida de inventario |
| `POST` | `/inventory/merma` | Admin | Registrar merma |
| `POST` | `/inventory/ajuste` | Admin | Ajuste de inventario |

## 💰 Cash Shifts (`/cash-shifts`)
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `POST` | `/cash-shifts` | Auth | Abrir turno de caja |
| `POST` | `/cash-shifts/close` | Auth | Cerrar turno de caja |
| `GET` | `/cash-shifts/active` | Auth | Obtener turno activo |
| `GET` | `/cash-shifts/stats/:id` | Auth | Estadísticas del turno |
| `GET` | `/cash-shifts` | Auth | Listar turnos de caja |
| `GET` | `/cash-shifts/:id` | Auth | Obtener turno por ID |
| `POST` | `/cash-shifts/:id/close` | Auth | Cerrar turno por ID |

## 🔄 Sync (`/sync`)
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `POST` | `/sync/batch` | Auth | Procesar lote de sincronización (offline-first) |
| `GET` | `/sync/statuses` | Auth | Estados de sincronización |
| `GET` | `/sync/idempotency-logs` | Auth | Logs de idempotencia |
| `POST` | `/sync/force/:storeId` | Admin | Forzar sincronización |
| `GET` | `/sync/data` | Auth | Obtener datos para sincronización delta |

## 📃 Orders (`/orders`)
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `POST` | `/orders` | Auth | Crear pedido |
| `GET` | `/orders` | Auth | Listar pedidos |
| `GET` | `/orders/:id` | Auth | Obtener pedido por ID |
| `POST` | `/orders/:id/autorizar` | Admin | Autorizar pedido |
| `PATCH` | `/orders/:id/status` | Auth | Cambiar estado del pedido |
| `PATCH` | `/orders/:id/prepare` | Auth | Marcar en preparación |
| `PATCH` | `/orders/:id/stage` | Auth | Marcar como listo |
| `PATCH` | `/orders/:id/load-truck` | Auth | Cargar a camión |
| `PATCH` | `/orders/:id/dispatch` | Auth | Despachar pedido |
| `PATCH` | `/orders/:id/deliver` | Auth | Marcar como entregado |

## 👥 Clients (`/clients`)
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `POST` | `/clients` | Auth | Crear cliente |
| `GET` | `/clients` | Auth | Listar clientes |
| `GET` | `/clients/:id` | Auth | Obtener cliente por ID |
| `GET` | `/clients/:id/estado-cuenta` | Auth | Estado de cuenta del cliente |
| `PATCH` | `/clients/:id` | Admin | Actualizar cliente |
| `DELETE` | `/clients/:id` | Admin | Eliminar cliente |
| `POST` | `/clients/:id/reasignar` | Admin | Reasignar cliente a otro grupo |

## 🏭 Suppliers (`/suppliers`)
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `POST` | `/suppliers` | Admin | Crear proveedor |
| `GET` | `/suppliers` | Auth | Listar proveedores |
| `GET` | `/suppliers/:id` | Auth | Obtener proveedor por ID |
| `PATCH` | `/suppliers/:id` | Admin | Actualizar proveedor |
| `DELETE` | `/suppliers/:id` | Admin | Eliminar proveedor |

## 📄 Invoices (`/invoices`)
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `POST` | `/invoices` | Auth | Crear factura |
| `GET` | `/invoices` | Auth | Listar facturas |
| `GET` | `/invoices/:id` | Auth | Obtener factura por ID |
| `PATCH` | `/invoices/:id` | Admin | Actualizar factura |
| `DELETE` | `/invoices/:id` | Admin | Eliminar factura |

## 💳 Finance
### Accounts Receivable (`/accounts-receivable`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/accounts-receivable` | Listar cuentas por cobrar |
| `GET` | `/accounts-receivable/:id` | Detalle de cuenta |
| `POST` | `/accounts-receivable` | Crear cuenta por cobrar |
| `POST` | `/accounts-receivable/:id/payments` | Registrar pago |

### Accounts Payable (`/accounts-payable`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/accounts-payable` | Crear cuenta por pagar |
| `GET` | `/accounts-payable` | Listar cuentas por pagar |
| `GET` | `/accounts-payable/:id` | Detalle de cuenta |
| `POST` | `/accounts-payable/:id/payment` | Registrar pago |

### Collections (`/collections`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/collections` | Registrar cobro |
| `GET` | `/collections` | Listar cobros |
| `GET` | `/collections/summary` | Resumen de cobros |

### Arqueos (`/arqueos`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/arqueos` | Crear arqueo |
| `GET` | `/arqueos` | Listar arqueos |
| `GET` | `/arqueos/:id` | Detalle de arqueo |

### Daily Closings (`/daily-closings`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/daily-closings` | Crear cierre diario |
| `GET` | `/daily-closings` | Listar cierres |
| `GET` | `/daily-closings/:id` | Detalle de cierre |

## 🚛 Logistics
### Pending Orders (`/pending-orders`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/pending-orders` | Listar comandas pendientes |
| `POST` | `/pending-orders` | Crear comanda |
| `POST` | `/pending-orders/dispatch` | Despachar comanda |
| `PATCH` | `/pending-orders/:id/status` | Cambiar estado |

### Pending Deliveries (`/pending-deliveries`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/pending-deliveries` | Listar entregas pendientes |
| `POST` | `/pending-deliveries` | Crear entrega |
| `PATCH` | `/pending-deliveries/:id` | Actualizar entrega |
| `POST` | `/pending-deliveries/assign-route` | Asignar a ruta |

### Routes (`/routes`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/routes` | Listar rutas |
| `POST` | `/routes` | Crear ruta |
| `PATCH` | `/routes/:id` | Actualizar ruta |

### Cargas Camión (`/cargas-camion`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/cargas-camion` | Crear carga |
| `GET` | `/cargas-camion` | Listar cargas |
| `GET` | `/cargas-camion/:id` | Detalle de carga |
| `PUT` | `/cargas-camion/:id/salida` | Registrar salida |

### Liquidaciones Ruta (`/liquidaciones-ruta`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/liquidaciones-ruta` | Crear liquidación |
| `GET` | `/liquidaciones-ruta` | Listar liquidaciones |
| `GET` | `/liquidaciones-ruta/:id` | Detalle de liquidación |

## 🔔 Notifications (`/notifications`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/notifications` | Listar notificaciones |
| `POST` | `/notifications` | Crear notificación |
| `PATCH` | `/notifications/:id/read` | Marcar como leída |
| `PATCH` | `/notifications/read-all` | Marcar todas como leídas |
| `POST` | `/notifications/device-token` | Registrar token FCM |
| `POST` | `/notifications/unregister-token` | Des-registrar token |

## ⚙️ System
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Health check (público) |
| `GET` | `/config` | Obtener configuración |
| `GET` | `/config/:key` | Obtener clave de config |
| `PUT` | `/config/:key` | Actualizar clave de config |
| `GET` | `/errors` | Listar errores registrados |
| `POST` | `/errors` | Registrar error |

## 🗺️ Zones
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/zones` | Listar zonas |
| `POST` | `/zones` | Crear zona |
| `PATCH` | `/zones/:id` | Actualizar zona |
| `DELETE` | `/zones/:id` | Eliminar zona |
| `GET` | `/sub-zones` | Listar sub-zonas |
| `POST` | `/sub-zones` | Crear sub-zona |
| `PATCH` | `/sub-zones/:id` | Actualizar sub-zona |
| `DELETE` | `/sub-zones/:id` | Eliminar sub-zona |

---

## 📦 Empaque y Presentación Canónica (Bultos / Unidades)

### Regla Canónica de Negocio:
1. **Almacenamiento**: El stock siempre se almacena en **Unidades Totales** en la base de datos (`current_stock`).
2. **Campos en Producto**:
   - `handlesBulk` (`handles_bulk` boolean): Indica si el producto se vende/almacena en empaques o bultos.
   - `unitsPerBulk` (`units_per_bulk` integer >= 1): Cantidad de unidades contenidas en 1 bulto/caja/pack.
   - `stockDisplay` (Objeto autogenerado):
     ```json
     "stockDisplay": {
       "bulks": 5,
       "units": 3,
       "formatted": "5 bultos + 3 unidades"
     }
     ```
3. **Conversión Estándar**:
   - $\text{Bultos} = \lfloor \text{totalUnits} / \text{unitsPerBulk} \rfloor$
   - $\text{Unidades Sueltas} = \text{totalUnits} \pmod{\text{unitsPerBulk}}$
   - En pedidos/ventas: Enviar `quantity` (unidades totales) o desglosado en `quantityBulks` + `quantityUnits`.

---

**Total: ~140 endpoints | 33 controladores | 37 módulos**
