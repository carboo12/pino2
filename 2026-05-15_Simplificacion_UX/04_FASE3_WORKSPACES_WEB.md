# 🧩 Fase 3 — Eliminar Tabs Vacías en Workspaces Web

**Objetivo:** Cada tab debe mostrar contenido real. Si solo tiene un botón "Ir a X", eliminarla.  
**Estimación:** 0.5 día  
**Archivos afectados:** 3

---

## Archivo 1: `web/src/pages/work/sales-workspace-page.tsx` (198 líneas)

### Problema: 4 de 5 tabs son EmptyState con un solo botón

| Tab | Contenido | Acción |
|-----|-----------|--------|
| Clientes | ✅ Lista real con búsqueda | MANTENER |
| Pedido rápido | ❌ EmptyState + btn "Nuevo pedido" | ELIMINAR |
| Cobros | ❌ EmptyState + btn "Ir a cobros" | ELIMINAR |
| Devoluciones | ❌ EmptyState + btn "Ir a devoluciones" | ELIMINAR |
| Rutas | ❌ EmptyState + btn "Ir a rutas" | ELIMINAR |

---

### ✅ Paso 3.1: Eliminar imports de Tabs

**Línea 11** — Eliminar:
```diff
- import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
```

---

### ✅ Paso 3.2: Eliminar icons no usados

**Líneas 16-28** — Reducir imports:
```diff
  import {
-   Users,
    ShoppingCart,
    HandCoins,
    Undo2,
-   Route,
    Search,
-   Plus,
    User,
    Phone,
    MapPin,
    DollarSign,
    ArrowRight,
  } from 'lucide-react';
```

---

### ✅ Paso 3.3: Eliminar state de activeTab

**Línea 46**:
```diff
- const [activeTab, setActiveTab] = useState('clientes');
```

---

### ✅ Paso 3.4: Reemplazar todo el bloque de Tabs (líneas 130-194) por contenido directo

Eliminar `<Tabs>`, todas las `<TabsTrigger>`, y todas las `<TabsContent>`. Reemplazar con el contenido de la tab "clientes" directamente dentro del `<WorkspaceShell>`:

```tsx
{/* Contenido: lista de clientes */}
<div className="flex-1 overflow-auto p-4">
  {loading ? <LoadingRows rows={6} /> : clients.length === 0 ? (
    <EmptyState title={searchTerm.length < 2 ? 'Busca un cliente' : 'Sin resultados'} icon={Search} />
  ) : (
    <div className="space-y-2">
      {clients.map((c) => (
        <button key={c.id} onClick={() => setSelectedClient(c)}
          className={`w-full rounded-lg border p-3 text-left transition-all hover:shadow-sm ${
            selectedClient?.id === c.id ? 'border-[#0F766E] ring-1 ring-[#0F766E]/20' : 'border-[#DDE2E8]'
          }`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#17202A]">{c.name}</p>
            <ArrowRight className="h-3.5 w-3.5 text-[#5B6673]" />
          </div>
          {c.code && <p className="text-xs text-[#5B6673]">{c.code}</p>}
          {c.balance !== undefined && c.balance > 0 && (
            <p className="mt-1 text-xs font-medium text-[#DC2626]">Saldo: {formatCurrency(c.balance)}</p>
          )}
        </button>
      ))}
    </div>
  )}
</div>
```

El `contextPanel` ya muestra las acciones (Pedido, Cobrar, Devolver) cuando se selecciona un cliente — esto se mantiene igual.

---

### ✅ Paso 3.5: Resultado esperado

**Antes:** 198 líneas, 5 tabs, 4 vacías  
**Después:** ~130 líneas, vista directa de clientes, acciones en panel lateral

---

## Archivo 2: `web/src/pages/work/cash-workspace-page.tsx` (518 líneas)

### Problema: Tab "Caja" y Tab "Devolución" tienen poco contenido real

---

### ✅ Paso 3.6: Eliminar tab "Devolución" y mover botón al topbar

**Líneas 286-289** — Eliminar TabsTrigger de devolución:
```diff
- <TabsTrigger value="devolucion" className="...">
-   <Undo2 className="mr-1.5 h-3.5 w-3.5" />
-   Devolución
- </TabsTrigger>
```

