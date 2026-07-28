import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_theme.dart';
import '../../data/cash_shift_repository.dart';
import '../../domain/models/cash_shift_model.dart';
import '../../presentation/cash_shift_controller.dart';

class CashShiftScreen extends StatefulWidget {
  const CashShiftScreen({
    required this.storeId,
    this.storeName,
    this.userId,
    super.key,
  });

  final String storeId;
  final String? storeName;
  final String? userId;

  @override
  State<CashShiftScreen> createState() => _CashShiftScreenState();
}

class _CashShiftScreenState extends State<CashShiftScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CashShiftController>().loadActiveShift(
        storeId: widget.storeId,
        userId: widget.userId,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<CashShiftController>();

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Gestión de Caja', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            if (widget.storeName != null)
              Text(widget.storeName!, style: const TextStyle(fontSize: 12, color: AppTheme.slate500)),
          ],
        ),
      ),
      body: _buildBody(controller),
    );
  }

  Widget _buildBody(CashShiftController controller) {
    if (controller.loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (controller.error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded, size: 48, color: AppTheme.error),
              const SizedBox(height: 12),
              Text(controller.error!, textAlign: TextAlign.center, style: const TextStyle(color: AppTheme.error, fontSize: 15)),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () {
                  controller.clearError();
                  controller.loadActiveShift(storeId: widget.storeId, userId: widget.userId);
                },
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Reintentar'),
              ),
            ],
          ),
        ),
      );
    }

    if (!controller.hasActiveShift) {
      return _buildOpenShiftForm(controller);
    }

    return _buildActiveShiftView(controller);
  }

  Widget _buildOpenShiftForm(CashShiftController controller) {
    final startingCashController = TextEditingController();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: AppTheme.heroGradient,
            borderRadius: BorderRadius.circular(20),
            boxShadow: AppTheme.cardShadow,
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.countertops_rounded, color: Colors.white, size: 40),
              ),
              const SizedBox(height: 16),
              const Text(
                'No hay turno abierto',
                style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 4),
              Text(
                'Abre un turno para comenzar a operar',
                style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 13),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        const Text('Apertura de Turno', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 12),
        TextField(
          controller: startingCashController,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: InputDecoration(
            labelText: 'Fondo Inicial en Caja (C\$)',
            prefixIcon: const Icon(Icons.attach_money_rounded),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton.icon(
            onPressed: controller.submitting
                ? null
                : () async {
                    final cash = double.tryParse(startingCashController.text.trim());
                    if (cash == null || cash < 0) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Ingresa un monto válido'), backgroundColor: AppTheme.error),
                      );
                      return;
                    }
                    final success = await controller.openShift(
                      storeId: widget.storeId,
                      startingCash: cash,
                    );
                    if (success && mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('✅ Turno abierto con éxito'), backgroundColor: Color(0xFF10B981)),
                      );
                    }
                  },
            icon: controller.submitting
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.play_arrow_rounded),
            label: Text(controller.submitting ? 'Abriendo...' : 'Abrir Turno'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
        if (controller.activeShift != null && !controller.activeShift!.isOpen) ...[
          const SizedBox(height: 24),
          _buildClosedShiftSummary(controller.activeShift!),
        ],
      ],
    );
  }

  Widget _buildActiveShiftView(CashShiftController controller) {
    final shift = controller.activeShift!;

    return RefreshIndicator(
      onRefresh: () => controller.loadActiveShift(storeId: widget.storeId, userId: widget.userId),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildShiftHeader(shift),
          const SizedBox(height: 16),
          _buildStatsCard(shift),
          const SizedBox(height: 16),
          _buildOutflowsList(shift.outflows),
          const SizedBox(height: 16),
          if (shift.isOpen) ...[
            Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 48,
                    child: ElevatedButton.icon(
                      onPressed: controller.submitting ? null : () => _showOutflowDialog(controller, shift),
                      icon: const Icon(Icons.remove_circle_outline_rounded),
                      label: const Text('Egreso'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: SizedBox(
                    height: 48,
                    child: ElevatedButton.icon(
                      onPressed: controller.submitting ? null : () => _showCloseDialog(controller, shift),
                      icon: const Icon(Icons.lock_rounded),
                      label: const Text('Cerrar Turno'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.error,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildShiftHeader(CashShiftModel shift) {
    final isOpen = shift.isOpen;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: isOpen ? const LinearGradient(colors: [Color(0xFF10B981), Color(0xFF059669)]) : AppTheme.heroGradient,
        borderRadius: BorderRadius.circular(20),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(isOpen ? Icons.check_circle_rounded : Icons.cancel_rounded, size: 14, color: Colors.white),
                    const SizedBox(width: 4),
                    Text(
                      isOpen ? 'TURNO ABIERTO' : 'TURNO CERRADO',
                      style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ),
              Text(
                '#${shift.id.substring(0, 8)}',
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            'C\$ ${_fmt(shift.startingCash)}',
            style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900),
          ),
          Text(
            'Fondo inicial',
            style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 13),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.access_time_rounded, color: Colors.white70, size: 14),
              const SizedBox(width: 4),
              Text(
                'Abierto: ${_fmtDate(shift.openedAt)}',
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ],
          ),
          if (shift.openedByName != null) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.person_rounded, color: Colors.white70, size: 14),
                const SizedBox(width: 4),
                Text(
                  'Cajero: ${shift.openedByName}',
                  style: const TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStatsCard(CashShiftModel shift) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.slate200),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Resumen del Turno', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          const SizedBox(height: 12),
          _statRow('Ventas Efectivo (C\$)', shift.salesCash, Colors.green),
          _statRow('Ventas Tarjeta (C\$)', shift.salesCard, Colors.blue),
          _statRow('Ventas USD (\$)', shift.salesUSD, Colors.orange),
          if (shift.totalSales != null) _statRow('Total Ventas (C\$)', shift.totalSales, AppTheme.primary),
          if (shift.totalReturns != null) _statRow('Devoluciones (C\$)', shift.totalReturns, Colors.red),
          const Divider(height: 20),
          _statRow('Egresos del Turno', _totalOutflows(shift.outflows), Colors.red.shade700),
          _statRow('Efectivo Esperado', shift.expectedCash, AppTheme.primary),
          if (shift.isOpen && shift.actualCash != null) ...[
            const Divider(height: 20),
            _statRow('Efectivo Real (C\$)', shift.actualCash, Colors.green.shade700),
            if (shift.actualUSD != null) _statRow('Dólares Reales (\$)', shift.actualUSD, Colors.orange.shade700),
            if (shift.difference != null)
              _statRow('Diferencia', shift.difference!, shift.difference! >= 0 ? Colors.green : Colors.red),
          ],
        ],
      ),
    );
  }

  Widget _statRow(String label, double? value, Color color) {
    if (value == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 13, color: AppTheme.slate600)),
          Text(
            'C\$ ${_fmt(value)}',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: color),
          ),
        ],
      ),
    );
  }

  Widget _buildOutflowsList(List<CashOutflowModel> outflows) {
    if (outflows.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.slate200),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Egresos Registrados', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.error.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text('${outflows.length}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.error)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...outflows.map((o) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: AppTheme.error.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.receipt_rounded, size: 16, color: AppTheme.error),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(o.reason, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                      if (o.receiptNumber != null)
                        Text('#${o.receiptNumber}', style: const TextStyle(fontSize: 11, color: AppTheme.slate500)),
                    ],
                  ),
                ),
                Text(
                  '-C\$ ${_fmt(o.amount)}',
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppTheme.error),
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildClosedShiftSummary(CashShiftModel shift) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFBBF7D0)),
      ),
      child: Column(
        children: [
          const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 40),
          const SizedBox(height: 8),
          const Text('Último Turno Cerrado', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF065F46))),
          const SizedBox(height: 4),
          Text('Fondo final: C\$ ${_fmt(shift.actualCash ?? shift.startingCash)}', style: const TextStyle(color: Color(0xFF047857))),
        ],
      ),
    );
  }

  void _showOutflowDialog(CashShiftController controller, CashShiftModel shift) {
    final amountController = TextEditingController();
    final reasonController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 24, right: 24, top: 24,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Registrar Egreso', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 4),
            const Text('Ingresa el motivo y monto del egreso', style: TextStyle(color: AppTheme.slate500, fontSize: 13)),
            const SizedBox(height: 16),
            TextField(
              controller: amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                labelText: 'Monto (C\$)',
                prefixIcon: const Icon(Icons.attach_money_rounded),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonController,
              maxLines: 2,
              decoration: InputDecoration(
                labelText: 'Motivo del Egreso',
                hintText: 'Ej. Pago a proveedor, compras menores...',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: controller.submitting ? null : () async {
                  final amount = double.tryParse(amountController.text.trim());
                  final reason = reasonController.text.trim();
                  if (amount == null || amount <= 0) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Ingresa un monto válido'), backgroundColor: AppTheme.error),
                    );
                    return;
                  }
                  if (reason.isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Ingresa el motivo del egreso'), backgroundColor: AppTheme.error),
                    );
                    return;
                  }
                  final success = await controller.registerOutflow(
                    shiftId: shift.id,
                    storeId: widget.storeId,
                    amount: amount,
                    reason: reason,
                  );
                  if (mounted) Navigator.pop(ctx);
                  if (success && mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('✅ Egreso registrado'), backgroundColor: Color(0xFF10B981)),
                    );
                  }
                },
                icon: controller.submitting
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.check_rounded),
                label: Text(controller.submitting ? 'Registrando...' : 'Registrar Egreso'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCloseDialog(CashShiftController controller, CashShiftModel shift) {
    final cashController = TextEditingController();
    final usdController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 24, right: 24, top: 24,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Cerrar Turno', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 4),
            const Text('Registra el conteo final de caja', style: TextStyle(color: AppTheme.slate500, fontSize: 13)),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.slate50,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Efectivo esperado', style: TextStyle(fontSize: 13)),
                  Text('C\$ ${_fmt(shift.expectedCash ?? shift.startingCash)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: cashController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                labelText: 'Efectivo Real Contado (C\$)',
                prefixIcon: const Icon(Icons.monetization_on_rounded),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: usdController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                labelText: 'Dólares Reales Contados (\$)',
                prefixIcon: const Icon(Icons.attach_money_rounded),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: controller.submitting ? null : () async {
                  final actualCash = double.tryParse(cashController.text.trim());
                  final actualUSD = double.tryParse(usdController.text.trim());
                  if (actualCash == null || actualCash < 0) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Ingresa el efectivo real contado'), backgroundColor: AppTheme.error),
                    );
                    return;
                  }
                  final success = await controller.closeShift(
                    storeId: widget.storeId,
                    actualCash: actualCash,
                    actualUSD: actualUSD,
                  );
                  if (mounted) Navigator.pop(ctx);
                  if (success && mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('✅ Turno cerrado con éxito'), backgroundColor: Color(0xFF10B981)),
                    );
                  }
                },
                icon: controller.submitting
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.lock_rounded),
                label: Text(controller.submitting ? 'Cerrando...' : 'Cerrar Turno'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.error,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _fmt(double? v) {
    if (v == null) return '0.00';
    return v.toStringAsFixed(2);
  }

  double _totalOutflows(List<CashOutflowModel> list) {
    double total = 0;
    for (final o in list) {
      total += o.amount;
    }
    return total;
  }

  String _fmtDate(String ts) {
    try {
      final dt = DateTime.parse(ts);
      final d = '${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')}';
      final t = '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
      return '$d $t';
    } catch (_) {
      return ts;
    }
  }
}
