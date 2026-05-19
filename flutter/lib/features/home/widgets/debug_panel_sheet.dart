import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/connectivity_service.dart';
import '../../../core/network/sync_queue_processor.dart';
import '../../../core/realtime/realtime_controller.dart';
import '../../../core/realtime/realtime_event.dart';
import '../../../core/database/app_database.dart';
import '../../../core/database/local_cache_repository.dart';

class DebugPanelSheet extends ConsumerWidget {
  const DebugPanelSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final networkStatus = ref.watch(networkStatusProvider).valueOrNull;
    final syncQueueState = ref.watch(syncQueueProcessorProvider);
    final realtimeState = ref.watch(realtimeControllerProvider);
    final pendingSyncCount = ref.watch(pendingSyncCountProvider).asData?.value ?? 0;
    final failedSyncCount = ref.watch(failedSyncCountProvider).asData?.value ?? 0;
    final recentSyncEntries = ref.watch(recentSyncEntriesProvider).asData?.value ?? const [];
    final latestCachedEvent = ref.watch(latestRealtimeEventProvider).asData?.value;

    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      minChildSize: 0.4,
      maxChildSize: 0.95,
      builder: (_, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: theme.scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: ListView(
            controller: scrollController,
            padding: const EdgeInsets.all(20),
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Text('Estado del Sistema',
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                )),
              const SizedBox(height: 16),
              _buildRuntimeSection(
                context: context,
                networkStatus: networkStatus,
                syncQueueState: syncQueueState,
                realtimeState: realtimeState,
                pendingSyncCount: pendingSyncCount,
                failedSyncCount: failedSyncCount,
                recentSyncEntries: recentSyncEntries,
                latestCachedEvent: latestCachedEvent,
                onRetrySync: () => ref.read(syncQueueProcessorProvider.notifier).processPendingQueue(),
                onRetryFailed: () => ref.read(syncQueueProcessorProvider.notifier).retryFailedQueue(),
                onDiscardEntry: (id) => ref.read(syncQueueProcessorProvider.notifier).discardFailedEntry(id),
              ),
            ],
          ),
        );
      },
    );
  }
}

Widget _buildRuntimeSection({
  required BuildContext context,
  required NetworkStatus? networkStatus,
  required SyncQueueState syncQueueState,
  required RealtimeState realtimeState,
  required int pendingSyncCount,
  required int failedSyncCount,
  required List<SyncQueueEntry> recentSyncEntries,
  required RealtimeEvent? latestCachedEvent,
  required Future<void> Function() onRetrySync,
  required Future<void> Function() onRetryFailed,
  required Future<void> Function(int) onDiscardEntry,
}) {
  final theme = Theme.of(context);

  return Container(
    width: double.infinity,
    padding: const EdgeInsets.all(18),
    decoration: BoxDecoration(
      color: const Color(0xFF0F172A),
      borderRadius: BorderRadius.circular(24),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Estado de trabajo',
          style: theme.textTheme.titleMedium?.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'Si algo no se puede enviar por falta de señal, la app lo guarda y luego lo reintenta.',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: Colors.white.withValues(alpha: 0.82),
            height: 1.35,
          ),
        ),
        const SizedBox(height: 12),
        _RuntimeLine(
          label: 'Señal',
          value: networkStatus == null
              ? 'Verificando...'
              : networkStatus == NetworkStatus.online
                  ? 'Disponible'
                  : 'Sin conexión',
        ),
        const SizedBox(height: 8),
        _RuntimeLine(
          label: 'Envío',
          value: _syncStatusLabel(syncQueueState.status, pendingSyncCount),
        ),
        const SizedBox(height: 8),
        _RuntimeLine(
          label: 'Pendientes',
          value: pendingSyncCount == 1
              ? '1 operación'
              : '$pendingSyncCount operaciones',
        ),
        const SizedBox(height: 8),
        _RuntimeLine(
          label: 'Requieren atención',
          value: failedSyncCount == 1
              ? '1 operación'
              : '$failedSyncCount operaciones',
        ),
        if (syncQueueState.status == SyncQueueStatus.error && failedSyncCount == 0) ...[
          const SizedBox(height: 8),
          const _RuntimeLine(label: 'Aviso', value: 'Revisa tu señal y vuelve a intentar.'),
        ],
        if (recentSyncEntries.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text(
            'Últimos movimientos guardados',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          ...recentSyncEntries.take(4).map(
            (entry) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _SyncEntryTile(entry: entry, onDiscard: () => onDiscardEntry(entry.id)),
            ),
          ),
        ],
        const SizedBox(height: 14),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            FilledButton.tonal(
              onPressed: pendingSyncCount > 0 ? onRetrySync : null,
              child: const Text('Enviar pendientes'),
            ),
            FilledButton.tonal(
              onPressed: failedSyncCount > 0 ? onRetryFailed : null,
              child: const Text('Reintentar'),
            ),
          ],
        ),
      ],
    ),
  );
}

String _syncStatusLabel(SyncQueueStatus status, int pendingCount) {
  switch (status) {
    case SyncQueueStatus.idle:
      return pendingCount > 0 ? 'Listo para enviar' : 'Todo al día';
    case SyncQueueStatus.syncing:
      return 'Enviando información';
    case SyncQueueStatus.offline:
      return 'Guardando temporalmente';
    case SyncQueueStatus.error:
      return 'Necesita revisión';
  }
}

class _SyncEntryTile extends StatelessWidget {
  const _SyncEntryTile({required this.entry, this.onDiscard});

  final SyncQueueEntry entry;
  final VoidCallback? onDiscard;

  @override
  Widget build(BuildContext context) {
    final statusColor = switch (entry.status) {
      'completed' => const Color(0xFF22C55E),
      'failed' => const Color(0xFFEF4444),
      _ => const Color(0xFFF59E0B),
    };

    final title = entry.operationType?.trim().isNotEmpty == true
        ? entry.operationType!
        : 'Operación pendiente';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 10, height: 10,
                decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(_entryStatusText(entry.status), style: TextStyle(color: Colors.white.withValues(alpha: 0.72), fontSize: 12)),
          const SizedBox(height: 4),
          Text('Intentos: ${entry.attemptCount}', style: TextStyle(color: Colors.white.withValues(alpha: 0.72), fontSize: 12)),
          if (entry.status == 'failed' && onDiscard != null) ...[
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: onDiscard,
                style: TextButton.styleFrom(minimumSize: Size.zero, padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4)),
                child: const Text('Descartar', style: TextStyle(color: Colors.redAccent, fontSize: 13)),
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _entryStatusText(String status) {
    switch (status) {
      case 'completed':
        return 'Enviado correctamente';
      case 'failed':
        return 'Requiere reintento';
      default:
        return 'Pendiente de envío';
    }
  }
}

class _RuntimeLine extends StatelessWidget {
  const _RuntimeLine({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 84,
          child: Text(label, style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white, fontWeight: FontWeight.w700)),
        ),
        Expanded(
          child: Text(value, style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white.withValues(alpha: 0.76))),
        ),
      ],
    );
  }
}
