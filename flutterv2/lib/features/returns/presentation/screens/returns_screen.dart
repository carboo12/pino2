import 'package:flutter/material.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/stock_display.dart';
import '../../data/returns_repository.dart';
import '../../domain/models/sale_lookup.dart';

class ReturnsScreen extends StatefulWidget {
  const ReturnsScreen({
    required this.storeId,
    this.storeName,
    super.key,
  });

  final String storeId;
  final String? storeName;

  @override
  State<ReturnsScreen> createState() => _ReturnsScreenState();
}

class _ReturnsScreenState extends State<ReturnsScreen> {
  final _repository = ReturnsRepository();
  final _ticketController = TextEditingController();
  final _notesController = TextEditingController();

  SaleLookup? _sale;
  bool _isSearching = false;
  bool _isSubmitting = false;
  final Map<String, int> _returnQuantities = {};

  @override
  void dispose() {
    _ticketController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _searchSale() async {
    final ref = _ticketController.text.trim();
    if (ref.isEmpty) return;

    setState(() => _isSearching = true);

    final sale = await _repository.findSale(
      saleReference: ref,
      storeId: widget.storeId,
    );

    if (mounted) {
      setState(() {
        _isSearching = false;
        _sale = sale;
        _returnQuantities.clear();
        if (sale != null) {
          for (final item in sale.items) {
            _returnQuantities[item.productId] = 0;
          }
        }
      });

      if (sale == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se encontró el ticket de venta indicado.')),
        );
      }
    }
  }

  void _changeQuantity(SaleLookupItem item, int delta) {
    setState(() {
      final current = _returnQuantities[item.productId] ?? 0;
      final next = (current + delta).clamp(0, item.quantity);
      _returnQuantities[item.productId] = next;
    });
  }

  Future<void> _submitReturn() async {
    final sale = _sale;
    if (sale == null) return;

    final items = sale.items
        .where((item) => (_returnQuantities[item.productId] ?? 0) > 0)
        .map((item) {
      final totalQty = _returnQuantities[item.productId] ?? 0;
      final split = splitIntoBulkUnits(totalUnits: totalQty, unitsPerBulk: item.unitsPerBulk);
      return {
        'productId': item.productId,
        'quantity': totalQty,
        'quantityBulks': split.bulks,
        'quantityUnits': split.units,
      };
    }).toList();

    if (items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Selecciona al menos un artículo a devolver.')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final success = await _repository.createReturn(
      storeId: widget.storeId,
      saleId: sale.id,
      items: items,
      notes: _notesController.text,
    );

    if (mounted) {
      setState(() => _isSubmitting = false);
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ Devolución registrada para el ticket ${sale.ticketNumber}.'),
            backgroundColor: const Color(0xFF10B981),
          ),
        );
        setState(() {
          _sale = null;
          _ticketController.clear();
          _notesController.clear();
          _returnQuantities.clear();
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('❌ Error al procesar la devolución.'),
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
            const Text('Devolución de Productos', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            if (widget.storeName != null)
              Text(widget.storeName!, style: const TextStyle(fontSize: 12, color: AppTheme.slate500)),
          ],
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Buscar Ticket
          Container(
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
                const Text('Buscar Ticket de Venta', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _ticketController,
                        decoration: InputDecoration(
                          hintText: 'Número de ticket o ID de venta...',
                          prefixIcon: const Icon(Icons.receipt_long_rounded),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onSubmitted: (_) => _searchSale(),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: _isSearching ? null : _searchSale,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                      ),
                      child: _isSearching
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.search_rounded),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          if (_sale != null) ...[
            // Cabecera Ticket Encontrado
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.slate50,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.slate200),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Ticket: ${_sale!.ticketNumber}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      Text('Total Venta: C\$${_sale!.total.toStringAsFixed(2)}', style: const TextStyle(color: AppTheme.slate600, fontSize: 13)),
                    ],
                  ),
                  const Chip(
                    label: Text('Encontrado', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                    backgroundColor: Color(0xFF10B981),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Artículos
            const Text('Artículos Comprados', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            ..._sale!.items.map((item) {
              final qty = _returnQuantities[item.productId] ?? 0;
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.slate200),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item.description, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          Text(
                            'Comprado: ${item.quantity}  ·  C\$${item.salePrice.toStringAsFixed(2)} c/u',
                            style: const TextStyle(color: AppTheme.slate600, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.remove_circle_outline_rounded, color: AppTheme.primary),
                          onPressed: qty > 0 ? () => _changeQuantity(item, -1) : null,
                        ),
                        Text('$qty', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        IconButton(
                          icon: const Icon(Icons.add_circle_outline_rounded, color: AppTheme.primary),
                          onPressed: qty < item.quantity ? () => _changeQuantity(item, 1) : null,
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }),

            const SizedBox(height: 16),

            // Notas
            TextField(
              controller: _notesController,
              decoration: InputDecoration(
                labelText: 'Motivo o notas de la devolución',
                hintText: 'Ej. Producto defectuoso o empaque dañado',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 20),

            // Botón Confirmar
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: _isSubmitting ? null : _submitReturn,
                icon: _isSubmitting
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.assignment_return_rounded),
                label: Text(_isSubmitting ? 'Procesando...' : 'Confirmar Devolución'),
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
