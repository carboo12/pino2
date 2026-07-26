import 'package:flutter/material.dart';

import '../../config/app_colors.dart';

/// Estado vacío para cuando el Gestor no tiene ruta asignada.
///
/// Muestra un mensaje claro con ícono y opcionalmente un botón de acción.
/// Cumple F-M2: "Mostrar mensaje práctico: No tienes una ruta asignada para hoy"
class EmptyRouteState extends StatelessWidget {
  const EmptyRouteState({
    super.key,
    this.title = 'No tienes una ruta asignada para hoy',
    this.description =
        'Contacta a tu supervisor para que te asigne una ruta de trabajo.',
    this.icon = Icons.route_rounded,
    this.onRefresh,
  });

  final String title;
  final String? description;
  final IconData icon;
  final VoidCallback? onRefresh;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Large icon container
            Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppColors.primary.withValues(alpha: 0.08),
                    AppColors.secondary.withValues(alpha: 0.08),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Icon(
                icon,
                size: 44,
                color: AppColors.primary.withValues(alpha: 0.5),
              ),
            ),
            const SizedBox(height: 24),

            // Title
            Text(
              title,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),

            // Description
            if (description != null) ...[
              const SizedBox(height: 8),
              Text(
                description!,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ],

            // Refresh button
            if (onRefresh != null) ...[
              const SizedBox(height: 24),
              OutlinedButton.icon(
                onPressed: onRefresh,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Actualizar'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(180, 52),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
