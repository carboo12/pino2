# 🧭 Fase 2 — Simplificación de Navegación Web

**Objetivo:** Reducir items de menú, eliminar redundancias, quitar código muerto.  
**Estimación:** 1 día  
**Archivos afectados:** 3

---

## Archivo Principal: `web/src/components/app-layout.tsx` (744 líneas)

---

### ✅ Paso 2.1: Eliminar sistema de traducciones muerto

**Líneas 72-153** — Eliminar el objeto `translations` completo (82 líneas):
```diff
- const translations = {
-   es: {
-     dashboard: 'Panel',
-     stores: 'Tiendas',
-     ... (todo el bloque hasta línea 153)
-   },
- };
```

---

### ✅ Paso 2.2: Eliminar parámetro `lang` de todas las funciones de nav

**Línea 159** — `getChainAdminNav`:
```diff
- const getChainAdminNav = (lang: 'es' | 'en'): NavItem[] => [
-   { type: 'link', name: translations[lang].dashboard, href: '/chain-admin/dashboard', icon: LayoutDashboard },
-   { type: 'link', name: translations[lang].stores, href: '/master-admin/stores', icon: Store },
+ const getChainAdminNav = (): NavItem[] => [
+   { type: 'link', name: 'Panel', href: '/chain-admin/dashboard', icon: LayoutDashboard },
+   { type: 'link', name: 'Tiendas', href: '/master-admin/stores', icon: Store },
```

**Línea 164** — `getMasterAdminNav` — reescribir completo:
```typescript
const getMasterAdminNav = (): NavItem[] => [
  { type: 'link', name: 'Panel', href: '/master-admin/dashboard', icon: LayoutDashboard },
  { type: 'link', name: 'Tiendas', href: '/master-admin/stores', icon: Store },
  { type: 'link', name: 'Usuarios', href: '/master-admin/users', icon: Users },
  { type: 'link', name: 'Licencias', href: '/master-admin/licenses', icon: WalletCards },
  { type: 'separator' },
  { type: 'group', name: 'Operaciones', icon: AreaChart, children: [
    { type: 'link', name: 'Sync Monitor', href: '/master-admin/sync-monitor', icon: RefreshCw, section: 'ops' },
    { type: 'link', name: 'Comparar', href: '/master-admin/comparison', icon: AreaChart, section: 'ops' },
    { type: 'link', name: 'Activity Log', href: '/master-admin/monitor', icon: FileText, section: 'ops' },
  ]},
  { type: 'separator' },
  { type: 'link', name: 'Configuración', href: '/master-admin/config', icon: Settings },
];
```

**Cambios clave:**
- Cadenas → mover dentro de Configuración como tab (no es navegación frecuente)
- Zonas Globales → mover dentro de Configuración como tab
- Sub-Zonas → mover dentro de Configuración como tab
- Monitor + Monitor Sync → agrupar en "Operaciones"
- Items: de 13 a 8 (incluyendo grupo colapsable)

**Línea 180** — `getStoreAdminNav` — reescribir:
```typescript
const getStoreAdminNav = (storeId: string): NavItem[] => [
  { type: 'link', name: 'Caja', href: `/store/${storeId}/work/cash`, icon: WalletCards },
  { type: 'link', name: 'Bodega', href: `/store/${storeId}/work/warehouse`, icon: Boxes },
  { type: 'link', name: 'Ventas', href: `/store/${storeId}/work/sales`, icon: Route },
  { type: 'link', name: 'Finanzas', href: `/store/${storeId}/work/finance`, icon: Wallet },
  { type: 'link', name: 'Catálogo', href: `/store/${storeId}/work/catalog`, icon: Package },
  { type: 'link', name: 'Admin', href: `/store/${storeId}/work/admin`, icon: ShieldCheck },
];
```

**Cambio clave:** Eliminar "Pulso" (dashboard) — era redundante con los workspaces.

---

### ✅ Paso 2.3: Actualizar todas las llamadas que pasan `language`

**Buscar y reemplazar en el mismo archivo** (líneas 546-583):

