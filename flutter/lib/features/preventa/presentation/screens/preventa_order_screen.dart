import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';
import '../../../../core/database/local_cache_repository.dart';
import '../../../../core/network/api_client.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../../clients/domain/models/client_summary.dart';

class PreventaOrderScreen extends ConsumerStatefulWidget {
  final String clientId;
  final String clientName;

  const PreventaOrderScreen({super.key, required this.clientId, required this.clientName});

  @override
  ConsumerState<PreventaOrderScreen> createState() => _PreventaOrderScreenState();
}

class _PreventaOrderScreenState extends ConsumerState<PreventaOrderScreen> {
  final List<Map<String, dynamic>> _cart = [];
  bool _isCredit = false;
  double _creditLimit = 0;
  List<Map<String, dynamic>> _catalog = [];
  bool _loadingCatalog = true;
  bool _loadingClient = true;

  @override
  void initState() {
    super.initState();
    _loadCatalog();
    _loadClientData();
  }

  Future<void> _loadClientData() async {
    try {
      final apiClient = ref.read(appApiClientProvider);
      final session = ref.read(authControllerProvider).session;
      if (session == null) return;
      final data = await apiClient.getMap(
        '/clients/${widget.clientId}',
        bearerToken: session.accessToken,
      );
      final client = ClientSummary.fromJson(data);
      _creditLimit = client.creditLimit?.toDouble() ?? 0;
    } catch (_) {
      _creditLimit = 0;
    }
    if (mounted) setState(() => _loadingClient = false);
  }

  Future<void> _loadCatalog() async {
    final storeId = ref.read(authControllerProvider).session?.user.primaryStoreId;
    if (storeId == null || storeId.isEmpty) {
      setState(() => _loadingCatalog = false);
      return;
    }

    final products = await ref.read(localCacheRepositoryProvider).getCatalogProducts(storeId);
    if (!mounted) return;

    setState(() {
      _catalog = products
          .map((product) => {
                'id': product.id,
                'name': product.description,
                'price': product.salePrice,
                'stock': product.currentStock,
              })
          .toList();
      _loadingCatalog = false;
    });
  }

  /*
   * Add to cart helper
   */
  void _addToCart(Map<String, dynamic> product) {
    setState(() {
      final existing = _cart.indexWhere((e) => e['id'] == product['id']);
      if (existing >= 0) {
        _cart[existing]['quantity']++;
      } else {
        _cart.add({
          ...product,
          'quantity': 1,
          'presentation': 'UNIT',
          'priceLevel': 1,
        });
      }
    });
  }

  void _removeFromCart(int index) {
    setState(() {
      if (_cart[index]['quantity'] > 1) {
        _cart[index]['quantity']--;
      } else {
        _cart.removeAt(index);
      }
    });
  }

  double get _subtotal {
    return _cart.fold(
      0,
      (sum, item) => sum + (item['price'] as double) * (item['quantity'] as int),
    );
  }

