# 📦 Fase 5 — Pulido del Módulo Preventa Flutter

**Objetivo:** Arreglar BottomNav roto, optimizar KPIs, compactar hero, mejorar CTA.  
**Estimación:** 0.5 día  
**Archivos afectados:** 1

---

## Archivo: `flutter/lib/features/preventa/presentation/screens/preventa_home_screen.dart` (394 líneas)

---

### ✅ Paso 5.1: Arreglar BottomNavigationBar — Tab "Catálogo" no navega

**Líneas 281-295** — Reemplazar bloque completo de `bottomNavigationBar`:

```diff
  bottomNavigationBar: BottomNavigationBar(
    currentIndex: 0,
    selectedItemColor: const Color(0xFF047857),
    unselectedItemColor: Colors.grey,
    onTap: (index) {
-     if (index == 1) {
-       context.push('/preventa-clients');
-     }
+     switch (index) {
+       case 1:
+         context.push('/preventa-clients');
+         break;
+       case 2:
+         final storeId = session?.user.primaryStoreId ?? '';
+         context.push('/catalog/$storeId');
+         break;
+     }
    },
    items: const [
      BottomNavigationBarItem(icon: Icon(Icons.home_rounded), label: 'Inicio'),
-     BottomNavigationBarItem(icon: Icon(Icons.people_alt_rounded), label: 'Mis Clientes'),
-     BottomNavigationBarItem(icon: Icon(Icons.shopping_bag_rounded), label: 'Catálogo'),
+     BottomNavigationBarItem(icon: Icon(Icons.people_alt_rounded), label: 'Clientes'),
+     BottomNavigationBarItem(icon: Icon(Icons.inventory_2_rounded), label: 'Catálogo'),
    ],
  ),
```

**Cambios:**
1. Agregar handler para `case 2` que navega a `/catalog/$storeId`
2. Cambiar "Mis Clientes" → "Clientes" (más corto)
3. Cambiar icono `shopping_bag_rounded` → `inventory_2_rounded` (más coherente con catálogo de productos)

**Nota:** Para acceder a `session` en el `onTap`, el `session` debe estar disponible en el scope del `build()`. Verificar que la variable `session` (línea 82) sigue accesible en la línea del `bottomNavigationBar`.

---

### ✅ Paso 5.2: Compactar hero card — Reducir padding y fecha

**Línea 124** — Reducir padding:
```diff
-            padding: const EdgeInsets.all(22),
+            padding: const EdgeInsets.all(18),
```

**Línea 89** — Formato de fecha más corto:
```diff
-   final todayStr = DateFormat('EEEE d \'de\' MMMM', 'es').format(DateTime.now());
+   final todayStr = DateFormat('EEE d \'de\' MMMM', 'es').format(DateTime.now());
```

Resultado: "miércoles 15 de mayo" → "mié 15 de mayo"

**Líneas 164-166** — Eliminar SizedBox sobrante al final del hero:
```diff
-                const SizedBox(height: 16),
              ],
            ),
          ),
```

---

### ✅ Paso 5.3: KPIs responsivos para pantallas pequeñas

**Líneas 175-211** — Envolver GridView en LayoutBuilder:

```diff
-          GridView.count(
-            crossAxisCount: 2,
-            shrinkWrap: true,
-            physics: const NeverScrollableScrollPhysics(),
-            crossAxisSpacing: 16,
-            mainAxisSpacing: 16,
-            childAspectRatio: 1.4,
+          LayoutBuilder(
+            builder: (context, constraints) {
+              final isSmall = constraints.maxWidth < 360;
+              return GridView.count(
+                crossAxisCount: 2,
+                shrinkWrap: true,
+                physics: const NeverScrollableScrollPhysics(),
+                crossAxisSpacing: isSmall ? 10 : 16,
+                mainAxisSpacing: isSmall ? 10 : 16,
+                childAspectRatio: isSmall ? 1.15 : 1.4,
               children: [
                 // ... sin cambios en los children
               ],
-          ),
+              );
+            },
+          ),
```

---

### ✅ Paso 5.4: Mejorar botón CTA "INICIAR RUTA DEL DÍA"

**Líneas 217-237** — Reemplazar completo:

```diff
-          ElevatedButton(
-            onPressed: () {
-               context.push('/preventa-route');
-            },
-            style: ElevatedButton.styleFrom(
-              backgroundColor: const Color(0xFF0F172A),
-              foregroundColor: Colors.white,
-              padding: const EdgeInsets.symmetric(vertical: 20),
-              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
-              elevation: 8,
-              shadowColor: const Color(0xFF0F172A).withValues(alpha: 0.4),
-            ),
-            child: const Row(
-              mainAxisAlignment: MainAxisAlignment.center,
-              children: [
-                Icon(Icons.directions_car_rounded, size: 24),
-                SizedBox(width: 12),
-                Text('INICIAR RUTA DEL DÍA', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
-              ],
-            ),
-          ),
+          FilledButton.icon(
+            onPressed: () => context.push('/preventa-route'),
+            icon: const Icon(Icons.directions_car_rounded, size: 22),
+            label: const Text('Iniciar Ruta'),
+            style: FilledButton.styleFrom(
+              backgroundColor: const Color(0xFF047857),
+              foregroundColor: Colors.white,
+              minimumSize: const Size(double.infinity, 56),
+              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
+              textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
+            ),
+          ),
```

**Cambios:**
1. Color: negro → verde marca `#047857` (más amigable)
2. Texto: "INICIAR RUTA DEL DÍA" (mayúsculas, largo) → "Iniciar Ruta" (title case, corto)
3. Widget: `ElevatedButton` con Row manual → `FilledButton.icon` (Material 3)
4. Padding: reducido de 20 a implícito (minimumSize controla alto)
5. Sombra excesiva eliminada

---

### ✅ Paso 5.5: Eliminar import no usado (si aplica)

Verificar si `intl` es el único paquete usado para `DateFormat`. Si se cambió el formato, verificar que `'es'` locale sigue funcionando.

---

## Verificación Final Fase 5

- [ ] **BottomNav:** Tap en "Catálogo" navega a `/catalog/{storeId}` correctamente
- [ ] **BottomNav:** Tap en "Clientes" navega a `/preventa-clients` correctamente
- [ ] **BottomNav:** Los 3 items tienen iconos distintos y legibles
- [ ] **Hero:** Fecha dice "mié 15 de mayo" (no "miércoles 15 de mayo")
- [ ] **Hero:** No hay espacio sobrante al final de la card verde
- [ ] **KPIs:** En pantalla de 5" los 4 KPIs se ven sin truncar
- [ ] **KPIs:** En pantalla de 6.7" los KPIs tienen spacing cómodo
- [ ] **CTA:** Botón es verde `#047857` con texto "Iniciar Ruta"
- [ ] **CTA:** No hay sombra excesiva
- [ ] `flutter analyze` — 0 errores
- [ ] La lista de "Últimos pedidos" sigue visible debajo del CTA
