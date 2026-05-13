# 🌐 AUDITORÍA WEB ADMIN — React 19 + Vite 6

## Stack Técnico

| Componente | Versión |
|---|---|
| React | 19.2.4 |
| Vite | 6.2.0 |
| TypeScript | ~5.9.3 |
| TanStack Query | v5.100.7 |
| React Router DOM | v7.13.2 |
| Radix UI | 20+ primitivos |
| Tailwind CSS | 3.4.15 |
| Recharts | v3.8.1 |
| React Hook Form | 7.72.0 |
| Zod | v4.3.6 |
| jsPDF | 4.2.1 |
| XLSX | 0.18.5 |
| Socket.IO Client | 4.8.3 |
| PWA | vite-plugin-pwa 1.2.0 |

## Estructura de Archivos

```
web/src/
├── App.tsx              (276 líneas — Router principal)
├── main.tsx             (Entry point)
├── index.css            (Estilos globales)
├── components/
│   ├── app-layout.tsx   (35,244 bytes — Layout + Sidebar)
│   ├── app-header.tsx
│   ├── auth/
│   ├── dashboard/
│   ├── pos/             (POS components)
│   ├── products/
│   └── ui/              (ShadcnUI primitivos)
├── contexts/
├── hooks/
├── lib/
├── pages/
│   ├── login-page.tsx
│   ├── forgot-password-page.tsx
│   ├── pos-page.tsx
│   ├── store-admin/     (20 secciones)
│   ├── master-admin/    (15 páginas)
│   └── chain-admin/
├── services/
│   ├── api-client.ts
│   └── finance-service.ts
└── types/
```

## Páginas Store Admin (20 secciones) — Verificadas

| Sección | Archivos | Estado |
|---------|----------|--------|
| `dashboard/` | dashboard-page.tsx | ✅ |
| `products/` | products-page, add-product, edit-product, departments, sub-departments | ✅ |
| `inventory/` | movements, adjustments, entry | ✅ |
| `billing/` | billing-page.tsx (411 líneas) | ✅ (ver nota genericClient) |
| `cash-register/` | cash-register-page.tsx (502 líneas) | ✅ Ambos botones funcionales |
| `clients/` | client-groups, economic-groups, client-reassign | ✅ |
| `vendors/` | vendors, add-vendor, dashboard, zones, clients, collections, inventory, quick-sale, sales, assign-route, routes, returns | ✅ |
| `pending-orders/` | pending-orders, orders-pipeline | ✅ |
| `dispatch/` | dispatch, dispatch-cargas | ✅ |
| `dispatcher/` | dispatcher-page.tsx | ✅ (ver nota genericClient) |
| `warehouse/` | warehouse-dashboard | ✅ |
| `delivery-route/` | delivery-route, rutero-daily-closing | ✅ |
| `suppliers/` | suppliers, add-supplier, edit-supplier, supplier-invoices | ✅ |
| `finance/` | receivables, payables, aging-report, arqueos, liquidation-route | ✅ |
| `authorizations/` | authorizations, price-auth | ✅ |
| `reports/` | reports, admin-daily-closings, inventory-valuation | ✅ |
| `control-tower/` | control-tower-page.tsx (274 líneas) | ✅ Datos reales API |
| `settings/` | settings-page | ✅ |
| `users/` | users, add-user, edit-user | ✅ |
| `help/` | help-page | ✅ |

## Páginas Master Admin (15 páginas) — Verificadas

| Página | Estado |
|--------|--------|
| master-dashboard-page.tsx | ✅ |
| master-stores-page.tsx | ✅ |
| add-store-page.tsx | ✅ |
| edit-store-page.tsx | ✅ |
| master-chains-page.tsx | ✅ |
| add-chain-page.tsx | ✅ |
| master-users-page.tsx | ✅ |
| master-licenses-page.tsx | ✅ |
| master-monitor-page.tsx | ✅ |
| master-config-page.tsx | ✅ |
| master-zones-page.tsx | ✅ |
| master-sub-zones-page.tsx | ✅ |
| master-sync-monitor-page.tsx | ✅ |
| master-help-page.tsx | ✅ |
| multi-store-comparison-page.tsx | ✅ |

---

## VERIFICACIÓN PIEZA POR PIEZA

### ✅ PIEZA 3 — ControlTower chartData — RESUELTO

