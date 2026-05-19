# 🎯 Plan de Simplificación UX — Sistema Pino

**Fecha:** 15 de Mayo, 2026  
**Filosofía:** "Menos es más — el usuario debe completar su tarea en el menor número de toques posible."

---

## Principios Rectores

| # | Principio | Significado |
|---|-----------|-------------|
| 1 | **Un toque, una tarea** | Cada acción principal debe estar a ≤2 toques del punto de entrada |
| 2 | **Zero chrome** | Eliminar decoración que no transmita información útil |
| 3 | **Contexto inmediato** | Mostrar los datos relevantes sin que el usuario los busque |
| 4 | **Roles = vistas** | Cada rol ve SOLO lo que necesita, sin menús genéricos |
| 5 | **Consistencia cross-platform** | React y Flutter comparten la misma lógica visual |

---

## Resumen de Hallazgos

### 🔴 Problemas Críticos (requieren acción inmediata)

- [ ] **Login Web** — Neumorfismo anticuado, sin branding, footer innecesario
- [ ] **Dashboard Tienda** — 4 cards de "Acción rápida" que duplican el sidebar
- [ ] **Sales Workspace** — 4 de 5 tabs son EmptyState con un solo botón
- [ ] **Flutter Home** — 1,407 líneas; panel de debugging visible al usuario final
- [ ] **Preventa BottomNav** — Tab "Catálogo" no navega a nada (handler faltante)

### 🟡 Mejoras Importantes

- [ ] **Sidebar Master Admin** — 13 items es demasiado → reducir a 8
- [ ] **Cash Workspace** — Tab "Caja" y "Devolución" redundantes
- [ ] **Finance Workspace** — "Excepciones" es nombre confuso → "Atención"
- [ ] **Colores hardcoded** — Sin tokens de diseño compartidos
- [ ] **Flutter CTA Preventa** — Negro agresivo, texto ALL CAPS excesivo

### ✅ Componentes que Funcionan Bien (no tocar)

- Warehouse Workspace — Kanban excelente
- Cash Workspace tab "Venta" — Flujo claro scan→carrito→cobrar
- Admin Control Center — Exception-based dashboard correcto
- Catalog Workspace — 3 tabs con contenido real
- Flutter Login — Bien diseñado (base para unificar web)

---

## Fases del Plan

| Fase | Nombre | Archivos | Esfuerzo | Doc |
|------|--------|----------|----------|-----|
| **F1** | Login & Primera Impresión | 2 archivos | 1 día | [02_FASE1](./02_FASE1_LOGIN_REDISEÑO.md) |
| **F2** | Navegación Web Simplificada | 3 archivos | 1 día | [03_FASE2](./03_FASE2_NAVEGACION_WEB.md) |
| **F3** | Workspaces: Tabs Vacías | 3 archivos | 0.5 día | [04_FASE3](./04_FASE3_WORKSPACES_WEB.md) |
| **F4** | Flutter: Home Simplificado | 1 + 3 nuevos | 1 día | [05_FASE4](./05_FASE4_FLUTTER_HOME.md) |
| **F5** | Flutter: Preventa Pulido | 1 archivo | 0.5 día | [06_FASE5](./06_FASE5_FLUTTER_PREVENTA.md) |
| **F6** | Pulido Visual Global | 1 nuevo + múltiples | 1 día | [07_FASE6](./07_FASE6_PULIDO_VISUAL.md) |

**Total estimado: 5 días de trabajo**

---

## Checklist Master — Todas las Fases

### Fase 1 — Login (14 pasos)
- [ ] 1.1: Eliminar sombras neumorfistas del Card web
- [ ] 1.2: Eliminar sombras de inputs web
- [ ] 1.3: Eliminar sombra del botón web
- [ ] 1.4: Cambiar fondo a gradiente oscuro web
- [ ] 1.5: Reemplazar SVG genérico por icono de marca web
- [ ] 1.6: Cambiar textos header web
- [ ] 1.7: Simplificar footer web (1 link)
- [ ] 1.8: Eliminar copyright footer web
- [ ] 1.9: Cambiar texto botón web
- [ ] 1.10: Suavizar gradiente Flutter
- [ ] 1.11: Cambiar icono Flutter
- [ ] 1.12: Cambiar textos Flutter
- [ ] 1.13: Cambiar color botón Flutter
- [ ] 1.14: Verificar texto botón Flutter

