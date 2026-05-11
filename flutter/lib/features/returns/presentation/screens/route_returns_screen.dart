import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../core/network/api_client.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';

class RouteReturnsScreen extends ConsumerStatefulWidget {
  const RouteReturnsScreen({super.key});

  @override
  ConsumerState<RouteReturnsScreen> createState() => _RouteReturnsScreenState();
}

class _RouteReturnsScreenState extends ConsumerState<RouteReturnsScreen> {
  List<Map<String, dynamic>> _inventory = [];
  final Map<String, int> _returnQtys = {};
  int _selectedReasonIdx = 0;
  bool _isLoading = true;
  bool _isSaving = false;
  static const _reasons = ['Cliente ausente', 'Producto dañado', 'No tiene dinero', 'Producto vencido', 'Otro'];

  @override
  void initState() {
    super.initState();
    _loadInventory();
  }

  Future<void> _loadInventory() async {
    final session = ref.read(authControllerProvider).session;
    if (session == null) return;
    final apiClient = ref.read(appApiClientProvider);
    final token = session.accessToken;
    final userId = session.user.id;

    try {
      final data = await apiClient.getList(
        '/vendor-inventories/$userId',
        bearerToken: token,
      );
      setState(() {
        _inventory = (data as List).map((item) => item as Map<String, dynamic>).toList();
        for (final item in _inventory) {
          _returnQtys[item['id']?.toString() ?? ''] = 0;
        }
        _isLoading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  int get _totalItemsToReturn => _returnQtys.values.fold(0, (a, b) => a + b);

  Future<void> _confirmReturn() async {
    if (_totalItemsToReturn == 0) return;
    setState(() => _isSaving = true);
    try {
      final session = ref.read(authControllerProvider).session;
      if (session == null) return;
      final apiClient = ref.read(appApiClientProvider);
      final token = session.accessToken;
      final storeId = session.user.primaryStoreId;
      if (storeId == null) return;

      final items = _inventory
        .where((item) => (_returnQtys[item['id']?.toString() ?? ''] ?? 0) > 0)
        .map((item) => {
          'productId': item['productId'] ?? item['id'],
          'quantity': _returnQtys[item['id']?.toString() ?? ''] ?? 0,
          'reason': _reasons[_selectedReasonIdx],
        }).toList();

      await apiClient.postMap(
        '/returns',
        bearerToken: token,
        data: {
          'storeId': storeId,
          'ruteroId': session.user.id,
          'type': 'rutero',
          'items': items,
          'notes': 'Retorno de ruta: ${_reasons[_selectedReasonIdx]}',
        },
      );

      if (mounted) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            icon: const Icon(Icons.check_circle_rounded, color: Colors.green, size: 48),
            title: const Text('Retorno Confirmado'),
            content: const Text('Los productos han sido reintegrados al inventario de bodega correctamente.'),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  Navigator.pop(context);
                },
                child: const Text('Entendido')
              )
            ],
          )
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error al confirmar: $e')));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Devoluciones a Bodega')),
      body: _isLoading
        ? const Center(child: CircularProgressIndicator())
        : _inventory.isEmpty
          ? const Center(child: Text('No hay productos en tu inventario para devolver.'))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: Colors.amber.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.amber.shade200)),
                  child: const Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.amber),
                      SizedBox(width: 12),
                      Expanded(child: Text('Selecciona los productos que devolverás a bodega y sus cantidades.')),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<int>(
                  value: _selectedReasonIdx,
                  decoration: InputDecoration(
                    labelText: 'Motivo general de devolución',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                  ),
                  items: _reasons.asMap().entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value))).toList(),
                  onChanged: (v) => setState(() => _selectedReasonIdx = v!)),
                const SizedBox(height: 12),
                ..._inventory.map((item) {
                  final itemId = item['id']?.toString() ?? '';
                  final maxQty = int.tryParse(item['currentQuantity']?.toString() ?? '0') ?? 0;
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      title: Text(item['productName'] ?? item['description'] ?? 'Producto', style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text('Disponible: $maxQty ${item['unit'] ?? 'unidades'}'),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.remove_circle_outline, color: Colors.red),
                            onPressed: _returnQtys[itemId]! > 0
                              ? () => setState(() => _returnQtys[itemId] = _returnQtys[itemId]! - 1)
                              : null,
                          ),
                          Text('${_returnQtys[itemId] ?? 0}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                          IconButton(
                            icon: const Icon(Icons.add_circle_outline, color: Colors.green),
                            onPressed: (_returnQtys[itemId] ?? 0) < maxQty
                              ? () => setState(() => _returnQtys[itemId] = _returnQtys[itemId]! + 1)
                              : null,
                          ),
                        ],
                      ),
                    ),
                  );
                }),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _totalItemsToReturn == 0 || _isSaving ? null : _confirmReturn,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0F172A),
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 54),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))
                  ),
                  child: _isSaving 
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text('CONFIRMAR DEVOLUCIÓN ($_totalItemsToReturn items)', style: const TextStyle(fontWeight: FontWeight.bold)),
                )
              ],
            ),
    );
  }
}
