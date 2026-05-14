import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/warehouse/domain/models/warehouse_models.dart';
import '../../features/deliveries/domain/models/delivery_summary.dart';
import '../../features/workday/presentation/screens/workday_home_screen.dart';
import '../../features/workday/presentation/screens/route_workday_screen.dart';
import '../../features/workday/presentation/screens/client_work_screen.dart';
import '../../features/workday/presentation/screens/mobile_order_screen.dart';
import '../../features/workday/presentation/screens/sync_status_screen.dart';

import '../../features/catalog/presentation/screens/product_catalog_screen.dart';
import '../../features/clients/presentation/screens/client_portfolio_screen.dart';
import '../../features/collections/presentation/screens/collections_screen.dart';
import '../../features/auth/presentation/controllers/auth_controller.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/deliveries/presentation/screens/route_board_screen.dart';
import '../../features/deliveries/presentation/screens/delivery_detail_screen.dart';
import '../../features/home/presentation/screens/home_screen.dart';
import '../../features/orders/presentation/screens/quick_order_screen.dart';
import '../../features/returns/presentation/screens/returns_screen.dart';
import '../../features/returns/presentation/screens/route_returns_screen.dart';
import '../../features/startup/presentation/screens/splash_screen.dart';
import '../../features/warehouse/presentation/screens/warehouse_board_screen.dart';
import '../../features/warehouse/presentation/screens/picking_checklist_screen.dart';
import '../../features/warehouse/presentation/screens/carga_camion_screen.dart';
import '../../features/warehouse/presentation/screens/inventory_adjustment_screen.dart';
import '../../features/daily_closing/presentation/screens/daily_closing_screen.dart';
import '../../features/vendor_inventory/presentation/screens/vendor_inventory_screen.dart';
import '../../features/sales_history/presentation/screens/sales_history_screen.dart';
import '../../features/preventa/presentation/screens/preventa_route_screen.dart';
import '../../features/preventa/presentation/screens/preventa_order_screen.dart';
import '../../features/preventa/presentation/screens/preventa_clients_screen.dart';
import '../../features/preventa/presentation/screens/preventa_add_client_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authControllerProvider);

  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(path: '/', builder: (context, state) => const SplashScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
      GoRoute(path: '/workday', builder: (context, state) => const WorkdayHomeScreen()),
      GoRoute(path: '/workday/route', builder: (context, state) => const RouteWorkdayScreen()),
      GoRoute(
        path: '/workday/client/:clientId',
        builder: (context, state) {
          final clientId = state.pathParameters['clientId'] ?? '';
          return ClientWorkScreen(clientId: clientId);
        },
      ),
      GoRoute(
        path: '/workday/order',
        builder: (context, state) {
          final clientId = state.uri.queryParameters['clientId'];
          final clientName = state.uri.queryParameters['clientName'];
          return MobileOrderScreen(clientId: clientId, clientName: clientName);
        },
      ),
      GoRoute(path: '/sync', builder: (context, state) => const SyncStatusScreen()),
      GoRoute(
        path: '/workday/collections',
        builder: (context, state) {
          final storeId = state.uri.queryParameters['storeId'] ?? '';
          return CollectionsScreen(
            storeId: storeId,
            storeName: state.uri.queryParameters['storeName'],
          );
        },
      ),
      GoRoute(
        path: '/workday/returns',
        builder: (context, state) => const RouteReturnsScreen(),
      ),
      GoRoute(
        path: '/workday/closing',
        builder: (context, state) {
          final storeId = state.uri.queryParameters['storeId'] ?? '';
          return DailyClosingScreen(
            storeId: storeId,
            storeName: state.uri.queryParameters['storeName'],
          );
        },
      ),
      GoRoute(path: '/preventa-route', builder: (context, state) => const PreventaRouteScreen()),
      GoRoute(path: '/preventa-clients', builder: (context, state) => const PreventaClientsScreen()),
      GoRoute(path: '/preventa-add-client', builder: (context, state) => const PreventaAddClientScreen()),
      GoRoute(
        path: '/preventa-order',
        builder: (context, state) {
          final clientId = state.uri.queryParameters['clientId'] ?? 'unknown';
          final clientName = state.uri.queryParameters['clientName'] ?? 'Cliente';
          return PreventaOrderScreen(clientId: clientId, clientName: clientName);
        },
      ),
      GoRoute(
        path: '/catalog/:storeId',
        builder: (context, state) => ProductCatalogScreen(
          storeId: state.pathParameters['storeId'] ?? '',
          storeName: state.uri.queryParameters['storeName'],
        ),
      ),
      GoRoute(
        path: '/clients/:storeId',
        builder: (context, state) => ClientPortfolioScreen(
          storeId: state.pathParameters['storeId'] ?? '',
          storeName: state.uri.queryParameters['storeName'],
        ),
      ),
      GoRoute(
        path: '/route-board/:storeId',
        builder: (context, state) => RouteBoardScreen(
          storeId: state.pathParameters['storeId'] ?? '',
          storeName: state.uri.queryParameters['storeName'],
        ),
      ),
      GoRoute(
        path: '/quick-order/:storeId',
        builder: (context, state) => QuickOrderScreen(
          storeId: state.pathParameters['storeId'] ?? '',
          storeName: state.uri.queryParameters['storeName'],
        ),
      ),
      GoRoute(
        path: '/collections/:storeId',
        builder: (context, state) => CollectionsScreen(
          storeId: state.pathParameters['storeId'] ?? '',
          storeName: state.uri.queryParameters['storeName'],
        ),
      ),
      GoRoute(
        path: '/returns/:storeId',
        builder: (context, state) => ReturnsScreen(
          storeId: state.pathParameters['storeId'] ?? '',
          storeName: state.uri.queryParameters['storeName'],
        ),
      ),
      GoRoute(
        path: '/warehouse/:storeId',
        builder: (context, state) => WarehouseBoardScreen(
          storeId: state.pathParameters['storeId'] ?? '',
          storeName: state.uri.queryParameters['storeName'],
        ),
      ),
      GoRoute(
        path: '/daily-closing/:storeId',
        builder: (context, state) => DailyClosingScreen(
          storeId: state.pathParameters['storeId'] ?? '',
          storeName: state.uri.queryParameters['storeName'],
        ),
      ),
      GoRoute(
        path: '/vendor-inventory/:storeId',
        builder: (context, state) => VendorInventoryScreen(
          storeId: state.pathParameters['storeId'] ?? '',
          storeName: state.uri.queryParameters['storeName'],
        ),
      ),
      GoRoute(
        path: '/sales-history/:storeId',
        builder: (context, state) => SalesHistoryScreen(
          storeId: state.pathParameters['storeId'] ?? '',
          storeName: state.uri.queryParameters['storeName'],
        ),
      ),
      GoRoute(
        path: '/inventory-adjustments/:storeId',
        builder: (context, state) => InventoryAdjustmentScreen(
          storeId: state.pathParameters['storeId'] ?? '',
          storeName: state.uri.queryParameters['storeName'],
        ),
      ),
      GoRoute(
        path: '/picking-checklist',
        builder: (context, state) {
          final order = state.extra as WarehouseOrder;
          return PickingChecklistScreen(order: order);
        },
      ),
      GoRoute(
        path: '/carga-camion/:storeId',
        builder: (context, state) => CargaCamionScreen(
          storeId: state.pathParameters['storeId'] ?? '',
        ),
      ),
      GoRoute(
        path: '/delivery-detail',
        builder: (context, state) {
          final delivery = state.extra as DeliverySummary;
          return DeliveryDetailScreen(delivery: delivery);
        },
      ),
      GoRoute(
        path: '/route-returns',
        builder: (context, state) => const RouteReturnsScreen(),
      ),
    ],
    redirect: (context, state) {
      final location = state.uri.path;
      final stage = authState.stage;

      if (stage == AuthStage.initial || stage == AuthStage.loading) {
        return location == '/' ? null : '/';
      }

      if (stage == AuthStage.unauthenticated) {
        return location == '/login' ? null : '/login';
      }

      if (stage == AuthStage.authenticated) {
        if (location == '/' || location == '/login') {
          return '/home';
        }
      }

      return null;
    },
  );
});