### Fase 2 — Navegación Web (8 pasos)
- [ ] 2.1: Eliminar objeto `translations` (82 líneas)
- [ ] 2.2: Eliminar `lang` de funciones de nav
- [ ] 2.3: Actualizar llamadas que pasan `language`
- [ ] 2.4: Eliminar state y handler de language
- [ ] 2.5: Eliminar `language` de useMemo deps
- [ ] 2.6: Verificar roles operativos (≤2 items)
- [ ] 2.7: Redirigir dashboard → workspace
- [ ] 2.8: Agrupar zonas/sub-zonas en configuración (iterativo)

### Fase 3 — Workspaces (9 pasos)
- [ ] 3.1: Eliminar imports de Tabs (sales)
- [ ] 3.2: Eliminar icons no usados (sales)
- [ ] 3.3: Eliminar state activeTab (sales)
- [ ] 3.4: Reemplazar Tabs por vista directa (sales)
- [ ] 3.5: Verificar resultado sales
- [ ] 3.6: Eliminar tab Devolución + botón en topbar (cash)
- [ ] 3.7: Fusionar tab Caja como barra inline (cash)
- [ ] 3.8: Verificar resultado cash (2 tabs)
- [ ] 3.9: Renombrar "Excepciones" → "Atención" (finance)

### Fase 4 — Flutter Home (7 pasos)
- [ ] 4.1: Crear `role_actions.dart` (extraer ~250 líneas)
- [ ] 4.2: Crear `debug_panel_sheet.dart` (extraer ~400 líneas)
- [ ] 4.3: Crear `action_cards.dart` (widgets nuevos)
- [ ] 4.4: Reescribir `build()` de HomeScreen
- [ ] 4.5: Crear `_CompactHero` (20 líneas vs 60)
- [ ] 4.6: Implementar acciones con overflow (3 visibles + "más")
- [ ] 4.7: Eliminar widgets obsoletos del archivo original

### Fase 5 — Flutter Preventa (5 pasos)
- [ ] 5.1: Arreglar BottomNav tab Catálogo
- [ ] 5.2: Compactar hero (padding + fecha)
- [ ] 5.3: KPIs responsivos con LayoutBuilder
- [ ] 5.4: CTA verde marca + texto corto
- [ ] 5.5: Verificar imports

### Fase 6 — Pulido Visual (7 pasos)
- [ ] 6.1: Crear `pino_colors.dart`
- [ ] 6.2: Reemplazar colores hardcoded Flutter (12 tokens)
- [ ] 6.3: Agregar paleta `pino` a tailwind.config
- [ ] 6.4: Reemplazar colores hardcoded React (8+ tokens)
- [ ] 6.5: Documentar estándares de border-radius
- [ ] 6.6: Agregar hover transitions a cards web
- [ ] 6.7: Agregar transición a sidebar links

---

## Documentos del Plan

| Archivo | Contenido | Pasos |
|---------|-----------|-------|
| [01_AUDITORIA_DETALLADA.md](./01_AUDITORIA_DETALLADA.md) | Auditoría página-por-página (16 componentes) | — |
| [02_FASE1_LOGIN_REDISEÑO.md](./02_FASE1_LOGIN_REDISEÑO.md) | Login web + Flutter con diffs exactos | 14 |
| [03_FASE2_NAVEGACION_WEB.md](./03_FASE2_NAVEGACION_WEB.md) | Sidebar + dashboard con diffs exactos | 8 |
| [04_FASE3_WORKSPACES_WEB.md](./04_FASE3_WORKSPACES_WEB.md) | Sales/Cash/Finance con diffs exactos | 9 |
| [05_FASE4_FLUTTER_HOME.md](./05_FASE4_FLUTTER_HOME.md) | Refactorización home con código completo | 7 |
| [06_FASE5_FLUTTER_PREVENTA.md](./06_FASE5_FLUTTER_PREVENTA.md) | Preventa con diffs exactos | 5 |
| [07_FASE6_PULIDO_VISUAL.md](./07_FASE6_PULIDO_VISUAL.md) | Tokens + tablas de búsqueda/reemplazo | 7 |

**Total: 50 pasos ejecutables, cada uno con código before/after y verificación.**
