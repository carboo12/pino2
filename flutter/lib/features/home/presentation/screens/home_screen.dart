import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../core/config/app_colors.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/connectivity_service.dart';
import '../../../../core/network/sync_queue_processor.dart';
import '../../../../core/realtime/realtime_controller.dart';
import '../../../../core/utils/role_utils.dart';
import '../../../../core/widgets/premium_widgets.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../data/home_repository.dart';
import '../../domain/models/store_summary.dart';
import '../../../../features/preventa/presentation/screens/preventa_home_screen.dart';
import '../../widgets/sync_status_banner.dart';
import '../../data/role_actions.dart';
import '../../widgets/action_cards.dart';
import '../../widgets/debug_panel_sheet.dart';

final assignedStoresProvider = FutureProvider<List<StoreSummary>>((ref) async {
  ref.watch(networkStatusProvider);
  ref.watch(syncQueueProcessorProvider.select((state) => state.lastSyncAt));

  final authState = ref.watch(authControllerProvider);
  final session = authState.session;

  if (session == null) return <StoreSummary>[];

  final repository = ref.read(homeRepositoryProvider);
  return repository.getAssignedStores(
    userId: session.user.id,
    accessToken: session.accessToken,
  );
});

final quickPulseProvider =
    FutureProvider.family<Map<String, dynamic>, String>((ref, storeId) async {
  final authState = ref.watch(authControllerProvider);
  final session = authState.session;
  if (session == null) return {};

  final client = ref.read(appApiClientProvider);
  final token = session.accessToken;
  final userId = session.user.id;
  final today = DateTime.now().toIso8601String().substring(0, 10);

  // Ejecutar solicitudes en paralelo para máxima agilidad
  final results = await Future.wait([
    client
        .getList('/orders?storeId=$storeId&status=RECIBIDO', bearerToken: token)
        .catchError((_) => <dynamic>[]),
    client
        .getList('/sales?storeId=$storeId&startDate=${today}T00:00:00&endDate=${today}T23:59:59', bearerToken: token)
        .catchError((_) => <dynamic>[]),
    client
        .getList('/vendor-inventories/$userId', bearerToken: token)
        .catchError((_) => <dynamic>[]),
  ]);

  final orders = results[0];
  final sales = results[1];
  final inv = results[2];

  int pendingOrders = orders.length;
  int todaySalesCount = sales.length;
  double todaySalesTotal = 0;
  for (final s in sales) {
    todaySalesTotal += (s['total'] as num?)?.toDouble() ?? 0;
  }

  int vendorStockItems = 0;
  for (final v in inv) {
    vendorStockItems += (v['currentQuantity'] as num?)?.toInt() ?? 0;
  }

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
    final storesAsync = ref.watch(assignedStoresProvider);
    final session = authState.session;

    if (session == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final role = normalizeRole(session.user.role);

    if (role == AppRole.salesManager) {
      return const PreventaHomeScreen();
    }

    if (!_realtimeBootstrapped) {
      _realtimeBootstrapped = true;
      Future<void>.microtask(
        () => ref.read(realtimeControllerProvider.notifier)
            .connect(session, storeId: _selectedStoreId ?? session.user.primaryStoreId),
      );
    }

    final currentStoreId = _selectedStoreId ?? session.user.primaryStoreId;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: AppColors.heroGradient,
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(8),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.3),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Icon(Icons.park_rounded, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 10),
            const Text(
              'Pino',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 19),
            ),
          ],
        ),
        actions: [
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
          IconButton(
            tooltip: 'Sistema',
            icon: const Icon(Icons.tune_rounded),
            onPressed: () => showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              builder: (_) => const DebugPanelSheet(),
            ),
          ),
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
            const StaggeredFadeIn(
              index: 0,
              child: SyncStatusBanner(),
            ),
            const SizedBox(height: 12),
            StaggeredFadeIn(
              index: 1,
              child: _HeroCard(
                name: session.user.name,
                roleLabel: roleLabel(role),
                storeName: storesAsync.asData?.value
                    .where((s) => s.id == currentStoreId)
                    .map((s) => s.name).firstOrNull,
              ),
            ),
            const SizedBox(height: 16),
            if (currentStoreId != null)
              StaggeredFadeIn(
                index: 2,
                child: _QuickPulseBar(storeId: currentStoreId),
              ),
            const SizedBox(height: 20),
            StaggeredFadeIn(
              index: 3,
              child: _buildActions(
                context,
                role,
                storesAsync.asData?.value
                    .where((s) => s.id == currentStoreId)
                    .firstOrNull,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActions(BuildContext context, AppRole role, StoreSummary? store) {
    final actions = actionsForRole(role);

    if (actions.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Acciones Rápidas',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w800,
                fontSize: 17,
                color: AppColors.slate900,
              ),
        ),
        const SizedBox(height: 12),
        ...actions.asMap().entries.map((entry) {
          final idx = entry.key;
          final action = entry.value;
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: StaggeredFadeIn(
              index: 4 + idx,
              child: PrimaryActionCard(
                action: action,
                onTap: store == null
                    ? null
                    : () => openAction(
                          context,
                          action: action,
                          storeId: store.id,
                          storeName: store.name,
                        ),
              ),
            ),
          );
        }),
      ],
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.name, required this.roleLabel, this.storeName});
  final String name;
  final String roleLabel;
  final String? storeName;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final today = DateFormat("d 'de' MMMM, yyyy", 'es').format(DateTime.now());
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        gradient: const LinearGradient(
          colors: AppColors.heroGradient,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: AppColors.elevatedShadow,
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.25),
                width: 1,
              ),
            ),
            child: const Icon(Icons.park_rounded, color: Colors.white, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Hola, ${name.split(' ').first}',
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 18,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  [roleLabel, if (storeName != null) storeName].join(' • '),
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Colors.white.withValues(alpha: 0.85),
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  today,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.6),
                    fontSize: 11,
                  ),
                ),
              ],
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

        final int pending = (pulse['pendingOrders'] as num?)?.toInt() ?? 0;
        final int salesCount = (pulse['todaySalesCount'] as num?)?.toInt() ?? 0;
        final int salesTotal = (pulse['todaySalesTotal'] as num?)?.toInt() ?? 0;
        final int stock = (pulse['vendorStock'] as num?)?.toInt() ?? 0;

        return Row(
          children: [
            _PulseChip(
              icon: Icons.inbox_rounded,
              numericValue: pending,
              label: 'Pendientes',
              color: pending > 0 ? AppColors.error : AppColors.slate500,
              highlight: pending > 0,
              hasPulse: pending > 0,
            ),
            const SizedBox(width: 8),
            _PulseChip(
              icon: Icons.receipt_long_rounded,
              numericValue: salesCount,
              label: 'Ventas',
              color: AppColors.primary,
            ),
            const SizedBox(width: 8),
            _PulseChip(
              icon: Icons.attach_money_rounded,
              numericValue: salesTotal,
              prefix: 'C\$',
              label: 'Total',
              color: AppColors.success,
              flex: 2,
            ),
            const SizedBox(width: 8),
            _PulseChip(
              icon: Icons.inventory_2_rounded,
              numericValue: stock,
              label: 'Stock',
              color: AppColors.accent,
            ),
          ],
        );
      },
      loading: () => Row(
        children: List.generate(
          4,
          (_) => Expanded(
            child: Container(
              height: 64,
              margin: const EdgeInsets.only(right: 8),
              decoration: BoxDecoration(
                color: AppColors.slate100,
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
    required this.numericValue,
    required this.label,
    required this.color,
    this.prefix,
    this.highlight = false,
    this.hasPulse = false,
    this.flex = 1,
  });

  final IconData icon;
  final int numericValue;
  final String label;
  final Color color;
  final String? prefix;
  final bool highlight;
  final bool hasPulse;
  final int flex;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      flex: flex,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          color: highlight ? color.withValues(alpha: 0.08) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: highlight ? color.withValues(alpha: 0.3) : AppColors.slate200,
            width: highlight ? 1.5 : 1,
          ),
          boxShadow: AppColors.cardShadow,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (hasPulse) ...[
                  PulsingDot(color: color, size: 8),
                  const SizedBox(width: 5),
                ] else ...[
                  Icon(icon, size: 14, color: color),
                  const SizedBox(width: 4),
                ],
                Flexible(
                  child: AnimatedCounter(
                    value: numericValue,
                    prefix: prefix,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: highlight ? color : AppColors.slate800,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: AppColors.slate500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
