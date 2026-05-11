# 🔍 AUDITORÍA INTEGRAL — FEEDBACK DE CARBOO
**Fecha:** 4 de Mayo, 2026  
**Fuente:** Conversación WhatsApp del 3/Mayo/2026  
**Auditor:** Análisis automático vs código fuente actual  
**Estado:** ⏳ Pendiente de ejecución  

---

## RESUMEN EJECUTIVO

Se identificaron **12 hallazgos críticos** que impiden la operación real del sistema. La app tiene la estructura base (38 módulos backend, ~60 páginas web, 52 tablas) pero muchas funciones están incompletas, simuladas con datos random, o les falta la UI correspondiente.

> [!CAUTION]
> **Regla #1 de Carboo:** NO dejar que la IA elimine funciones que ya estaban. Si algo existía, solo se afina, nunca se borra.  
> **Regla #2:** Las pruebas son MANUALES. No gastar tokens en pruebas automatizadas durante el desarrollo.  
> **Regla #3:** Trabajar módulo por módulo, uno a la vez, hasta dejarlo refinado.

---

## PRIORIDAD 1 — CRÍTICO (Bloquea operación diaria)

### 🔴 HALLAZGO 1: Cierre/Apertura de Caja sin Arqueo por Denominaciones

**Lo que dice Carboo:**
> "En el cierre y apertura de caja debe haber un arqueo, para que el usuario cajero ingrese las cantidades de cada denominación que hay en la apertura y en el cierre. Eso es para facilitar la rapidez y evitar errores."

**Estado actual verificado:**