**Líneas 390-401** — Eliminar TabsContent de devolución:
```diff
- <TabsContent value="devolucion" className="mt-0 flex-1 p-6">
-   <EmptyState ... />
- </TabsContent>
```

**Líneas 188-192** — Agregar botón de devolución al topbar:
```diff
  <WorkspaceTopBar
    title="Caja"
    storeName={user?.storeName}
    actions={
      <div className="flex items-center gap-2">
+       <Button variant="outline" size="sm" onClick={() => setShowReturns(true)}>
+         <Undo2 className="mr-1.5 h-3.5 w-3.5" />
+         Devolución
+       </Button>
        <ScanInput onScan={handleScan} placeholder="Escanear código..." autoFocus />
      </div>
    }
  />
```

---

### ✅ Paso 3.7: Fusionar tab "Caja" como barra de estado inline

**Líneas 282-285** — Eliminar TabsTrigger de caja:
```diff
- <TabsTrigger value="caja" className="...">
-   <WalletCards className="mr-1.5 h-3.5 w-3.5" />
-   Caja
- </TabsTrigger>
```

**Líneas 372-388** — Eliminar TabsContent de caja:
```diff
- <TabsContent value="caja" className="mt-0 flex-1 p-6">
-   ... (todo el contenido)
- </TabsContent>
```

**Dentro de TabsContent "venta" (línea 296)** — Agregar barra de estado de caja arriba del ProductSearch:
```tsx
<TabsContent value="venta" className="mt-0 flex-1 p-0">
  <div className="flex h-full">
    <div className="flex flex-1 flex-col">
      {/* NUEVA: Barra de estado de caja */}
      <div className="flex items-center justify-between border-b border-[#DDE2E8] bg-[#F6F7F9] px-3 py-1.5">
        <div className="flex items-center gap-2 text-xs">
          <WalletCards className="h-3.5 w-3.5 text-[#0F766E]" />
          <span className="font-medium text-[#5B6673]">Caja cerrada</span>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowOpening(true)}>
          Abrir caja
        </Button>
      </div>
      {/* Resto igual: ProductSearch + carrito */}
      <div className="border-b border-[#DDE2E8] bg-white p-3">
```

---

### ✅ Paso 3.8: Resultado de tabs

**Antes:** 4 tabs (Venta, Caja, Devolución, Historial)  
**Después:** 2 tabs (Venta, Historial) + barra de estado de caja inline + botón devolución en topbar

---

## Archivo 3: `web/src/pages/work/finance-workspace-page.tsx` (260 líneas)

### ✅ Paso 3.9: Renombrar tab "Excepciones" → "Atención"

**Línea 134** — Valor del tab:
```diff
- <TabsTrigger value="excepciones" className="...">
+ <TabsTrigger value="atencion" className="...">
```

**Línea 138** — Texto:
```diff
-   Excepciones
+   Atención
```

**Línea 156** — TabsContent value:
```diff
- <TabsContent value="excepciones" className="...">
+ <TabsContent value="atencion" className="...">
```

**Línea 47** — Estado inicial:
```diff
- const [activeTab, setActiveTab] = useState('excepciones');
+ const [activeTab, setActiveTab] = useState('atencion');
```

---

## Verificación Final Fase 3

- [ ] **Sales workspace:** No hay tabs visibles — solo lista de clientes con búsqueda
- [ ] **Sales workspace:** Al seleccionar cliente → panel lateral con botones (Pedido, Cobrar, Devolver)
- [ ] **Cash workspace:** Solo 2 tabs (Venta, Historial)
- [ ] **Cash workspace:** Barra "Caja cerrada / [Abrir]" visible arriba del ProductSearch
- [ ] **Cash workspace:** Botón "Devolución" en la topbar
- [ ] **Finance workspace:** Primera tab dice "Atención" no "Excepciones"
- [ ] **Build:** `npm run build` sin errores
- [ ] **Funcionalidad:** Todas las acciones que estaban en tabs eliminadas siguen accesibles desde otro lugar
