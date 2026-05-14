import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/database/local_cache_repository.dart';
import '../../../../core/utils/role_utils.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../../clients/domain/models/client_summary.dart';
import '../../../deliveries/domain/models/delivery_summary.dart';
import '../widgets/workday_action_button.dart';
import '../widgets/client_work_card.dart';

final _routeClientsProvider = FutureProvider<List<ClientSummary>>((ref) async {
  final session = ref.watch(authControllerProvider).session;
  final storeId = session?.user.primaryStoreId;
  if (storeId == null || storeId.isEmpty) return [];

  final repository = ref.read(localCacheRepositoryProvider);
  final clients = await repository.getClients(storeId);
  final routes = await repository.getRoutes(storeId);
  final visits = await repository.getVisits();

  final now = DateTime.now();
  final todayRoutes = routes.where((r) {
    final d = r.routeDate;
    return d != null &&
        d.year == now.year &&
        d.month == now.month &&
        d.day == now.day;
  }).toList();

  final routeClientIds = todayRoutes
      .expand((r) => r.clientIds)
      .where((id) => id.isNotEmpty)
      .toSet();

  final visitedIds = visits
      .where((v) {
        final d = v.visitedAt;
        return d != null &&
            d.year == now.year &&
            d.month == now.month &&
            d.day == now.day;
      })
      .map((v) => v.clientId)
      .where((id) => id != null)
      .toSet();

  return clients
      .where((c) => routeClientIds.contains(c.id) && !visitedIds.contains(c.id))
      .toList();
});

class RouteWorkdayScreen extends ConsumerWidget {
  const RouteWorkdayScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(authControllerProvider).session;
    final role = normalizeRole(session?.user.role);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          role == AppRole.rutero ? 'Ruta de entregas' : 'Ruta del día',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      body: ref.watch(_routeClientsProvider).when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline, size: 48, color: theme.colorScheme.error),
              const SizedBox(height: 16),
              Text('Error al cargar ruta',
                  style: TextStyle(color: theme.colorScheme.error)),
            ],
          ),
        ),
        data: (clients) {
          if (clients.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check_circle_outline,
                      size: 64, color: theme.colorScheme.primary),
                  const SizedBox(height: 16),
                  Text('Ruta completada',
                      style: theme.textTheme.titleLarge
                          ?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Text('Todos los clientes han sido visitados',
                      style: TextStyle(
                          color: theme.colorScheme.onSurfaceVariant)),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: clients.length + 1,
            itemBuilder: (context, index) {
              if (index == 0) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(
                    '${clients.length} pendiente${clients.length != 1 ? 's' : ''}',
                    style: theme.textTheme.titleSmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                );
              }
              final client = clients[index - 1];
              return ClientWorkCard(
                client: client,
                onTap: () => context.push('/workday/client/${client.id}'),
                actions: [
                  WorkAction(
                    icon: Icons.shopping_cart_outlined,
                    label: role == AppRole.rutero ? 'Entregar' : 'Pedido',
                    onTap: () => context.push('/workday/client/${client.id}'),
                  ),
                  WorkAction(
                    icon: Icons.payments_outlined,
                    label: 'Cobrar',
                    onTap: () => context.push('/workday/client/${client.id}'),
                  ),
                ],
              );
            },
          );
        },
      ),
    );
  }
}
