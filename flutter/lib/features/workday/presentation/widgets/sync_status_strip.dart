import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/sync_queue_processor.dart';

class SyncStatusStrip extends ConsumerWidget {
  const SyncStatusStrip({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final syncState = ref.watch(syncQueueProcessorProvider);

    if (syncState.status == SyncQueueStatus.idle &&
        syncState.pendingCount == 0) {
      return const SizedBox.shrink();
    }

    final (Color bg, IconData icon, String label) = switch (syncState.status) {
      SyncQueueStatus.syncing => (
        const Color(0xFF2563EB),
        Icons.sync,
        'Sincronizando...',
      ),
      SyncQueueStatus.offline => (
        const Color(0xFFD97706),
        Icons.cloud_off,
        'Sin conexión • ${syncState.pendingCount} pendientes',
      ),
      SyncQueueStatus.error => (
        const Color(0xFFDC2626),
        Icons.error_outline,
        '${syncState.failedCount} con error • toca para reintentar',
      ),
      SyncQueueStatus.idle => (
        const Color(0xFF16A34A),
        Icons.check_circle_outline,
        '${syncState.pendingCount} pendientes',
      ),
    };

    return Material(
      color: bg,
      child: InkWell(
        onTap: syncState.status == SyncQueueStatus.error ||
                syncState.status == SyncQueueStatus.offline
            ? () => ref.read(syncQueueProcessorProvider.notifier).retryFailedQueue()
            : null,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          child: Row(
            children: [
              if (syncState.status == SyncQueueStatus.syncing)
                const SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              else
                Icon(icon, size: 14, color: Colors.white),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              if (syncState.lastSyncAt != null)
                Text(
                  _formatLastSync(syncState.lastSyncAt!),
                  style: const TextStyle(color: Colors.white70, fontSize: 10),
                ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatLastSync(DateTime dt) {
    final diff = DateTime.now().toUtc().difference(dt);
    if (diff.inSeconds < 60) return '${diff.inSeconds}s';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    return '${diff.inHours}h';
  }
}
