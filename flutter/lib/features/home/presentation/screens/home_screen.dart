import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/database/app_database.dart';
import '../../../../core/database/local_cache_repository.dart';
import '../../../../core/network/connectivity_service.dart';
import '../../../../core/network/sync_queue_processor.dart';
import '../../../../core/realtime/realtime_controller.dart';
import '../../../../core/realtime/realtime_event.dart';
import '../../../../core/utils/role_utils.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../data/home_repository.dart';
import '../../domain/models/store_summary.dart';
import '../../../../features/preventa/presentation/screens/preventa_home_screen.dart';
import '../../widgets/sync_status_banner.dart';

final assignedStoresProvider = FutureProvider<List<StoreSummary>>((ref) async {
  ref.watch(networkStatusProvider);
  ref.watch(syncQueueProcessorProvider.select((state) => state.lastSyncAt));

  final authState = ref.watch(authControllerProvider);
  final session = authState.session;

  if (session == null) {
    return <StoreSummary>[];
  }

  final repository = ref.read(homeRepositoryProvider);
  return repository.getAssignedStores(
    userId: session.user.id,
    accessToken: session.accessToken,
  );
});

// ── Quick Pulse: números clave al abrir ──
final quickPulseProvider =
    FutureProvider.family<Map<String, int>, String>((ref, storeId) async {
  final authState = ref.watch(authControllerProvider);
  final session = authState.session;
  if (session == null) return {};

  final client = ref.read(appApiClientProvider);
  final token = session.accessToken;
  final userId = session.user.id;

  int pendingOrders = 0;
  int todaySalesCount = 0;
  double todaySalesTotal = 0;
  int vendorStockItems = 0;

  try {
    final orders = await client.getList(
      '/orders?storeId=$storeId&status=RECIBIDO',
      bearerToken: token,
    );
    pendingOrders = orders.length;
  } catch (_) {}

  try {
    final today = DateTime.now().toIso8601String().substring(0, 10);
    final sales = await client.getList(
      '/sales?storeId=$storeId&startDate=${today}T00:00:00&endDate=${today}T23:59:59',
      bearerToken: token,
    );
    todaySalesCount = sales.length;
    for (final s in sales) {
      todaySalesTotal += (s['total'] as num?)?.toDouble() ?? 0;
    }
  } catch (_) {}

  try {
    final inv = await client.getList(
      '/vendor-inventories/$userId',
      bearerToken: token,
    );
    for (final v in inv) {
      vendorStockItems += (v['currentQuantity'] as num?)?.toInt() ?? 0;
    }
  } catch (_) {}

  return {
    'pendingOrders': pendingOrders,
    'todaySalesCount': todaySalesCount,
    'todaySalesTotal': todaySalesTotal.round(),
    'vendorStock': vendorStockItems,
  };
});

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  String? _selectedStoreId;
  bool _realtimeBootstrapped = false;

  @override
  void dispose() {
    ref.read(realtimeControllerProvider.notifier).disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final syncQueueState = ref.watch(syncQueueProcessorProvider);
    final networkStatusAsync = ref.watch(networkStatusProvider);
    final realtimeState = ref.watch(realtimeControllerProvider);
    final pendingSyncCountAsync = ref.watch(pendingSyncCountProvider);
    final failedSyncCountAsync = ref.watch(failedSyncCountProvider);
    final recentSyncEntriesAsync = ref.watch(recentSyncEntriesProvider);
    final latestRealtimeEventAsync = ref.watch(latestRealtimeEventProvider);
    final storesAsync = ref.watch(assignedStoresProvider);
    final session = authState.session;

    if (session == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final role = normalizeRole(session.user.role);

    if (role == AppRole.preventa) {
      return const PreventaHomeScreen();
    }

    if (!_realtimeBootstrapped) {
      _realtimeBootstrapped = true;
      Future<void>.microtask(
        () => ref
            .read(realtimeControllerProvider.notifier)
            .connect(
              session,
              storeId: _selectedStoreId ?? session.user.primaryStoreId,
            ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pino Mobile'),
        actions: [
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
          await ref.read(assignedStoresProvider.future);
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
          children: [
            const SyncStatusBanner(),
            const SizedBox(height: 8),
            _HeroSessionCard(
              name: session.user.name,
              email: session.user.email,
              roleLabelText: roleLabel(role),
            ),
            const SizedBox(height: 18),
            storesAsync.when(
              data: (stores) {
                final currentStoreId =
                    _selectedStoreId ??
                    (stores.isNotEmpty ? stores.first.id : null);
                final currentStore =
                    stores
                        .where((store) => store.id == currentStoreId)
                        .isNotEmpty
                    ? stores.firstWhere((store) => store.id == currentStoreId)
                    : (stores.isNotEmpty ? stores.first : null);

                return Column(
                  children: [
                    _StoreScopeCard(
                      stores: stores,
                      currentStoreId: currentStoreId,
                      onSelected: (storeId) {
                        setState(() {
                          _selectedStoreId = storeId;
                        });
                        ref
                            .read(realtimeControllerProvider.notifier)
                            .connect(session, storeId: storeId);
                      },
                    ),
                    const SizedBox(height: 14),
                    if (currentStoreId != null)
                      _QuickPulseBar(storeId: currentStoreId),
                    const SizedBox(height: 14),
                    _RoleActionGrid(role: role, store: currentStore),
                  ],
                );
              },
              loading: () =>
                  const _LoadingCard(title: 'Cargando tiendas asignadas...'),
              error: (error, stackTrace) => _ErrorCard(
                title: 'No se pudieron cargar las tiendas del usuario.',
                message: error.toString(),
              ),
            ),
            const SizedBox(height: 18),
            _BackendRuntimeCard(
              networkStatus: networkStatusAsync.asData?.value,
              syncQueueState: syncQueueState,
              realtimeState: realtimeState,
              pendingSyncCount: pendingSyncCountAsync.asData?.value ?? 0,
              failedSyncCount: failedSyncCountAsync.asData?.value ?? 0,
              recentSyncEntries: recentSyncEntriesAsync.asData?.value ?? const [],
              latestCachedEvent: latestRealtimeEventAsync.asData?.value,
              onRetrySync: () =>
                  ref.read(syncQueueProcessorProvider.notifier).processPendingQueue(),
              onRetryFailed: () =>
                  ref.read(syncQueueProcessorProvider.notifier).retryFailedQueue(),
              onDiscardEntry: (id) =>
                  ref.read(syncQueueProcessorProvider.notifier).discardFailedEntry(id),
            ),
          ],
        ),
      ),
    );
  }
}

class _HeroSessionCard extends StatelessWidget {
  const _HeroSessionCard({
    required this.name,
    required this.email,
    required this.roleLabelText,
  });

  final String name;
  final String email;
  final String roleLabelText;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: const LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF14532D)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Icon(
              Icons.phone_iphone_rounded,
              color: Colors.white,
              size: 28,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            name,
            style: theme.textTheme.headlineSmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            email,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: Colors.white.withValues(alpha: 0.84),
            ),
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              roleLabelText,
              style: theme.textTheme.bodySmall?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickPulseBar extends ConsumerWidget {
  const _QuickPulseBar({required this.storeId});

  final String storeId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pulseAsync = ref.watch(quickPulseProvider(storeId));

    return pulseAsync.when(
      data: (pulse) {
        if (pulse.isEmpty) return const SizedBox.shrink();

        final pending = pulse['pendingOrders'] ?? 0;
        final salesCount = pulse['todaySalesCount'] ?? 0;
        final salesTotal = pulse['todaySalesTotal'] ?? 0;
        final stock = pulse['vendorStock'] ?? 0;

        return Row(
          children: [
            _PulseChip(
              icon: Icons.inbox_rounded,
              value: '$pending',
              color: pending > 0 ? const Color(0xFFEF4444) : const Color(0xFF6B7280),
              highlight: pending > 0,
            ),
            const SizedBox(width: 8),
            _PulseChip(
              icon: Icons.receipt_long_rounded,
              value: '$salesCount',
              color: const Color(0xFF3B82F6),
            ),
            const SizedBox(width: 8),
            _PulseChip(
              icon: Icons.attach_money_rounded,
              value: 'C\$$salesTotal',
              color: const Color(0xFF10B981),
              flex: 2,
            ),
            const SizedBox(width: 8),
            _PulseChip(
              icon: Icons.inventory_2_rounded,
              value: '$stock',
              color: const Color(0xFFF59E0B),
            ),
          ],
        );
      },
      loading: () => Row(
        children: List.generate(
          4,
          (_) => Expanded(
            child: Container(
              height: 48,
              margin: const EdgeInsets.only(right: 8),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
        ),
      ),
      error: (_, _) => const SizedBox.shrink(),
    );
  }
}

class _PulseChip extends StatelessWidget {
  const _PulseChip({
    required this.icon,
    required this.value,
    required this.color,
    this.highlight = false,
    this.flex = 1,
  });

  final IconData icon;
  final String value;
  final Color color;
  final bool highlight;
  final int flex;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      flex: flex,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          color: highlight ? color.withValues(alpha: 0.12) : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: highlight ? color.withValues(alpha: 0.3) : Colors.grey.shade200,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 5),
            Flexible(
              child: Text(
                value,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: highlight ? color : Colors.grey.shade800,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StoreScopeCard extends StatelessWidget {
  const _StoreScopeCard({
    required this.stores,
    required this.currentStoreId,
    required this.onSelected,
  });

  final List<StoreSummary> stores;
  final String? currentStoreId;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Tienda activa',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
          if (stores.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                'Sin tiendas asignadas.',
                style: theme.textTheme.bodyMedium?.copyWith(color: Colors.black54),
              ),
            ),
          if (stores.isNotEmpty) ...[
            const SizedBox(height: 14),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: stores
                  .map(
                    (store) => ChoiceChip(
                      label: Text(store.name),
                      selected: store.id == currentStoreId,
                      onSelected: (_) => onSelected(store.id),
                    ),
                  )
                  .toList(),
            ),
          ],
        ],
      ),
    );
  }
}

