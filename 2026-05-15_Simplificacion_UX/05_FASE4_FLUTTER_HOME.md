# 📱 Fase 4 — Refactorización del Home Screen Flutter

**Objetivo:** Reducir `home_screen.dart` de 1,407 a ~400 líneas. Extraer debug panel y acciones por rol.  
**Estimación:** 1 día  
**Archivos afectados:** 1 existente + 3 nuevos

---

## Archivo: `flutter/lib/features/home/presentation/screens/home_screen.dart` (1,407 líneas)

---

### ✅ Paso 4.1: Crear archivo de acciones por rol

**Crear:** `flutter/lib/features/home/data/role_actions.dart`

Mover las siguientes piezas desde `home_screen.dart`:
- Enum `_RouteKey` (buscar `enum _RouteKey`)  
- Clase `_ActionDescriptor` (buscar `class _ActionDescriptor`)
- Método `_actionsForRole` con todo su switch de ~250 líneas
- Método `_openAction`

Renombrar eliminando el prefijo `_` (ya no son privados):

```dart
// role_actions.dart

import 'package:flutter/material.dart';
import '../../../../core/utils/role_utils.dart';

enum RouteKey {
  quickOrder, warehouse, collections, clients, catalog,
  routeBoard, inventoryAdjustments, returns, dailyClosing,
  vendorInventory, salesHistory, preventaClients, preventaOrder,
  preventaRoute,
}

class RoleAction {
  final String title;
  final String subtitle;
  final IconData icon;
  final RouteKey routeKey;
  
  const RoleAction({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.routeKey,
  });
}

List<RoleAction> actionsForRole(AppRole role) {
  // COPIAR el switch completo de _actionsForRole() aquí
  // Cambiar _ActionDescriptor por RoleAction
  // Cambiar _RouteKey por RouteKey
}

void openAction(BuildContext context, {
  required RoleAction action,
  required String storeId,
  String? storeName,
}) {
  // COPIAR la lógica de _openAction() aquí
}
```

**Líneas a mover desde home_screen.dart:** Buscar desde `enum _RouteKey` hasta el final de `_openAction` — aproximadamente líneas 850-1100 (~250 líneas).

---

### ✅ Paso 4.2: Crear widget del debug panel como BottomSheet

**Crear:** `flutter/lib/features/home/widgets/debug_panel_sheet.dart`

Mover `_BackendRuntimeCard` completo desde `home_screen.dart`:

```dart
// debug_panel_sheet.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// ... imports necesarios

class DebugPanelSheet extends ConsumerWidget {
  const DebugPanelSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // COPIAR toda la lógica de _BackendRuntimeCard aquí
    // Envolver en DraggableScrollableSheet
    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      minChildSize: 0.4,
      maxChildSize: 0.95,
      builder: (_, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: ListView(
            controller: scrollController,
            padding: const EdgeInsets.all(20),
            children: [
              // Indicador de drag
              Center(
                child: Container(
                  width: 40, height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Text('Estado del Sistema',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                )),
              const SizedBox(height: 16),
              // PEGAR el contenido de _BackendRuntimeCard aquí
            ],
          ),
        );
      },
    );
  }
}
```

**Líneas a mover:** Buscar `class _BackendRuntimeCard` — aproximadamente 400 líneas.

---

### ✅ Paso 4.3: Crear widget de acción primaria compacto

**Crear:** `flutter/lib/features/home/widgets/action_cards.dart`

```dart
import 'package:flutter/material.dart';
import '../data/role_actions.dart';

class PrimaryActionCard extends StatelessWidget {
  const PrimaryActionCard({
    super.key,
    required this.action,
    this.onTap,
  });

  final RoleAction action;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
      color: const Color(0xFF047857),
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Container(
                width: 48, height: 48,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(action.icon, color: Colors.white, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(action.title, style: theme.textTheme.titleMedium?.copyWith(
                      color: Colors.white, fontWeight: FontWeight.w800)),
                    Text(action.subtitle, style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.white70)),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_rounded, color: Colors.white70),
            ],
          ),
        ),
      ),
    );
  }
}

class SecondaryActionCard extends StatelessWidget {
  const SecondaryActionCard({
    super.key,
    required this.action,
    this.onTap,
  });

  final RoleAction action;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(action.icon, color: const Color(0xFF047857), size: 22),
              const SizedBox(height: 8),
              Text(action.title, style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w700)),
              Text(action.subtitle, style: theme.textTheme.bodySmall?.copyWith(
                color: Colors.grey.shade600), maxLines: 1, overflow: TextOverflow.ellipsis),
            ],
          ),
        ),
      ),
    );
  }
}
```

