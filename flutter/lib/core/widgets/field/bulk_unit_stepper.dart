import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../config/app_colors.dart';
import '../../contracts/field_contracts.dart';

/// Stepper de campo para capturar bultos y unidades sueltas.
///
/// Calcula [totalUnits] = bulkCount × unitsPerBulk + looseUnitCount.
/// Botones grandes para uso de campo/piso. No usa Dio, Drift ni repositorios.
class BulkUnitStepper extends StatefulWidget {
  const BulkUnitStepper({
    super.key,
    required this.productName,
    required this.unitsPerBulk,
    this.initialBulkCount = 0,
    this.initialLooseUnitCount = 0,
    this.maxTotalUnits,
    this.handlesBulk = true,
    required this.onChanged,
  });

  final String productName;
  final int unitsPerBulk;
  final int initialBulkCount;
  final int initialLooseUnitCount;
  final int? maxTotalUnits;
  final bool handlesBulk;
  final void Function(int bulkCount, int looseUnitCount, int totalUnits) onChanged;

  @override
  State<BulkUnitStepper> createState() => _BulkUnitStepperState();
}

class _BulkUnitStepperState extends State<BulkUnitStepper> {
  late int _bulkCount;
  late int _looseCount;
  late final TextEditingController _bulkController;
  late final TextEditingController _looseController;

  int get _totalUnits => calculateTotalUnits(
    bulkCount: _bulkCount,
    unitsPerBulkSnapshot: widget.unitsPerBulk,
    looseUnitCount: _looseCount,
  );

  @override
  void initState() {
    super.initState();
    _bulkCount = widget.initialBulkCount;
    _looseCount = widget.initialLooseUnitCount;
    _bulkController = TextEditingController(text: '$_bulkCount');
    _looseController = TextEditingController(text: '$_looseCount');
  }

  @override
  void dispose() {
    _bulkController.dispose();
    _looseController.dispose();
    super.dispose();
  }

  bool _canAdd(int addedUnits) {
    if (widget.maxTotalUnits == null) return true;
    return (_totalUnits + addedUnits) <= widget.maxTotalUnits!;
  }

  void _updateBulk(int delta) {
    final next = _bulkCount + delta;
    if (next < 0) return;
    if (delta > 0 && !_canAdd(delta * widget.unitsPerBulk)) return;
    setState(() {
      _bulkCount = next;
      _bulkController.text = '$next';
    });
    _notifyChange();
  }

  void _updateLoose(int delta) {
    final next = _looseCount + delta;
    if (next < 0) return;
    if (delta > 0 && !_canAdd(delta)) return;
    setState(() {
      _looseCount = next;
      _looseController.text = '$next';
    });
    _notifyChange();
  }

  void _notifyChange() {
    widget.onChanged(_bulkCount, _looseCount, _totalUnits);
  }

  void _onBulkEdited(String value) {
    final parsed = int.tryParse(value);
    if (parsed == null || parsed < 0) return;
    setState(() => _bulkCount = parsed);
    _notifyChange();
  }

  void _onLooseEdited(String value) {
    final parsed = int.tryParse(value);
    if (parsed == null || parsed < 0) return;
    setState(() => _looseCount = parsed);
    _notifyChange();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Product name
          Text(
            widget.productName,
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          if (widget.handlesBulk)
            Text(
              '1 bulto = ${widget.unitsPerBulk} unidades',
              style: theme.textTheme.bodySmall?.copyWith(
                color: AppColors.textMuted,
              ),
            ),
          const SizedBox(height: 12),

          // Bulk row
          if (widget.handlesBulk)
            _StepperRow(
              label: 'Bultos',
              controller: _bulkController,
              value: _bulkCount,
              onDecrement: () => _updateBulk(-1),
              onIncrement: () => _updateBulk(1),
              onEdited: _onBulkEdited,
            ),
          if (widget.handlesBulk) const SizedBox(height: 8),

          // Loose units row
          _StepperRow(
            label: 'Unidades',
            controller: _looseController,
            value: _looseCount,
            onDecrement: () => _updateLoose(-1),
            onIncrement: () => _updateLoose(1),
            onEdited: _onLooseEdited,
          ),
          const SizedBox(height: 12),

          // Total
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Total unidades',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                    color: AppColors.primary,
                  ),
                ),
                Text(
                  '$_totalUnits',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StepperRow extends StatelessWidget {
  const _StepperRow({
    required this.label,
    required this.controller,
    required this.value,
    required this.onDecrement,
    required this.onIncrement,
    required this.onEdited,
  });

  final String label;
  final TextEditingController controller;
  final int value;
  final VoidCallback onDecrement;
  final VoidCallback onIncrement;
  final ValueChanged<String> onEdited;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(
          width: 80,
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ),
        // Decrement button — large touch target
        _StepperButton(
          icon: Icons.remove_rounded,
          onTap: value > 0 ? onDecrement : null,
        ),
        const SizedBox(width: 8),
        // Editable value
        SizedBox(
          width: 64,
          height: 48,
          child: TextField(
            controller: controller,
            textAlign: TextAlign.center,
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            onChanged: onEdited,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
            decoration: InputDecoration(
              contentPadding: EdgeInsets.zero,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: AppColors.border),
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        // Increment button — large touch target
        _StepperButton(
          icon: Icons.add_rounded,
          onTap: onIncrement,
          isPrimary: true,
        ),
      ],
    );
  }
}

class _StepperButton extends StatelessWidget {
  const _StepperButton({
    required this.icon,
    required this.onTap,
    this.isPrimary = false,
  });

  final IconData icon;
  final VoidCallback? onTap;
  final bool isPrimary;

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;
    return Material(
      color: enabled
          ? (isPrimary ? AppColors.primary : AppColors.background)
          : AppColors.border.withValues(alpha: 0.5),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: SizedBox(
          width: 48,
          height: 48,
          child: Icon(
            icon,
            color: enabled
                ? (isPrimary ? Colors.white : AppColors.textPrimary)
                : AppColors.textMuted,
          ),
        ),
      ),
    );
  }
}
