import 'package:flutter/material.dart';

import '../../config/app_colors.dart';
import '../../contracts/field_contracts.dart';

/// Muestra resumen visual de bultos + unidades sueltas = total.
///
/// Widget puro de lectura; no usa Dio, Drift ni repositorios.
class BulkUnitSummary extends StatelessWidget {
  const BulkUnitSummary({
    super.key,
    required this.bulkCount,
    required this.looseUnitCount,
    required this.unitsPerBulk,
    this.label,
    this.compact = false,
  });

  final int bulkCount;
  final int looseUnitCount;
  final int unitsPerBulk;
  final String? label;
  final bool compact;

  int get totalUnits => calculateTotalUnits(
    bulkCount: bulkCount,
    unitsPerBulkSnapshot: unitsPerBulk,
    looseUnitCount: looseUnitCount,
  );

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (compact) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (label != null) ...[
            Text(
              label!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(width: 8),
          ],
          _Chip(value: '$bulkCount', label: 'blt', color: AppColors.primary),
          const SizedBox(width: 4),
          Text('+', style: theme.textTheme.bodySmall?.copyWith(color: AppColors.textMuted)),
          const SizedBox(width: 4),
          _Chip(value: '$looseUnitCount', label: 'ud', color: AppColors.secondary),
          const SizedBox(width: 4),
          Text('=', style: theme.textTheme.bodySmall?.copyWith(color: AppColors.textMuted)),
          const SizedBox(width: 4),
          _Chip(value: '$totalUnits', label: 'total', color: AppColors.success),
        ],
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (label != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text(
                label!,
                style: theme.textTheme.labelMedium?.copyWith(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          Row(
            children: [
              Expanded(
                child: _SummaryColumn(
                  value: bulkCount,
                  label: 'Bultos',
                  sublabel: '× $unitsPerBulk ud',
                  color: AppColors.primary,
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Text(
                  '+',
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: AppColors.textMuted,
                    fontWeight: FontWeight.w300,
                  ),
                ),
              ),
              Expanded(
                child: _SummaryColumn(
                  value: looseUnitCount,
                  label: 'Sueltas',
                  color: AppColors.secondary,
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Text(
                  '=',
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: AppColors.textMuted,
                    fontWeight: FontWeight.w300,
                  ),
                ),
              ),
              Expanded(
                child: _SummaryColumn(
                  value: totalUnits,
                  label: 'Total',
                  color: AppColors.success,
                  bold: true,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({
    required this.value,
    required this.label,
    required this.color,
  });

  final String value;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        '$value $label',
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _SummaryColumn extends StatelessWidget {
  const _SummaryColumn({
    required this.value,
    required this.label,
    required this.color,
    this.sublabel,
    this.bold = false,
  });

  final int value;
  final String label;
  final String? sublabel;
  final Color color;
  final bool bold;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '$value',
            style: theme.textTheme.headlineSmall?.copyWith(
              color: color,
              fontWeight: bold ? FontWeight.w800 : FontWeight.w700,
            ),
          ),
          Text(
            label,
            style: theme.textTheme.labelSmall?.copyWith(
              color: color.withValues(alpha: 0.7),
            ),
          ),
          if (sublabel != null)
            Text(
              sublabel!,
              style: theme.textTheme.labelSmall?.copyWith(
                color: AppColors.textMuted,
                fontSize: 10,
              ),
            ),
        ],
      ),
    );
  }
}