class _RoleActionGrid extends StatelessWidget {
  const _RoleActionGrid({required this.role, required this.store});

  final AppRole role;
  final StoreSummary? store;

  @override
  Widget build(BuildContext context) {
    final actions = _actionsForRole(role);
    final primaryAction = actions.first;
    final secondaryActions = actions.skip(1).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Acciones',
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 12),
        _ActionCard(
          title: primaryAction.title,
          subtitle: primaryAction.subtitle,
          icon: primaryAction.icon,
          storeName: store?.name,
          primary: true,
          onTap: store == null
              ? null
              : () => _openAction(
                    context,
                    action: primaryAction,
                    storeId: store!.id,
                    storeName: store?.name,
                  ),
        ),
        const SizedBox(height: 12),
        ...secondaryActions.map(
          (action) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _ActionCard(
              title: action.title,
              subtitle: action.subtitle,
              icon: action.icon,
              storeName: store?.name,
              onTap: store == null
                  ? null
                  : () => _openAction(
                        context,
                        action: action,
                        storeId: store!.id,
                        storeName: store?.name,
                      ),
            ),
          ),
        ),
      ],
    );
  }

  List<_ActionDescriptor> _actionsForRole(AppRole role) {
    switch (role) {
      case AppRole.masterAdmin:
      case AppRole.owner:
        return const [
          _ActionDescriptor(
            title: 'Nuevo pedido',
            subtitle: 'Capturar pedido de cliente.',
            icon: Icons.flash_on_rounded,
            routeKey: _RouteKey.quickOrder,
          ),
          _ActionDescriptor(
            title: 'Bodega',
            subtitle: 'Recibir, alistar y cargar.',
            icon: Icons.warehouse_rounded,
            routeKey: _RouteKey.warehouse,
          ),
          _ActionDescriptor(
            title: 'Cobros',
            subtitle: 'Cartera y pagos pendientes.',
            icon: Icons.payments_rounded,
            routeKey: _RouteKey.collections,
          ),
          _ActionDescriptor(
            title: 'Catálogo',
            subtitle: 'Stock, precios y bultos.',
            icon: Icons.inventory_2_rounded,
            routeKey: _RouteKey.catalog,
          ),
          _ActionDescriptor(
            title: 'Entregas',
            subtitle: 'Estado de pedidos y rutas.',
            icon: Icons.route_rounded,
            routeKey: _RouteKey.routeBoard,
          ),
        ];
      case AppRole.preventa:
        return const [
          _ActionDescriptor(
            title: 'Mis Clientes',
            subtitle: 'Portafolio y visitas.',
            icon: Icons.people_alt_rounded,
            routeKey: _RouteKey.preventaClients,
          ),
          _ActionDescriptor(
            title: 'Nueva Orden',
            subtitle: 'Levantar pedido en campo.',
            icon: Icons.add_shopping_cart_rounded,
            routeKey: _RouteKey.preventaOrder,
          ),
          _ActionDescriptor(
            title: 'Ruta de Hoy',
            subtitle: 'Seguimiento de visitas.',
            icon: Icons.directions_run_rounded,
            routeKey: _RouteKey.preventaRoute,
          ),
        ];
      case AppRole.storeAdmin:
        return const [
          _ActionDescriptor(
            title: 'Nuevo pedido',
            subtitle: 'Capturar pedido de cliente.',
            icon: Icons.flash_on_rounded,
            routeKey: _RouteKey.quickOrder,
          ),
          _ActionDescriptor(
            title: 'Bodega',
            subtitle: 'Recibir, alistar y cargar.',
            icon: Icons.warehouse_rounded,
            routeKey: _RouteKey.warehouse,
          ),
          _ActionDescriptor(
            title: 'Cobros',
            subtitle: 'Pendientes y registrar pagos.',
            icon: Icons.payments_rounded,
            routeKey: _RouteKey.collections,
          ),
          _ActionDescriptor(
            title: 'Clientes',
            subtitle: 'Buscar contacto y cartera.',
            icon: Icons.people_alt_rounded,
            routeKey: _RouteKey.clients,
          ),
          _ActionDescriptor(
            title: 'Entregas',
            subtitle: 'Despacho y seguimiento.',
            icon: Icons.route_rounded,
            routeKey: _RouteKey.routeBoard,
          ),
        ];
      case AppRole.inventory:
        return const [
          _ActionDescriptor(
            title: 'Bodega',
            subtitle: 'Recibir, preparar y cargar.',
            icon: Icons.warehouse_rounded,
            routeKey: _RouteKey.warehouse,
          ),
          _ActionDescriptor(
            title: 'Ajustes de Stock',
            subtitle: 'Escanear código y ajustar.',
            icon: Icons.qr_code_scanner_rounded,
            routeKey: _RouteKey.inventoryAdjustments,
          ),
          _ActionDescriptor(
            title: 'Catálogo',
            subtitle: 'Stock, bultos y precios.',
            icon: Icons.inventory_2_rounded,
            routeKey: _RouteKey.catalog,
          ),
          _ActionDescriptor(
            title: 'Entregas',
            subtitle: 'Despachos del día.',
            icon: Icons.local_shipping_rounded,
            routeKey: _RouteKey.routeBoard,
          ),
        ];
      case AppRole.dispatcher:
        return const [
          _ActionDescriptor(
            title: 'Entregas',
            subtitle: 'Asignación y pendientes.',
            icon: Icons.alt_route_rounded,
            routeKey: _RouteKey.routeBoard,
          ),
          _ActionDescriptor(
            title: 'Clientes',
            subtitle: 'Datos de contacto.',
            icon: Icons.people_alt_rounded,
            routeKey: _RouteKey.clients,
          ),
          _ActionDescriptor(
            title: 'Catálogo',
            subtitle: 'Confirmar artículos.',
            icon: Icons.inventory_2_rounded,
            routeKey: _RouteKey.catalog,
          ),
        ];
      case AppRole.rutero:
        return const [
          _ActionDescriptor(
            title: 'Ruta de hoy',
            subtitle: 'Entregas y cobro actual.',
            icon: Icons.map_rounded,
            routeKey: _RouteKey.routeBoard,
          ),
          _ActionDescriptor(
            title: 'Cobros',
            subtitle: 'Registrar pagos.',
            icon: Icons.payments_rounded,
            routeKey: _RouteKey.collections,
          ),
          _ActionDescriptor(
            title: 'Devoluciones',
            subtitle: 'Marcar devolución por ticket.',
            icon: Icons.assignment_return_rounded,
            routeKey: _RouteKey.returns,
          ),
          _ActionDescriptor(
            title: 'Clientes',
            subtitle: 'Contacto y dirección.',
            icon: Icons.people_alt_rounded,
            routeKey: _RouteKey.clients,
          ),
          _ActionDescriptor(
            title: 'Stock Actual',
            subtitle: 'Carga en mi poder.',
            icon: Icons.inventory_rounded,
            routeKey: _RouteKey.vendorInventory,
          ),
          _ActionDescriptor(
            title: 'Cierre de Caja',
            subtitle: 'Consolidar y liquidar el día.',
            icon: Icons.wallet_rounded,
            routeKey: _RouteKey.dailyClosing,
          ),
        ];
      case AppRole.vendor:
      case AppRole.salesManager:
        return const [
          _ActionDescriptor(
            title: 'Preventa',
            subtitle: 'Capturar pedido de cliente.',
            icon: Icons.flash_on_rounded,
            routeKey: _RouteKey.quickOrder,
          ),
          _ActionDescriptor(
            title: 'Cobros',
            subtitle: 'Registrar pagos de clientes.',
            icon: Icons.payments_rounded,
            routeKey: _RouteKey.collections,
          ),
          _ActionDescriptor(
            title: 'Devoluciones',
            subtitle: 'Registrar devolución.',
            icon: Icons.assignment_return_rounded,
            routeKey: _RouteKey.returns,
          ),
          _ActionDescriptor(
            title: 'Clientes',
            subtitle: 'Buscar contacto.',
            icon: Icons.people_alt_rounded,
            routeKey: _RouteKey.clients,
          ),
          _ActionDescriptor(
            title: 'Catálogo',
            subtitle: 'Precios, stock y bultos.',
            icon: Icons.inventory_2_rounded,
            routeKey: _RouteKey.catalog,
          ),
          _ActionDescriptor(
            title: 'Stock Actual',
            subtitle: 'Carga asignada.',
            icon: Icons.inventory_rounded,
            routeKey: _RouteKey.vendorInventory,
          ),
          _ActionDescriptor(
            title: 'Ventas del Día',
            subtitle: 'Tickets emitidos hoy.',
            icon: Icons.receipt_long_rounded,
            routeKey: _RouteKey.salesHistory,
          ),
          _ActionDescriptor(
            title: 'Cierre de Caja',
            subtitle: 'Cuadrar el día.',
            icon: Icons.wallet_rounded,
            routeKey: _RouteKey.dailyClosing,
          ),
        ];
      case AppRole.cashier:
        return const [
          _ActionDescriptor(
            title: 'Devoluciones',
            subtitle: 'Buscar ticket y devolver.',
            icon: Icons.assignment_return_rounded,
            routeKey: _RouteKey.returns,
          ),
          _ActionDescriptor(
            title: 'Catálogo',
            subtitle: 'Confirmar producto y precio.',
            icon: Icons.inventory_2_rounded,
            routeKey: _RouteKey.catalog,
          ),
          _ActionDescriptor(
            title: 'Clientes',
            subtitle: 'Datos del cliente.',
            icon: Icons.people_alt_rounded,
            routeKey: _RouteKey.clients,
          ),
        ];
      case AppRole.auxiliar:
        return const [
          _ActionDescriptor(
            title: 'Ajustes de Stock',
            subtitle: 'Escanear y ajustar.',
            icon: Icons.qr_code_scanner_rounded,
            routeKey: _RouteKey.inventoryAdjustments,
          ),
          _ActionDescriptor(
            title: 'Bodega',
            subtitle: 'Apoyo en despacho.',
            icon: Icons.warehouse_rounded,
            routeKey: _RouteKey.warehouse,
          ),
          _ActionDescriptor(
            title: 'Catálogo',
            subtitle: 'Verificar precios.',
            icon: Icons.inventory_2_rounded,
            routeKey: _RouteKey.catalog,
          ),
        ];
      case AppRole.supervisorCaja:
        return const [
          _ActionDescriptor(
            title: 'Cobros',
            subtitle: 'Validar pagos y cartera.',
            icon: Icons.payments_rounded,
            routeKey: _RouteKey.collections,
          ),
          _ActionDescriptor(
            title: 'Cierre de Caja',
            subtitle: 'Auditar cierres.',
            icon: Icons.wallet_rounded,
            routeKey: _RouteKey.dailyClosing,
          ),
          _ActionDescriptor(
            title: 'Catálogo',
            subtitle: 'Precios y productos.',
            icon: Icons.inventory_2_rounded,
            routeKey: _RouteKey.catalog,
          ),
        ];
      case AppRole.supervisorPasillo:
        return const [
          _ActionDescriptor(
            title: 'Catálogo',
            subtitle: 'Consultar precios en piso.',
            icon: Icons.inventory_2_rounded,
            routeKey: _RouteKey.catalog,
          ),
          _ActionDescriptor(
            title: 'Clientes',
            subtitle: 'Datos del cliente.',
            icon: Icons.people_alt_rounded,
            routeKey: _RouteKey.clients,
          ),
        ];
      case AppRole.unknown:
        return const [
          _ActionDescriptor(
            title: 'Catálogo',
            subtitle: 'Ver productos y precios.',
            icon: Icons.inventory_2_rounded,
            routeKey: _RouteKey.catalog,
          ),
          _ActionDescriptor(
            title: 'Clientes',
            subtitle: 'Consultar datos.',
            icon: Icons.people_alt_rounded,
            routeKey: _RouteKey.clients,
          ),
          _ActionDescriptor(
            title: 'Entregas',
            subtitle: 'Vista de operación.',
            icon: Icons.lock_open_rounded,
            routeKey: _RouteKey.routeBoard,
          ),
        ];
    }
  }

  void _openAction(
    BuildContext context, {
    required _ActionDescriptor action,
    required String storeId,
    required String? storeName,
  }) {
    final path = switch (action.routeKey) {
      _RouteKey.quickOrder => '/quick-order/$storeId',
      _RouteKey.catalog => '/catalog/$storeId',
      _RouteKey.clients => '/clients/$storeId',
      _RouteKey.routeBoard => '/route-board/$storeId',
      _RouteKey.collections => '/collections/$storeId',
      _RouteKey.returns => '/returns/$storeId',
      _RouteKey.warehouse => '/warehouse/$storeId',
      _RouteKey.dailyClosing => '/daily-closing/$storeId',
      _RouteKey.vendorInventory => '/vendor-inventory/$storeId',
      _RouteKey.salesHistory => '/sales-history/$storeId',
      _RouteKey.inventoryAdjustments => '/inventory-adjustments/$storeId',
      _RouteKey.preventaClients => '/preventa-clients',
      _RouteKey.preventaOrder => '/preventa-order',
      _RouteKey.preventaRoute => '/preventa-route',
    };

    context.push(
      Uri(
        path: path,
        queryParameters: {
          if (storeName != null && storeName.isNotEmpty) 'storeName': storeName,
        },
      ).toString(),
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    this.storeName,
    this.primary = false,
    this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final String? storeName;
  final bool primary;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Ink(
        width: double.infinity,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: primary ? const Color(0xFF0F172A) : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: primary ? const Color(0xFF0F172A) : Colors.grey.shade200,
          ),
          boxShadow: primary
              ? const [
                  BoxShadow(
                    color: Color(0x220F172A),
                    blurRadius: 18,
                    offset: Offset(0, 10),
                  ),
                ]
              : null,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: primary
                    ? Colors.white.withValues(alpha: 0.12)
                    : theme.colorScheme.primary.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Icon(
                icon,
                color: primary ? Colors.white : theme.colorScheme.primary,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: primary ? Colors.white : null,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    subtitle,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: primary
                          ? Colors.white.withValues(alpha: 0.82)
                          : Colors.black54,
                      height: 1.35,
                    ),
                  ),
                  if (storeName != null) ...[
                    const SizedBox(height: 10),
                    Text(
                      'Tienda activa: $storeName',
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: primary
                            ? const Color(0xFFFACC15)
                            : theme.colorScheme.secondary,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_rounded,
              color: primary ? Colors.white : const Color(0xFF475569),
            ),
          ],
        ),
      ),
    );
  }
}

