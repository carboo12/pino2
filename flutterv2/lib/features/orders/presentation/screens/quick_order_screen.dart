import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../auth/presentation/auth_controller.dart';
import '../../../catalog/data/catalog_repository.dart';
import '../../../catalog/domain/models/catalog_product.dart';
import '../../../clients/data/client_portfolio_repository.dart';
import '../../../clients/domain/models/client_summary.dart';
import '../../data/quick_order_repository.dart';

class QuickOrderScreen extends StatefulWidget {
  const QuickOrderScreen({
    required this.storeId,
    this.storeName,
    super.key,
  });

  final String storeId;
  final String? storeName;

  @override
  State<QuickOrderScreen> createState() => _QuickOrderScreenState();
}

class _QuickOrderScreenState extends State<QuickOrderScreen> {
  final _productSearchController = TextEditingController();
  final _notesController = TextEditingController();
  final _catalogRepo = CatalogRepository();
  final _clientRepo = ClientPortfolioRepository();
  final _orderRepo = QuickOrderRepository();

  List<CatalogProduct> _products = [];
  List<ClientSummary> _clients = [];
  bool _loadingBootstrap = true;

  String _productSearch = '';
  final String _paymentType = 'CONTADO';
  final int _priceLevel = 1;
  ClientSummary? _selectedClient;
  bool _isSubmitting = false;
  final Map<String, _DraftOrderItem> _draftItems = {};

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    setState(() => _loadingBootstrap = true);
    final results = await Future.wait([
      _catalogRepo.getProducts(storeId: widget.storeId),
      _clientRepo.getClients(storeId: widget.storeId),
    ]);
    if (mounted) {
      setState(() {
        _products = results[0] as List<CatalogProduct>;
        _clients = results[1] as List<ClientSummary>;
        _loadingBootstrap = false;
      });
    }
  }

  @override
  void dispose() {
    _productSearchController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _addProduct(CatalogProduct product) {
    setState(() {
      final existing = _draftItems[product.id];
      if (existing == null) {
        _draftItems[product.id] = _DraftOrderItem(product: product, quantity: 1);
      } else {
        _draftItems[product.id] = existing.copyWith(quantity: existing.quantity + 1);
      }
    });
  }

  void _changeQuantity(CatalogProduct product, int delta) {
    setState(() {
      final existing = _draftItems[product.id];
      if (existing == null) {
        if (delta > 0) {
          _draftItems[product.id] = _DraftOrderItem(product: product, quantity: delta);
        }
        return;
      }
      final next = existing.quantity + delta;
      if (next <= 0) {
        _draftItems.remove(product.id);
        return;
      }
      _draftItems[product.id] = existing.copyWith(quantity: next);
    });
  }

  Future<void> _submitOrder() async {
    final auth = context.read<AuthController>();
    final user = auth.user;
    if (user == null) return;

    if (_selectedClient == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Primero selecciona un cliente.')),
      );
      return;
    }

    if (_draftItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Agrega al menos un producto.')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final client = _selectedClient!;
      await _orderRepo.createOrder(
        storeId: widget.storeId,
        clientId: client.id,
        clientName: client.name,
        vendorId: user.carnet,
        salesManagerName: user.nombre,
        paymentType: _paymentType,
        notes: _notesController.text,
        items: _draftItems.values
            .map(
              (item) => {
                'productId': item.product.id,
                'quantity': item.quantity,
                'unitPrice': item.product.priceForLevel(_priceLevel),
                'presentation': 'UNIT',
                'priceLevel': _priceLevel,
              },
            )
            .toList(),
      );

      if (mounted) {
        setState(() {
          _draftItems.clear();
          _notesController.clear();
          _productSearchController.clear();
          _productSearch = '';
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Pedido enviado exitosamente para ${client.name}.'),
            backgroundColor: AppTheme.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al enviar pedido: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final total = _draftItems.values.fold<double>(
      0,
      (sum, item) => sum + (item.quantity * item.product.priceForLevel(_priceLevel)),
    );

    final filteredProducts = _products.where((p) {
      if (_productSearch.isEmpty) return true;
      final q = _productSearch.toLowerCase();
      return p.description.toLowerCase().contains(q) ||
          (p.barcode != null && p.barcode!.contains(q));
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Nuevo Pedido', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            if (widget.storeName != null)
              Text(
                widget.storeName!,
                style: const TextStyle(fontSize: 12, color: AppTheme.slate500),
              ),
          ],
        ),
      ),
      body: _loadingBootstrap
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Header Selector de cliente
                Container(
                  padding: const EdgeInsets.all(16),
                  color: Colors.white,
                  child: Column(
                    children: [
                      InkWell(
                        onTap: () => _pickClient(_clients),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            border: Border.all(color: AppTheme.slate300),
                            borderRadius: BorderRadius.circular(12),
                            color: AppTheme.slate50,
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.person_pin_rounded, color: AppTheme.primary),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  _selectedClient != null
                                      ? _selectedClient!.name
                                      : 'Seleccionar Cliente *',
                                  style: TextStyle(
                                    fontWeight: _selectedClient != null ? FontWeight.bold : FontWeight.normal,
                                    color: _selectedClient != null ? AppTheme.slate900 : AppTheme.slate500,
                                  ),
                                ),
                              ),
                              const Icon(Icons.arrow_drop_down_rounded, color: AppTheme.slate600),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _productSearchController,
                        onChanged: (v) => setState(() => _productSearch = v),
                        decoration: InputDecoration(
                          hintText: 'Buscar producto por nombre o código...',
                          prefixIcon: const Icon(Icons.search_rounded),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),

                // Lista de productos
                Expanded(
                  child: filteredProducts.isEmpty
                      ? const Center(child: Text('No hay productos disponibles'))
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: filteredProducts.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 8),
                          itemBuilder: (ctx, i) {
                            final prod = filteredProducts[i];
                            final draft = _draftItems[prod.id];
                            final qty = draft?.quantity ?? 0;
                            final price = prod.priceForLevel(_priceLevel);

                            return Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: qty > 0 ? AppTheme.primary : AppTheme.slate200),
                              ),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          prod.description,
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          'Stock: ${prod.stockLabel} | C\$${price.toStringAsFixed(2)}',
                                          style: const TextStyle(fontSize: 12, color: AppTheme.slate600),
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (qty == 0)
                                    ElevatedButton(
                                      onPressed: () => _addProduct(prod),
                                      style: ElevatedButton.styleFrom(
                                        minimumSize: const Size(80, 36),
                                        padding: const EdgeInsets.symmetric(horizontal: 12),
                                      ),
                                      child: const Text('Agregar'),
                                    )
                                  else
                                    Row(
                                      children: [
                                        IconButton(
                                          icon: const Icon(Icons.remove_circle_outline, color: AppTheme.primary),
                                          onPressed: () => _changeQuantity(prod, -1),
                                        ),
                                        Text('$qty', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                        IconButton(
                                          icon: const Icon(Icons.add_circle_outline, color: AppTheme.primary),
                                          onPressed: () => _changeQuantity(prod, 1),
                                        ),
                                      ],
                                    ),
                                ],
                              ),
                            );
                          },
                        ),
                ),

                // Footer resumen y enviar
                if (_draftItems.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, -4))],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '${_draftItems.length} producto(s) en pedido',
                              style: const TextStyle(color: AppTheme.slate600),
                            ),
                            Text(
                              'Total: C\$${total.toStringAsFixed(2)}',
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primary),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          height: 48,
                          child: ElevatedButton(
                            onPressed: _isSubmitting ? null : _submitOrder,
                            child: _isSubmitting
                                ? const CircularProgressIndicator(color: Colors.white)
                                : const Text('Confirmar y Enviar Pedido', style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
    );
  }

  void _pickClient(List<ClientSummary> clients) async {
    final selected = await showModalBottomSheet<ClientSummary>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Container(
        height: MediaQuery.of(ctx).size.height * 0.7,
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Text('Seleccionar Cliente', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Expanded(
              child: ListView.separated(
                itemCount: clients.length,
                separatorBuilder: (_, _) => const Divider(),
                itemBuilder: (ctx, i) {
                  final c = clients[i];
                  return ListTile(
                    title: Text(c.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text(c.address ?? c.phone ?? 'Sin dirección'),
                    onTap: () => Navigator.pop(ctx, c),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );

    if (selected != null) {
      setState(() => _selectedClient = selected);
    }
  }
}

class _DraftOrderItem {
  const _DraftOrderItem({
    required this.product,
    required this.quantity,
  });

  final CatalogProduct product;
  final int quantity;

  _DraftOrderItem copyWith({int? quantity}) {
    return _DraftOrderItem(
      product: product,
      quantity: quantity ?? this.quantity,
    );
  }
}
