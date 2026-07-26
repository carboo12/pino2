import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../core/config/app_colors.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/connectivity_service.dart';
import '../../../../core/network/sync_queue_processor.dart';
import '../../../../core/realtime/realtime_controller.dart';
import '../../../../core/utils/role_utils.dart';
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
              width: 28, height: 28,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: AppColors.heroGradient),
                borderRadius: BorderRadius.circular(7),
              ),
              child: const Icon(Icons.park_rounded, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 8),
            const Text('Pino', style: TextStyle(fontWeight: FontWeight.w700)),
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
            const SyncStatusBanner(),
            const SizedBox(height: 12),
            _HeroCard(
              name: session.user.name,
              roleLabel: roleLabel(role),
              storeName: storesAsync.asData?.value
                  .where((s) => s.id == currentStoreId)
                  .map((s) => s.name).firstOrNull,
            ),
            const SizedBox(height: 14),
            if (currentStoreId != null)
              _QuickPulseBar(storeId: currentStoreId),
            const SizedBox(height: 18),
            _buildActions(context, role, storesAsync.asData?.value
                .where((s) => s.id == currentStoreId).firstOrNull),
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
        Text('Acciones', style: Theme.of(context).textTheme.titleMedium?.copyWith(
          fontWeight: FontWeight.w800)),
        const SizedBox(height: 12),
        ...actions.map((action) => Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: PrimaryActionCard(
            action: action,
            onTap: store == null ? null : () => openAction(context,
              action: action, storeId: store.id, storeName: store.name),
          ),
        )),
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
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          colors: AppColors.heroGradient,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.25),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 48, height: 48,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.park_rounded, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Hola, ${name.split(' ').first}',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: Colors.white, fontWeight: FontWeight.w800)),
                const SizedBox(height: 2),
                Text([roleLabel, ?storeName].join(' • '),
                  style: theme.textTheme.bodySmall?.copyWith(color: Colors.white70)),
                Text(today,
                  style: theme.textTheme.bodySmall?.copyWith(color: Colors.white60, fontSize: 11)),
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

        final pending = pulse['pendingOrders'] ?? 0;
        final salesCount = pulse['todaySalesCount'] ?? 0;
        final salesTotal = pulse['todaySalesTotal'] ?? 0;
        final stock = pulse['vendorStock'] ?? 0;

        return Row(
          children: [
            _PulseChip(
              icon: Icons.inbox_rounded,
              value: '$pending',
              label: 'Pendientes',
              color: pending > 0 ? AppColors.error : AppColors.textMuted,
              highlight: pending > 0,
            ),
            const SizedBox(width: 8),
            _PulseChip(
              icon: Icons.receipt_long_rounded,
              value: '$salesCount',
              label: 'Ventas',
              color: AppColors.primary,
            ),
            const SizedBox(width: 8),
            _PulseChip(
              icon: Icons.attach_money_rounded,
              value: 'C\$$salesTotal',
              label: 'Total',
              color: AppColors.success,
              flex: 2,
            ),
            const SizedBox(width: 8),
            _PulseChip(
              icon: Icons.inventory_2_rounded,
              value: '$stock',
              label: 'Stock',
              color: AppColors.accent,
            ),
          ],
        );
      },
      loading: () => Row(
        children: List.generate(4, (_) => Expanded(
          child: Container(
            height: 64,
            margin: const EdgeInsets.only(right: 8),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(14),
            ),
          ),
        )),
      ),
      error: (_, _) => const SizedBox.shrink(),
    );
  }
}

class _PulseChip extends StatelessWidget {
  const _PulseChip({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
    this.highlight = false,
    this.flex = 1,
  });

  final IconData icon;
  final String value;
  final String label;
  final Color color;
  final bool highlight;
  final int flex;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      flex: flex,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: highlight ? color.withValues(alpha: 0.1) : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: highlight ? color.withValues(alpha: 0.25) : AppColors.border,
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 14, color: color),
                const SizedBox(width: 4),
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
            const SizedBox(height: 2),
            Text(label,
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w600,
                color: AppColors.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
