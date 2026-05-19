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

import 'package:flutter/material.dart';

GoRoute _fadeRoute({
  required String path,
  required Widget Function(BuildContext, GoRouterState) builder,
  List<GoRoute> routes = const [],
}) {
  return GoRoute(
    path: path,
    pageBuilder: (context, state) => CustomTransitionPage<void>(
      key: state.pageKey,
      child: builder(context, state),
      transitionsBuilder: (_, animation, __, child) =>
          FadeTransition(opacity: animation, child: child),
      transitionDuration: const Duration(milliseconds: 250),
    ),
    routes: routes,
  );
}

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authControllerProvider);

  return GoRouter(
    initialLocation: '/',
    routes: [
      _fadeRoute(path: '/', builder: (context, state) => const SplashScreen()),
      _fadeRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      _fadeRoute(path: '/home', builder: (context, state) => const HomeScreen()),
      _fadeRoute(path: '/workday', builder: (context, state) => const WorkdayHomeScreen()),
      _fadeRoute(path: '/workday/route', builder: (context, state) => const RouteWorkdayScreen()),
      _fadeRoute(
        path: '/workday/client/:clientId',
        builder: (context, state) {
          final clientId = state.pathParameters['clientId'] ?? '';
          return ClientWorkScreen(clientId: clientId);
        },
      ),
      _fadeRoute(
        path: '/workday/order',
        builder: (context, state) {
          final clientId = state.uri.queryParameters['clientId'];
          final clientName = state.uri.queryParameters['clientName'];
          return MobileOrderScreen(clientId: clientId, clientName: clientName);
        },
      ),
      _fadeRoute(path: '/sync', builder: (context, state) => const SyncStatusScreen()),
      _fadeRoute(
        path: '/workday/collections',
        builder: (context, state) {
          final storeId = state.uri.queryParameters['storeId'] ?? '';
          return CollectionsScreen(
            storeId: storeId,
            storeName: state.uri.queryParameters['storeName'],
          );
        },
      ),
      _fadeRoute(
        path: '/workday/returns',
        builder: (context, state) => const RouteReturnsScreen(),
      ),
      _fadeRoute(
        path: '/workday/closing',
        builder: (context, state) {
          final storeId = state.uri.queryParameters['storeId'] ?? '';
          return DailyClosingScreen(
            storeId: storeId,
            storeName: state.uri.queryParameters['storeName'],
          );
        },
      ),
      _fadeRoute(path: '/preventa-route', builder: (context, state) => const PreventaRouteScreen()),
      _fadeRoute(path: '/preventa-clients', builder: (context, state) => const PreventaClientsScreen()),
      _fadeRoute(path: '/preventa-add-client', builder: (context, state) => const PreventaAddClientScreen()),
      _fadeRoute(
        path: '/preventa-order',
        builder: (context, state) {
          final clientId = state.uri.queryParameters['clientId'] ?? 'unknown';
          final clientName = state.uri.queryParameters['clientName'] ?? 'Cliente';
          return PreventaOrderScreen(clientId: clientId, clientName: clientName);
        },
      ),
      _fadeRoute(
        path: '/catalog/:storeId',
        builder: (context, state) => ProductCatalogScreen(
          storeId: state.pathParameters['storeId'] ?? '',
          storeName: state.uri.queryParameters['storeName'],
        ),
      ),
      _fadeRoute(
        path: '/clients/:storeId',
        builder: (context, state) => ClientPortfolioScreen(
          storeId: state.pathParameters['storeId'] ?? '',
          storeName: state.uri.queryParameters['storeName'],
        ),
      ),
      _fadeRoute(
        path: '/route-board/:storeId',
        builder: (context, state) => RouteBoardScreen(
          storeId: state.pathParameters['storeId'] ?? '',
          storeName: state.uri.queryParameters['storeName'],
        ),
      ),
      _fadeRoute(
        path: '/quick-order/:storeId',
        builder: (context, state) => QuickOrderScreen(
          storeId: state.pathParameters['storeId'] ?? '',
          storeName: state.uri.queryParameters['storeName'],
        ),
      ),
      _fadeRoute(
        path: '/collections/:storeId',
        builder: (context, state) => CollectionsScreen(
          storeId: state.pathParameters['storeId'] ?? '',
          storeName: state.uri.queryParameters['storeName'],
        ),
      ),
      _fadeRoute(
        path: '/returns/:storeId',
        builder: (context, state) => ReturnsScreen(
          storeId: state.pathParameters['storeId'] ?? '',
          storeName: state.uri.queryParameters['storeName'],
        ),
      ),
      _fadeRoute(
        path: '/warehouse/:storeId',
        builder: (context, state) => WarehouseBoardScreen(
          storeId: state.pathParameters['storeId'] ?? '',
          storeName: state.uri.queryParameters['storeName'],
        ),
      ),
      _fadeRoute(
        path: '/daily-closing/:storeId',
        builder: (context, state) => DailyClosingScreen(
          storeId: state.pathParameters['storeId'] ?? '',
          storeName: state.uri.queryParameters['storeName'],
        ),
      ),
      _fadeRoute(
        path: '/vendor-inventory/:storeId',
        builder: (context, state) => VendorInventoryScreen(
          storeId: state.pathParameters['storeId'] ?? '',
          storeName: state.uri.queryParameters['storeName'],
        ),
      ),
      _fadeRoute(
        path: '/sales-history/:storeId',
        builder: (context, state) => SalesHistoryScreen(
          storeId: state.pathParameters['storeId'] ?? '',
          storeName: state.uri.queryParameters['storeName'],
        ),
      ),
      _fadeRoute(
        path: '/inventory-adjustments/:storeId',
        builder: (context, state) => InventoryAdjustmentScreen(
          storeId: state.pathParameters['storeId'] ?? '',
          storeName: state.uri.queryParameters['storeName'],
        ),
      ),
      _fadeRoute(
        path: '/picking-checklist',
        builder: (context, state) {
          final order = state.extra as WarehouseOrder;
          return PickingChecklistScreen(order: order);
        },
      ),
      _fadeRoute(
        path: '/carga-camion/:storeId',
        builder: (context, state) => CargaCamionScreen(
          storeId: state.pathParameters['storeId'] ?? '',
        ),
      ),
      _fadeRoute(
        path: '/delivery-detail',
        builder: (context, state) {
          final delivery = state.extra as DeliverySummary;
          return DeliveryDetailScreen(delivery: delivery);
        },
      ),
      _fadeRoute(
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
