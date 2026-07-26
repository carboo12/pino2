import 'package:flutter/material.dart';

import '../../config/app_colors.dart';

/// Card de item de carga mostrando planned/loaded/accepted.
///
/// Usado en el tablero de cargas para visualizar cuántas unidades se
/// planificaron, cargaron y aceptaron por producto. Puro visual.
class LoadItemCountCard extends StatelessWidget {
  const LoadItemCountCard({
    super.key,
    required this.productName,
    required this.plannedUnits,
    this.loadedUnits = 0,
    this.acceptedUnits = 0,
    this.discrepancyUnits = 0,
    this.unitsPerBulk,
    this.handlesBulk = false,
  });

  final String productName;
  final int plannedUnits;
  final int loadedUnits;
  final int acceptedUnits;
  final int discrepancyUnits;
  final int? unitsPerBulk;
  final bool handlesBulk;

  bool get _hasDiscrepancy => discrepancyUnits != 0;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: _hasDiscrepancy ? AppColors.accent : AppColors.border,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Product name
          Text(
            productName,
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          if (handlesBulk && unitsPerBulk != null)
            Text(
              '1 bulto = $unitsPerBulk ud',
              style: theme.textTheme.labelSmall?.copyWith(
                color: AppColors.textMuted,
              ),
            ),
          const SizedBox(height: 10),

          // Counts row
          Row(
            children: [
              _CountPill(
                label: 'Plan',
                value: plannedUnits,
                color: AppColors.textSecondary,
              ),
              const SizedBox(width: 6),
              _CountPill(
                label: 'Cargado',
                value: loadedUnits,
                color: AppColors.primary,
              ),
              const SizedBox(width: 6),
              _CountPill(
                label: 'Aceptado',
                value: acceptedUnits,
                color: AppColors.success,
              ),
              if (_hasDiscrepancy) ...[
                const SizedBox(width: 6),
                _CountPill(
                  label: 'Dif',
                  value: discrepancyUnits,
                  color: AppColors.error,
                ),
              ],
            ],
          ),

          // Progress bar
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: plannedUnits > 0
                  ? (acceptedUnits / plannedUnits).clamp(0.0, 1.0)
                  : 0,
              backgroundColor: AppColors.border,
              valueColor: AlwaysStoppedAnimation(
                _hasDiscrepancy ? AppColors.accent : AppColors.success,
              ),
              minHeight: 4,
            ),
          ),
        ],
      ),
    );
  }
}

class _CountPill extends StatelessWidget {
  const _CountPill({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final int value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '$value',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
            Text(
              label,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: color.withValues(alpha: 0.7),
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
