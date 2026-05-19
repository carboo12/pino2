import 'package:flutter/material.dart';
import '../../../core/config/app_colors.dart';
import '../data/role_actions.dart';

class PrimaryActionCard extends StatelessWidget {
  const PrimaryActionCard({
    super.key,
    required this.action,
    this.onTap,
  });

  final RoleAction action;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      elevation: 0,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              Container(
                width: 48, height: 48,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: AppColors.heroGradient),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(action.icon, color: Colors.white, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(action.title, style: theme.textTheme.titleMedium?.copyWith(
                      color: AppColors.textPrimary, fontWeight: FontWeight.w800)),
                    Text(action.subtitle, style: theme.textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary)),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_rounded, color: AppColors.textMuted),
            ],
          ),
        ),
      ),
    );
  }
}
