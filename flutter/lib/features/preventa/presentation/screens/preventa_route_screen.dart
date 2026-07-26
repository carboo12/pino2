import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/database/local_cache_repository.dart';
import '../../../../core/widgets/field/route_stop_card.dart';
import '../../../../core/widgets/field/empty_route_state.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../../clients/domain/models/client_summary.dart';

class PreventaRouteScreen extends ConsumerStatefulWidget {
  const PreventaRouteScreen({super.key});

  @override
  ConsumerState<PreventaRouteScreen> createState() => _PreventaRouteScreenState();
}

class _PreventaRouteScreenState extends ConsumerState<PreventaRouteScreen> {
  List<ClientSummary> _clientsRoute = [];
  Set<String> _visitedClientIds = {};
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadRoute();
  }

  Future<void> _loadRoute() async {
    final authState = ref.read(authControllerProvider);
    final storeId = authState.session?.user.primaryStoreId;
    final userId = authState.session?.user.id;
    if (storeId == null || storeId.isEmpty || userId == null) {
      setState(() => _loading = false);
      return;
    }

    final repository = ref.read(localCacheRepositoryProvider);
    final clients = await repository.getClients(storeId);
    final routes = await repository.getRoutes(storeId);
    final visits = await repository.getVisits();

    final now = DateTime.now();
    // F-M2: Filter routes by session.user.id AND today's date
    final todaysRoutes = routes.where((route) {
      final routeDate = route.routeDate;
      if (routeDate == null) return false;
      final isToday = routeDate.year == now.year &&
          routeDate.month == now.month &&
          routeDate.day == now.day;
      // Only show routes assigned to the current user
      final isMyRoute = route.vendorId == userId;
      return isToday && isMyRoute;
    }).toList();

    final routeClientIds = todaysRoutes
        .expand((route) => route.clientIds)
        .where((id) => id.isNotEmpty)
        .toSet();

    // F-M2: Eliminated routeClientIds.isEmpty fallback.
    // If no route assigned, show empty list — not all clients.
    final selectedClients = clients
        .where((client) => routeClientIds.contains(client.id))
        .toList();

    if (!mounted) return;
    setState(() {
      _clientsRoute = selectedClients;
      _visitedClientIds = visits.map((visit) => visit.clientId).toSet();
      _loading = false;
    });
  }

  Future<void> _markNoBuy(String clientId) async {
    await ref.read(localCacheRepositoryProvider).signVisit(
          clientId: clientId,
          status: 'no_buy',
        );
    if (!mounted) return;
    setState(() => _visitedClientIds = {..._visitedClientIds, clientId});
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Visita sin compra registrada.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final visitedCount = _clientsRoute
        .where((client) => _visitedClientIds.contains(client.id))
        .length;
    final totalCount = _clientsRoute.length;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Ruta del Día'),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
           Container(
             padding: const EdgeInsets.all(16),
             color: Colors.white,
             child: Row(
               mainAxisAlignment: MainAxisAlignment.spaceBetween,
               children: [
                 Column(
                   crossAxisAlignment: CrossAxisAlignment.start,
                   children: [
                     const Text('Progreso de Visitas', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black54)),
                     const SizedBox(height: 4),
                     Text('$visitedCount / $totalCount Clientes', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
                   ],
                 ),
                 CircularProgressIndicator(
                   value: totalCount == 0 ? 0 : visitedCount / totalCount,
                   backgroundColor: Colors.grey.shade200,
                   color: const Color(0xFF047857),
                   strokeWidth: 6,
                 )
               ],
             ),
           ),
           const Divider(height: 1),
           Expanded(
             child: _loading
                 ? const Center(child: CircularProgressIndicator())
                 : _clientsRoute.isEmpty
                     ? EmptyRouteState(onRefresh: _loadRoute)
                     : ListView.builder(
               padding: const EdgeInsets.all(16),
               itemCount: _clientsRoute.length,
               itemBuilder: (context, index) {
                 final client = _clientsRoute[index];
                 final visited = _visitedClientIds.contains(client.id);
                 
                 return Padding(
                   padding: const EdgeInsets.only(bottom: 12),
                   child: RouteStopCard(
                     clientName: client.name,
                     address: client.address,
                     visitStatus: visited ? 'VISITED' : 'PENDING',
                     stopIndex: index + 1,
                     onTap: () {
                       final paramId = client.id;
                       final paramName = Uri.encodeComponent(client.name);
                       context.push('/preventa-order?clientId=$paramId&clientName=$paramName');
                     },
                     onVisitTap: visited ? null : () => _markNoBuy(client.id),
                   ),
                 );
               },
             ),
           )
        ],
      ),
    );
  }
}
