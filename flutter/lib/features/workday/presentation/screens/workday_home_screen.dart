import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/utils/role_utils.dart';
import '../../../../core/network/sync_queue_processor.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../../home/data/home_repository.dart';
import '../../../home/domain/models/store_summary.dart';
import '../widgets/workday_scaffold.dart';

final _assignedStoresProvider = FutureProvider<List<StoreSummary>>((ref) async {
  final authState = ref.watch(authControllerProvider);
  final session = authState.session;
  if (session == null) return [];
  final repository = ref.read(homeRepositoryProvider);
  return repository.getAssignedStores(
    userId: session.user.id,
    accessToken: session.accessToken,
  );
});

class WorkdayHomeScreen extends ConsumerStatefulWidget {
  const WorkdayHomeScreen({super.key});

  @override
  ConsumerState<WorkdayHomeScreen> createState() => _WorkdayHomeScreenState();
}

class _WorkdayHomeScreenState extends ConsumerState<WorkdayHomeScreen> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final session = authState.session;
    final storesAsync = ref.watch(_assignedStoresProvider);
    final role = normalizeRole(session?.user.role);
    final theme = Theme.of(context);

    final storeName = storesAsync.value?.firstOrNull?.name ?? 'Mi Tienda';
    final storeId = session?.user.primaryStoreId;

    Widget buildNextAction() {
      switch (role) {
        case AppRole.vendor:
        case AppRole.preventa:
          return _NextClientCard(
            onStart: () => context.push('/workday/route'),
            storeName: storeName,
          );
        case AppRole.rutero:
          return _NextStopCard(
            onStart: () => context.push('/workday/route'),
            storeName: storeName,
          );
        case AppRole.inventory:
          return _NextWarehouseCard(
            onStart: () => context.push('/workday/route'),
            storeName: storeName,
          );
        default:
          return _PulseCard(
            storesAsync: storesAsync,
            onSelectStore: (s) {
              context.push('/workday/route');
            },
          );
      }
    }

    final navItems = <BottomNavItem>[
      BottomNavItem(
        icon: Icons.home_outlined,
        activeIcon: Icons.home,
        label: 'Inicio',
        onTap: () => setState(() => _selectedIndex = 0),
        isSelected: _selectedIndex == 0,
      ),
      if (role == AppRole.vendor || role == AppRole.preventa) ...[
        BottomNavItem(
          icon: Icons.route_outlined,
          activeIcon: Icons.route,
          label: 'Ruta',
          onTap: () => context.push('/workday/route'),
          isSelected: false,
        ),
        BottomNavItem(
          icon: Icons.shopping_cart_outlined,
          activeIcon: Icons.shopping_cart,
          label: 'Pedido',
          onTap: () => context.push('/workday/order'),
          isSelected: false,
        ),
      ],
      if (role == AppRole.rutero) ...[
        BottomNavItem(
          icon: Icons.route_outlined,
          activeIcon: Icons.route,
          label: 'Ruta',
          onTap: () => context.push('/workday/route'),
          isSelected: false,
        ),
        BottomNavItem(
          icon: Icons.payments_outlined,
          activeIcon: Icons.payments,
          label: 'Cobros',
          onTap: () => context.push('/collections/${storeId ?? ""}'),
          isSelected: false,
        ),
        BottomNavItem(
          icon: Icons.replay_outlined,
          activeIcon: Icons.replay,
          label: 'Devolución',
          onTap: () => context.push('/returns/${storeId ?? ""}'),
          isSelected: false,
        ),
      ],
      if (role == AppRole.inventory) ...[
        BottomNavItem(
          icon: Icons.inventory_2_outlined,
          activeIcon: Icons.inventory_2,
          label: 'Pedidos',
          onTap: () => context.push('/warehouse/${storeId ?? ""}'),
          isSelected: false,
        ),
        BottomNavItem(
          icon: Icons.qr_code_scanner_outlined,
          activeIcon: Icons.qr_code_scanner,
          label: 'Picking',
          onTap: () => context.push('/warehouse/${storeId ?? ""}'),
          isSelected: false,
        ),
      ],
      BottomNavItem(
        icon: Icons.sync_outlined,
        activeIcon: Icons.sync,
        label: 'Sync',
        onTap: () => context.push('/sync'),
        isSelected: false,
      ),
    ];

    return WorkdayScaffold(
      title: 'Jornada',
      bottomNavItems: navItems,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _StoreCard(storeName: storeName, storeId: storeId),
            const SizedBox(height: 20),
            Text(
              'Siguiente acción',
              style: theme.textTheme.titleSmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 12),
            buildNextAction(),
            const SizedBox(height: 24),
            Text(
              'Pendientes',
              style: theme.textTheme.titleSmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 12),
            _PendingList(role: role),
          ],
        ),
      ),
    );
  }
}

class _StoreCard extends StatelessWidget {
  final String storeName;
  final String? storeId;