| Componente | Archivo | Estado |
|---|---|---|
| Apertura de Caja | [cash-register-page.tsx](file:///d:/pino/sistema_final/web/src/pages/store-admin/cash-register/cash-register-page.tsx) | ❌ Solo pide un monto total, NO tiene desglose por denominaciones |
| Cierre de Caja | [cash-register-page.tsx](file:///d:/pino/sistema_final/web/src/pages/store-admin/cash-register/cash-register-page.tsx#L302-L354) | ❌ Solo pide "Efectivo Físico en Gaveta" como un solo número |
| Arqueo (Página separada) | [arqueos-page.tsx](file:///d:/pino/sistema_final/web/src/pages/store-admin/finance/arqueos-page.tsx) | ⚠️ EXISTE pero solo para ruteros, usa Math.random() para monto esperado (línea 55) |
| Backend cash-shifts | [cash-shifts.service.ts](file:///d:/pino/sistema_final/backend/src/modules/cash-shifts/cash-shifts.service.ts) | ❌ No almacena detalle de denominaciones |

**Lo que falta:**
1. En **Apertura**: Agregar grid de denominaciones (billetes 1000, 500, 200, 100, 50 + monedas) para que el cajero ingrese cantidades
2. En **Cierre**: Agregar el mismo grid de denominaciones. El total contado se calcula automáticamente
3. Backend: Agregar campo `denomination_detail JSONB` a la tabla `cash_shifts` o registrarlo en `arqueos`
4. La suma de denominaciones debe ser el `startingCash` (apertura) y `actualCash` (cierre)

**Esfuerzo:** 🟡 Medio (1-2 sesiones)

---

### 🔴 HALLAZGO 2: Un cajero NO puede cerrar la caja de otro cajero

**Lo que dice Carboo:**
> "Ningún cajero puede hacer el cierre de caja de otro cajero"

**Estado actual verificado:**
- Backend [cash-shifts.service.ts L52-58](file:///d:/pino/sistema_final/backend/src/modules/cash-shifts/cash-shifts.service.ts#L52-L58): La apertura valida `WHERE store_id = $1 AND status = 'OPEN'` — busca por **tienda**, no por **usuario**
- Backend [cash-shifts.service.ts L95-98](file:///d:/pino/sistema_final/backend/src/modules/cash-shifts/cash-shifts.service.ts#L95-L98): El cierre usa `WHERE id = $5 AND store_id = $6 AND status = 'OPEN'` — **NO valida que userId == opened_by**
- Frontend: El `getActiveShift` busca `storeId` solamente, no filtra por usuario

**Lo que falta:**
1. Backend `openShift`: Cambiar la query para buscar por `store_id AND opened_by = $2` o permitir múltiples cajas abiertas por tienda (una por cajero)
2. Backend `closeShift`: Agregar validación `AND opened_by = $userId` para que solo el cajero que abrió pueda cerrar
3. Frontend `getActiveShift`: Filtrar por `userId` del cajero logueado
4. **Decisión de negocio necesaria:** ¿Puede haber varias cajas abiertas simultáneamente en una tienda (una por cajero)? En un supermercado SÍ.

**Esfuerzo:** 🟢 Bajo (30 min)

---

### 🔴 HALLAZGO 3: Precios por Unidad Y por Bulto (Precio 1-5 en cada modalidad)

**Lo que dice Carboo:**
> "En los precios hay precios en unidades y precios por bultos, igual para los dos tiene que haber del precio 1 al 5"

**Estado actual verificado:**
- Formulario de producto ([add-product-page.tsx](file:///d:/pino/sistema_final/web/src/pages/store-admin/products/add-product-page.tsx#L339-L423)): Tiene `price1` a `price5` pero son **solo de unidad**
- No existe `bulkPrice1` a `bulkPrice5` en ninguna parte del código
- La búsqueda `bulk_price` en todo el backend devuelve 0 resultados
- El schema de productos solo maneja 5 precios genéricos, sin distinción unidad/bulto

**Lo que falta:**
1. **Base de datos:** Agregar columnas `bulk_price_1` a `bulk_price_5` en la tabla `products` (o renombrar los actuales `price_1..5` a `unit_price_1..5` y agregar los de bulto)
2. **Backend products service:** Actualizar CREATE/UPDATE/SELECT para incluir los 10 precios
3. **Frontend add-product:** Agregar sección "Precios por Bulto" con campos `bulkPrice1..5`
4. **Frontend edit-product:** Lo mismo
5. **Frontend POS/billing:** Al momento de facturar, poder elegir si se vende en unidad o bulto y que cargue el precio correspondiente

**Esfuerzo:** 🔴 Alto (2-3 sesiones — toca DB, backend y 4+ pantallas)

---

### 🔴 HALLAZGO 4: Editar el Código de Barras

**Lo que dice Carboo:**
> "Editar el código de barras"

**Estado actual verificado:**
- [edit-product-page.tsx L284-293](file:///d:/pino/sistema_final/web/src/pages/store-admin/products/edit-product-page.tsx#L284-L293): El campo de código de barras está **disabled** con el texto: "Para cambiar o agregar códigos, use la sección de Códigos Alternativos abajo."
- Existe `AlternativeBarcodes` component para multi-barcode
- **PERO** el código principal (el barcode del producto) NO se puede editar directamente

**Lo que falta:**
1. Quitar el `disabled` del input de barcode principal en edit-product-page.tsx
2. Alternativamente, agregar un botón "Editar" junto al campo que active la edición
3. Asegurar que el backend acepte actualizaciones del barcode principal

**Esfuerzo:** 🟢 Bajo (15 min)

---

## PRIORIDAD 2 — IMPORTANTE (Funciones de negocio faltantes)

### 🟠 HALLAZGO 5: No hay página de Gestión de Clientes completa

**Lo que dice Carboo:**
> "Los clientes no tenemos la página de gestión de clientes, donde metamos los datos del cliente más su límite de crédito y la cantidad de días que ese cliente tiene que pagar"

**Estado actual verificado:**
- Existe [vendor-clients-page.tsx](file:///d:/pino/sistema_final/web/src/pages/store-admin/vendors/vendor-clients-page.tsx) — **Solo muestra listado con columnas:** Nombre, Contacto, Dirección, Zona, Vendedor, Crédito (badge), Historial
- ❌ **NO muestra** `limite_credito` ni `dias_credito` en la tabla
- ❌ **NO tiene formulario** para editar datos del cliente (solo un diálogo para agregar con `AddClientDialog`)
- El backend SÍ tiene los campos `limite_credito` y `dias_credito` en [clients.service.ts](file:///d:/pino/sistema_final/backend/src/modules/clients/clients.service.ts#L14)
- El backend SÍ tiene endpoint `PATCH /clients/:id` con `UpdateClientDto`

**Lo que falta:**
1. Agregar **columnas** "Límite Crédito" y "Días Crédito" a la tabla de clientes
2. Crear **formulario de edición** de cliente (edit-client-page o dialog)
3. En el formulario: campos para `limiteCredito`, `diasCredito`, `frecuenciaVisita`, `diaVisita`, `notasEntrega`, coordenadas GPS
4. Botón "Editar" en cada fila del listado de clientes

**Esfuerzo:** 🟡 Medio (1 sesión)

---

### 🟠 HALLAZGO 6: Gestión de Proveedores — Acceso directo a Facturas

**Lo que dice Carboo:**
> "No hay una opción para que diga factura de proveedores para solo darle click y ya, actualmente me tengo que ir a entrada, darle a un producto y después en factura"

**Estado actual verificado:**
- Existe [suppliers-page.tsx](file:///d:/pino/sistema_final/web/src/pages/store-admin/suppliers/suppliers-page.tsx) — Lista proveedores ✅
- Existe [supplier-invoices-page.tsx](file:///d:/pino/sistema_final/web/src/pages/store-admin/suppliers/supplier-invoices-page.tsx) — 39KB, completa ✅
- **PERO** el menú lateral no tiene entrada directa a "Facturas de Proveedores"
- La ruta existe: `/store/:storeId/suppliers/invoice` (App.tsx L197)
- **Falta un link directo en el menú** lateral (app-layout.tsx)

**Lo que falta:**
1. Agregar link directo "Facturas Proveedor" en el menú lateral bajo "Inventario y Compras"
2. Verificar que la página funcione independientemente (sin necesitar seleccionar producto primero)

**Esfuerzo:** 🟢 Bajo (15 min)

---

### 🟠 HALLAZGO 7: Inventario Valorizado en Córdobas y Dólares (Reporte para bancos)

**Lo que dice Carboo:**
> "Para factor del los bancos el cliente requiere lo siguiente: inventario valorizado en Córdoba y dólares, eso es con precio costos"

**Estado actual verificado:**
- [reports-page.tsx](file:///d:/pino/sistema_final/web/src/pages/store-admin/reports/reports-page.tsx): Solo tiene reportes de **ventas** (por departamento y por producto)
- ❌ NO existe reporte de inventario valorizado
- ❌ NO existe soporte para tasa de cambio USD/NIO

**Lo que falta:**
1. **Nuevo reporte:** "Inventario Valorizado" que muestre:
   - Producto | Existencia | Costo Unitario | Valor Total C$ | Valor Total US$
   - Total general en ambas monedas
2. **Configuración de tasa de cambio:** Campo en `config` para tipo de cambio USD/NIO
3. **Exportar a Excel** para entregar al banco
4. Agregar este reporte a la página de Reportes o como una opción nueva en el menú

**Esfuerzo:** 🟡 Medio (1 sesión)

---

## PRIORIDAD 3 — REESTRUCTURA DE ROLES (Requiere planificación)

### 🟡 HALLAZGO 8: La "T" en Existencias del Inventario

**Lo que dice Carboo:**
> "En el inventario la IA puso en las cantidades una T que creo que se refiere a los 140 T, osea la T es total... que la elimines. Que prefiere que diga unidades y abajo la cantidad en bultos y unidades"

**Estado actual verificado:**
- [products-page.tsx L243-244](file:///d:/pino/sistema_final/web/src/pages/store-admin/products/products-page.tsx#L243-L244): El badge muestra `{product.currentStock} T` y debajo `{product.stockBulks} Bultos, {product.stockUnits} U`

**Lo que falta:**
1. Eliminar la **"T"** del badge
2. Cambiar el formato para mostrar:
   - Línea 1: **Existencia** (número sin "T")
   - Línea 2: `X Bultos, Y Unidades`
3. Es un cambio cosmético simple

**Esfuerzo:** 🟢 Bajo (5 min)

---

### 🟡 HALLAZGO 9: Roles Mezclados — Supermercado vs Distribuidora vs Bodega

**Lo que dice Carboo:**
> "Es importante dividir los roles porque hasta cierto punto están mezclados"

**Resumen de roles por tipo de negocio según Carboo:**

#### 🏪 BODEGA CENTRAL
| Rol | Función |
|---|---|
| Gerente/Admin | Gestión general |
| Bodeguero | Control de stock, picking, despacho |
| Auxiliar | Digita todo, ayuda al gerente |
| Rutero | Entrega en la calle (usuario de bodega, NO de tienda) |
| Preventista (gestor ventas) | Venta en la calle (usuario de bodega, NO de tienda) |

#### 🛒 SUPERMERCADO
| Rol | Función |
|---|---|
| Gerente/Admin | Gestión total del supermercado |
| Bodeguero | Stock interno del supermercado |
| Auxiliar | Digitación, ayuda al gerente |
| Cajero | Facturación POS |
| Supervisor de Caja | Revisa arqueos de apertura y cierre |
| Supervisor de Pasillo | Revisa estantes, levanta requisas a bodega |

#### 🚚 DISTRIBUIDORA
| Rol | Función |
|---|---|
| Gerente/Admin | Gestión total |
| Cajero | Facturación |
| Despachador | Solo aplica a distribuidora |
| Auxiliar | Digitación |

**Estado actual de roles en el código:**
```
MASTER_ROLES:      ['master-admin', 'owner']
STORE_ADMIN_ROLES: ['store-admin']
CASHIER_ROLES:     ['cashier', 'store-admin']
INVENTORY_ROLES:   ['inventory', 'store-admin']
DISPATCH_ROLES:    ['dispatcher', 'store-admin', 'sales-manager']
DELIVERY_ROLES:    ['rutero', 'store-admin', 'sales-manager']
SALES_TEAM_ROLES:  ['vendor', 'sales-manager', 'store-admin']
SALES_ADMIN_ROLES: ['sales-manager', 'store-admin']
```

**Problemas detectados:**
1. ❌ No existe rol `auxiliar`
2. ❌ No existe rol `supervisor-caja`
3. ❌ No existe rol `supervisor-pasillo`
4. ❌ Rutero y Preventista están como usuarios de tienda, deberían ser de **bodega**
5. ❌ No hay distinción de `store_type` (supermercado vs distribuidora) que afecte qué roles/menús mostrar
6. ⚠️ La tabla `stores` tiene campo `store_type` pero no se usa para filtrar roles/menús

**Lo que falta:**
1. Agregar nuevos roles: `auxiliar`, `supervisor-caja`, `supervisor-pasillo`
2. Modificar `normalizeUserRole()` para reconocer los nuevos roles
3. Condicionar menú lateral según `store_type`: supermercado muestra supervisor de caja/pasillo; distribuidora muestra despachador
4. Rutero/Preventista: asignarlos como usuarios de la bodega central, no de tienda

**Esfuerzo:** 🔴 Alto (3-4 sesiones)

---

### 🟡 HALLAZGO 10: Dashboards Específicos por Rol de Bodega

**Lo que dice Carboo:**
> "Lo mejor es afinar uno por uno, afinemos el dashboard de cada usuario de la bodega primero"

**Estado actual:**
- Existe [warehouse-dashboard-page.tsx](file:///d:/pino/sistema_final/web/src/pages/store-admin/warehouse/warehouse-dashboard-page.tsx) — Un solo dashboard genérico
- No hay dashboards diferenciados para: bodeguero, auxiliar, gerente de bodega

**Lo que falta:**
1. Dashboard Bodeguero: Pedidos pendientes de alistar, stock bajo, últimos movimientos
2. Dashboard Auxiliar: Tareas del día, digitación pendiente
3. Dashboard Gerente Bodega: KPIs, pedidos procesados vs pendientes, eficiencia

**Esfuerzo:** 🟡 Medio (1-2 sesiones)

---

### 🟡 HALLAZGO 11: Distribuidora maneja Crédito, Supermercado NO

**Lo que dice Carboo:**
> "La distribuidora maneja clientes a crédito y el super no... ambos negocios tienen sus cuentas por pagar y cobrar"

**Estado actual:**
- CxC y CxP existen en backend y frontend ✅
- **PERO** no hay filtro por `store_type` para ocultar CxC del supermercado
- Las páginas de crédito son accesibles para cualquier tienda

**Lo que falta:**
1. Condicionar visibilidad de "Cuentas por Cobrar" según `store_type`
2. En supermercado: ventas solo al contado (o con tarjeta), sin crédito a clientes
3. En distribuidora: crédito completo con límites y días

**Esfuerzo:** 🟡 Medio (1 sesión)

---

### 🟡 HALLAZGO 12: Arqueo de Cajero usa datos RANDOM

**Detalle técnico encontrado durante auditoría:**
- [arqueos-page.tsx L55](file:///d:/pino/sistema_final/web/src/pages/store-admin/finance/arqueos-page.tsx#L55): El monto esperado se genera con `Math.random()` — esto es un placeholder que NUNCA debe llegar a producción

**Lo que falta:**
1. Conectar con el backend real para obtener el monto esperado basado en ventas del turno
2. Eliminar el `Math.random()` completamente

**Esfuerzo:** 🟢 Bajo (30 min)

---

## PLAN DE EJECUCIÓN RECOMENDADO

Siguiendo la regla de Carboo: **"Afinar uno por uno"**

| Orden | Hallazgo | Tiempo | Dependencias |
|---|---|---|---|
| 1 | #8 — Quitar "T" de existencias | 5 min | Ninguna |
| 2 | #4 — Habilitar edición de código de barras | 15 min | Ninguna |
| 3 | #6 — Link directo a Facturas de Proveedor | 15 min | Ninguna |
| 4 | #2 — Cajero no cierre caja de otro | 30 min | Ninguna |
| 5 | #12 — Eliminar Math.random() del arqueo | 30 min | Ninguna |
| 6 | #1 — Arqueo por denominaciones en apertura/cierre | 1-2 sesiones | Hallazgo #2 primero |
| 7 | #5 — Gestión completa de clientes | 1 sesión | Ninguna |
| 8 | #7 — Reporte inventario valorizado | 1 sesión | Ninguna |
| 9 | #3 — Precios unidad + bulto (1-5 cada uno) | 2-3 sesiones | Requiere migración DB |
| 10 | #9 — Reestructura de roles | 3-4 sesiones | Decisión de negocio |
| 11 | #10 — Dashboards por rol | 1-2 sesiones | Hallazgo #9 primero |
| 12 | #11 — Crédito solo en distribuidora | 1 sesión | Hallazgo #9 primero |

---

## CREDENCIALES DE PRUEBA (Confirmadas por Carboo)

### 👑 Administradores Globales (master-admin)
| Email | Clave |
|---|---|
| `admin@multitienda.com` | `123` o `admin123` |
| `dueno@lospinos.com` | `123` |

### 🏬 Administradores de Tienda (store-admin)
| Email | Clave |
|---|---|
| `gerente@tienda.com` | `admin123` |
| `admin_test@lospinos.com` | `123` |

### 💰 Cajeros / Vendedores
| Email | Clave | Rol |
|---|---|---|
| `cajero@tienda.com` | `admin123` | cashier |
| `vendedor@tienda.com` | `admin123` | vendor |
| `vender@lospinos.com` | `123` | vendor |

### 📦 Bodega e Inventario
| Email | Clave | Rol |
|---|---|---|
| `bodeguero@tienda.com` | `admin123` | inventory |
| `bodeg@lospinos.com` | `123` | inventory |

### 📊 Gestores y Supervisores
| Email | Clave | Rol |
|---|---|---|
| `gestor@lospinos.com` | `123` | sales-manager |
| `rute@lospinos.com` | `123` | rutero |

---

## ARCHIVOS CLAVE REFERENCIADOS

| Área | Archivo | Tamaño |
|---|---|---|
| Caja Registradora | `web/src/pages/store-admin/cash-register/cash-register-page.tsx` | 17.9 KB |
| Arqueo de Ruteros | `web/src/pages/store-admin/finance/arqueos-page.tsx` | 10.2 KB |
| Productos (listado) | `web/src/pages/store-admin/products/products-page.tsx` | 18.8 KB |
| Producto (agregar) | `web/src/pages/store-admin/products/add-product-page.tsx` | 23.6 KB |
| Producto (editar) | `web/src/pages/store-admin/products/edit-product-page.tsx` | 17.2 KB |
| Clientes (listado) | `web/src/pages/store-admin/vendors/vendor-clients-page.tsx` | 8.7 KB |
| Reportes | `web/src/pages/store-admin/reports/reports-page.tsx` | 7.6 KB |
| Proveedores | `web/src/pages/store-admin/suppliers/suppliers-page.tsx` | 6.5 KB |
| Backend Cash Shifts | `backend/src/modules/cash-shifts/cash-shifts.service.ts` | 7.2 KB |
| Backend Clientes | `backend/src/modules/clients/clients.service.ts` | 6.4 KB |
| Routing Principal | `web/src/App.tsx` | 24 KB |
| Roles y Permisos | `docs/19_USUARIOS_ROLES_Y_PERMISOS.md` | 6.5 KB |
