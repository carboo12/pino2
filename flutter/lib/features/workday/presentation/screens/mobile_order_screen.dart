import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/database/local_cache_repository.dart';
import '../../../../core/network/api_client.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../../catalog/domain/models/catalog_product.dart';

class _CartItem {
  final CatalogProduct product;
  int quantity = 1;

  _CartItem({required this.product});

  double get total => product.salePrice * quantity;
}

final _catalogProvider = FutureProvider.family<List<CatalogProduct>, String>(
    (ref, storeId) async {
  final repository = ref.read(localCacheRepositoryProvider);
  return repository.getCatalogProducts(storeId);
});

class MobileOrderScreen extends ConsumerStatefulWidget {
  final String? clientId;
  final String? clientName;

  const MobileOrderScreen({
    super.key,
    this.clientId,
    this.clientName,
  });

  @override
  ConsumerState<MobileOrderScreen> createState() => _MobileOrderScreenState();
}

class _MobileOrderScreenState extends ConsumerState<MobileOrderScreen> {
  final List<_CartItem> _cart = [];
  final TextEditingController _searchCtrl = TextEditingController();
  List<CatalogProduct> _filteredProducts = [];
  final bool _isCredit = false;
  final double _creditLimit = 0;
  bool _saving = false;

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  bool get _cartNotEmpty => _cart.isNotEmpty;
  double get _cartTotal => _cart.fold(0.0, (sum, item) => sum + item.total);

  void _addToCart(CatalogProduct product) {
    setState(() {
      final existing = _cart.where((c) => c.product.id == product.id).firstOrNull;
      if (existing != null) {
        existing.quantity++;
      } else {
        _cart.add(_CartItem(product: product));
      }
    });
  }

  void _removeFromCart(int index) {
    setState(() => _cart.removeAt(index));
  }

  void _changeQuantity(int index, int delta) {
    setState(() {
      if (delta < 0 && _cart[index].quantity <= 1) {
        _cart.removeAt(index);
      } else {
        _cart[index].quantity += delta;
      }
    });
  }

  Future<void> _saveOrder() async {
    if (_cart.isEmpty) return;
    setState(() => _saving = true);

    final session = ref.read(authControllerProvider).session;
    final storeId = session?.user.primaryStoreId;

    try {
      final apiClient = ref.read(appApiClientProvider);
      await apiClient.postMap(
        '/orders',
        data: {
          'storeId': storeId,
          'clientId': widget.clientId,
          'items': _cart
              .map((c) => {
                    'productId': c.product.id,
                    'quantity': c.quantity,
                    'price': c.product.salePrice,
                  })
              .toList(),
          'total': _cartTotal,
          'type': _isCredit ? 'credit' : 'cash',
        },
        bearerToken: session?.accessToken,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Pedido guardado'),
            behavior: SnackBarBehavior.floating,
          ),
        );
        context.pop();
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Error al guardar. Intenta de nuevo.'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(authControllerProvider).session;
    final storeId = session?.user.primaryStoreId ?? '';
    final catalogAsync = ref.watch(_catalogProvider(storeId));
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Nuevo pedido',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
        actions: [
          if (_cartNotEmpty)
            TextButton(
              onPressed: _saving ? null : _saveOrder,
              child: _saving
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Guardar'),
            ),
        ],
      ),
      body: Column(
        children: [
          if (widget.clientName != null)
            Container(
              width: double.infinity,
              color: theme.colorScheme.primaryContainer,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  Icon(Icons.person, size: 16,
                      color: theme.colorScheme.onPrimaryContainer),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      widget.clientName!,
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onPrimaryContainer,
                      ),
                    ),
                  ),
                  if (_isCredit)
                    Chip(
                      label: Text(
                        'Crédito: \$${_creditLimit.toStringAsFixed(2)}',
                        style: const TextStyle(fontSize: 10),
                      ),
                      visualDensity: VisualDensity.compact,
                    ),
                ],
              ),
            ),

          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Buscar producto...',
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: _searchCtrl.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          _searchCtrl.clear();
                          setState(() => _filteredProducts = []);
                        },
                      )
                    : null,
              ),
              onChanged: (q) {
                catalogAsync.whenData((products) {
                  setState(() {
                    _filteredProducts = q.length >= 2
                        ? products
                            .where((p) =>
                                p.description
                                    .toLowerCase()
                                    .contains(q.toLowerCase()) ||
                                (p.barcode?.contains(q) ?? false))
                            .take(20)
                            .toList()
                        : [];
                  });
                });
              },
            ),
          ),

          if (_filteredProducts.isNotEmpty)
            SizedBox(
              height: 160,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: _filteredProducts.length,
                separatorBuilder: (_, _) => const Divider(height: 1),
                itemBuilder: (context, i) {
                  final p = _filteredProducts[i];
                  return ListTile(
                    dense: true,
                    title: Text(p.description,
                        style: const TextStyle(fontSize: 13)),
                    subtitle: p.barcode != null
                        ? Text(p.barcode!,
                            style: const TextStyle(fontSize: 10))
                        : null,
                    trailing: Text(
                      '\$${p.salePrice.toStringAsFixed(2)}',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.primary,
                      ),
                    ),
                    onTap: () {
                      _addToCart(p);
                      _searchCtrl.clear();
                      setState(() => _filteredProducts = []);
                    },
                  );
                },
              ),
            ),

          const Divider(height: 1),

          Expanded(
            child: _cart.isEmpty
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.shopping_cart_outlined,
                            size: 48, color: theme.colorScheme.onSurfaceVariant),
                        const SizedBox(height: 12),
                        Text('Carrito vacío',
                            style: TextStyle(
                                color: theme.colorScheme.onSurfaceVariant)),
                        const SizedBox(height: 4),
                        Text('Busca productos arriba',
                            style: TextStyle(
                                fontSize: 12,
                                color: theme.colorScheme.onSurfaceVariant)),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _cart.length,
                    itemBuilder: (context, i) {
                      final item = _cart[i];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 8),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(item.product.description,
                                        style: const TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w500)),
                                    if (item.product.barcode != null)
                                      Text(item.product.barcode!,
                                          style: const TextStyle(
                                              fontSize: 10,
                                              color: Colors.grey)),
                                  ],
                                ),
                              ),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.remove_circle_outline,
                                        size: 20),
                                    onPressed: () => _changeQuantity(i, -1),
                                  ),
                                  Text('${item.quantity}',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w600)),
                                  IconButton(
                                    icon: const Icon(Icons.add_circle_outline,
                                        size: 20),
                                    onPressed: () => _changeQuantity(i, 1),
                                  ),
                                ],
                              ),
                              SizedBox(
                                width: 80,
                                child: Text(
                                  '\$${item.total.toStringAsFixed(2)}',
                                  textAlign: TextAlign.right,
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    color: theme.colorScheme.primary,
                                  ),
                                ),
                              ),
                              IconButton(
                                icon: Icon(Icons.delete_outline,
                                    size: 18, color: theme.colorScheme.error),
                                onPressed: () => _removeFromCart(i),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),

          if (_cartNotEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withAlpha(13),
                    blurRadius: 8,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: SafeArea(
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('${_cart.length} productos',
                              style: const TextStyle(fontSize: 12)),
                          Text(
                            'Total: \$${_cartTotal.toStringAsFixed(2)}',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: theme.colorScheme.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    FilledButton.icon(
                      onPressed: _saving ? null : _saveOrder,
                      icon: _saving
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child:
                                  CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.save),
                      label: const Text('Guardar pedido'),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