  void _submitOrder() async {
    final authState = ref.read(authControllerProvider);
    final userId = authState.session?.user.id;
    final storeId = authState.session?.user.primaryStoreId;
    if (storeId == null ||
        storeId.isEmpty ||
        userId == null ||
        userId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No hay sesión o tienda activa para guardar el pedido.'),
        ),
      );
      return;
    }

    final payload = {
      'externalId': const Uuid().v4(),
      'clientId': widget.clientId,
      'userId': userId,
      'storeId': storeId,
      'paymentType': _isCredit ? 'CREDITO' : 'CONTADO',
      'items': _cart
          .map((item) => {
                'productId': item['id'],
                'quantity': item['quantity'],
                'price': item['price'],
                'unitPrice': item['price'],
                'presentation': item['presentation'],
                'priceLevel': item['priceLevel'],
              })
          .toList(),
      'subtotal': _subtotal,
      'notes': 'Pedido offline preventa',
    };

    await ref.read(localCacheRepositoryProvider).enqueueSyncAction(
          method: 'POST',
          endpoint: '/orders',
          storeId: storeId,
          operationType: 'CREATE_ORDER',
          payload: payload,
        );

    if (!mounted) return;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        icon: const Icon(
          Icons.check_circle_rounded,
          color: Colors.green,
          size: 48,
        ),
        title: const Text('Pedido Guardado'),
        content: const Text(
          'El pedido ha sido guardado exitosamente y será sincronizado automáticamente cuando haya conexión.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              context.pop();
            },
            child: const Text('Entendido'),
          )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final hasWarning = _cart.any((i) => i['priceLevel'] > 3);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Pedido - ${widget.clientName}', style: const TextStyle(fontSize: 16)),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
      ),
      body: Row(
        children: [
          // Left side: Catalog
          Expanded(
            flex: 3,
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  color: Colors.white,
                  child: TextField(
                    decoration: InputDecoration(
                      hintText: 'Buscar producto...',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      filled: true,
                      fillColor: Colors.grey.shade100,
                      contentPadding: EdgeInsets.zero
                    ),
                  ),
                ),
                Expanded(
                  child: _loadingCatalog
                        ? const Center(child: CircularProgressIndicator())
                        : _catalog.isEmpty
                          ? const Center(child: Text('No hay catálogo local sincronizado.'))
                          : ListView.builder(
                    itemCount: _catalog.length,
                    itemBuilder: (context, index) {
                      final p = _catalog[index];
                      return ListTile(
                        title: Text(p['name']),
                        subtitle: Text('Bodega: ${p['stock']} disp.'),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('C\$ ${p['price']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                            const SizedBox(width: 8),
                            IconButton(
                              style: IconButton.styleFrom(backgroundColor: const Color(0xFF047857), foregroundColor: Colors.white),
                              icon: const Icon(Icons.add, size: 20),
                              onPressed: () => _addToCart(p),
                            )
                          ],
                        ),
                      );
                    },
                  )
                )
              ],
            )
          ),
          
          const VerticalDivider(width: 1),

          // Right side: Cart Drawer/Panel
          Expanded(
            flex: 2,
            child: Container(
              color: Colors.white,
              child: Column(
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    color: Colors.grey.shade50,
                    child: const Text('Resumen del Pedido', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                  Expanded(
                    child: _cart.isEmpty 
                      ? const Center(child: Text('Carrito vacío', style: TextStyle(color: Colors.grey)))
                      : ListView.separated(
                          itemCount: _cart.length,
                          separatorBuilder: (_, _) => const Divider(height: 1),
                          itemBuilder: (context, index) {
                            final item = _cart[index];
                            return Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(item['name'], style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                        Row(
                                          children: [
                                            Text('${item['quantity']}x @ C\$${item['price']}', style: const TextStyle(color: Colors.black54, fontSize: 12)),
                                            if (item['priceLevel'] > 1) ...[
                                              const SizedBox(width: 6),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                                decoration: BoxDecoration(color: Colors.amber.shade100, borderRadius: BorderRadius.circular(4)),
                                                child: Text('N${item['priceLevel']}', style: TextStyle(fontSize: 10, color: Colors.amber.shade900, fontWeight: FontWeight.bold)),
                                              )
                                            ]
                                          ],
                                        )
                                      ],
                                    ),
                                  ),
                                  Text('C\$ ${item['price'] * item['quantity']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                                  IconButton(
                                    icon: const Icon(Icons.remove_circle_outline, color: Colors.red, size: 20),
                                    onPressed: () => _removeFromCart(index),
                                    constraints: const BoxConstraints(),
                                    padding: EdgeInsets.zero,
                                  )
                                ],
                              ),
                            );
                          },
                        ),
                  ),
                  if (hasWarning)
                    Container(
                      padding: const EdgeInsets.all(10),
                      color: Colors.orange.shade50,
                      child: Row(
                         children: [
                            Icon(Icons.warning_amber_rounded, color: Colors.orange.shade800, size: 20),
                            const SizedBox(width: 8),
                            const Expanded(child: Text('Requiere autorización de precio (Nivel >= 4). Se facturará al aprobarse.', style: TextStyle(fontSize: 11, color: Colors.orange))),
                         ],
                      ),
                    ),
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border(top: BorderSide(color: Colors.grey.shade200)),
                    ),
                    child: Column(
                      children: [
                         Row(
                           mainAxisAlignment: MainAxisAlignment.spaceBetween,
                           children: [
                             const Text('Subtotal:', style: TextStyle(fontSize: 16)),
                             Text('C\$ $_subtotal', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                           ],
                         ),
                         const SizedBox(height: 16),
                         // Payment selector
                         Row(
                           children: [
                             Expanded(
                               child: GestureDetector(
                                 onTap: () => setState(() => _isCredit = false),
                                 child: Container(
                                   padding: const EdgeInsets.symmetric(vertical: 10),
                                   decoration: BoxDecoration(
                                     color: !_isCredit ? const Color(0xFF0F172A) : Colors.grey.shade200,
                                     borderRadius: BorderRadius.circular(8)
                                   ),
                                   alignment: Alignment.center,
                                   child: Text('CONTADO', style: TextStyle(color: !_isCredit ? Colors.white : Colors.black54, fontWeight: FontWeight.bold)),
                                 ),
                               ),
                             ),
                             const SizedBox(width: 10),
                             Expanded(
                               child: GestureDetector(
                                 onTap: () => setState(() => _isCredit = true),
                                 child: Container(
                                   padding: const EdgeInsets.symmetric(vertical: 10),
                                   decoration: BoxDecoration(
                                     color: _isCredit ? const Color(0xFF0F172A) : Colors.grey.shade200,
                                     borderRadius: BorderRadius.circular(8)
                                   ),
                                   alignment: Alignment.center,
                                   child: Text('CRÉDITO', style: TextStyle(color: _isCredit ? Colors.white : Colors.black54, fontWeight: FontWeight.bold)),
                                 ),
                               ),
                             )
                           ],
                         ),
                         if (_isCredit) ...[
                           const SizedBox(height: 12),
                           Row(
                             mainAxisAlignment: MainAxisAlignment.spaceBetween,
                             children: [
                               const Text('Crédito Disp:', style: TextStyle(fontSize: 12, color: Colors.black54)),
                               Text('C\$ $_creditLimit', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _subtotal > _creditLimit ? Colors.red : Colors.green)),
                             ],
                           ),
                         ],
                         const SizedBox(height: 20),
                         ElevatedButton(
                           onPressed: _cart.isEmpty || (_isCredit && _subtotal > _creditLimit) ? null : _submitOrder,
                           style: ElevatedButton.styleFrom(
                             backgroundColor: const Color(0xFF047857),
                             foregroundColor: Colors.white,
                             minimumSize: const Size(double.infinity, 54),
                             shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))
                           ),
                           child: const Text('ENVIAR PEDIDO', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                         )
                      ],
                    ),
                  )
                ],
              ),
            )
          )
        ],
      ),
    );
  }
}
