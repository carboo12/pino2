# 📋 Auditoría Detallada UX — Página por Página

---

## REACT WEB — Análisis por Componente

### 1. Login Page (`login-page.tsx`)

**Estado actual:**
- Estilo neumorfista con sombras `shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_8px_#ffffff]`
- Icono SVG genérico de "capas" — no comunica la marca "Pino"
- Texto de footer "World Wide All in One Programing" poco profesional
- Link a "Olvidaste tu contraseña" con dos opciones confusas (pedir a admin + link automatizado)
- **No tiene dark mode** (las sombras neumorfistas se ven como artefactos en fondos oscuros)

**Problemas:**
- ❌ Neumorfismo es una tendencia muerta desde 2022
- ❌ No hay branding (logo, colores de marca)
- ❌ Dos caminos para recuperar contraseña es confuso
- ❌ Footer con copyright largo innecesario en login

**Propuesta:** Ver `02_FASE1_LOGIN_REDISEÑO.md`

---

### 2. App Layout / Sidebar (`app-layout.tsx` — 744 líneas)

**Estado actual:**
- Sidebar colapsable con texto completo → solo iconos
- 13 items para master-admin (dashboard, tiendas, cadenas, usuarios, licencias, separator, sync-monitor, monitor, comparar, separator, zonas, sub-zonas, configuración)
- 7 items para store-admin (Pulso, Caja, Bodega, Ventas/Ruta, Finanzas, Catálogo, Admin)
- Roles operativos (bodeguero=2 items, cajero=2 items, despacho=1 item)
- Sistema de traducciones es/en que nunca se usa (el botón de idioma no está visible)
- Footer de copyright repite en todas las páginas

**Problemas:**
- ❌ **Master-admin**: 13 items es demasiado. "Zonas Globales" y "Sub-Zonas (Barrios)" deberían estar dentro de Configuración
- ❌ **Master-admin**: "Monitor" y "Monitor de Sincronización" son confusos — ¿cuál es cuál?
- ❌ Roles operativos con 1-2 items: el sidebar es un desperdicio de espacio. Mejor usar un topbar con tabs
- ❌ Traducciones en/es nunca se usan → código muerto
- ❌ Link "Regresar a Tiendas" visible solo para admins dentro de tienda — correcto pero el botón podría ser más sutil

**Propuesta:** Ver `03_FASE2_NAVEGACION_WEB.md`

---

### 3. Store Admin Dashboard (`dashboard-page.tsx`)

**Estado actual:**
- Hero section con gradiente oscuro "Panel Operativo" + badge "Pulsaciones vivas"
- 4 cards de "Acción rápida" (Facturar, Bodega, Despacho, Cobranza) cada una con título, descripción, badge "Acción rápida" y botón "Abrir"
- Card de "Resumen operativo" con métricas
- Card dashed de "tip" operacional con botones a Productos e Ir a bodega

**Problemas:**
- ❌ **Redundancia total**: Las 4 acciones rápidas son las mismas que las entradas del sidebar (Caja, Bodega, Ventas, Finanzas)
- ❌ Badge "Acción rápida" en cada card es ruido visual — no aporta información
- ❌ Card de "tip" al final es texto de relleno
- ❌ "Pulsaciones vivas" como badge es confuso — no hay pulsaciones reales visibles

**Propuesta:** Eliminar las 4 cards de acción rápida. El dashboard debe ser SOLO métricas + excepciones que requieran atención. Las acciones ya están en el sidebar.

---

### 4. Cash Workspace (`cash-workspace-page.tsx` — 518 líneas)

**Estado actual:**
- Tabs: Venta | Caja | Devolución | Historial
- Tab "Venta": ProductSearch + carrito con líneas de items → bien diseñado
- Tab "Caja": Solo muestra "No hay caja abierta" + botón
- Tab "Devolución": Solo muestra EmptyState con botón "Abrir devolución"
- Tab "Historial": Lista de ventas recientes
- ActionDock flotante con total y botón "Cobrar (F10)"
- Atajos de teclado (F2-F10) — excelente pero no documentados en UI

**Problemas:**
- ✅ **Tab Venta está bien diseñada** — flujo claro scan→carrito→cobrar
- ❌ Tab "Caja" debería mostrar inline el estado y el botón de apertura, no una pantalla separada
- ❌ Tab "Devolución" es un placeholder que redirige a un dialog — redundante
- ⚠️ Los atajos de teclado son valiosos pero invisibles al usuario

**Propuesta:** Fusionar el estado de "Caja" como una barra de contexto en la tab de Venta. Eliminar la tab de Devolución y poner un botón en la barra de acciones.

