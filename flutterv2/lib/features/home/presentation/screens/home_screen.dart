import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/role_utils.dart';
import '../../../auth/presentation/auth_controller.dart';
import '../../../catalog/presentation/screens/product_catalog_screen.dart';
import '../../../clients/presentation/screens/client_portfolio_screen.dart';
import '../../../collections/presentation/screens/collections_screen.dart';
import '../../../daily_closing/presentation/screens/daily_closing_screen.dart';
import '../../../expenses/presentation/screens/expenses_screen.dart';
import '../../../deliveries/presentation/screens/route_board_screen.dart';
import '../../../orders/presentation/screens/express_visit_screen.dart';
import '../../../orders/presentation/screens/quick_order_screen.dart';
import '../../../preventa/presentation/screens/preventa_home_screen.dart';
import '../../../promotions/presentation/screens/promotions_screen.dart';
import '../../../returns/presentation/screens/returns_screen.dart';
import '../../../sales_history/presentation/screens/sales_history_screen.dart';
import '../../../vendor_inventory/presentation/screens/vendor_inventory_screen.dart';
import '../../../warehouse/presentation/screens/inventory_adjustments_screen.dart';
import '../../../warehouse/presentation/screens/warehouse_board_screen.dart';
import '../../../workday/presentation/screens/workday_screen.dart';
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
  int _currentBottomIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadStores();
  }

  Future<void> _loadStores() async {
    final auth = context.read<AuthController>();
    final carnet = auth.userCarnet;
    if (carnet == null) return;

    final stores = await _repository.getAssignedStores(userId: carnet);
    setState(() {
      _stores = stores;
      _selectedStore = stores.isNotEmpty ? stores.first : null;
    });
  }

  void _onBottomNavTapped(int index, String storeId, String? storeName) {
    if (index == 0) {
      setState(() => _currentBottomIndex = 0);
      return;
    }
    if (index == 1) {
      Navigator.push(context, MaterialPageRoute(builder: (_) => QuickOrderScreen(storeId: storeId, storeName: storeName)));
      return;
    }
    if (index == 2) {
      Navigator.push(context, MaterialPageRoute(builder: (_) => RouteBoardScreen(storeId: storeId, storeName: storeName)));
      return;
    }
    if (index == 3) {
      Navigator.push(context, MaterialPageRoute(builder: (_) => CollectionsScreen(storeId: storeId, storeName: storeName)));
      return;
    }
    if (index == 4) {
      Navigator.push(context, MaterialPageRoute(builder: (_) => ProductCatalogScreen(storeId: storeId, storeName: storeName)));
      return;
    }
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
    final storeId = _selectedStore?.id ?? 'default_store';

    return Scaffold(
      drawer: _buildDrawer(context, user, role, storeId, storeName),
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
            const SizedBox(height: 16),
            if (role == AppRole.vendor || role == AppRole.salesManager || role == AppRole.rutero) ...[
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => ExpressVisitScreen(
                          storeId: storeId,
                          storeName: storeName,
                        ),
                      ),
                    );
                  },
                  icon: const Icon(Icons.flash_on_rounded, size: 24, color: Colors.white),
                  label: const Text(
                    '⚡ VISITA Y VENTA EXPRESS EN CALLE (GPS)',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, letterSpacing: 0.2),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 3,
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
            _buildActions(context, role, _selectedStore),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentBottomIndex,
        onTap: (idx) => _onBottomNavTapped(idx, storeId, storeName),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppTheme.primary,
        unselectedItemColor: AppTheme.slate500,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
        unselectedLabelStyle: const TextStyle(fontSize: 11),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_rounded),
            label: 'Inicio',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.add_shopping_cart_rounded),
            label: 'Pedidos',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.local_shipping_rounded),
            label: 'Entregas',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.payments_rounded),
            label: 'Cobros',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.grid_view_rounded),
            label: 'Catálogo',
          ),
        ],
      ),
    );
  }

  Widget _buildDrawer(BuildContext context, dynamic user, AppRole role, String storeId, String? storeName) {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          UserAccountsDrawerHeader(
            accountName: Text(user.nombre, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            accountEmail: Text('${user.carnet}  ·  ${roleLabel(role)}', style: const TextStyle(fontSize: 12)),
            currentAccountPicture: CircleAvatar(
              backgroundColor: Colors.white,
              child: Text(
                user.nombre.isNotEmpty ? user.nombre[0].toUpperCase() : 'P',
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.primary),
              ),
            ),
            decoration: const BoxDecoration(
              gradient: AppTheme.heroGradient,
            ),
          ),
          if (storeName != null)
            ListTile(
              leading: const Icon(Icons.store_rounded, color: AppTheme.primary),
              title: Text(storeName, style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: const Text('Tienda Activa'),
            ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.flash_on_rounded, color: AppTheme.primary),
            title: const Text('Capturar Pedido'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => QuickOrderScreen(storeId: storeId, storeName: storeName)));
            },
          ),
          ListTile(
            leading: const Icon(Icons.local_shipping_rounded, color: AppTheme.primary),
            title: const Text('Entregas y Rutas'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => RouteBoardScreen(storeId: storeId, storeName: storeName)));
            },
          ),
          ListTile(
            leading: const Icon(Icons.payments_rounded, color: AppTheme.primary),
            title: const Text('Cobros y Cartera'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => CollectionsScreen(storeId: storeId, storeName: storeName)));
            },
          ),
          ListTile(
            leading: const Icon(Icons.grid_view_rounded, color: AppTheme.primary),
            title: const Text('Catálogo de Productos'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => ProductCatalogScreen(storeId: storeId, storeName: storeName)));
            },
          ),
          ListTile(
            leading: const Icon(Icons.people_alt_rounded, color: AppTheme.primary),
            title: const Text('Cartera de Clientes'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => ClientPortfolioScreen(storeId: storeId, storeName: storeName)));
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.assignment_return_rounded, color: AppTheme.primary),
            title: const Text('Devoluciones'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => ReturnsScreen(storeId: storeId, storeName: storeName)));
            },
          ),
          ListTile(
            leading: const Icon(Icons.warehouse_rounded, color: AppTheme.primary),
            title: const Text('Tablero de Bodega'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => WarehouseBoardScreen(storeId: storeId, storeName: storeName)));
            },
          ),
          ListTile(
            leading: const Icon(Icons.inventory_2_rounded, color: AppTheme.primary),
            title: const Text('Stock Actual Vendedor'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => VendorInventoryScreen(storeId: storeId, storeName: storeName)));
            },
          ),
          ListTile(
            leading: const Icon(Icons.lock_clock_rounded, color: AppTheme.primary),
            title: const Text('Cierre Diario de Caja'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => DailyClosingScreen(storeId: storeId, storeName: storeName)));
            },
          ),
          ListTile(
            leading: const Icon(Icons.receipt_long_rounded, color: AppTheme.primary),
            title: const Text('Historial de Ventas'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => SalesHistoryScreen(storeId: storeId, storeName: storeName)));
            },
          ),
          ListTile(
            leading: const Icon(Icons.account_balance_wallet_rounded, color: AppTheme.primary),
            title: const Text('Gastos Operativos'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => ExpensesScreen(storeId: storeId, storeName: storeName)));
            },
          ),
          ListTile(
            leading: const Icon(Icons.tune_rounded, color: AppTheme.primary),
            title: const Text('Ajustes de Inventario'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => InventoryAdjustmentsScreen(storeId: storeId, storeName: storeName)));
            },
          ),
          ListTile(
            leading: const Icon(Icons.percent_rounded, color: AppTheme.primary),
            title: const Text('Promociones Vigentes'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => PromotionsScreen(storeId: storeId, storeName: storeName)));
            },
          ),
          ListTile(
            leading: const Icon(Icons.timer_rounded, color: AppTheme.primary),
            title: const Text('Jornada Laboral'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => WorkdayScreen(storeId: storeId, storeName: storeName)));
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout_rounded, color: AppTheme.error),
            title: const Text('Cerrar Sesión', style: TextStyle(color: AppTheme.error, fontWeight: FontWeight.bold)),
            onTap: () {
              Navigator.pop(context);
              context.read<AuthController>().logout();
            },
          ),
        ],
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

    if (action.routeKey == RouteKey.warehouse) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => WarehouseBoardScreen(
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

    if (action.routeKey == RouteKey.catalog) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ProductCatalogScreen(
            storeId: storeId,
            storeName: storeName,
          ),
        ),
      );
      return;
    }

    if (action.routeKey == RouteKey.clients) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ClientPortfolioScreen(
            storeId: storeId,
            storeName: storeName,
          ),
        ),
      );
      return;
    }

    if (action.routeKey == RouteKey.returns) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ReturnsScreen(
            storeId: storeId,
            storeName: storeName,
          ),
        ),
      );
      return;
    }

    if (action.routeKey == RouteKey.vendorInventory) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => VendorInventoryScreen(
            storeId: storeId,
            storeName: storeName,
          ),
        ),
      );
      return;
    }

    if (action.routeKey == RouteKey.dailyClosing) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => DailyClosingScreen(
            storeId: storeId,
            storeName: storeName,
          ),
        ),
      );
      return;
    }

    if (action.routeKey == RouteKey.salesHistory) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => SalesHistoryScreen(
            storeId: storeId,
            storeName: storeName,
          ),
        ),
      );
      return;
    }

    if (action.routeKey == RouteKey.expenses) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ExpensesScreen(
            storeId: storeId,
            storeName: storeName,
          ),
        ),
      );
      return;
    }

    if (action.routeKey == RouteKey.inventoryAdjustments) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => InventoryAdjustmentsScreen(
            storeId: storeId,
            storeName: storeName,
          ),
        ),
      );
      return;
    }

    if (action.routeKey == RouteKey.preventaClients ||
        action.routeKey == RouteKey.preventaOrder ||
        action.routeKey == RouteKey.preventaRoute) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => PreventaHomeScreen(
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
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppTheme.heroGradient,
        borderRadius: BorderRadius.circular(20),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  roleLabelStr,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const Icon(
                Icons.account_balance_wallet_rounded,
                color: Colors.white70,
                size: 20,
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            '¡Hola, $name!',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(Icons.storefront_rounded, color: Colors.white70, size: 15),
              const SizedBox(width: 6),
              Text(
                storeName,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
