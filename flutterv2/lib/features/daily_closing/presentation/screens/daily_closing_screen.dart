import 'package:flutter/material.dart';

import '../../../../core/theme/app_theme.dart';
import '../../data/daily_closing_repository.dart';

class DailyClosingScreen extends StatefulWidget {
  const DailyClosingScreen({
    required this.storeId,
    this.storeName,
    super.key,
  });

  final String storeId;
  final String? storeName;

  @override
  State<DailyClosingScreen> createState() => _DailyClosingScreenState();
}

class _DailyClosingScreenState extends State<DailyClosingScreen> {
  final _repository = DailyClosingRepository();
  final _notesController = TextEditingController();
  final _salesController = TextEditingController();
  final _collectionsController = TextEditingController();
  final _returnsController = TextEditingController();

  bool _loading = true;
  bool _submitting = false;
  bool _alreadyClosed = false;

  String get _todayDateStr {
    final now = DateTime.now();
    return '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
  }

  @override
  void initState() {
    super.initState();
    _checkClosing();
  }

  Future<void> _checkClosing() async {
    setState(() => _loading = true);
    final closed = await _repository.hasClosingForToday(
      storeId: widget.storeId,
      date: _todayDateStr,
    );
    if (mounted) {
      setState(() {
        _alreadyClosed = closed;
        _loading = false;
      });
    }
  }

  @override
  void dispose() {
    _notesController.dispose();
    _salesController.dispose();
    _collectionsController.dispose();
    _returnsController.dispose();
    super.dispose();
  }

  Future<void> _submitClosing() async {
    final sales = double.tryParse(_salesController.text.trim()) ?? 0.0;
    final collections = double.tryParse(_collectionsController.text.trim()) ?? 0.0;
    final returns = double.tryParse(_returnsController.text.trim()) ?? 0.0;
    final cashTotal = sales + collections - returns;

    setState(() => _submitting = true);

    final success = await _repository.submitClosing(
      storeId: widget.storeId,
      totalSales: sales,
      totalCollections: collections,
      totalReturns: returns,
      cashTotal: cashTotal,
      closingDate: _todayDateStr,
      notes: _notesController.text.trim(),
    );

    if (mounted) {
      setState(() => _submitting = false);
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Cierre diario registrado con éxito.'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
        setState(() => _alreadyClosed = true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('❌ Error al registrar el cierre diario.'),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Cierre Diario de Caja', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            if (widget.storeName != null)
              Text(widget.storeName!, style: const TextStyle(fontSize: 12, color: AppTheme.slate500)),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (_alreadyClosed)
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFA7F3D0)),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 32),
                        SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Cierre de Hoy Completado', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF065F46))),
                              SizedBox(height: 2),
                              Text('Ya has registrado el cierre de caja para el día de hoy.', style: TextStyle(color: Color(0xFF047857), fontSize: 13)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  )
                else ...[
                  const Text('Resumen del Día', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _salesController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: InputDecoration(
                      labelText: 'Ventas Totales en Efectivo (C\$)',
                      prefixIcon: const Icon(Icons.attach_money_rounded),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _collectionsController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: InputDecoration(
                      labelText: 'Cobros / Abonos Recaudados (C\$)',
                      prefixIcon: const Icon(Icons.payments_rounded),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _returnsController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: InputDecoration(
                      labelText: 'Devoluciones en Efectivo (C\$)',
                      prefixIcon: const Icon(Icons.assignment_return_rounded),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _notesController,
                    maxLines: 2,
                    decoration: InputDecoration(
                      labelText: 'Observaciones o Novedades',
                      hintText: 'Ej. Arqueo sin diferencias, depósito realizado...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton.icon(
                      onPressed: _submitting ? null : _submitClosing,
                      icon: _submitting
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.lock_clock_rounded),
                      label: Text(_submitting ? 'Procesando...' : 'Finalizar y Cerrar Día'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ],
            ),
    );
  }
}
