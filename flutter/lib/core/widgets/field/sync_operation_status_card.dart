import 'package:flutter/material.dart';

import '../../config/app_colors.dart';

/// Muestra el estado de una operación en el outbox (pending/synced/error).
///
/// Puro visual; no usa Dio, Drift ni repositorios.
class SyncOperationStatusCard extends StatelessWidget {
  const SyncOperationStatusCard({
    super.key,
    required this.operationType,
    required this.status,
    this.createdAt,
    this.errorMessage,
    this.externalId,
    this.onRetry,
    this.onDiscard,
  });

  /// Tipo legible: 'Pedido', 'Cobro', 'Entrega', etc.
  final String operationType;

  /// Estado del outbox: pending, processing, synced, retryable_error, conflict
  final String status;

  final DateTime? createdAt;
  final String? errorMessage;
  final String? externalId;
  final VoidCallback? onRetry;
  final VoidCallback? onDiscard;

  Color get _statusColor => switch (status) {
    'synced' => AppColors.success,
    'processing' => AppColors.primary,
    'pending' => AppColors.accent,
    'retryable_error' => AppColors.error,
    'conflict' => AppColors.error,
    _ => AppColors.textMuted,
  };

  IconData get _statusIcon => switch (status) {
    'synced' => Icons.cloud_done_rounded,
    'processing' => Icons.cloud_upload_rounded,
    'pending' => Icons.cloud_queue_rounded,
    'retryable_error' => Icons.cloud_off_rounded,
    'conflict' => Icons.warning_amber_rounded,
    _ => Icons.help_outline_rounded,
  };

  String get _statusLabel => switch (status) {
    'synced' => 'Sincronizado',
    'processing' => 'Enviando…',
    'pending' => 'Pendiente',
    'retryable_error' => 'Error (reintentar)',
    'conflict' => 'Conflicto',
    _ => status,
  };

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = _statusColor;
    final isError = status == 'retryable_error' || status == 'conflict';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isError ? color.withValues(alpha: 0.5) : AppColors.border,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Status icon with background
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(_statusIcon, size: 20, color: color),
              ),
              const SizedBox(width: 12),

              // Operation type + status
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      operationType,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Row(
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: color,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _statusLabel,
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: color,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Time
              if (createdAt != null)
                Text(
                  _formatTime(createdAt!),
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: AppColors.textMuted,
                  ),
                ),
            ],
          ),

          // Error message
          if (errorMessage != null && isError) ...[
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.errorLight,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                errorMessage!,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: AppColors.error,
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],

          // External ID (collapsed)
          if (externalId != null) ...[
            const SizedBox(height: 4),
            Text(
              'ID: ${externalId!.substring(0, 8)}…',
              style: theme.textTheme.labelSmall?.copyWith(
                color: AppColors.textMuted,
                fontFamily: 'monospace',
              ),
            ),
          ],

          // Action buttons
          if (isError && (onRetry != null || onDiscard != null)) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                if (onRetry != null)
                  Expanded(
                    child: _ActionButton(
                      label: 'Reintentar',
                      icon: Icons.refresh_rounded,
                      color: AppColors.primary,
                      onTap: onRetry!,
                    ),
                  ),
                if (onRetry != null && onDiscard != null)
                  const SizedBox(width: 8),
                if (onDiscard != null)
                  Expanded(
                    child: _ActionButton(
                      label: 'Descartar',
                      icon: Icons.delete_outline_rounded,
                      color: AppColors.error,
                      onTap: onDiscard!,
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          height: 44,
          alignment: Alignment.center,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: color),
              const SizedBox(width: 6),
              Text(
                label,
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
