import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/role_utils.dart';
import '../../../auth/presentation/auth_controller.dart';
import '../../../catalog/data/catalog_repository.dart';
import '../../../catalog/presentation/screens/product_catalog_screen.dart';
import '../../../clients/data/client_portfolio_repository.dart';
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
import '../../domain/models/store_summary.dart';
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

  int _productCount = 0;
  int _clientCount = 0;
  bool _isLoadingMetrics = false;

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
    if (mounted) {
      setState(() {
        _stores = stores;
        _selectedStore = stores.isNotEmpty ? stores.first : null;
      });
      if (_selectedStore != null) {
        _refreshStoreData(_selectedStore!.id);
      }
    }
  }

  Future<void> _refreshStoreData(String storeId) async {
    if (mounted) setState(() => _isLoadingMetrics = true);
    try {
      final products = await CatalogRepository().getProducts(storeId: storeId);
      final clients = await ClientPortfolioRepository().getClients(storeId: storeId);

      if (mounted) {
        setState(() {
          _productCount = products.length;
          _clientCount = clients.length;
          _isLoadingMetrics = false;
        });
      }
    } catch (e) {
      debugPrint('Error al refrescar métricas de tienda: $e');
      if (mounted) setState(() => _isLoadingMetrics = false);
    }
  }

  void _switchStore(StoreSummary store) {
    if (_selectedStore?.id == store.id) return;
    setState(() => _selectedStore = store);
    _refreshStoreData(store.id);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('🏪 Cambiado a: ${store.name}'),
        backgroundColor: const Color(0xFF4F46E5),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _showStoreSelectorModal() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Seleccionar Tienda / Sucursal',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: AppTheme.slate900,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Elige la tienda con la que deseas operar:',
              style: TextStyle(fontSize: 13, color: AppTheme.slate500),
            ),
            const SizedBox(height: 16),
            ..._stores.map((s) {
              final isSelected = s.id == _selectedStore?.id;
              final isSuper = s.name.toLowerCase().contains('supermercado');

              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                decoration: BoxDecoration(
                  color: isSelected ? AppTheme.primary.withValues(alpha: 0.08) : AppTheme.slate50,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isSelected ? AppTheme.primary : AppTheme.slate200,
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: isSelected ? AppTheme.primary : AppTheme.slate200,
                    child: Icon(
                      isSuper ? Icons.shopping_bag_rounded : Icons.local_shipping_rounded,
                      color: isSelected ? Colors.white : AppTheme.slate600,
                      size: 20,
                    ),
                  ),
                  title: Text(
                    s.name,
                    style: TextStyle(
                      fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                      color: isSelected ? AppTheme.primary : AppTheme.slate900,
                    ),
                  ),
                  subtitle: Text(
                    isSuper ? 'Formato POS / Sala de Ventas' : 'Formato Bultos & Preventa Campo',
                    style: const TextStyle(fontSize: 12),
                  ),
                  trailing: isSelected
                      ? const Icon(Icons.check_circle_rounded, color: AppTheme.primary)
                      : null,
                  onTap: () {
                    Navigator.pop(ctx);
                    _switchStore(s);
                  },
                ),
              );
            }),
          ],
        ),
      ),
    );
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
    final storeName = _selectedStore?.name ?? 'Supermercado Los Pinos';
    final storeId = _selectedStore?.id ?? '9321856d-19ba-42b8-ba47-cf35c0d133dd';

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
          IconButton(
            tooltip: 'Sincronizar Datos',
            icon: const Icon(Icons.sync_rounded),
            onPressed: () {
              _refreshStoreData(storeId);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('🔄 Sincronizando catálogo y clientes...'),
                  backgroundColor: Color(0xFF10B981),
                  duration: Duration(seconds: 2),
                ),
              );
            },
          ),
          IconButton(
            tooltip: 'Cambiar Tienda',
            icon: const Icon(Icons.store_rounded, color: AppTheme.primary),
            onPressed: _showStoreSelectorModal,
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
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          children: [
            SyncStatusBanner(storeId: storeId),
            const SizedBox(height: 12),

            // Selector de Tienda Destacado (Banner Superior)
            GestureDetector(
              onTap: _showStoreSelectorModal,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF4F46E5), Color(0xFF3730A3)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: AppTheme.cardShadow,
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.storefront_rounded, color: Colors.white, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'TIENDA ACTIVA',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.5,
                            ),
                          ),
                          Text(
                            storeName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Cambiar',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                            ),
                          ),
                          SizedBox(width: 4),
                          Icon(Icons.keyboard_arrow_down_rounded, color: Colors.white, size: 16),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Hero Card Saludo y Rol
            _HeroCard(
              name: user.nombre,
              roleLabelStr: roleLabel(role),
              storeName: storeName,
            ),
            const SizedBox(height: 16),

            // Dashboard KPI Metrics Grid
            Row(
              children: [
                Expanded(
                  child: _KpiCard(
                    title: 'Catálogo',
                    value: _isLoadingMetrics ? '...' : '$_productCount',
                    subtitle: 'Productos Disponibles',
                    icon: Icons.inventory_2_rounded,
                    color: const Color(0xFF4F46E5),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ProductCatalogScreen(storeId: storeId, storeName: storeName),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _KpiCard(
                    title: 'Cartera',
                    value: _isLoadingMetrics ? '...' : '$_clientCount',
                    subtitle: 'Clientes Asignados',
                    icon: Icons.people_alt_rounded,
                    color: const Color(0xFF10B981),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ClientPortfolioScreen(storeId: storeId, storeName: storeName),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Botón de Acción Principal por Rol
            if (role == AppRole.vendor || role == AppRole.salesManager) ...[
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
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, letterSpacing: 0.2),
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
            ] else if (role == AppRole.rutero) ...[
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => RouteBoardScreen(
                          storeId: storeId,
                          storeName: storeName,
                        ),
                      ),
                    );
                  },
                  icon: const Icon(Icons.local_shipping_rounded, size: 24, color: Colors.white),
                  label: const Text(
                    '🚚 MI RUTA Y ENTREGAS DEL DÍA',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, letterSpacing: 0.2),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 3,
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ] else if (role == AppRole.inventory || role == AppRole.auxiliar) ...[
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => WarehouseBoardScreen(
                          storeId: storeId,
                          storeName: storeName,
                        ),
                      ),
                    );
                  },
                  icon: const Icon(Icons.warehouse_rounded, size: 24, color: Colors.white),
                  label: const Text(
                    '🏬 TABLERO DE PREPARACIÓN DE BODEGA',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, letterSpacing: 0.2),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 3,
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Grid de Menú Rápido Completo
            const Text(
              'Menú de Operaciones Rápidas',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: AppTheme.slate900,
              ),
            ),
            const SizedBox(height: 12),

            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.3,
              children: [
                _MenuGridTile(
                  title: 'Capturar Pedido',
                  subtitle: 'Preventa rápida',
                  icon: Icons.add_shopping_cart_rounded,
                  color: const Color(0xFF4F46E5),
                  onTap: () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => QuickOrderScreen(storeId: storeId, storeName: storeName)));
                  },
                ),
                _MenuGridTile(
                  title: 'Entregas y Rutas',
                  subtitle: 'Despacho camión',
                  icon: Icons.local_shipping_rounded,
                  color: const Color(0xFF0284C7),
                  onTap: () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => RouteBoardScreen(storeId: storeId, storeName: storeName)));
                  },
                ),
                _MenuGridTile(
                  title: 'Cobros y Cartera',
                  subtitle: 'Recaudación CxC',
                  icon: Icons.payments_rounded,
                  color: const Color(0xFF10B981),
                  onTap: () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => CollectionsScreen(storeId: storeId, storeName: storeName)));
                  },
                ),
                _MenuGridTile(
                  title: 'Historial Ventas',
                  subtitle: 'Consultar facturas',
                  icon: Icons.receipt_long_rounded,
                  color: const Color(0xFFD97706),
                  onTap: () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => SalesHistoryScreen(storeId: storeId, storeName: storeName)));
                  },
                ),
                _MenuGridTile(
                  title: 'Devoluciones',
                  subtitle: 'Rechazo en tránsito',
                  icon: Icons.assignment_return_rounded,
                  color: const Color(0xFFEF4444),
                  onTap: () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => ReturnsScreen(storeId: storeId, storeName: storeName)));
                  },
                ),
                _MenuGridTile(
                  title: 'Cierre Diario',
                  subtitle: 'Rendición de caja',
                  icon: Icons.lock_clock_rounded,
                  color: const Color(0xFF8B5CF6),
                  onTap: () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => DailyClosingScreen(storeId: storeId, storeName: storeName)));
                  },
                ),
              ],
            ),
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
              subtitle: const Text('Tienda Activa (Toca para cambiar)'),
              onTap: () {
                Navigator.pop(context);
                _showStoreSelectorModal();
              },
            ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.flash_on_rounded, color: AppTheme.primary),
            title: const Text('Visita Express GPS'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) => ExpressVisitScreen(storeId: storeId, storeName: storeName)));
            },
          ),
          ListTile(
            leading: const Icon(Icons.add_shopping_cart_rounded, color: AppTheme.primary),
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
            title: const Text('Stock Actual (Camión / Vendedor)'),
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
                Icons.person_rounded,
                color: Colors.white70,
                size: 22,
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
              Expanded(
                child: Text(
                  storeName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _KpiCard extends StatelessWidget {
  const _KpiCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final String title;
  final String value;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppTheme.slate200),
          boxShadow: AppTheme.cardShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: color, size: 20),
                ),
                const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: AppTheme.slate400),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: color,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              title,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: AppTheme.slate900,
              ),
            ),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 11,
                color: AppTheme.slate500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MenuGridTile extends StatelessWidget {
  const _MenuGridTile({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.slate200),
          boxShadow: AppTheme.cardShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: AppTheme.slate900,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 11,
                color: AppTheme.slate500,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