---

### ✅ Paso 4.4: Reescribir `HomeScreen.build()` simplificado

En `home_screen.dart`, reescribir el método `build()` de `_HomeScreenState`:

```dart
@override
Widget build(BuildContext context) {
  final authState = ref.watch(authControllerProvider);
  final storesAsync = ref.watch(assignedStoresProvider);
  final session = authState.session;

  if (session == null) {
    return const Scaffold(body: Center(child: CircularProgressIndicator()));
  }

  final role = normalizeRole(session.user.role);

  if (role == AppRole.preventa) {
    return const PreventaHomeScreen();
  }

  // Bootstrap realtime (sin cambios)
  if (!_realtimeBootstrapped) {
    _realtimeBootstrapped = true;
    Future<void>.microtask(
      () => ref.read(realtimeControllerProvider.notifier)
          .connect(session, storeId: _selectedStoreId ?? session.user.primaryStoreId),
    );
  }

  return Scaffold(
    appBar: AppBar(
      title: const Text('Pino'),
      actions: [
        // Selector de tienda (si hay >1)
        storesAsync.when(
          data: (stores) {
            if (stores.length <= 1) return const SizedBox.shrink();
            return PopupMenuButton<String>(
              icon: const Icon(Icons.store_rounded),
              tooltip: 'Cambiar tienda',
              onSelected: (id) {
                setState(() => _selectedStoreId = id);
                ref.read(realtimeControllerProvider.notifier)
                    .connect(session, storeId: id);
              },
              itemBuilder: (_) => stores.map((s) => PopupMenuItem(
                value: s.id,
                child: Text(s.name),
              )).toList(),
            );
          },
          loading: () => const SizedBox.shrink(),
          error: (_, _) => const SizedBox.shrink(),
        ),
        // Debug panel
        IconButton(
          tooltip: 'Estado del sistema',
          icon: const Icon(Icons.tune_rounded),
          onPressed: () => showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            builder: (_) => const DebugPanelSheet(),
          ),
        ),
        // Logout
        IconButton(
          tooltip: 'Cerrar sesión',
          onPressed: () => ref.read(authControllerProvider.notifier).logout(),
          icon: const Icon(Icons.logout_rounded),
        ),
      ],
    ),
    body: RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(assignedStoresProvider);
        await ref.read(syncQueueProcessorProvider.notifier).processPendingQueue();
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
        children: [
          const SyncStatusBanner(),
          const SizedBox(height: 12),
          // Hero compacto
          _CompactHero(
            name: session.user.name,
            roleLabel: roleLabel(role),
            storeName: storesAsync.asData?.value
                .where((s) => s.id == (_selectedStoreId ?? session.user.primaryStoreId))
                .map((s) => s.name).firstOrNull,
          ),
          const SizedBox(height: 14),
          // Quick pulse
          if (_currentStoreId != null)
            _QuickPulseBar(storeId: _currentStoreId!),
          const SizedBox(height: 18),
          // Acciones — máximo 3 visibles + overflow
          _buildActions(context, role),
        ],
      ),
    ),
  );
}
```

---

### ✅ Paso 4.5: Crear widget `_CompactHero` (reemplaza `_HeroSessionCard`)