  const _StoreCard({required this.storeName, this.storeId});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(Icons.store, color: theme.colorScheme.primary, size: 32),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(storeName,
                      style: theme.textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.w600)),
                  if (storeId != null)
                    Text('ID: $storeId',
                        style: TextStyle(
                            fontSize: 11,
                            color: theme.colorScheme.onSurfaceVariant)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NextClientCard extends StatelessWidget {
  final VoidCallback onStart;
  final String storeName;

  const _NextClientCard({required this.onStart, required this.storeName});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      color: theme.colorScheme.primaryContainer,
      child: InkWell(
        onTap: onStart,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Icon(Icons.person_pin_circle,
                  size: 40, color: theme.colorScheme.onPrimaryContainer),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Iniciar jornada',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: theme.colorScheme.onPrimaryContainer,
                        )),
                    const SizedBox(height: 4),
                    Text(
                      'Toca para ver tu ruta y empezar',
                      style: TextStyle(
                          fontSize: 12,
                          color: theme.colorScheme.onPrimaryContainer
                              .withAlpha(180)),
                    ),
                  ],
                ),
              ),
              Icon(Icons.arrow_forward_ios,
                  size: 16, color: theme.colorScheme.onPrimaryContainer),
            ],
          ),
        ),
      ),
    );
  }
}

class _NextStopCard extends StatelessWidget {
  final VoidCallback onStart;
  final String storeName;

  const _NextStopCard({required this.onStart, required this.storeName});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      color: theme.colorScheme.secondaryContainer,
      child: InkWell(
        onTap: onStart,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Icon(Icons.local_shipping,
                  size: 40, color: theme.colorScheme.onSecondaryContainer),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Próxima parada',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: theme.colorScheme.onSecondaryContainer,
                        )),
                    const SizedBox(height: 4),
                    Text(
                      'Toca para ver tu ruta de entregas',
                      style: TextStyle(
                          fontSize: 12,
                          color: theme.colorScheme.onSecondaryContainer
                              .withAlpha(180)),
                    ),
                  ],
                ),
              ),
              Icon(Icons.arrow_forward_ios,
                  size: 16, color: theme.colorScheme.onSecondaryContainer),
            ],
          ),
        ),
      ),
    );
  }
}

class _NextWarehouseCard extends StatelessWidget {
  final VoidCallback onStart;
  final String storeName;

  const _NextWarehouseCard({required this.onStart, required this.storeName});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      color: theme.colorScheme.tertiaryContainer,
      child: InkWell(
        onTap: onStart,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Icon(Icons.inventory_2,
                  size: 40, color: theme.colorScheme.onTertiaryContainer),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Pedidos recibidos',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: theme.colorScheme.onTertiaryContainer,
                        )),
                    const SizedBox(height: 4),
                    Text(
                      'Revisa los pedidos pendientes en bodega',
                      style: TextStyle(
                          fontSize: 12,
                          color: theme.colorScheme.onTertiaryContainer
                              .withAlpha(180)),
                    ),
                  ],
                ),
              ),
              Icon(Icons.arrow_forward_ios,
                  size: 16, color: theme.colorScheme.onTertiaryContainer),
            ],
          ),
        ),
      ),
    );
  }
}

class _PulseCard extends StatelessWidget {
  final AsyncValue<List<StoreSummary>> storesAsync;
  final void Function(StoreSummary) onSelectStore;

  const _PulseCard({required this.storesAsync, required this.onSelectStore});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return storesAsync.when(
      loading: () => const Card(
        child: SizedBox(
          height: 100,
          child: Center(child: CircularProgressIndicator()),
        ),
      ),
      error: (_, _) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text('Error al cargar tiendas',
              style: TextStyle(color: theme.colorScheme.error)),
        ),
      ),
      data: (stores) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Tus tiendas',
                  style: theme.textTheme.titleSmall
                      ?.copyWith(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              ...stores.map((s) => ListTile(
                    title: Text(s.name),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => onSelectStore(s),
                    dense: true,
                  )),
            ],
          ),
        ),
      ),
    );
  }
}

class _PendingList extends ConsumerWidget {
  final AppRole role;

  const _PendingList({required this.role});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final syncState = ref.watch(syncQueueProcessorProvider);
    final theme = Theme.of(context);

    final pendingItems = <Widget>[];
    if (syncState.pendingCount > 0) {
      pendingItems.add(
        ListTile(
          leading: const Icon(Icons.cloud_upload_outlined),
          title: Text('${syncState.pendingCount} pendientes de enviar'),
          trailing: const Icon(Icons.chevron_right),
          dense: true,
        ),
      );
    }
    if (syncState.failedCount > 0) {
      pendingItems.add(
        ListTile(
          leading: Icon(Icons.error_outline, color: theme.colorScheme.error),
          title: Text('${syncState.failedCount} con error',
              style: TextStyle(color: theme.colorScheme.error)),
          trailing: const Icon(Icons.chevron_right),
          dense: true,
        ),
      );
    }

    if (pendingItems.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Icon(Icons.check_circle, color: theme.colorScheme.primary),
              const SizedBox(width: 12),
              Text('Todo sincronizado',
                  style: theme.textTheme.bodyMedium
                      ?.copyWith(color: theme.colorScheme.primary)),
            ],
          ),
        ),
      );
    }

    return Card(child: Column(children: pendingItems));
  }
}