class _BackendRuntimeCard extends StatelessWidget {
  const _BackendRuntimeCard({
    required this.networkStatus,
    required this.syncQueueState,
    required this.realtimeState,
    required this.pendingSyncCount,
    required this.failedSyncCount,
    required this.recentSyncEntries,
    required this.latestCachedEvent,
    required this.onRetrySync,
    required this.onRetryFailed,
    required this.onDiscardEntry,
  });

  final NetworkStatus? networkStatus;
  final SyncQueueState syncQueueState;
  final RealtimeState realtimeState;
  final int pendingSyncCount;
  final int failedSyncCount;
  final List<SyncQueueEntry> recentSyncEntries;
  final RealtimeEvent? latestCachedEvent;
  final Future<void> Function() onRetrySync;
  final Future<void> Function() onRetryFailed;
  final Future<void> Function(int) onDiscardEntry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Estado de trabajo',
            style: theme.textTheme.titleMedium?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Si algo no se puede enviar por falta de señal, la app lo guarda y luego lo reintenta.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: Colors.white.withValues(alpha: 0.82),
              height: 1.35,
            ),
          ),
          const SizedBox(height: 12),
          _RuntimeLine(
            label: 'Señal',
            value: networkStatus == null
                ? 'Verificando...'
                : networkStatus == NetworkStatus.online
                    ? 'Disponible'
                    : 'Sin conexión',
          ),
          const SizedBox(height: 8),
          _RuntimeLine(
            label: 'Envío',
            value: _syncStatusLabel(syncQueueState.status, pendingSyncCount),
          ),
          const SizedBox(height: 8),
          _RuntimeLine(
            label: 'Pendientes',
            value: pendingSyncCount == 1
                ? '1 operación'
                : '$pendingSyncCount operaciones',
          ),
          const SizedBox(height: 8),
          _RuntimeLine(
            label: 'Requieren atención',
            value: failedSyncCount == 1
                ? '1 operación'
                : '$failedSyncCount operaciones',
          ),
          if (syncQueueState.status == SyncQueueStatus.error &&
              failedSyncCount == 0) ...[
            const SizedBox(height: 8),
            const _RuntimeLine(
              label: 'Aviso',
              value: 'Revisa tu señal y vuelve a intentar.',
            ),
          ],
          if (recentSyncEntries.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              'Últimos movimientos guardados',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            ...recentSyncEntries.take(4).map(
              (entry) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _SyncEntryTile(
                    entry: entry,
                    onDiscard: () => onDiscardEntry(entry.id),
                ),
              ),
            ),
          ],
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              FilledButton.tonal(
                onPressed: pendingSyncCount > 0 ? onRetrySync : null,
                child: const Text('Enviar pendientes'),
              ),
              FilledButton.tonal(
                onPressed: failedSyncCount > 0 ? onRetryFailed : null,
                child: const Text('Reintentar'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _syncStatusLabel(SyncQueueStatus status, int pendingCount) {
    switch (status) {
      case SyncQueueStatus.idle:
        return pendingCount > 0 ? 'Listo para enviar' : 'Todo al día';
      case SyncQueueStatus.syncing:
        return 'Enviando información';
      case SyncQueueStatus.offline:
        return 'Guardando temporalmente';
      case SyncQueueStatus.error:
        return 'Necesita revisión';
    }
  }
}

class _SyncEntryTile extends StatelessWidget {
  const _SyncEntryTile({required this.entry, this.onDiscard});

  final SyncQueueEntry entry;
  final VoidCallback? onDiscard;

  @override
  Widget build(BuildContext context) {
    final statusColor = switch (entry.status) {
      'completed' => const Color(0xFF22C55E),
      'failed' => const Color(0xFFEF4444),
      _ => const Color(0xFFF59E0B),
    };

    final title = entry.operationType?.trim().isNotEmpty == true
        ? entry.operationType!
        : 'Operación pendiente';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: statusColor,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            _entryStatusText(entry.status),
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.72),
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Intentos: ${entry.attemptCount}',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.72),
              fontSize: 12,
            ),
          ),
          if (entry.status == 'failed' && onDiscard != null) ...[
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: onDiscard,
                style: TextButton.styleFrom(
                   minimumSize: Size.zero,
                   padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                ),
                child: const Text('Descartar', style: TextStyle(color: Colors.redAccent, fontSize: 13)),
              )
            )
          ]
        ],
      ),
    );
  }

  String _entryStatusText(String status) {
    switch (status) {
      case 'completed':
        return 'Enviado correctamente';
      case 'failed':
        return 'Requiere reintento';
      default:
        return 'Pendiente de envío';
    }
  }
}

class _RuntimeLine extends StatelessWidget {
  const _RuntimeLine({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 84,
          child: Text(
            label,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: Colors.white.withValues(alpha: 0.76),
            ),
          ),
        ),
      ],
    );
  }
}

class _LoadingCard extends StatelessWidget {
  const _LoadingCard({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          const SizedBox(
            width: 22,
            height: 22,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
          const SizedBox(width: 14),
          Expanded(child: Text(title)),
        ],
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.title, required this.message});

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF1F2),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFFDA4AF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w800,
              color: const Color(0xFF9F1239),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            message,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: const Color(0xFF9F1239),
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionDescriptor {
  const _ActionDescriptor({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.routeKey,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final _RouteKey routeKey;
}

enum _RouteKey {
  quickOrder,
  catalog,
  clients,
  routeBoard,
  collections,
  returns,
  warehouse,
  dailyClosing,
  vendorInventory,
  salesHistory,
  inventoryAdjustments,
  preventaClients,
  preventaOrder,
  preventaRoute,
}
