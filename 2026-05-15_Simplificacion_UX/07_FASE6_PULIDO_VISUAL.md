# 🎨 Fase 6 — Pulido Visual Global (Tokens de Diseño)

**Objetivo:** Crear tokens de color/tipografía/espaciado compartidos. Reemplazar colores hardcoded.  
**Estimación:** 1 día  
**Archivos afectados:** 1 nuevo Flutter + 1 config Tailwind + múltiples componentes

---

## PARTE A — Flutter: Crear archivo de colores

### ✅ Paso 6.1: Crear `PinoColors`

**Crear:** `flutter/lib/app/theme/pino_colors.dart`

```dart
import 'package:flutter/material.dart';

/// Tokens de color unificados del sistema Pino.
/// Usar estos en lugar de Color(0xFF...) hardcoded.
abstract class PinoColors {
  // ── Marca ──
  static const primary      = Color(0xFF047857);  // verde marca principal
  static const primaryDark  = Color(0xFF064E3B);  // verde oscuro, gradientes
  static const primaryLight = Color(0xFF10B981);   // verde claro, indicadores
  static const primarySoft  = Color(0xFFD1FAE5);   // verde pastel, fondos suaves

  // ── Fondos ──
  static const bgDark       = Color(0xFF0F172A);   // navy oscuro, gradientes
  static const bgSurface    = Color(0xFFF6F7F9);   // gris claro, fondos de tabla
  static const bgWhite      = Color(0xFFFFFFFF);   // cards

  // ── Texto ──
  static const textPrimary  = Color(0xFF17202A);   // texto principal
  static const textMuted    = Color(0xFF5B6673);   // texto secundario
  static const textWhite    = Colors.white;

  // ── Bordes ──
  static const border       = Color(0xFFDDE2E8);   // bordes y separadores

  // ── Semánticos ──
  static const error        = Color(0xFFDC2626);   // rojo — errores, stock crítico
  static const warning      = Color(0xFFD97706);   // ámbar — advertencias
  static const info         = Color(0xFF2563EB);    // azul — información
  static const success      = Color(0xFF10B981);    // verde — éxito

  // ── Gradientes reutilizables ──
  static const heroGradient = LinearGradient(
    colors: [bgDark, primaryDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const loginGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [bgDark, primaryDark, bgDark],
    stops: [0.0, 0.5, 1.0],
  );
}
```

---

### ✅ Paso 6.2: Buscar y reemplazar colores hardcoded en Flutter

Ejecutar estos comandos para encontrar todas las ocurrencias:

```bash
# En la carpeta flutter/lib/
grep -rn "Color(0xFF047857)" lib/ --include="*.dart"
grep -rn "Color(0xFF064E3B)" lib/ --include="*.dart"
grep -rn "Color(0xFF0F172A)" lib/ --include="*.dart"
grep -rn "Color(0xFF10B981)" lib/ --include="*.dart"
grep -rn "Color(0xFFEF4444)" lib/ --include="*.dart"
grep -rn "Color(0xFF3B82F6)" lib/ --include="*.dart"
grep -rn "Color(0xFFF59E0B)" lib/ --include="*.dart"
grep -rn "Color(0xFFDC2626)" lib/ --include="*.dart"
grep -rn "Color(0xFF14532D)" lib/ --include="*.dart"
grep -rn "Color(0xFF5B6673)" lib/ --include="*.dart"
grep -rn "Color(0xFF17202A)" lib/ --include="*.dart"
```

**Tabla de reemplazo:**

| Buscar | Reemplazar con | Agregar import |
|--------|---------------|----------------|
| `const Color(0xFF047857)` | `PinoColors.primary` | ✅ |
| `const Color(0xFF064E3B)` | `PinoColors.primaryDark` | ✅ |
| `const Color(0xFF0F172A)` | `PinoColors.bgDark` | ✅ |
| `const Color(0xFF14532D)` | `PinoColors.primaryDark` | ✅ |
| `const Color(0xFF10B981)` | `PinoColors.success` | ✅ |
| `const Color(0xFFEF4444)` | `PinoColors.error` | ✅ |
| `const Color(0xFFDC2626)` | `PinoColors.error` | ✅ |
| `const Color(0xFF3B82F6)` | `PinoColors.info` | ✅ |
| `const Color(0xFFF59E0B)` | `PinoColors.warning` | ✅ |
| `const Color(0xFFD97706)` | `PinoColors.warning` | ✅ |
| `const Color(0xFF5B6673)` | `PinoColors.textMuted` | ✅ |
| `const Color(0xFF17202A)` | `PinoColors.textPrimary` | ✅ |

**Import a agregar en cada archivo:**
```dart
import 'package:pino_mobile/app/theme/pino_colors.dart';
```

**⚠️ Nota:** Algunos usos con `const` pueden requerir quitar `const` si `PinoColors.primary` no es const en el contexto. Verificar con `flutter analyze`.

---

## PARTE B — React: Agregar tokens a Tailwind

### ✅ Paso 6.3: Actualizar `tailwind.config.js`

