# Tablero de Trello "Los Pinos" — Resumen Detallado

Este documento contiene la estructura completa y oficial del **Tablero de Trello "Los Pinos"**, organizada por listas, tarjetas y flujos operativos del sistema.

---

## 📋 Lista: Roles

### 👑 1. Administrador General
- **Estado**: Tarjeta creada (Administración Master / Super Admin).
- **Comentario en la tarjeta**: *"este rol es el primer rol"*.

---

### 📦 2. Jefe / Encargado de Bodega Central

#### ✅ Lo que SÍ hace:
- **Acceso y Control Total**: Acceso irrestricto a los 38 módulos del sistema backend y configuraciones globales.
- **Gestión de Roles y Usuarios**: Crear, editar, activar, desactivar y asignar contraseñas/roles a cualquier usuario.
- **Configuración de Negocio**: Modificar reglas de precios, parámetros de facturación, impuestos y zonas geográficas (`zones`, `store-zones`).
- **Supervisión Global**: Consultar reportes consolidados de ventas, utilidades, inventarios generales y auditorías del sistema.
- **Sobrescribir Autorizaciones**: Aprobar de emergencia cualquier transacción bloqueada o requerida por otro rol (`authorizations`).
- **Creación y Configuración de Rutas**: Diseñar y estructurar las rutas de venta y de reparto en la Web (`routes`, `zones`).
- **Asignación de Clientes a Gestores**: Asignar carteras de clientes y secuencias de visitas diarias a los Gestores de Ventas.
- **Asignación de Cargas a Ruteros**: Consolidar pedidos levantados y asignar las hojas de reparto/camión a los Ruteros.
- **Reasignación Dinámica**: Cambiar clientes de vendedor o reasignar cargas entre ruteros en caso de emergencias o ausencias.

#### ❌ Lo que NO hace:
- **Operación física directa**: No realiza conteos de almacén en piso ni despacho de camiones en el día a día (delegado al equipo operativo).
- **Sin restricciones**: No tiene ninguna restricción técnica en la plataforma.

---

### 🕵️ 3. Analista de Inventario (Bodeguero / Auditor)

#### ✅ Lo que SÍ hace:
- **Auditoría de Kárdex**: Monitorear todos los movimientos de entrada/salida (`movements`) expresados en unidades base y su conversión a bultos.
- **Ejecutar Arqueos Físicos**: Crear y registrar conteos ciegos o parciales por zonas y pasillos de la bodega (`arqueos`).
- **Solicitar Ajustes de Stock**: Detectar discrepancias y generar solicitudes de ajuste para que el Jefe de Bodega las autorice.
- **Monitorear Errores e Inconsistencias**: Revisar logs de diferencias entre lo despachado versus lo liquidado por las rutas.

#### ❌ Lo que NO hace:
- **Auto-Aprobar Ajustes**: No puede aprobar los ajustes que él mismo solicita (separación de funciones para evitar fraudes).
- **Cobrar o Manejar Efectivo**: No recibe pagos de clientes ni liquida dinero de los Ruteros.
- **Modificar Catálogo**: No crea productos ni cambia sus precios.

---

### 👷 4. Auxiliar de Recepción y Despacho Físico

#### ✅ Lo que SÍ hace:
- **Registrar Recepción Física**: Digitar la entrada real de mercancía de proveedores en Bultos y Unidades usando escáner o teclado.
- **Armar Cargas Físicas**: Preparar la mercancía en pallets/cajas según la hoja de consolidación para subirla al camión del Rutero.
- **Recibir Devoluciones de Campo**: Contar físicamente el producto devuelto o no vendido que el Rutero trae al cerrar la ruta.
- **Escaneo de Código de Barras**: Asignar o escanear códigos de barra tanto para la unidad suelta como para el bulto cerrado (`product_barcodes`).

#### ❌ Lo que NO hace:
- No tiene acceso a márgenes, costos de compra ni valorización monetaria de la bodega.
- No puede dar de baja producto dañado ni aprobar faltantes de inventario en el Kárdex.
- No puede cambiar el factor $X$ de unidades por bulto de ningún producto.

---

### 📱 5. Gestor de Ventas (App Mobile Android)

#### ✅ Lo que SÍ hace:
- **Levantar Pedidos Preventa**: Tomar pedidos a clientes en ruta seleccionando Bultos y/o Unidades directamente en la App Android.
- **Consultar Stock de Bodega**: Ver en tiempo real (o última sincronización) la disponibilidad de inventario en la Bodega Central en Bultos/Unidades.
- **Consultar Cuentas por Cobrar**: Verificar saldo pendiente y límite de crédito del cliente antes de vender.
- **Registrar Visita a Clientes**: Marcar geolocalización GPS o estado de visita.

