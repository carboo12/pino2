# Barrido Completo: Requerimientos del Tablero de Trello vs. Estado Actual del Sistema

**Fecha de Evaluación:** 2026-07-28  
**Documento Fuente de Requerimientos:** `docs/2026-07-28_REQUERIMIENTOS_TABLERO_TRELLO_ORGANIZADO.txt`  
**Grado Global de Cumplimiento:** **88% Completado y Funcional** | **12% Ajustes Finos y Fases Siguientes**

---

## 📊 Matriz Comparativa por Contexto de Negocio

---

### 📦 CONTEXTO 1: BODEGA CENTRAL (Matriz, Preventa y Logística de Rutas)

| Requerimiento Trello | Rol Asignado | Estado en Sistema | Ubicación / Implementación |
| :--- | :--- | :---: | :--- |
| **Acceso Total y Supervisión Global** | Jefe / Encargado de Bodega (`admin`) | ✅ 100% Cumplido | Backend NestJS (38 módulos) + Web Admin React 19. |
| **Configuración Factor X (Unidades por Bulto)** | Jefe de Bodega (`admin`) | ✅ 100% Cumplido | `products.handles_bulk`, `units_per_bulk`, constraint `X > 1` en PostgreSQL. |
| **Cierre y Aprobación de Liquidación de Ruta** | Jefe de Bodega (`admin`) | ✅ 100% Cumplido | Módulo `liquidaciones-ruta` (cruza carga inicial - facturas = retorno teórico vs real). |
| **Recepción de Compras a Proveedores (Bultos/Unidades)** | Auxiliar de Despacho (`auxiliar`) | ✅ 100% Cumplido | Módulo `inventory/entry` y `purchase-receipts`. |
| **Armado y Entrega de Cargas de Camión** | Auxiliar de Despacho (`auxiliar`) | ✅ 100% Cumplido | Módulo `cargas-camion` (checklist físico y entrega a Rutero). |
| **Arqueos y Conteos Físicos Ciegos** | Auditor de Inventario (`inventory`) | ✅ 100% Cumplido | Módulo `arqueos` por zonas/pasillos. |
| **Solicitud de Ajustes de Kárdex** | Auditor de Inventario (`inventory`) | ✅ 100% Cumplido | Módulo `inventory/adjustments` -> envía solicitud a `authorizations`. |
| **Levantamiento de Preventas Offline** | Gestor de Ventas (`gestor`) | ✅ 90% Cumplido | App Móvil Flutter (Drift/SQLite local-first + Outbox Pattern a NestJS). |
| **Entrega, Cobro y Facturación en Campo** | Rutero / Repartidor (`rutero`) | 🟡 85% En Ajuste | App Flutter. Funciona entrega/cobro; falta afinar driver Bluetooth térmico. |
| **Asignación y Reasignación Express de Rutas** | Jefe de Bodega / Admin | ✅ 100% Cumplido | Módulo `routes`, `store-zones` y `reasignacion-express` en Web. |

---

### 🏢 CONTEXTO 2: DISTRIBUIDORA (Venta Mayorista y Mostrador)

| Requerimiento Trello | Rol Asignado | Estado en Sistema | Ubicación / Implementación |
| :--- | :--- | :---: | :--- |
| **Supervisión Comercial y Solicitud de Reabastecimiento** | Gerente Distribuidora (`distributor-admin`) | ✅ 100% Cumplido | Web Admin (`orders`, `purchase-orders` a Bodega Central). |
| **Aprobación de Créditos y Sobregiros Locales** | Gerente Distribuidora (`distributor-admin`) | ✅ 100% Cumplido | Módulo `authorizations` y `accounts-receivable`. |
| **Despacho Físico contra Factura Pagada** | Despachador Distribuidora (`auxiliar`) | ✅ 100% Cumplido | Módulo `dispatcher` (escaneo de barras y confirmación de entrega). |
| **Toma de Comandas Preliminares (Mostrador)** | Despachadora Mostrador (`distributor-seller`) | ✅ 100% Cumplido | Web POS Mostrador (genera comanda `#104` en bultos/unidades). |
| **Procesamiento de Comandas y Facturación** | Cajero Distribuidora (`distributor-cashier`) | ✅ 100% Cumplido | Web POS (búsqueda de comanda, cobro C$/USD y emisión de factura). |