---

### 5. Warehouse Workspace (`warehouse-workspace-page.tsx` — 449 líneas)

**Estado actual:**
- Kanban de 4 columnas: Recibido → En preparación → Alistado → Cargado
- ContextPanel lateral con detalle del pedido seleccionado
- Filtro de búsqueda en topbar
- Botones de acción progresivos en el panel de contexto

**Problemas:**
- ✅ **Diseño Kanban es excelente** — visual, claro, accionable
- ✅ ContextPanel con acciones progresivas funciona bien
- ⚠️ En mobile/tablet el kanban horizontal puede ser difícil de navegar
- ⚠️ Auto-refresh cada 15s es bueno pero no hay indicador visual

**Propuesta:** Mantener el diseño actual. Solo agregar indicador de "última actualización" en topbar.

---

### 6. Sales Workspace (`sales-workspace-page.tsx` — 198 líneas)

**Estado actual:**
- Tabs: Clientes | Pedido rápido | Cobros | Devoluciones | Rutas
- Tab "Clientes": búsqueda + lista con panel de contexto
- Tabs "Pedido rápido", "Cobros", "Devoluciones", "Rutas": **TODAS son EmptyState con un solo botón que redirige a otra página**

**Problemas:**
- ❌ **4 de 5 tabs son inútiles** — solo muestran un icono + texto + botón "Ir a X"
- ❌ Si el contenido está en otra página, ¿por qué existe la tab?
- ❌ El usuario hace 2 clicks donde debería hacer 1

**Propuesta:** Eliminar las tabs vacías. Convertir en una sola vista de "Clientes" con botones de acción rápida (Pedido, Cobrar, Devolver) que aparezcan al seleccionar un cliente.

---

### 7. Finance Workspace (`finance-workspace-page.tsx` — 260 líneas)

**Estado actual:**
- Tabs: Excepciones | Cartera | Pagos
- Tab Excepciones: lista de cuentas vencidas — bien
- Tab Cartera: lista con StatusChip y botón "Cobrar" — bien
- Tab Pagos: lista con StatusChip y botón "Pagar" — bien

**Problemas:**
- ✅ Contenido real en las 3 tabs — bien diseñado
- ⚠️ "Excepciones" es un nombre técnico. Mejor: "Alertas" o "Atención"

**Propuesta:** Renombrar "Excepciones" → "Atención". Mantener estructura actual.

---

### 8. Admin Control Center (`admin-control-center-page.tsx` — 231 líneas)

**Estado actual:**
- Lista de excepciones de múltiples fuentes (autorizaciones, cajas abiertas, stock crítico, pedidos sin avanzar)
- Cards con severidad (alta/media) y botón de acción

**Problemas:**
- ✅ Diseño "exception-based" es exactamente correcto para admin
- ⚠️ Podría tener un conteo de excepciones por tipo en un mini-dashboard arriba

**Propuesta:** Agregar mini badges de conteo arriba de la lista.

---

### 9. Master Admin Dashboard (`master-dashboard-page.tsx` — 64 líneas)

**Estado actual:**
- 5 cards en fila: Total Tiendas, Licencias Activas, Por Vencer, Sin Licencia, Total Usuarios
- Solo números — no hay gráficos ni acciones

**Problemas:**
- ❌ Demasiado simple — no da contexto accionable
- ❌ No hay links a resolver los problemas (ej: licencia vencida → ir a la tienda)

**Propuesta:** Hacer las cards clickeables a su sección relevante. Agregar una lista de "Tiendas que requieren atención".

---

## FLUTTER MOBILE — Análisis por Pantalla

### 10. Login Screen (`login_screen.dart` — 211 líneas)

**Estado actual:**
- Gradiente oscuro (navy → verde → blanco)
- Card blanca con esquinas redondeadas (28)
- Icono de storefront en cuadro verde
- Texto "Acceso móvil" + descripción
- Form con email + password + botón "Entrar"

**Problemas:**
- ✅ **Diseño limpio y moderno** — mucho mejor que el web
- ⚠️ El gradiente se corta en `stops: [0.0, 0.42, 0.42]` que da un corte visual brusco
- ⚠️ No hay branding "Pino" visible

**Propuesta:** Usar este diseño como base para unificar con web. Agregar logo "Pino".

---

### 11. Home Screen (`home_screen.dart` — 1,407 líneas)

**Estado actual:**
- `_HeroSessionCard`: nombre + email + rol
- `_StoreScopeCard`: selector de tienda con ChoiceChips
- `_QuickPulseBar`: 4 chips con métricas en tiempo real
- `_RoleActionGrid`: grid de acciones según rol (hasta 8 acciones para vendor/salesManager)
- `_BackendRuntimeCard`: panel de debugging con estado de sync, websocket, cola pendiente, entradas fallidas