```diff
- case 'master-admin':
-   return getMasterAdminNav(language);
+ case 'master-admin':
+   return getMasterAdminNav();

- case 'chain-admin':
-   return getChainAdminNav(language);
+ case 'chain-admin':
+   return getChainAdminNav();

- case 'store-admin':
-   return getStoreAdminNav(storeId || '', language);
+ case 'store-admin':
+   return getStoreAdminNav(storeId || '');
```

Repetir para TODOS los `case` que pasen `language`.

---

### ✅ Paso 2.4: Eliminar estado de language y handler

**Línea 485** — Eliminar:
```diff
- const [language, setLanguage] = useState<'es' | 'en'>('es');
```

**Línea 515-517** — Eliminar:
```diff
- const handleLanguageChange = (lang: string) => {
-   setLanguage(lang as 'es' | 'en');
- };
```

**Línea 726** — Eliminar prop de AppHeader:
```diff
- language={language}
- onLanguageChange={handleLanguageChange}
```

---

### ✅ Paso 2.5: Eliminar `language` del useMemo dependencies

**Línea 583**:
```diff
- }, [user, language, storeId]);
+ }, [user, storeId]);
```

---

### ✅ Paso 2.6: Simplificar roles operativos con navegación mínima

Los roles con ≤2 items ya están definidos correctamente. Solo verificar:

- `getBodegueroNav` → 2 items ✅
- `getCashierNav` → 2 items ✅
- `getDespachoNav` → 1 item ✅
- `getSupervisorPasilloNav` → 1 item ✅

Para estos roles, el sidebar de 280px es un desperdicio. Marcar esto como mejora futura (topbar en lugar de sidebar para ≤3 items).

---

## Archivo Secundario: `web/src/pages/store-admin/dashboard/dashboard-page.tsx`

### ✅ Paso 2.7: Redirigir dashboard de tienda → workspace de caja

**Opción A (recomendada):** En el router, agregar redirect:

**Archivo:** `web/src/App.tsx` (o donde esté definida la ruta `/store/:storeId/dashboard`)

Buscar la ruta del dashboard y reemplazar:
```diff
- { path: 'dashboard', element: <DashboardPage /> },
+ { path: 'dashboard', element: <Navigate to="work/cash" replace /> },
```

**Agregar import:**
```typescript
import { Navigate } from 'react-router-dom';
```

**Opción B (conservadora):** Si prefieres mantener el dashboard, solo eliminar las 4 cards de "Acción rápida" (líneas 110-147 de dashboard-page.tsx) y la card de "tip" (líneas 163-188).

---

## Archivo Terciario: `web/src/pages/master-admin/master-config-page.tsx`

### ✅ Paso 2.8: Agregar tabs para absorber Zonas, Sub-Zonas, Cadenas

En la página de configuración, agregar tabs que contengan lo que antes eran páginas separadas:

```
[General] [Zonas] [Sub-Zonas] [Cadenas]
```

Esto puede hacerse después como mejora iterativa. Por ahora, mantener los links en la página de configuración como secciones con links a las páginas existentes.

---

## Verificación Final Fase 2

- [ ] **Compilar:** `npm run build` sin errores en `web/`
- [ ] **Sidebar master-admin:** Verificar que muestra 8 items (4 links + grupo "Operaciones" con 3 hijos + separator + Configuración)
- [ ] **Sidebar store-admin:** Verificar que NO muestra "Pulso" — primer item es "Caja"
- [ ] **No hay `translations`:** Buscar en el archivo — no debe existir
- [ ] **No hay `language`:** Buscar en el archivo — no debe existir como state
- [ ] **Dashboard de tienda:** Redirige a `/work/cash` o está simplificado sin cards de acción rápida
- [ ] **AppHeader:** No pide `language` ni `onLanguageChange` como props
- [ ] **Cada link del sidebar:** Verificar que lleva a contenido real, no a otra lista de links

### Comando de verificación rápida:
```bash
# Buscar restos de traducciones:
grep -n "translations\[" web/src/components/app-layout.tsx
# Debe dar 0 resultados

# Buscar restos de language state:
grep -n "language" web/src/components/app-layout.tsx
# Debe dar 0 resultados (salvo comentarios)
```