#### ❌ Lo que NO hace:
- **No maneja inventario físico**: No lleva mercancía en su vehículo ni despacha.
- **No confirma facturas ni hace cobros directos**.
- **No modifica precios ni el factor $X$**.
- **No puede autoasignarse clientes**: Solo ve y atiende a los clientes asignados por la administración en su ruta del día.

---

### 🚚 6. Rutero / Repartidor (App Mobile Android)

#### ✅ Lo que SÍ hace:
- **Recepcionar carga asignada**: Inspeccionar y aceptar en la App el inventario cargado en su camión.
- **Entregar y facturar**: Confirmar entrega física y convertir la orden en factura/ticket.
- **Procesar rechazos y devoluciones**.
- **Recaudar cobros**: Efectivo, transferencia, cheque y emitir recibo por impresora Bluetooth.
- **Rendir liquidación diaria**: Entregar mercancía no vendida y el efectivo al final del día.

#### ❌ Lo que NO hace:
- **No levanta preventas nuevas**.
- **No modifica precios en la calle**.
- **No ajusta el inventario general de la Bodega Central** (solo su propio inventario de camión).
- **No escoge qué pedidos entregar**: Solo transporta y entrega la ruta de carga que le fue consolidada y asignada por el Jefe de Bodega Central.

---

## 📋 Lista: Proceso (Versión Numerada por Roles)

### 👑 1. Administrador
- **Módulo**: Plataforma Web (React 19) — **Frecuencia**: Eventual / Diaria.
- **Proceso A (Alta y configuración de personal)**: Entra a *Configuración > Gestión de Usuarios*, registra nombre/correo/usuario/contraseña, asigna el rol exacto (`JEFE_BODEGA`, `AUXILIAR_DESPACHO`, `AUDITOR_INVENTARIO`, `GESTOR_VENTAS`, `RUTERO`), y guarda (el backend encripta la contraseña con Argon2).
- **Proceso B (Autorización de emergencia)**: Recibe alertas de procesos bloqueados (`authorizations`), revisa el incidente y aprueba o rechaza, quedando su firma digital registrada.

---

### 📦 2. Jefe / Encargado de Bodega Central
- **Módulo**: Plataforma Web (React 19) — **Frecuencia**: Diaria / Continua.
- **Proceso A (Configuración del factor X en productos)**: Crea productos en el catálogo con SKU, nombre, descripción, precios; activa el switch *"¿Se controla en bultos?"* (`handles_bulk`) y define *"Unidades por Bulto (X)"* (ejemplo: 20). El sistema garantiza que $X > 1$ en PostgreSQL.
- **Proceso B (Aprobación y cierre de liquidación de ruta)**: Recibe al Rutero al final de su jornada; el sistema cruza automáticamente `Carga Inicial − Facturas Entregadas = Mercancía Teórica a Retornar`; valida el reporte del Auxiliar y cierra la liquidación, devolviendo el stock no vendido al Kárdex.

---

### 👷 3. Auxiliar de Recepción y Despacho
- **Módulo**: Web / Terminal de Almacén (React 19) — **Frecuencia**: Diaria (Operación de Piso).
- **Proceso A (Recepción física de compras)**: Ingresa al módulo de Ingreso de Inventario, cuenta y digita Bultos y Unidades recibidas, valida con lector de barras, y el sistema convierte todo a Unidades Totales Base $[(B \times X) + U]$.
- **Proceso B (Armado y entrega de carga para Rutero)**: Abre la orden de despacho consolidada, retira los bultos/unidades solicitados, hace checklist junto al Rutero y marca el pedido como *"Cargado y Entregado a Transportista"*.

---

### 🕵️ 4. Analista / Auditor de Inventarios
- **Módulo**: Plataforma Web (React 19) — **Frecuencia**: Diaria / Periódica.
- **Proceso A (Arqueo/conteo físico ciego)**: Programa un evento en Arqueos de Inventario para una zona/pasillo, cuenta físicamente sin ver el stock lógico (conteo ciego), el sistema compara contra `movements` y genera Reporte de Discrepancia si hay diferencias.
- **Proceso B (Solicitud de ajuste de Kárdex)**: A partir del reporte de discrepancia, indica el motivo (ej. *"3 bultos rotos en estiba"*) y envía la solicitud a `authorizations`, quedando pendiente hasta la aprobación del Jefe de Bodega o Admin.

---

