import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/role_utils.dart';
import '../../../auth/presentation/auth_controller.dart';
import '../../../collections/presentation/screens/collections_screen.dart';
import '../../../deliveries/presentation/screens/route_board_screen.dart';
import '../../../orders/presentation/screens/quick_order_screen.dart';
import '../../data/home_repository.dart';
import '../../data/role_actions.dart';
import '../../domain/models/store_summary.dart';
import '../../widgets/action_cards.dart';
import '../../widgets/sync_status_banner.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final HomeRepository _repository = HomeRepository();
  List<StoreSummary> _stores = [];
  StoreSummary? _selectedStore;
  bool _loadingStores = false;

  @override
  void initState() {
    super.initState();
    _loadStores();
  }

  Future<void> _loadStores() async {
    final auth = context.read<AuthController>();
    final carnet = auth.userCarnet;
    if (carnet == null) return;

    setState(() => _loadingStores = true);
    final stores = await _repository.getAssignedStores(userId: carnet);
    setState(() {
      _stores = stores;
      _selectedStore = stores.isNotEmpty ? stores.first : null;
      _loadingStores = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final user = auth.user;

    if (user == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final role = normalizeRole(user.rol);
    final storeName = _selectedStore?.name ?? 'Tienda Principal';

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                gradient: AppTheme.heroGradient,
                borderRadius: BorderRadius.circular(8),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primary.withValues(alpha: 0.3),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Icon(Icons.park_rounded, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 10),
            const Text(
              'Pino Mobile',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 19),
            ),
          ],
        ),
        actions: [
          if (_stores.length > 1)
            PopupMenuButton<StoreSummary>(
              icon: const Icon(Icons.store_rounded),
              tooltip: 'Cambiar tienda',
              onSelected: (store) {
                setState(() => _selectedStore = store);
              },
              itemBuilder: (_) => _stores
                  .map((s) => PopupMenuItem(
                        value: s,
                        child: Text(s.name),
                      ))
                  .toList(),
            ),
          IconButton(
            tooltip: 'Cerrar sesión',
            icon: const Icon(Icons.logout_rounded),
            onPressed: () => auth.logout(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadStores,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          children: [
            const SyncStatusBanner(),
            const SizedBox(height: 12),
            _HeroCard(
              name: user.nombre,
              roleLabelStr: roleLabel(role),
              storeName: storeName,
            ),
            const SizedBox(height: 20),
            _buildActions(context, role, _selectedStore),
          ],
        ),
      ),
    );
  }

  Widget _buildActions(BuildContext context, AppRole role, StoreSummary? store) {
    final actions = actionsForRole(role);
    if (actions.isEmpty) return const SizedBox.shrink();

    final storeId = store?.id ?? 'default_store';
    final storeName = store?.name;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Acciones Disponibles',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppTheme.slate900,
          ),
        ),
        const SizedBox(height: 12),
        ...actions.map(
          (act) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: PrimaryActionCard(
              action: act,
              onTap: () => _openActionScreen(context, act, storeId, storeName),
            ),
          ),
        ),
      ],
    );
  }

  void _openActionScreen(
    BuildContext context,
    RoleAction action,
    String storeId,
    String? storeName,
  ) {
    if (action.routeKey == RouteKey.quickOrder) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => QuickOrderScreen(
            storeId: storeId,
            storeName: storeName,
          ),
        ),
      );
      return;
    }

    if (action.routeKey == RouteKey.routeBoard) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => RouteBoardScreen(
            storeId: storeId,
            storeName: storeName,
          ),
        ),
      );
      return;
    }

    if (action.routeKey == RouteKey.collections) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => CollectionsScreen(
            storeId: storeId,
            storeName: storeName,
          ),
        ),
      );
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Abriendo ${action.title}...'),
        duration: const Duration(seconds: 1),
      ),
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({
    required this.name,
    required this.roleLabelStr,
    required this.storeName,
  });

  final String name;
  final String roleLabelStr;
  final String storeName;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: AppTheme.heroGradient,
        borderRadius: BorderRadius.circular(20),
        boxShadow: AppTheme.elevatedShadow,
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.person_rounded,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      roleLabelStr,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.8),
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.store_rounded, color: Colors.white, size: 16),
                const SizedBox(width: 6),
                Text(
                  storeName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
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