**Archivo:** `web/tailwind.config.js` o `web/tailwind.config.ts`

Agregar en `theme.extend.colors`:
```javascript
module.exports = {
  // ... existing config
  theme: {
    extend: {
      colors: {
        pino: {
          50:  '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          500: '#10B981',
          700: '#047857',
          900: '#064E3B',
          950: '#022C22',
        },
      },
    },
  },
};
```

---

### ✅ Paso 6.4: Buscar y reemplazar colores hardcoded en React

Ejecutar:
```bash
# En web/src/
grep -rn "#0F766E" src/ --include="*.tsx" --include="*.ts"
grep -rn "#047857" src/ --include="*.tsx" --include="*.ts"
grep -rn "text-\[#17202A\]" src/ --include="*.tsx"
grep -rn "text-\[#5B6673\]" src/ --include="*.tsx"
grep -rn "border-\[#DDE2E8\]" src/ --include="*.tsx"
grep -rn "bg-\[#F6F7F9\]" src/ --include="*.tsx"
```

**Tabla de reemplazo Tailwind:**

| Buscar | Reemplazar con |
|--------|---------------|
| `text-[#0F766E]` | `text-pino-700` |
| `bg-[#0F766E]` | `bg-pino-700` |
| `border-[#0F766E]` | `border-pino-700` |
| `text-[#17202A]` | `text-slate-800` |
| `text-[#5B6673]` | `text-slate-500` |
| `border-[#DDE2E8]` | `border-slate-200` |
| `bg-[#F6F7F9]` | `bg-slate-50` |
| `text-[#DC2626]` | `text-red-600` |
| `text-[#D97706]` | `text-amber-600` |

**⚠️ Nota sobre data-attributes:** Algunos colores se usan en selectores de data-state:
```
data-[state=active]:text-[#0F766E]
data-[state=active]:border-[#0F766E]
```
Estos deben cambiarse a:
```
data-[state=active]:text-pino-700
data-[state=active]:border-pino-700
```

---

## PARTE C — Tokens de Espaciado y Radio

### ✅ Paso 6.5: Documentar estándares (no requiere código)

Estos son los valores que TODOS los componentes deben seguir:

**Border Radius:**

| Componente | Radio | Tailwind | Flutter |
|------------|-------|----------|---------|
| Chip/Badge | 999px | `rounded-full` | `BorderRadius.circular(999)` |
| Botón | 12px | `rounded-xl` | `BorderRadius.circular(12)` |
| Card | 16px | `rounded-2xl` | `BorderRadius.circular(16)` |
| Hero | 20px | `rounded-[20px]` | `BorderRadius.circular(20)` |
| Input | 8px | `rounded-lg` | `BorderRadius.circular(8)` |

**Verificar inconsistencias:**
```bash
# Buscar border-radius en Flutter que no coincidan con los estándares
grep -rn "BorderRadius.circular" lib/ --include="*.dart" | grep -v "999\|16\|20\|12\|8\|14\|24\|28"
```

Los valores `14`, `24`, `28` son cercanos pero no estándar. Considerar normalizar:
- `14` → `16` (cards)
- `24` → `20` (hero) o `16` (cards)
- `28` → `20` (hero)

---

## PARTE D — Micro-animaciones

### ✅ Paso 6.6: Agregar hover transitions a cards web

**Buscar en todos los workspace pages:**
```bash
grep -rn "hover:shadow-sm" src/pages/work/ --include="*.tsx"
```

Para cada card que tenga `hover:shadow-sm`, verificar que también tenga `transition-all duration-200`:
```diff
- className="rounded-lg border border-[#DDE2E8] bg-white p-4"
+ className="rounded-lg border border-[#DDE2E8] bg-white p-4 transition-all duration-200 hover:shadow-sm"
```

### ✅ Paso 6.7: Agregar transición a sidebar links

**Archivo:** `web/src/components/app-layout.tsx`

Buscar los `NavLink` o buttons del sidebar. Asegurar que tengan:
```css
transition-colors duration-150
```

---

## Verificación Final Fase 6

- [ ] **Flutter:** `PinoColors` existe en `app/theme/pino_colors.dart`
- [ ] **Flutter:** `flutter analyze` — 0 errores después de reemplazar colores
- [ ] **Flutter:** Grep no encuentra `Color(0xFF047857)` en `lib/` (excepto en `pino_colors.dart`)
- [ ] **Flutter:** Grep no encuentra `Color(0xFF0F172A)` en `lib/` (excepto en `pino_colors.dart`)
- [ ] **React:** `tailwind.config` tiene la paleta `pino`
- [ ] **React:** `npm run build` sin errores
- [ ] **React:** Grep no encuentra `text-[#0F766E]` en `src/`
- [ ] **React:** Grep no encuentra `bg-[#0F766E]` en `src/`
- [ ] **Visual:** Colores verdes son consistentes entre web y móvil
- [ ] **Visual:** Cards tienen hover suave en web
- [ ] **Visual:** Border radius es consistente (no hay mezcla de 14/16/20/24/28)
