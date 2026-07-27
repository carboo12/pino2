import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_theme.dart';

class _AdjustmentItem {
  final String productId;
  final String description;
  final double currentStock;
  int diffQuantity = 1;
  String reason = 'Ajuste In-situ App';

  _AdjustmentItem({
    required this.productId,
    required this.description,
    required this.currentStock,
  });
}

class InventoryAdjustmentsScreen extends StatefulWidget {
  final String storeId;
  final String? storeName;

  const InventoryAdjustmentsScreen({
    required this.storeId,
    this.storeName,
    super.key,
  });

  @override
  State<InventoryAdjustmentsScreen> createState() => _InventoryAdjustmentsScreenState();
}

class _InventoryAdjustmentsScreenState extends State<InventoryAdjustmentsScreen> {
  final TextEditingController _searchController = TextEditingController();
  final List<_AdjustmentItem> _items = [];
  bool _isLoading = false;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _searchProduct(String query) async {
    if (query.trim().isEmpty) return;

    setState(() => _isLoading = true);
    try {
      final response = await ApiClient.dio.get(
        '/products',
        queryParameters: {
          'storeId': widget.storeId,
          'search': query.trim(),
          'limit': 5,
        },
      );

      final list = response.data is List ? (response.data as List) : [];
      if (list.isNotEmpty) {
        final product = list.first;
        final existingIndex = _items.indexWhere((i) => i.productId == product['id']);

        setState(() {
          if (existingIndex >= 0) {
            _items[existingIndex].diffQuantity += 1;
          } else {
            _items.add(_AdjustmentItem(
              productId: product['id']?.toString() ?? '',
              description: product['description']?.toString() ?? 'Producto',
              currentStock: double.tryParse('${product['currentStock'] ?? 0}') ?? 0.0,
            ));
          }
          _searchController.clear();
        });
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('No se encontró ningún producto con ese criterio.')),
          );
        }
      }
    } on DioException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error de búsqueda: ${e.message}')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _submitAdjustments() async {
    if (_items.isEmpty) return;

    setState(() => _isSubmitting = true);
    try {
      for (final item in _items) {
        await ApiClient.dio.post('/inventory/adjustments', data: {
          'storeId': widget.storeId,
          'productId': item.productId,
          'diffQuantity': item.diffQuantity,
          'reason': item.reason,
        });
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Ajustes de inventario procesados con éxito.'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
        setState(() => _items.clear());
      }
    } on DioException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('❌ Error al procesar ajuste: ${e.message}'),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Ajustes de Inventario', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            if (widget.storeName != null)
              Text(widget.storeName!, style: const TextStyle(fontSize: 12, color: AppTheme.slate500)),
          ],
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Escanear código de barras o buscar...',
                prefixIcon: const Icon(Icons.qr_code_scanner_rounded),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.search_rounded),
                  onPressed: () => _searchProduct(_searchController.text),
                ),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onSubmitted: _searchProduct,
            ),
            const SizedBox(height: 16),
            if (_isLoading) const LinearProgressIndicator(),
            const SizedBox(height: 8),

            Expanded(
              child: _items.isEmpty
                  ? const Center(
                      child: Text(
                        'Escanea un producto o búscalo por nombre para ajustar el stock.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: AppTheme.slate500),
                      ),
                    )
                  : ListView.builder(
                      itemCount: _items.length,
                      itemBuilder: (context, index) {
                        final item = _items[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        item.description,
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                      ),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.delete_outline_rounded, color: AppTheme.error),
                                      onPressed: () {
                                        setState(() => _items.removeAt(index));
                                      },
                                    ),
                                  ],
                                ),
                                Text(
                                  'Stock Actual en Sistema: ${item.currentStock}',
                                  style: const TextStyle(color: AppTheme.slate600, fontSize: 13),
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    const Text('Diferencia (+/-): ', style: TextStyle(fontWeight: FontWeight.bold)),
                                    IconButton(
                                      icon: const Icon(Icons.remove_circle_outline_rounded, color: AppTheme.primary),
                                      onPressed: () {
                                        setState(() => item.diffQuantity--);
                                      },
                                    ),
                                    Text(
                                      '${item.diffQuantity > 0 ? "+${item.diffQuantity}" : item.diffQuantity}',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                        color: item.diffQuantity > 0 ? const Color(0xFF10B981) : AppTheme.error,
                                      ),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.add_circle_outline_rounded, color: AppTheme.primary),
                                      onPressed: () {
                                        setState(() => item.diffQuantity++);
                                      },
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),

            if (_items.isNotEmpty)
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: _isSubmitting ? null : _submitAdjustments,
                  icon: _isSubmitting
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.save_rounded),
                  label: Text(_isSubmitting ? 'Guardando...' : 'Aplicar Ajustes (${_items.length})'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
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
}
