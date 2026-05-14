import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/connectivity_service.dart';
import '../../../../core/network/sync_queue_processor.dart';

class SyncStatusScreen extends ConsumerWidget {
  const SyncStatusScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final syncState = ref.watch(syncQueueProcessorProvider);
    final isOnline = ref.watch(networkStatusProvider).value == NetworkStatus.online;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sincronización',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
        actions: [
          if (syncState.status == SyncQueueStatus.error)
            TextButton.icon(
              onPressed: () =>
                  ref.read(syncQueueProcessorProvider.notifier).retryFailedQueue(),
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Reintentar'),
            ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Icon(
                    isOnline ? Icons.cloud_done : Icons.cloud_off,
                    size: 32,
                    color: isOnline ? Colors.green : Colors.orange,
                  ),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isOnline ? 'Conectado' : 'Sin conexión',
                        style: theme.textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      if (syncState.lastSyncAt != null)
                        Text(
                          'Última sincronización: ${_formatDate(syncState.lastSyncAt!)}',
                          style: TextStyle(
                              fontSize: 12,
                              color: theme.colorScheme.onSurfaceVariant),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text('Cola de sincronización',
              style: theme.textTheme.titleSmall
                  ?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),

          _QueueCard(
            icon: Icons.shopping_cart_outlined,
            label: 'Pedidos',
            count: syncState.pendingCount,
            color: theme.colorScheme.primary,
          ),
          _QueueCard(
            icon: Icons.payments_outlined,
            label: 'Cobros',
            count: syncState.pendingCount,
            color: theme.colorScheme.secondary,
          ),
          _QueueCard(
            icon: Icons.replay_outlined,
            label: 'Devoluciones',
            count: 0,
            color: Colors.orange,
          ),
          _QueueCard(
            icon: Icons.person_outline,
            label: 'Visitas',
            count: 0,
            color: Colors.blue,
          ),

          if (syncState.failedCount > 0) ...[
            const SizedBox(height: 16),
            Text('Requieren revisión',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.error,
                )),
            const SizedBox(height: 8),
            Card(
              color: theme.colorScheme.errorContainer,
              child: ListTile(
                leading: Icon(Icons.error_outline,
                    color: theme.colorScheme.onErrorContainer),
                title: Text(
                  '${syncState.failedCount} elemento${syncState.failedCount != 1 ? 's' : ''} con error',
                  style: TextStyle(color: theme.colorScheme.onErrorContainer),
                ),
                subtitle: Text(
                  'Toca para reintentar',
                  style: TextStyle(
                    fontSize: 12,
                    color: theme.colorScheme.onErrorContainer.withAlpha(180),
                  ),
                ),
                trailing: TextButton(
                  onPressed: () =>
                      ref.read(syncQueueProcessorProvider.notifier).retryFailedQueue(),
                  child: const Text('Reintentar'),
                ),
              ),
            ),
          ],

          if (syncState.pendingCount == 0 && syncState.failedCount == 0) ...[
            const SizedBox(height: 32),
            Center(
              child: Column(
                children: [
                  Icon(Icons.check_circle_outline,
                      size: 64, color: theme.colorScheme.primary),
                  const SizedBox(height: 16),
                  Text('Todo sincronizado',
                      style: theme.textTheme.titleLarge
                          ?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Text('No hay datos pendientes de enviar',
                      style: TextStyle(
                          color: theme.colorScheme.onSurfaceVariant)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _formatDate(DateTime dt) {
    final diff = DateTime.now().toUtc().difference(dt);
    if (diff.inSeconds < 60) return 'hace ${diff.inSeconds}s';
    if (diff.inMinutes < 60) return 'hace ${diff.inMinutes}m';
    if (diff.inHours < 24) return 'hace ${diff.inHours}h';
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}

class _QueueCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final int count;
  final Color color;

  const _QueueCard({
    required this.icon,
    required this.label,
    required this.count,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(icon, color: color),
        title: Text(label),
        trailing: count > 0
            ? Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withAlpha(25),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '$count',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: color,
                  ),
                ),
              )
            : const Icon(Icons.check, size: 18, color: Colors.green),
      ),
    );
  }
}
