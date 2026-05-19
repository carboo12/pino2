# 🔐 Fase 1 — Rediseño de Login (Web + Flutter)

**Objetivo:** Unificar la experiencia de login en ambas plataformas. Eliminar neumorfismo. Aplicar branding "Pino".  
**Estimación:** 1 día  
**Archivos afectados:** 2

---

## PARTE A — React Web Login

### Archivo: `web/src/pages/login-page.tsx` (140 líneas actuales)

---

### ✅ Paso 1.1: Eliminar sombras neumorfistas del Card

**Línea 52** — Eliminar la clase de shadow del Card:

```diff
- <Card className="w-full max-w-sm bg-background border-none shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
+ <Card className="w-full max-w-sm bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
```

---

### ✅ Paso 1.2: Eliminar sombras neumorfistas de los inputs

**Línea 84** — Input de email:
```diff
- className="bg-background shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] focus-visible:shadow-none"
+ className=""
```

**Línea 97** — Input de password:
```diff
- className="bg-background shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] focus-visible:shadow-none"
+ className=""
```

---

### ✅ Paso 1.3: Eliminar sombra neumorfista del botón

**Línea 122** — Botón submit:
```diff
- <Button type="submit" className="w-full shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] active:shadow-[inset_6px_6px_12px_#d1d9e6,inset_-6px_-6px_12px_#ffffff]" disabled={loading}>
+ <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800" disabled={loading}>
```

---

### ✅ Paso 1.4: Cambiar fondo de página

**Línea 50** — Contenedor principal:
```diff
- <div className="w-full h-screen flex flex-col items-center justify-center px-4 bg-background">
+ <div className="w-full h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900">
```

---

### ✅ Paso 1.5: Reemplazar icono SVG genérico por icono de marca

**Líneas 54-66** — Reemplazar el SVG completo:
```diff
- <div className="flex justify-center mb-4">
-   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
-     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
-     className="h-10 w-10 text-primary">
-     <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
-   </svg>
- </div>
+ <div className="flex justify-center mb-4">
+   <div className="w-14 h-14 rounded-2xl bg-emerald-700 flex items-center justify-center">
+     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
+       stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
+       className="h-7 w-7">
+       <path d="M17 10V4H7v6M3 14l9 5 9-5M3 9l9 5 9-5"></path>
+     </svg>
+   </div>
+ </div>
```

---

### ✅ Paso 1.6: Cambiar textos del header

**Línea 68** — Título:
```diff
- <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
+ <CardTitle className="text-2xl font-bold">Bienvenido</CardTitle>
```

**Línea 69-71** — Descripción:
```diff
- <CardDescription>
-   Ingresa tu correo para acceder a tu cuenta
- </CardDescription>
+ <CardDescription>Sistema de distribución</CardDescription>
```

---

### ✅ Paso 1.7: Simplificar footer del card

**Líneas 128-131** — Reemplazar los dos links por uno:
```diff
- <CardFooter className="flex flex-col gap-3 justify-center text-center text-sm text-muted-foreground pt-4">
-   <span>Si olvidaste tu contraseña, solicita el reinicio a un administrador.</span>
-   <Link to="/forgot-password" className="text-primary hover:underline font-medium">O usa la herramienta automatizada</Link>
- </CardFooter>
+ <CardFooter className="justify-center pt-4">
+   <Link to="/forgot-password" className="text-sm text-slate-400 hover:text-white transition-colors">
+     ¿Olvidaste tu contraseña?
+   </Link>
+ </CardFooter>
```

---

### ✅ Paso 1.8: Eliminar footer de copyright

**Líneas 134-136** — Eliminar completamente:
```diff
- <footer className="text-center p-4 text-xs text-muted-foreground">
-   © {new Date().getFullYear()} World Wide All in One Programing. Todos los derechos reservados.
- </footer>
```

---

### ✅ Paso 1.9: Cambiar texto del botón

**Línea 124** — Texto de botón:
```diff
- {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
+ {loading ? 'Validando...' : 'Entrar'}
```

---

## PARTE B — Flutter Login

### Archivo: `flutter/lib/features/auth/presentation/screens/login_screen.dart` (211 líneas)

---

### ✅ Paso 1.10: Suavizar gradiente de fondo

**Líneas 50-55** — Cambiar stops y colores:
```diff
- colors: [Color(0xFF0F172A), Color(0xFF14532D), Color(0xFFF5F7FB)],
- stops: [0.0, 0.42, 0.42],
+ colors: [Color(0xFF0F172A), Color(0xFF064E3B), Color(0xFF0F172A)],
+ stops: [0.0, 0.5, 1.0],
```

---

### ✅ Paso 1.11: Cambiar icono

**Líneas 81-85** — Cambiar el icono:
```diff
- child: const Icon(
-   Icons.storefront_rounded,
-   color: Colors.white,
-   size: 28,
- ),
+ child: const Icon(
+   Icons.park_rounded,
+   color: Colors.white,
+   size: 28,
+ ),
```

---

### ✅ Paso 1.12: Cambiar textos

**Línea 89** — Título:
```diff
- 'Acceso móvil',
+ 'Bienvenido',
```

**Líneas 95-100** — Descripción:
```diff
- 'Ingresa con tu usuario para empezar a trabajar rápido en calle, ruta o bodega.',
+ 'Sistema de distribución',
```

---

### ✅ Paso 1.13: Cambiar color del botón

**Línea 179** — Usar el color de marca:
```diff
- FilledButton.icon(
-   onPressed: authState.isLoading ? null : _submit,
+ FilledButton.icon(
+   style: FilledButton.styleFrom(
+     backgroundColor: const Color(0xFF047857),
+   ),
+   onPressed: authState.isLoading ? null : _submit,
```

---

### ✅ Paso 1.14: Cambiar texto del botón

**Líneas 191-193**:
```diff
- authState.isLoading
-     ? 'Validando...'
-     : 'Entrar',
+ authState.isLoading ? 'Validando...' : 'Entrar',
```
*(El texto "Entrar" ya coincide — solo verificar que no diga otra cosa)*

---

## Verificación Final Fase 1

- [ ] **Web:** Abrir `http://localhost:5173/login` — fondo gradiente oscuro, card blanca, sin sombras neumorfistas
- [ ] **Web:** El botón es verde `emerald-700`, no azul default
- [ ] **Web:** Solo hay UN link de "¿Olvidaste tu contraseña?"
- [ ] **Web:** No hay footer de copyright
- [ ] **Web:** Probar dark mode — debe verse bien sin artefactos
- [ ] **Flutter:** Ejecutar en emulador — gradiente suave sin corte brusco
- [ ] **Flutter:** Icono es un árbol/parque, no un storefront
- [ ] **Flutter:** Título dice "Bienvenido", subtítulo dice "Sistema de distribución"
- [ ] **Flutter:** Botón "Entrar" es verde `#047857`
- [ ] **Ambos:** Los textos coinciden (Bienvenido / Entrar / ¿Olvidaste tu contraseña?)
