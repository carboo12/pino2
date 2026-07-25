# 📖 Documentación de Referencia de Endpoints API — Pino2 MultiTienda

**Versión API:** `v1.0.0-mvp`  
**Base URL Local:** `http://localhost:3035`  
**Base URL Producción:** `http://190.56.16.85:3035`  

---

## 1. 🔑 Autenticación y Usuarios

### `POST /auth/login`
* **Descripción:** Inicia sesión con correo y contraseña. Retorna token JWT y perfil del usuario.
* **Recibe (JSON Body):**
  ```json
  {
    "email": "admin@tienda.com",
    "password": "Password123!"
  }
  ```
* **Devuelve (200 OK):**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": "usr-001",
      "email": "admin@tienda.com",
      "name": "Administrador General",
      "role": "admin",
      "primaryStoreId": "str-001"
    }
  }
  ```

### `GET /auth/profile`
* **Descripción:** Obtiene la información del perfil del usuario autenticado.
* **Headers:** `Authorization: Bearer <token>`
* **Devuelve (200 OK):**
  ```json
  {
    "id": "usr-001",
    "email": "admin@tienda.com",
    "name": "Administrador General",
    "role": "admin",
    "primaryStoreId": "str-001"
  }
  ```

### `GET /users`
* **Descripción:** Lista los usuarios registrados filtrados por tienda o rol.
* **Query Params:** `storeId` (string, opcional), `role` (string, opcional).
* **Devuelve (200 OK):**
  ```json
  [
    {
      "id": "usr-001",
      "name": "Juan Pérez",
      "email": "juan@tienda.com",
      "role": "vendor",
      "storeId": "str-001",
      "isActive": true
    }
  ]
  ```

### `POST /users`
* **Descripción:** Crea un nuevo usuario en el sistema.
* **Recibe (JSON Body):**
  ```json
  {
    "name": "Carlos Rutero",
    "email": "carlos@tienda.com",
    "password": "Password123!",
    "role": "rutero",
    "storeId": "str-001"
  }
  ```
* **Devuelve (201 Created):**
  ```json
  { "id": "usr-002", "name": "Carlos Rutero", "role": "rutero", "createdAt": "2026-07-25T14:00:00Z" }
  ```

---

## 2. 🏪 Tiendas, Cadenas y Configuración

### `GET /stores`
* **Descripción:** Lista todas las tiendas activas de la cadena.
* **Devuelve (200 OK):**
  ```json
  [
    { "id": "str-001", "name": "Los Pinos Central", "code": "PINO-01", "status": "ACTIVE" }
  ]
  ```

### `POST /stores`
* **Descripción:** Crea una nueva sucursal/tienda.
* **Recibe (JSON Body):**
  ```json
  { "name": "Los Pinos Sucursal Sur", "code": "PINO-02", "chainId": "chn-001" }
  ```
* **Devuelve (201 Created):**
  ```json
  { "id": "str-002", "name": "Los Pinos Sucursal Sur", "code": "PINO-02" }
  ```

### `GET /chains`
* **Descripción:** Lista las cadenas comerciales multitienda.
* **Devuelve (200 OK):**
  ```json
  [ { "id": "chn-001", "name": "Grupo Los Pinos", "code": "PINO_GRP" } ]
  ```

### `GET /config/general`
* **Descripción:** Obtiene los parámetros globales de la aplicación.
* **Devuelve (200 OK):**
  ```json
  { "companyName": "Distribuidora Los Pinos", "currency": "NIO", "taxPercentage": 15.0 }
  ```

---

## 3. 📦 Catálogo, Productos y Promociones

### `GET /products`
* **Descripción:** Consulta el catálogo de productos con soporte para empaque (Bulto/Unidad).
* **Query Params:** `storeId` (string, requerido), `search` (string, opcional), `stockCritical` (boolean, opcional), `page` (number, opcional), `limit` (number, opcional).
* **Devuelve (200 OK):**
  ```json
  [
    {
      "id": "prod-101",
      "description": "Jabón Marfil 35g",
      "salePrice": 12.50,
      "currentStock": 53,
      "handlesBulk": true,
      "unitsPerBulk": 10,
      "stockBulks": 5,
      "stockUnits": 3,
      "stockDisplayFormatted": "5 bultos + 3 unidades"
    }
  ]
  ```

### `POST /products`
* **Descripción:** Crea un nuevo producto registrando regla de empaque canónico.
* **Recibe (JSON Body):**
  ```json
  {
    "storeId": "str-001",
    "description": "Aceite Cocinero 1L",
    "salePrice": 65.00,
    "currentStock": 120,
    "handlesBulk": true,
    "unitsPerBulk": 12
  }
  ```
* **Devuelve (201 Created):**
  ```json
  { "id": "prod-102", "description": "Aceite Cocinero 1L", "handlesBulk": true, "unitsPerBulk": 12 }
  ```

### `GET /promotions`
* **Descripción:** Lista las promociones vigentes de una tienda.
* **Query Params:** `storeId` (string, requerido).
* **Devuelve (200 OK):**
  ```json
  [
    {
      "id": "prm-001",
      "name": "Descuento Bebidas 10%",
      "discountType": "PERCENTAGE",
      "discountValue": 10.0,
      "status": "ACTIVE"
    }
  ]
  ```

### `POST /promotions`
* **Descripción:** Crea una regla de promoción o descuento.
* **Recibe (JSON Body):**
  ```json
  {
    "storeId": "str-001",
    "name": "Bono Verano Abarrotes",
    "discountType": "FIXED_AMOUNT",
    "discountValue": 50.0,
    "productId": "prod-101"
  }
  ```
* **Devuelve (201 Created):**
  ```json
  { "id": "prm-002", "name": "Bono Verano Abarrotes", "status": "ACTIVE" }
  ```

---

## 4. 🛒 Ventas, POS y Caja Chica

### `POST /sales/process`
* **Descripción:** Procesa una venta en caja/POS en transacción PostgreSQL. Aplica promociones automáticamente.
* **Recibe (JSON Body):**
  ```json
  {
    "storeId": "str-001",
    "cashShiftId": "shf-001",
    "paymentMethod": "CASH",
    "items": [
      { "productId": "prod-101", "quantity": 20, "unitPrice": 12.50 }
    ]
  }
  ```
* **Devuelve (201 Created):**
  ```json
  {
    "id": "sal-501",
    "invoiceNumber": "FAC-2026-0089",
    "subtotal": 250.00,
    "discount": 25.00,
    "total": 225.00,
    "status": "COMPLETED"
  }
  ```

### `GET /cash-shifts/active`
* **Descripción:** Obtiene el turno de caja abierto actualmente en la tienda.
* **Query Params:** `storeId` (string, requerido).
* **Devuelve (200 OK):**
  ```json
  {
    "id": "shf-001",
    "openedByUserId": "usr-001",
    "initialCash": 1000.00,
    "status": "OPEN",
    "openedAt": "2026-07-25T08:00:00Z"
  }
  ```

---

## 5. 👥 Clientes y Contratos

### `GET /clients`
* **Descripción:** Lista la cartera de clientes.
* **Query Params:** `storeId` (string, requerido), `search` (string, opcional).
* **Devuelve (200 OK):**
  ```json
  [
    { "id": "cli-001", "name": "Pulpería Don Jose", "code": "CLI-01", "creditLimit": 5000.00 }
  ]
  ```

### `GET /contracts`
* **Descripción:** Consulta los contratos de crédito y comodato firmados con clientes.
* **Query Params:** `storeId` (string, requerido), `clientId` (string, opcional).
* **Devuelve (200 OK):**
  ```json
  [
    {
      "id": "ctr-001",
      "contractNumber": "CTR-2026-005",
      "clientId": "cli-001",
      "termMonths": 12,
      "creditLimit": 10000.00,
      "status": "ACTIVE"
    }
  ]
  ```

---

## 6. 💸 Finanzas y Gastos

### `GET /expenses`
* **Descripción:** Obtiene el listado de gastos y caja chica.
* **Query Params:** `storeId` (string, requerido), `category` (string, opcional).
* **Devuelve (200 OK):**
  ```json
  [
    {
      "id": "exp-001",
      "category": "Combustible",
      "amount": 450.00,
      "description": "Gasolina camión ruta 3",
      "receiptNumber": "REC-8821",
      "createdAt": "2026-07-25T11:30:00Z"
    }
  ]
  ```

### `POST /expenses`
* **Descripción:** Registra un nuevo gasto operativo.
* **Recibe (JSON Body):**
  ```json
  {
    "storeId": "str-001",
    "createdByUserId": "usr-001",
    "category": "Combustible",
    "amount": 450.00,
    "description": "Gasolina camión ruta 3",
    "receiptNumber": "REC-8821"
  }
  ```
* **Devuelve (201 Created):**
  ```json
  { "id": "exp-001", "amount": 450.00, "status": "APPROVED" }
  ```

---

## 7. 🚛 Logística, Rutas y Flota

### `GET /vehicles`
* **Descripción:** Consulta la flota de vehículos de reparto.
* **Query Params:** `storeId` (string, requerido).
* **Devuelve (200 OK):**
  ```json
  [
    {
      "id": "veh-001",
      "licensePlate": "M-192834",
      "model": "Isuzu Reward 3.5T",
      "driverUserId": "usr-002",
      "status": "AVAILABLE"
    }
  ]
  ```

### `GET /purchase-orders`
* **Descripción:** Lista las órdenes de compra a proveedores.
* **Query Params:** `storeId` (string, requerido).
* **Devuelve (200 OK):**
  ```json
  [
    {
      "id": "po-001",
      "orderNumber": "PO-2026-0012",
      "supplierName": "Distribuidora Central S.A.",
      "totalAmount": 15400.00,
      "status": "PENDING_DELIVERY"
    }
  ]
  ```

---

## 8. 🔄 Sincronización Offline & Monitoreo

### `POST /edge/sync-inbox`
* **Descripción:** Endpoint idempotente de la App Móvil para enviar transacciones offline. Usa ON CONFLICT DO NOTHING.
* **Recibe (JSON Body):**
  ```json
  {
    "idempotencyKey": "uuid-9921-8812",
    "entityType": "SALE",
    "payload": { "storeId": "str-001", "total": 120.00 }
  }
  ```
* **Devuelve (200 OK):**
  ```json
  { "status": "PROCESSED", "idempotencyKey": "uuid-9921-8812" }
  ```

### `GET /health`
* **Descripción:** Revisa el estado de salud de la API NestJS y la conexión a PostgreSQL.
* **Devuelve (200 OK):**
  ```json
  { "status": "ok", "timestamp": "2026-07-25T14:53:00Z", "database": "connected" }
  ```
