import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../domain/models/delivery_summary.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../../warehouse/data/warehouse_repository.dart';
import '../../../../core/widgets/field/delivery_item_result_editor.dart';

class DeliveryDetailScreen extends ConsumerStatefulWidget {
  const DeliveryDetailScreen({
    required this.delivery,
    super.key,
  });

  final DeliverySummary delivery;

  @override
  ConsumerState<DeliveryDetailScreen> createState() => _DeliveryDetailScreenState();
}

class _DeliveryDetailScreenState extends ConsumerState<DeliveryDetailScreen> {
  bool _isSaving = false;

  Future<void> _openMap() async {
    final address = Uri.encodeComponent(widget.delivery.clientAddress ?? '');
    final url = Uri.parse('https://www.google.com/maps/search/?api=1&query=$address');
    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    }
  }

  Future<void> _confirmDelivery() async {
    final bool isContado = widget.delivery.paymentType?.toUpperCase() == 'CASH' || widget.delivery.paymentType?.toUpperCase() == 'CONTADO';
    
    if (isContado) {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (ctx) => _PaymentCollectionDialog(total: widget.delivery.total),
      );
      if (confirmed != true) return;
    }

    setState(() => _isSaving = true);
    try {
      final session = ref.read(authControllerProvider).session;
      if (session == null) return;

      // Update status to ENTREGADO
      await ref.read(warehouseRepositoryProvider).updateStatus(
        orderId: widget.delivery.orderId,
        accessToken: session.accessToken,
        status: 'ENTREGADO',
      );

      if (mounted) {
        context.pop(true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _recordRejection() async {
    final reason = await showDialog<String>(
      context: context,
      builder: (ctx) => _RejectionDialog(),
    );

    if (reason != null) {
      setState(() => _isSaving = true);
      try {
        final session = ref.read(authControllerProvider).session;
        if (session == null) return;

        await ref.read(warehouseRepositoryProvider).updateStatus(
          orderId: widget.delivery.orderId,
          accessToken: session.accessToken,
          status: 'RECHAZO_TOTAL',
          notes: 'Motivo: $reason',
        );

        if (mounted) context.pop(true);
      } catch (e) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      } finally {
        if (mounted) setState(() => _isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final currencyFormat = NumberFormat.currency(symbol: 'C\$', decimalDigits: 2);

    return Scaffold(
      appBar: AppBar(title: const Text('Detalle de Entrega')),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                _HeaderCard(delivery: widget.delivery, onOpenMap: _openMap),
                const SizedBox(height: 24),
                Text('ITEMS A ENTREGAR:', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold, letterSpacing: 1.1)),
                const SizedBox(height: 12),
                ...widget.delivery.items.map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: DeliveryItemResultEditor(
                      productName: item.description,
                      plannedQuantity: item.quantity,
                      salePrice: item.salePrice,
                      onChanged: (delivered, rejected, reason) {
                        // Captures item delivery state
                      },
                    ),
                  ),
                ),
                const Divider(height: 32),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('TOTAL A COBRAR:', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
                    Text(currencyFormat.format(widget.delivery.total), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 22, color: Colors.blue)),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('MÉTODO DE PAGO:', style: TextStyle(fontSize: 12, color: Colors.black54)),
                    Text(widget.delivery.paymentType ?? 'Indefinido', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, -4))],
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _isSaving ? null : _recordRejection,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red,
                        side: const BorderSide(color: Colors.red),
                        minimumSize: const Size(0, 54),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('RECHAZO TOTAL', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    flex: 2,
                    child: FilledButton(
                      onPressed: _isSaving ? null : _confirmDelivery,
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF0F172A),
                        minimumSize: const Size(0, 54),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: _isSaving 
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text('ENTREGAR Y COBRAR', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({required this.delivery, required this.onOpenMap});
  final DeliverySummary delivery;
  final VoidCallback onOpenMap;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      color: Colors.grey.shade50,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: Colors.grey.shade200)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.receipt_long_rounded, color: Colors.blue),
                const SizedBox(width: 12),
                Text('Pedido #${delivery.orderId.substring(0, 8)}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
              ],
            ),
            const SizedBox(height: 12),
            Text(delivery.clientName ?? 'Cliente', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 4),
            Text(delivery.clientAddress ?? 'Sin dirección', style: const TextStyle(color: Colors.black54)),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: onOpenMap,
              icon: const Icon(Icons.map_rounded, size: 18),
              label: const Text('VER EN MAPA'),
              style: ElevatedButton.styleFrom(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                backgroundColor: Colors.white,
                foregroundColor: Colors.blue,
                elevation: 1,
              ),
            )
          ],
        ),
      ),
    );
  }
}



class _PaymentCollectionDialog extends StatefulWidget {
  const _PaymentCollectionDialog({required this.total});
  final double total;
  @override
  State<_PaymentCollectionDialog> createState() => _PaymentCollectionDialogState();
}

class _PaymentCollectionDialogState extends State<_PaymentCollectionDialog> {
  final _amountCtrl = TextEditingController();
  double _received = 0;

  @override
  Widget build(BuildContext context) {
    final change = _received - widget.total;

    return AlertDialog(
      title: const Text('Cobro en Efectivo'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('Total a cobrar: C\$ ${widget.total.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 20),
          TextField(
            controller: _amountCtrl,
            autofocus: true,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Efectivo Recibido (C\$)', border: OutlineInputBorder()),
            onChanged: (val) => setState(() => _received = double.tryParse(val) ?? 0),
          ),
          const SizedBox(height: 16),
          if (change >= 0)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(8)),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('CAMBIO: ', style: TextStyle(fontWeight: FontWeight.bold)),
                  Text('C\$ ${change.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w900, color: Colors.green)),
                ],
              ),
            ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('CANCELAR')),
        FilledButton(
          onPressed: _received >= widget.total ? () => Navigator.pop(context, true) : null,
          child: const Text('CONFIRMAR COBRO'),
        ),
      ],
    );
  }
}

class _RejectionDialog extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final List<String> reasons = [
      'Cliente ausente',
      'No tiene dinero',
      'Producto dañado',
      'Dirección incorrecta',
      'Otro'
    ];

    return SimpleDialog(
      title: const Text('Motivo del Rechazo'),
      children: reasons.map((r) => SimpleDialogOption(
        onPressed: () => Navigator.pop(context, r),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Text(r, style: const TextStyle(fontSize: 16)),
        ),
      )).toList(),
    );
  }
}
