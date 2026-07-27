import 'package:flutter/material.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../orders/presentation/screens/quick_order_screen.dart';

class PreventaHomeScreen extends StatefulWidget {
  const PreventaHomeScreen({
    required this.storeId,
    this.storeName,
    super.key,
  });

  final String storeId;
  final String? storeName;

  @override
  State<PreventaHomeScreen> createState() => _PreventaHomeScreenState();
}

class _PreventaHomeScreenState extends State<PreventaHomeScreen> {
  int _visitsCount = 0;
  int _ordersCount = 0;
  double _totalSold = 0.0;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadMetrics();
  }

  Future<void> _loadMetrics() async {
    setState(() => _loading = true);
    final todayStr = DateTime.now().toIso8601String().split('T')[0];

    try {
      final ordersRes = await ApiClient.dio.get(
        '/orders',
        queryParameters: {
          'storeId': widget.storeId,
          'fromDate': todayStr,
        },
      );

      final visitsRes = await ApiClient.dio.get(
        '/visit-logs',
        queryParameters: {
          'storeId': widget.storeId,
          'date': todayStr,
        },
      );

      final orders = ordersRes.data is List ? (ordersRes.data as List) : [];
      final visits = visitsRes.data is List ? (visitsRes.data as List) : [];

      double total = 0.0;
      for (final o in orders) {
        total += double.tryParse('${o['total'] ?? 0}') ?? 0.0;
      }

      if (mounted) {
        setState(() {
          _ordersCount = orders.length;
          _visitsCount = visits.length;
          _totalSold = total;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
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
            const Text('Módulo de Preventa', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            if (widget.storeName != null)
              Text(widget.storeName!, style: const TextStyle(fontSize: 12, color: AppTheme.slate500)),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadMetrics,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Metric card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppTheme.primary,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: AppTheme.cardShadow,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Ventas de Preventa Hoy', style: TextStyle(color: Colors.white70, fontSize: 13)),
                        const SizedBox(height: 4),
                        Text(
                          'C\$${_totalSold.toStringAsFixed(2)}',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 26),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('📦 Pedidos: $_ordersCount', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                            Text('📍 Visitas: $_visitsCount', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  const Text('Acciones Rápidas', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 12),

                  ListTile(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: const BorderSide(color: AppTheme.slate200),
                    ),
                    tileColor: Colors.white,
                    leading: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: const BoxDecoration(color: AppTheme.slate100, shape: BoxShape.circle),
                      child: const Icon(Icons.flash_on_rounded, color: AppTheme.primary),
                    ),
                    title: const Text('Capturar Nuevo Pedido', style: TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: const Text('Tomar preventa a un cliente'),
                    trailing: const Icon(Icons.chevron_right_rounded),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => QuickOrderScreen(storeId: widget.storeId, storeName: widget.storeName),
                        ),
                      );
                    },
                  ),
                ],
              ),
      ),
    );
  }
}