```dart
class _CompactHero extends StatelessWidget {
  const _CompactHero({required this.name, required this.roleLabel, this.storeName});
  final String name;
  final String roleLabel;
  final String? storeName;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF064E3B)],
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.park_rounded, color: Colors.white, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Hola, ${name.split(' ').first}',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: Colors.white, fontWeight: FontWeight.w800)),
                Text([roleLabel, if (storeName != null) storeName!].join(' • '),
                  style: theme.textTheme.bodySmall?.copyWith(color: Colors.white70)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

---

### ✅ Paso 4.6: Crear método `_buildActions` con overflow

```dart
Widget _buildActions(BuildContext context, AppRole role) {
  final store = /* obtener store actual */;
  final actions = actionsForRole(role);  // del archivo role_actions.dart
  
  if (actions.isEmpty) return const SizedBox.shrink();
  
  final primary = actions.first;
  final visible = actions.skip(1).take(2).toList();
  final overflow = actions.skip(3).toList();

  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text('Acciones', style: Theme.of(context).textTheme.titleMedium?.copyWith(
        fontWeight: FontWeight.w800)),
      const SizedBox(height: 12),
      PrimaryActionCard(
        action: primary,
        onTap: store == null ? null : () => openAction(context,
          action: primary, storeId: store.id, storeName: store.name),
      ),
      if (visible.isNotEmpty) ...[
        const SizedBox(height: 12),
        Row(
          children: visible.map((a) => Expanded(
            child: Padding(
              padding: EdgeInsets.only(right: a == visible.last ? 0 : 12),
              child: SecondaryActionCard(
                action: a,
                onTap: store == null ? null : () => openAction(context,
                  action: a, storeId: store.id, storeName: store.name),
              ),
            ),
          )).toList(),
        ),
      ],
      if (overflow.isNotEmpty) ...[
        const SizedBox(height: 8),
        Center(
          child: TextButton.icon(
            icon: const Icon(Icons.more_horiz_rounded, size: 18),
            label: Text('${overflow.length} más'),
            onPressed: () => _showMoreActions(context, overflow, store),
          ),
        ),
      ],
    ],
  );
}

void _showMoreActions(BuildContext context, List<RoleAction> actions, StoreSummary? store) {
  showModalBottomSheet(
    context: context,
    builder: (_) => SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: actions.map((a) => ListTile(
          leading: Icon(a.icon, color: const Color(0xFF047857)),
          title: Text(a.title),
          subtitle: Text(a.subtitle),
          onTap: store == null ? null : () {
            Navigator.pop(context);
            openAction(context, action: a, storeId: store.id, storeName: store.name);
          },
        )).toList(),
      ),
    ),
  );
}
```

---

### ✅ Paso 4.7: Eliminar widgets obsoletos de home_screen.dart

Después de extraer, eliminar del archivo:
- [ ] `_HeroSessionCard` → reemplazada por `_CompactHero`
- [ ] `_StoreScopeCard` → reemplazada por `PopupMenuButton` en AppBar
- [ ] `_RoleActionGrid` → reemplazada por `_buildActions`
- [ ] `_ActionCard` → reemplazada por `PrimaryActionCard` / `SecondaryActionCard`
- [ ] `_ActionDescriptor` → movida a `role_actions.dart`
- [ ] `_BackendRuntimeCard` → movida a `debug_panel_sheet.dart`
- [ ] `_LoadingCard` → usar `CircularProgressIndicator` estándar
- [ ] `_ErrorCard` → usar widget estándar inline

---

## Verificación Final Fase 4

- [ ] `flutter analyze` — 0 errores
- [ ] `home_screen.dart` tiene ≤ 400 líneas
- [ ] Existen los 3 archivos nuevos:
  - [ ] `data/role_actions.dart`
  - [ ] `widgets/debug_panel_sheet.dart`
  - [ ] `widgets/action_cards.dart`
- [ ] Hero compacto muestra "Hola, {nombre}" + rol + tienda en 2 líneas
- [ ] Selector de tienda en AppBar (PopupMenu) si hay >1 tienda
- [ ] Máximo 3 acciones visibles (1 primaria + 2 secundarias)
- [ ] Botón "X más" abre bottom sheet con acciones restantes
- [ ] Icono de engranaje en AppBar abre DebugPanelSheet
- [ ] QuickPulseBar se muestra debajo del hero
- [ ] Todos los roles navegan correctamente a sus destinos
- [ ] Verificar en emulador con pantallas de 5" a 6.7"