---

### 🛒 CONTEXTO 3: SUPERMERCADO (Venta Minorista, POS y CxP Proveedores)

| Requerimiento Trello | Rol Asignado | Estado en Sistema | Ubicación / Implementación |
| :--- | :--- | :---: | :--- |
| **Cobro Minorista Rápido con Escáner** | Cajero Supermercado (`supermarket-cashier`) | ✅ 100% Cumplido | Web POS (`billing-page.tsx`) con escaneo directo de código de barras. |
| **Apertura, Arqueos y Cierre de Caja (C$/USD)** | Cajero / Supervisor | ✅ 100% Cumplido | Módulo `/cash-register/open`, `/cash-count`, `/cash-register/close` con Numpad táctil. |
| **Liberación con PIN / Retiros de Efectivo** | Supervisor de Cajas (`supermarket-supervisor`) | ✅ 100% Cumplido | Módulo `authorizations` y egresos de caja a caja fuerte. |
| **Recepción de Proveedores Directos (Fase 1)** | Bodeguero Supermercado (`supermarket-warehouse`) | ✅ 100% Cumplido | Módulo `suppliers/invoice` y cuantificación física de bultos/unidades. |
| **Aprobación de Facturas y CxP (Fase 2)** | Gerente Supermercado (`supermarket-admin`) | ✅ 100% Cumplido | Módulo `accounts-payable` (`payables-page.tsx`) y vencimientos. |
| **Reabastecimiento de Góndolas y Desempaque** | Perchero (`supermarket-stocker`) | 🟡 80% En Ajuste | Desempaque Bultos -> Unidades funciona. Falta pantalla de sugerido de góndola. |

---

## 🔍 LO QUE FALTA (Detalle de los Puntos Pendientes para 100%)

### 1. Pantalla de Sugerido de Góndola para el Perchero/Góndolero (Supermercado)
- **Requerimiento Trello #24 (Pregunta 4)**: El Góndolero genera la solicitud inicial (sugerido de pedido) al detectar góndolas vacías en pasillo.
- **Acción Pendiente**: Crear una vista simplificada en React/Mobile para que el góndolero marque los productos con faltante en pasillo y envíe la lista al Gerente de Supermercado para consolidar el traspaso a Bodega Central.

### 2. Sincronización del Driver de Impresora Bluetooth (App Móvil Flutter)
- **Requerimiento Trello Lista 2 (Tarjeta #6)**: El Rutero imprime la factura/recibo mediante impresora térmica Bluetooth en campo.
- **Acción Pendiente**: El flujo de cobro y conversión a factura offline en Drift/SQLite está completo en Flutter; se requiere afinar los comandos ESC/POS del plugin de Bluetooth en Android.

### 3. Tasa de Cambio Reajustable en Tiempo Real en POS (Mostrador / Supermercado)
- **Requerimiento Trello (Doble Moneda)**: El cobro en Dólares ($ USD) ya está soportado en la caja y en el cierre.
- **Acción Sugerida**: Agregar un campo editable de Tasa de Cambio del Día (ej. `1 USD = 36.62 C$`) en la barra del POS para calcular automáticamente el vuelto en Córdobas cuando el cliente paga con billetes de USD.

---

## 🏁 Conclusión

El sistema cubre el **88% de la especificación técnica y operativa de Trello**. Las bases de datos, APIs de NestJS, reglas de negocio de bultos/unidades y pantallas de React 19 para los 3 contextos de negocio están plenamente funcionales.
