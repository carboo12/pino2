import 'package:flutter/material.dart';

import '../../config/app_colors.dart';

/// Banner compacto de error recuperable con botón de reintentar.
///
/// Para errores HTTP 400/409 y timeouts. Conserva la acción local
/// y muestra el mensaje; no crea otro externalId.
/// No usa Dio, Drift ni repositorios.
class CompactErrorBanner extends StatelessWidget {
  const CompactErrorBanner({
    super.key,
    required this.message,
    this.onRetry,
    this.onDismiss,
    this.isWarning = false,
  });

  final String message;
  final VoidCallback? onRetry;
  final VoidCallback? onDismiss;
  final bool isWarning;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = isWarning ? AppColors.accent : AppColors.error;
    final bgColor = isWarning ? AppColors.accentLight : AppColors.errorLight;

    return AnimatedSize(
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeInOut,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: color.withValues(alpha: 0.3),
          ),
        ),
        child: Row(
          children: [
            Icon(
              isWarning
                  ? Icons.warning_amber_rounded
                  : Icons.error_outline_rounded,
              size: 20,
              color: color,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                message,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w500,
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (onRetry != null) ...[
              const SizedBox(width: 8),
              _CompactAction(
                icon: Icons.refresh_rounded,
                color: color,
                onTap: onRetry!,
                tooltip: 'Reintentar',
              ),
            ],
            if (onDismiss != null) ...[
              const SizedBox(width: 4),
              _CompactAction(
                icon: Icons.close_rounded,
                color: color.withValues(alpha: 0.6),
                onTap: onDismiss!,
                tooltip: 'Cerrar',
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _CompactAction extends StatelessWidget {
  const _CompactAction({
    required this.icon,
    required this.color,
    required this.onTap,
    required this.tooltip,
  });

  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  final String tooltip;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(8),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.all(6),
            child: Icon(icon, size: 20, color: color),
          ),
        ),
      ),
    );
  }
}