**Problemas:**
- ❌ **1,407 líneas es inmanejable** — debería ser ~400
- ❌ `_BackendRuntimeCard` es información de desarrollador, no de usuario final. Ocupa ~400 líneas y confunde al operador
- ❌ `_RoleActionGrid` para vendor tiene 8 acciones — demasiadas opciones causan parálisis
- ❌ `_ActionCard` con botón primario (grande) + secundarios es bueno conceptualmente pero se pierde en el scroll
- ⚠️ El `_QuickPulseBar` es útil pero los iconos sin etiquetas son crípticos
- ⚠️ Selector de tienda solo muestra ChoiceChips — si hay >3 tiendas se desborda

**Propuesta:** Ver `05_FASE4_FLUTTER_HOME.md`

---

### 12. Preventa Home Screen (`preventa_home_screen.dart` — 394 líneas)

**Estado actual:**
- Hero card verde con "Buenos días, {nombre}" + fecha
- Grid de 4 KPIs (Visitas, Vendido, Pedidos, Pendientes)
- Botón grande "INICIAR RUTA DEL DÍA"
- Lista de últimos pedidos
- BottomNavigationBar: Inicio | Mis Clientes | Catálogo

**Problemas:**
- ✅ Diseño orientado a la acción — "INICIAR RUTA" como CTA principal es correcto
- ✅ KPIs relevantes y bien presentados
- ❌ BottomNav "Catálogo" no navega a nada (no hay handler para index==2)
- ⚠️ Los KPIs con `childAspectRatio: 1.4` se ven comprimidos en pantallas pequeñas

**Propuesta:** Ver `06_FASE5_FLUTTER_PREVENTA.md`

---

### 13. Workday Home Screen (`workday_home_screen.dart` — 468 líneas)

**Estado actual:**
- Usado por roles de ruta/venta
- Muestra tienda actual, acciones según rol, estado de sync

**Problemas:**
- ⚠️ Duplica conceptos de `home_screen.dart` — ambos son "punto de entrada después de login"
- ⚠️ Las acciones se construyen desde `_buildNextAction()` que duplica `_actionsForRole()` del home

**Propuesta:** Unificar con home_screen usando un único componente de acciones por rol.

---

### 14. Mobile Order Screen (`mobile_order_screen.dart` — 404 líneas)

**Estado actual:**
- Barra de búsqueda con filtro
- Lista de productos con stock/precio
- Carrito lateral/inferior
- Botón de confirmar pedido

**Problemas:**
- ✅ Flujo de pedido claro y funcional
- ⚠️ No hay feedback visual al agregar producto al carrito
- ⚠️ El carrito podría mostrar un resumen flotante cuando tiene items

**Propuesta:** Agregar animación de "añadido" + badge de carrito en AppBar.

---

### 15. Route Workday Screen (`route_workday_screen.dart` — ~120 líneas)

**Estado actual:**
- Lista de visitas del día con timestamps
- Simple y funcional

**Problemas:**
- ✅ Cumple su función sin sobrecarga

---

### 16. Sync Status Screen (`sync_status_screen.dart` — ~200 líneas)

**Estado actual:**
- Indicador de conectividad
- Cola de sincronización pendiente
- Entradas fallidas

**Problemas:**
- ⚠️ Solo útil para debugging — el usuario final no debería necesitar esto
- ⚠️ Podría ser un modal/bottom sheet en lugar de una pantalla completa

**Propuesta:** Convertir en bottom sheet accesible desde un icono en la AppBar del home.

---

## Tabla Resumen de Severidad

| Componente | Severidad | Acción |
|------------|-----------|--------|
| Login Web | 🔴 Alta | Rediseñar completamente |
| Sidebar Master Admin | 🟡 Media | Agrupar items |
| Dashboard Tienda | 🔴 Alta | Eliminar cards redundantes |
| Sales Workspace (4 tabs vacías) | 🔴 Alta | Eliminar tabs vacías |
| Flutter Home (1407 líneas) | 🔴 Alta | Refactorizar y simplificar |
| Flutter BackendRuntimeCard | 🟡 Media | Mover a bottom sheet |
| Preventa BottomNav rota | 🟡 Media | Arreglar navegación |
| Finance "Excepciones" | 🟢 Baja | Solo renombrar |
| Warehouse Kanban | ✅ OK | Mantener |
| Cash Workspace (tab Venta) | ✅ OK | Mantener |
| Admin Control Center | ✅ OK | Mantener |
