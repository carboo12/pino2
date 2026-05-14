import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/database/local_cache_repository.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/utils/role_utils.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../../clients/domain/models/client_summary.dart';
import '../widgets/client_work_card.dart';
import '../widgets/workday_action_button.dart';

final _clientProvider = FutureProvider.family<ClientSummary?, String>(
    (ref, clientId) async {
  final session = ref.watch(authControllerProvider).session;
  final storeId = session?.user.primaryStoreId;
  if (storeId == null) return null;
  final repository = ref.read(localCacheRepositoryProvider);
  final clients = await repository.getClients(storeId);
  try {
    return clients.firstWhere((c) => c.id == clientId);
  } catch (_) {
    return null;
  }
});

class ClientWorkScreen extends ConsumerWidget {
  final String clientId;

  const ClientWorkScreen({super.key, required this.clientId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(authControllerProvider).session;
    final storeId = session?.user.primaryStoreId;
    final role = normalizeRole(session?.user.role);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Cliente',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
      ),
      body: ref.watch(_clientProvider(clientId)).when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline, size: 48, color: theme.colorScheme.error),
              const SizedBox(height: 16),
              Text('Error al cargar cliente',
                  style: TextStyle(color: theme.colorScheme.error)),
            ],
          ),
        ),
        data: (client) {
          if (client == null) {
            return const Center(child: Text('Cliente no encontrado'));
          }

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              ClientWorkCard(
                client: client,
                onTap: () => context.push('/warehouse/${storeId ?? ''}'),
                actions: [
                  if (role == AppRole.vendor || role == AppRole.preventa)
                    WorkAction(
                      icon: Icons.shopping_cart_outlined,
                      label: 'Nuevo pedido',
                      onTap: () {
                        final session = ref.read(authControllerProvider).session;
                        context.push(
                          '/quick-order/${session?.user.primaryStoreId ?? ''}',
                        );
                      },
                    ),
                  WorkAction(
                    icon: Icons.payments_outlined,
                    label: 'Cobrar',
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: const Text('Abrir cobro...'),
                          behavior: SnackBarBehavior.floating,
                          action: SnackBarAction(
                            label: 'OK',
                            onPressed: () {},
                          ),
                        ),
                      );
                    },
                  ),
                  WorkAction(
                    icon: Icons.replay_outlined,
                    label: 'Devolución',
                    onTap: () {
                      context.push('/returns/${storeId ?? ''}');
                    },
                  ),
                  WorkAction(
                    icon: Icons.remove_red_eye_outlined,
                    label: 'Visita sin venta',
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Visita registrada (offline)'),
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                      context.pop();
                    },
                  ),
                ],
              ),
              const SizedBox(height: 24),
              WorkdayActionButton(
                icon: Icons.check_circle,
                label: 'Resolver parada',
                subtitle: role == AppRole.rutero
                    ? 'Entregar, cobrar o devolver'
                    : 'Pedido, cobro o visita',
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Parada resuelta'),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                  context.pop();
                },
              ),
              const SizedBox(height: 12),
              TextButton.icon(
                onPressed: () {
                  // Report issue or skip
                  context.pop();
                },
                icon: const Icon(Icons.skip_next),
                label: const Text('No entregado / Saltar'),
              ),
            ],
          );
        },
      ),
    );
  }
}
