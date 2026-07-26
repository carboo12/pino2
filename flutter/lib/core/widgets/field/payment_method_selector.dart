import 'package:flutter/material.dart';

import '../../config/app_colors.dart';
import '../../contracts/field_contracts.dart';

/// Selector visual de método de pago (CASH/TRANSFER/CHECK/CREDIT).
///
/// Botones grandes para uso de campo. No usa Dio, Drift ni repositorios.
class PaymentMethodSelector extends StatelessWidget {
  const PaymentMethodSelector({
    super.key,
    required this.selected,
    required this.onSelected,
    this.availableMethods = const [
      PaymentMethod.cash,
      PaymentMethod.transfer,
      PaymentMethod.check,
      PaymentMethod.credit,
    ],
    this.label,
  });

  final String? selected;
  final ValueChanged<String> onSelected;
  final List<String> availableMethods;
  final String? label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
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
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: availableMethods.map((method) {
            final isSelected = selected == method;
            return _PaymentChip(
              method: method,
              isSelected: isSelected,
              onTap: () => onSelected(method),
            );
          }).toList(),
        ),
      ],
    );
  }
}

class _PaymentChip extends StatelessWidget {
  const _PaymentChip({
    required this.method,
    required this.isSelected,
    required this.onTap,
  });

  final String method;
  final bool isSelected;
  final VoidCallback onTap;

  Color get _color {
    return switch (method) {
      PaymentMethod.cash => const Color(0xFF10B981),
      PaymentMethod.transfer => const Color(0xFF2563EB),
      PaymentMethod.check => const Color(0xFF7C3AED),
      PaymentMethod.credit => const Color(0xFFF59E0B),
      _ => AppColors.textSecondary,
    };
  }

  IconData get _icon {
    return switch (method) {
      PaymentMethod.cash => Icons.payments_rounded,
      PaymentMethod.transfer => Icons.account_balance_rounded,
      PaymentMethod.check => Icons.receipt_long_rounded,
      PaymentMethod.credit => Icons.credit_card_rounded,
      _ => Icons.payment_rounded,
    };
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = _color;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeInOut,
      child: Material(
        color: isSelected ? color.withValues(alpha: 0.12) : AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        elevation: isSelected ? 2 : 0,
        shadowColor: color.withValues(alpha: 0.3),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Container(
            constraints: const BoxConstraints(minWidth: 100, minHeight: 56),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isSelected ? color : AppColors.border,
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  _icon,
                  size: 22,
                  color: isSelected ? color : AppColors.textMuted,
                ),
                const SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      PaymentMethod.label(method),
                      style: theme.textTheme.labelLarge?.copyWith(
                        color: isSelected ? color : AppColors.textPrimary,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                if (isSelected) ...[
                  const SizedBox(width: 8),
                  Icon(
                    Icons.check_circle_rounded,
                    size: 18,
                    color: color,
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