### 📱 5. Gestor de Ventas (Preventista)
- **Módulo**: App Móvil Android (Flutter + Drift/SQLite, Local-First) — **Frecuencia**: Diaria en Campo.
- **Proceso (Toma de pedidos preventa offline)**: Sincroniza catálogo/clientes/stock al inicio del día, visita al cliente según su ruta, abre el catálogo (que muestra stock como *"50 Bultos / 10 Unidades"*), digita cantidades en Bultos y Unidades (la app calcula el total en tiempo real), y guarda el pedido localmente en SQLite. Al recuperar conexión, se envía al backend NestJS automáticamente mediante el patrón Outbox.

---

### 🚚 6. Rutero / Repartidor
- **Módulo**: App Móvil Android (Flutter + Drift/SQLite + Impresora Bluetooth) — **Frecuencia**: Diaria en Campo.
- **Proceso A (Recepción e inspección de carga)**: Abre la app, selecciona *"Aceptar Carga del Día"*, revisa el resumen en Bultos y Unidades, firma la recepción digital.
- **Proceso B (Entrega, cobro y facturación)**: Selecciona al cliente en su lista de entregas; si hay entrega parcial o rechazo, ajusta la cantidad (se registra como Devolución en Tránsito); registra el método de pago y convierte la orden en factura; imprime el comprobante en su impresora Bluetooth.
- **Proceso C (Cierre de ruta)**: Al volver a la bodega, selecciona *"Finalizar Ruta"*, entrega la mercancía no vendida al Auxiliar de Bodega y el efectivo al Cajero, y envía el resumen de liquidación para revisión del Jefe de Bodega.

---

## 📋 Lista: Tareas (Módulo de Creación y Asignación de Rutas)

### 🗺️ 1. Módulo de Creación y Configuración de Rutas (Web Admin)
En el backend NestJS existen los módulos `zones`, `routes`, `chains`, `stores` y `grupos-clientes`. Las rutas se crean en la Web, menú *Logística y Comercial > Definición de Rutas*. Existen dos tipos:
1. **Rutas de Ventas (Preventa)**: Agrupan clientes por cercanía/secuencia para tomar pedidos.
2. **Rutas de Reparto (Entrega)**: Agrupan sectores/municipios a donde el camión entrega físicamente.

---

### 👤 2. ¿Quién asigna clientes al GESTOR DE VENTAS?
- **Responsable**: El Jefe de Bodega Central o el Supervisor Comercial, desde la Web.

```
[ Web Admin: Módulo de Rutas / Clientes ]
   ├──► 1. Asignar Zona/Día (ej. "Ruta Lunes - Zona Norte")
   ├──► 2. Vincular Clientes a la Ruta
   └──► 3. Asignar Ruta al Gestor "Carlos Vendedor"
             │
             ▼
   Sincronización mediante API / DB Offline
             │
             ▼
   [ App Android Flutter del Gestor de Ventas ]
   (Visualiza solo su lista de clientes asignados para el día)
```

- **Asignación Inicial**: Se crea la ruta comercial en la Web, se seleccionan clientes de la base de datos, se asigna el usuario Gestor responsable. Al iniciar sesión, la app descarga automáticamente esa lista.
- **Reasignación en Tiempo Real**: Si un Gestor no puede atender (ej. se enferma), el Jefe de Bodega entra a *Gestión de Clientes > Reasignación Express*, selecciona los clientes y cambia el responsable a otro Gestor. En la siguiente sincronización, los clientes aparecen en la app del nuevo Gestor.

---

### 🚚 3. ¿Quién asigna las rutas al RUTERO?
- **Responsable**: El Jefe de Bodega Central, desde la Web, al consolidar los pedidos de preventa para el despacho.

```
[ 1. Gestores de Ventas levantan 50 pedidos en la App ]
             │
             ▼
[ 2. Jefe de Bodega en Web: Módulo "Despacho & Cargas Camión" ]
   - Filtra pedidos de la "Zona Sur"
   - Asigna los 50 pedidos a la Carga del Camión #3
   - Asigna la Carga al Rutero "Juan Repartidor"
             │
             ▼
[ 3. Auxiliar arma la carga en la bodega física ]
             │
             ▼
[ 4. App Android Flutter del Rutero "Juan Repartidor" ]
   - Recibe la Carga #3 con su Mapa/Lista de Entrega ordenada
```

- **Generación de la Carga**: El Jefe de Bodega revisa pedidos pendientes (`pending-orders`) de los Gestores.
- **Consolidación y Asignación**: Agrupa pedidos por zona/sector, crea una Carga de Camión (`cargas-camion`), asigna al Rutero. El sistema genera automáticamente el Plan de Entrega / Ruta de Reparto (`routes` / `pending-deliveries`).
- **Reasignación de Entrega**: Si un Rutero tiene una avería, el Jefe de Bodega transfiere la carga/pedidos pendientes a otro Rutero disponible.
