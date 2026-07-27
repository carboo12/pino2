import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/models/delivery_summary.dart';

class DeliveryDetailScreen extends StatefulWidget {
  const DeliveryDetailScreen({
    required this.delivery,
    super.key,
  });

  final DeliverySummary delivery;

  @override
  State<DeliveryDetailScreen> createState() => _DeliveryDetailScreenState();
}

class _DeliveryDetailScreenState extends State<DeliveryDetailScreen> {
  bool _isSaving = false;

  Future<void> _openMap() async {
    final address = Uri.encodeComponent(widget.delivery.clientAddress ?? '');
    final url = Uri.parse('https://www.google.com/maps/search/?api=1&query=$address');
    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    }
  }

  Future<void> _confirmDelivery() async {
    setState(() => _isSaving = true);
    try {
      await ApiClient.dio.patch('/orders/${widget.delivery.orderId}/status', data: {
        'status': 'ENTREGADO',
      }).catchError((_) => ApiClient.dio.patch('/orders/${widget.delivery.orderId}', data: {
        'status': 'ENTREGADO',
      }));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Entrega confirmada'), backgroundColor: AppTheme.success),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(symbol: 'C\$', decimalDigits: 2);

    return Scaffold(
      appBar: AppBar(title: const Text('Detalle de Entrega')),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                // Header Cliente
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.slate200),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.delivery.clientName ?? 'Cliente General',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        widget.delivery.clientAddress ?? 'Sin dirección especificada',
                        style: const TextStyle(color: AppTheme.slate600, fontSize: 13),
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: _openMap,
                        icon: const Icon(Icons.map_rounded, size: 18),
                        label: const Text('Ver en Mapa'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'PRODUCTOS A ENTREGAR:',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.slate700),
                ),
                const SizedBox(height: 12),
                ...widget.delivery.items.map(
                  (item) => Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.slate200),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item.description, style: const TextStyle(fontWeight: FontWeight.bold)),
                              Text('Cantidad: ${item.displayLabel}', style: const TextStyle(color: AppTheme.slate600, fontSize: 12)),
                            ],
                          ),
                        ),
                        Text(
                          currencyFormat.format(item.salePrice * item.quantity),
                          style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary),
                        ),
                      ],
                    ),
                  ),
                ),
                const Divider(height: 32),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('TOTAL A COBRAR:', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                    Text(
                      currencyFormat.format(widget.delivery.total),
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: AppTheme.primary),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: Colors.white,
              boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, -4))],
            ),
            child: SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isSaving ? null : _confirmDelivery,
                child: _isSaving
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Confirmar Entrega Realizada', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
