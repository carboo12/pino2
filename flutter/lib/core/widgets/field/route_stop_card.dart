import 'package:flutter/material.dart';

import '../../config/app_colors.dart';
import '../../contracts/field_contracts.dart';

/// Card de parada de ruta para el Gestor.
///
/// Muestra nombre del cliente, dirección, estado de visita y permite
/// navegar a la pantalla de pedido. Botones grandes para campo.
/// No usa Dio, Drift ni repositorios.
class RouteStopCard extends StatelessWidget {
  const RouteStopCard({
    super.key,
    required this.clientName,
    this.clientCode,
    this.address,
    this.visitStatus,
    this.orderCount = 0,
    this.stopIndex,
    this.onTap,
    this.onVisitTap,
  });

  final String clientName;
  final String? clientCode;
  final String? address;
  final String? visitStatus;
  final int orderCount;
  final int? stopIndex;
  final VoidCallback? onTap;
  final VoidCallback? onVisitTap;

  Color _statusColor() {
    return switch (visitStatus) {
      VisitStatus.sale => AppColors.success,
      VisitStatus.visited => AppColors.primary,
      VisitStatus.noSale => AppColors.accent,
      VisitStatus.skipped => AppColors.textMuted,
      _ => AppColors.border,
    };
  }

  String _statusLabel() {
    return switch (visitStatus) {
      VisitStatus.pending => 'Pendiente',
      VisitStatus.visited => 'Visitado',
      VisitStatus.noSale => 'Sin venta',
      VisitStatus.sale => 'Con venta',
      VisitStatus.skipped => 'Omitido',
      _ => 'Pendiente',
    };
  }

  IconData _statusIcon() {
    return switch (visitStatus) {
      VisitStatus.sale => Icons.check_circle_rounded,
      VisitStatus.visited => Icons.visibility_rounded,
      VisitStatus.noSale => Icons.cancel_rounded,
      VisitStatus.skipped => Icons.skip_next_rounded,
      _ => Icons.radio_button_unchecked_rounded,
    };
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final statusColor = _statusColor();

    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              // Stop index indicator
              if (stopIndex != null) ...[
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      '${stopIndex!}',
                      style: theme.textTheme.labelLarge?.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
              ],

              // Client info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            clientName,
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (orderCount > 0) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.success.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              '$orderCount pedido${orderCount > 1 ? 's' : ''}',
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: AppColors.success,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    if (clientCode != null)
                      Text(
                        clientCode!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: AppColors.textMuted,
                        ),
                      ),
                    if (address != null)
                      Text(
                        address!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),

              const SizedBox(width: 12),

              // Visit status indicator
              GestureDetector(
                onTap: onVisitTap,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(_statusIcon(), size: 16, color: statusColor),
                      const SizedBox(width: 4),
                      Text(
                        _statusLabel(),
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: statusColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
