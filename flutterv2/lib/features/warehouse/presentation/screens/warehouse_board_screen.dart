import 'package:flutter/material.dart';

import '../../../../core/theme/app_theme.dart';
import '../../data/warehouse_repository.dart';
import '../../domain/models/warehouse_models.dart';

class WarehouseBoardScreen extends StatefulWidget {
  const WarehouseBoardScreen({
    required this.storeId,
    this.storeName,
    super.key,
  });

  final String storeId;
  final String? storeName;

  @override
  State<WarehouseBoardScreen> createState() => _WarehouseBoardScreenState();
}

class _WarehouseBoardScreenState extends State<WarehouseBoardScreen> {
  final _repository = WarehouseRepository();
  List<WarehouseOrder> _orders = [];
  bool _loading = true;
  String _selectedTab = 'RECIBIDO'; // RECIBIDO, EN_PREPARACION, LISTO, CARGADO

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() => _loading = true);
    final orders = await _repository.getPendingOrders(storeId: widget.storeId);
    if (mounted) {
      setState(() {
        _orders = orders;
        _loading = false;
      });
    }
  }

  Future<void> _changeStatus(WarehouseOrder order, String newStatus) async {
    final success = await _repository.updateOrderStatus(
      orderId: order.id,
      status: newStatus,
    );
    if (mounted && success) {
      _loadOrders();
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _orders.where((o) => o.status.toUpperCase() == _selectedTab).toList();

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Tablero de Bodega', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            if (widget.storeName != null)
              Text(widget.storeName!, style: const TextStyle(fontSize: 12, color: AppTheme.slate500)),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadOrders,
        child: Column(
          children: [
            // Filter Tabs
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: Colors.white,
              child: Row(
                children: [
                  _buildTabButton('Recibidos', 'RECIBIDO'),
                  _buildTabButton('Preparación', 'EN_PREPARACION'),
                  _buildTabButton('Listos', 'LISTO'),
                  _buildTabButton('Cargados', 'CARGADO'),
                ],
              ),
            ),
            const Divider(height: 1),

            // Order List
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : filtered.isEmpty
                      ? const Center(child: Text('No hay pedidos en esta etapa.'))
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: filtered.length,
                          itemBuilder: (context, index) {
                            final order = filtered[index];
                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
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
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        order.clientName ?? 'Cliente Contado',
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                      ),
                                      Text(
                                        'C\$${order.total.toStringAsFixed(2)}',
                                        style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary, fontSize: 15),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${order.items.length} artículos  ·  Pedido #${order.id.length > 8 ? order.id.substring(0, 8) : order.id}',
                                    style: const TextStyle(color: AppTheme.slate600, fontSize: 13),
                                  ),
                                  if (order.notes != null && order.notes!.isNotEmpty)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 6),
                                      child: Text(
                                        'Nota: ${order.notes}',
                                        style: const TextStyle(color: AppTheme.slate500, fontSize: 12, fontStyle: FontStyle.italic),
                                      ),
                                    ),
                                  const SizedBox(height: 12),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.end,
                                    children: [
                                      if (_selectedTab == 'RECIBIDO')
                                        ElevatedButton.icon(
                                          onPressed: () => _changeStatus(order, 'EN_PREPARACION'),
                                          icon: const Icon(Icons.play_arrow_rounded, size: 18),
                                          label: const Text('Iniciar Picking'),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: AppTheme.primary,
                                            foregroundColor: Colors.white,
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                          ),
                                        ),
                                      if (_selectedTab == 'EN_PREPARACION')
                                        ElevatedButton.icon(
                                          onPressed: () => _changeStatus(order, 'LISTO'),
                                          icon: const Icon(Icons.check_circle_rounded, size: 18),
                                          label: const Text('Marcar Listo'),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: const Color(0xFF10B981),
                                            foregroundColor: Colors.white,
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                          ),
                                        ),
                                      if (_selectedTab == 'LISTO')
                                        ElevatedButton.icon(
                                          onPressed: () => _changeStatus(order, 'CARGADO'),
                                          icon: const Icon(Icons.local_shipping_rounded, size: 18),
                                          label: const Text('Cargar a Camión'),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: const Color(0xFF6366F1),
                                            foregroundColor: Colors.white,
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                          ),
                                        ),
                                    ],
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTabButton(String label, String statusKey) {
    final isSelected = _selectedTab == statusKey;
    final count = _orders.where((o) => o.status.toUpperCase() == statusKey).length;

    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedTab = statusKey),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: isSelected ? AppTheme.primary : Colors.transparent,
                width: 2,
              ),
            ),
          ),
          child: Column(
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  color: isSelected ? AppTheme.primary : AppTheme.slate600,
                ),
              ),
              const SizedBox(height: 2),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                decoration: BoxDecoration(
                  // ignore: deprecated_member_use
                  color: isSelected ? AppTheme.primary.withOpacity(0.1) : AppTheme.slate100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '$count',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: isSelected ? AppTheme.primary : AppTheme.slate600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