**Archivo:** `control-tower-page.tsx`
- Línea 19: `useState<...>([])` — inicializado vacío, sin datos hardcodeados
- Líneas 21-32: `groupOrdersByHour()` — agrupa pedidos reales por hora
- Línea 45: Fetch real: `apiClient.get('/orders', { params: { storeId, fromDate: today } })`
- Línea 55: `setChartData(groupOrdersByHour(todayOrders.data || []))`

### ✅ PIEZA 4 — CashRegister botones — RESUELTO

**Archivo:** `cash-register-page.tsx`
- Líneas 119-142: `handlePrintCorteX()` — Llama `GET /sales/report`, genera PDF con jsPDF
- Líneas 144-157: `handleShowLastSales()` — Llama `GET /sales?limit=50`, muestra dialog
- Línea 335: Botón "CORTE X" con `onClick={handlePrintCorteX}`
- Línea 342: Botón "ÚLTIMAS 50 VENTAS" con `onClick={handleShowLastSales}`
- Líneas 462-498: Dialog completo con loading, empty state, lista

### ✅ PIEZA 5 — ClientGroups Eliminar — RESUELTO

**Archivo:** `client-groups-page.tsx`
- Líneas 29-38: `handleDelete(groupId, groupName)` — `confirm()` + `DELETE /grupos-clientes/:id` + `invalidateQueries`
- Línea 86: Botón con `onClick={() => handleDelete(g.id, g.name)}`

### ✅ PIEZA 6 — EconomicGroups deuda — RESUELTO

**Archivo:** `economic-groups-page.tsx`
- Línea 81: `{g.saldo_total != null ? C$ ${parseFloat(g.saldo_total).toLocaleString()} : 'C$ 0'}`
- YA NO muestra "N/D"

### ✅ PIEZA 13 — Arqueos Math.random — RESUELTO

**Archivo:** `arqueos-page.tsx`
- NO existe `Math.random()` en el archivo
- Líneas 56-58: Usa `GET /daily-closings/summary` real
- Fallback a cálculo desde `/sales` si summary no responde

### ✅ PIEZA 14 — Barcode disabled — RESUELTO

**Archivo:** `edit-product-page.tsx`
- Grep confirma: NO hay atributo `disabled` en ningún input del archivo

### ✅ PIEZA 15 — "T" en existencias — RESUELTO

**Archivo:** `products-page.tsx`
- Línea 244: `{product.currentStock}` — número limpio
- Línea 248: `{product.stockBulks || 0} Bultos, {product.stockUnits || 0} U`

### Math.random() residuales en web — NO PROBLEMÁTICOS

| Archivo | Línea | Uso | ¿Problema? |
|---------|-------|-----|------------|
| `supplier-invoices-page.tsx` | 81 | localId temporal | ✅ OK |
| `lib/sync-service.ts` | 56 | operationId tracking | ✅ OK |
| `components/ui/sidebar.tsx` | 654 | ancho skeleton visual | ✅ OK |

---

## ⚠️ PIEZAS PENDIENTES MENORES

### PIEZA 2 — LiquidationRoute fallback con ceros

**Archivo:** `liquidation-route-page.tsx` líneas 39-47
**Problema:** Cuando la API retorna array vacío, crea objeto con todos valores en 0 y status `SIN_DATOS`. No es mock data inventado (son ceros reales), pero podría mejorar mostrando un empty state dedicado.
**Gravedad:** 🟢 Baja — funciona correctamente.

### PIEZA 7 — genericClient hardcodeado

**Archivos afectados (5):**
1. `billing/billing-page.tsx` líneas 79-86: `{ id: 'generic', name: 'Cliente Genérico' }`
2. `dispatcher/dispatcher-page.tsx` línea 26: Mismo patrón
3. `vendors/vendor-quick-sale-page.tsx` líneas 29-30: Mismo patrón
4. `components/pos/client-selection-dialog.tsx` líneas 33-34: Lo incluye en la lista
5. `components/pos/cashier-billing-view.tsx` línea 139: Referencia al ID

**Análisis:** Es un patrón de diseño intencional para ventas al mostrador. El código ya filtra: `clientId: selectedClient.id !== 'generic' ? selectedClient.id : undefined`. Billing-page ya intenta cargar un cliente default real (líneas 186-193).

**Gravedad:** 🟡 Media — funciona pero no es best practice.

## Conclusión

✅ ~58/60 páginas completamente funcionales con datos reales.
⚠️ 2 piezas menores pendientes (genericClient refactor + liquidation empty state).
