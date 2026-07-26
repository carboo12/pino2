import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../config/app_colors.dart';

/// Editor por línea de resultado de entrega.
///
/// Captura deliveredUnits + rejectedUnits por item. Cuando hay rechazo
/// exige rejectionReason. deliveredUnits + rejectedUnits = quantity.
/// Botones grandes para campo. No usa Dio, Drift ni repositorios.
class DeliveryItemResultEditor extends StatefulWidget {
  const DeliveryItemResultEditor({
    super.key,
    required this.productName,
    required this.plannedQuantity,
    this.salePrice,
    this.initialDelivered,
    this.initialRejected,
    this.initialRejectionReason,
    required this.onChanged,
  });

  final String productName;
  final int plannedQuantity;
  final double? salePrice;
  final int? initialDelivered;
  final int? initialRejected;
  final String? initialRejectionReason;
  final void Function(int delivered, int rejected, String? reason) onChanged;

  @override
  State<DeliveryItemResultEditor> createState() =>
      _DeliveryItemResultEditorState();
}

class _DeliveryItemResultEditorState extends State<DeliveryItemResultEditor> {
  late int _delivered;
  late int _rejected;
  late final TextEditingController _reasonController;
  bool _showReasonField = false;

  @override
  void initState() {
    super.initState();
    _delivered = widget.initialDelivered ?? widget.plannedQuantity;
    _rejected = widget.initialRejected ?? 0;
    _reasonController = TextEditingController(
      text: widget.initialRejectionReason ?? '',
    );
    _showReasonField = _rejected > 0;
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  void _setDelivered(int value) {
    if (value < 0 || value > widget.plannedQuantity) return;
    setState(() {
      _delivered = value;
      _rejected = widget.plannedQuantity - value;
      _showReasonField = _rejected > 0;
      if (_rejected == 0) _reasonController.clear();
    });
    _notify();
  }

  void _notify() {
    widget.onChanged(
      _delivered,
      _rejected,
      _rejected > 0 ? _reasonController.text : null,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isPartial = _rejected > 0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isPartial ? AppColors.accent : AppColors.border,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Product header
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.productName,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      'Cantidad planificada: ${widget.plannedQuantity}',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              if (widget.salePrice != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'C\$ ${widget.salePrice!.toStringAsFixed(2)}',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),

          // Slider for delivered vs rejected
          Row(
            children: [
              // Delivered
              Expanded(
                child: _ResultColumn(
                  label: 'Entregado',
                  value: _delivered,
                  color: AppColors.success,
                  icon: Icons.check_circle_outline_rounded,
                ),
              ),
              const SizedBox(width: 8),
              // Rejected
              Expanded(
                child: _ResultColumn(
                  label: 'Rechazado',
                  value: _rejected,
                  color: _rejected > 0 ? AppColors.error : AppColors.textMuted,
                  icon: Icons.cancel_outlined,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Slider
          SliderTheme(
            data: SliderThemeData(
              activeTrackColor: AppColors.success,
              inactiveTrackColor: AppColors.error.withValues(alpha: 0.3),
              thumbColor: AppColors.success,
              overlayColor: AppColors.success.withValues(alpha: 0.2),
              trackHeight: 8,
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 14),
            ),
            child: Slider(
              value: _delivered.toDouble(),
              min: 0,
              max: widget.plannedQuantity.toDouble(),
              divisions: widget.plannedQuantity > 0 ? widget.plannedQuantity : 1,
              onChanged: (v) => _setDelivered(v.round()),
            ),
          ),

          // Quick action buttons
          Row(
            children: [
              _QuickButton(
                label: 'Todo',
                onTap: () => _setDelivered(widget.plannedQuantity),
                isActive: _delivered == widget.plannedQuantity,
                color: AppColors.success,
              ),
              const SizedBox(width: 8),
              _QuickButton(
                label: 'Nada',
                onTap: () => _setDelivered(0),
                isActive: _delivered == 0,
                color: AppColors.error,
              ),
            ],
          ),

          // Rejection reason
          if (_showReasonField) ...[
            const SizedBox(height: 12),
            TextField(
              controller: _reasonController,
              onChanged: (_) => _notify(),
              maxLines: 2,
              inputFormatters: [LengthLimitingTextInputFormatter(200)],
              decoration: InputDecoration(
                labelText: 'Razón del rechazo *',
                hintText: 'Ej: Empaque dañado',
                prefixIcon: const Icon(Icons.warning_amber_rounded, size: 20),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: AppColors.accent),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ResultColumn extends StatelessWidget {
  const _ResultColumn({
    required this.label,
    required this.value,
    required this.color,
    required this.icon,
  });

  final String label;
  final int value;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$value',
                style: theme.textTheme.titleMedium?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                label,
                style: theme.textTheme.labelSmall?.copyWith(
                  color: color.withValues(alpha: 0.7),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _QuickButton extends StatelessWidget {
  const _QuickButton({
    required this.label,
    required this.onTap,
    required this.isActive,
    required this.color,
  });

  final String label;
  final VoidCallback onTap;
  final bool isActive;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Material(
        color: isActive ? color.withValues(alpha: 0.15) : AppColors.background,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(10),
          child: Container(
            height: 44,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: isActive ? color : AppColors.border,
              ),
            ),
            child: Text(
              label,
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: isActive ? color : AppColors.textSecondary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
