import 'package:flutter/material.dart';

import '../../../../core/theme/app_theme.dart';
import '../../data/sales_history_repository.dart';

class SalesHistoryScreen extends StatefulWidget {
  const SalesHistoryScreen({
    required this.storeId,
    this.storeName,
    super.key,
  });

  final String storeId;
  final String? storeName;

  @override
  State<SalesHistoryScreen> createState() => _SalesHistoryScreenState();
}

class _SalesHistoryScreenState extends State<SalesHistoryScreen> {
  final _repository = SalesHistoryRepository();
  List<Map<String, dynamic>> _sales = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadSales();
  }

  Future<void> _loadSales() async {
    setState(() => _loading = true);
    final sales = await _repository.getSales(storeId: widget.storeId);
    if (mounted) {
      setState(() {
        _sales = sales;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final totalAmount = _sales.fold<double>(
      0,
      (sum, s) => sum + (double.tryParse(s['total']?.toString() ?? '0') ?? 0),
    );

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Ventas del Día', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            if (widget.storeName != null)
              Text(widget.storeName!, style: const TextStyle(fontSize: 12, color: AppTheme.slate500)),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadSales,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Resumen
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppTheme.primary,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: AppTheme.cardShadow,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Total Recaudado Hoy', style: TextStyle(color: Colors.white70, fontSize: 13)),
                            const SizedBox(height: 4),
                            Text(
                              'C\$${totalAmount.toStringAsFixed(2)}',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 24),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.receipt_long_rounded, color: Colors.white, size: 28),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Tickets Emitidos (${_sales.length})',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.slate900),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  if (_sales.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(32),
                      child: const Center(child: Text('No hay ventas registradas el día de hoy.')),
                    )
                  else
                    ..._sales.map(
                      (s) => Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.slate200),
                          boxShadow: AppTheme.cardShadow,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Ticket #${s['ticketNumber'] ?? s['id']?.toString().substring(0, 8) ?? '---'}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  s['clientName']?.toString() ?? 'Cliente Contado',
                                  style: const TextStyle(color: AppTheme.slate600, fontSize: 13),
                                ),
                              ],
                            ),
                            Text(
                              'C\$${(double.tryParse('${s['total'] ?? 0}') ?? 0.0).toStringAsFixed(2)}',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF10B981), fontSize: 16),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
      ),
    );
  }
}
