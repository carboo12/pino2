import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/role_utils.dart';
import '../../../auth/presentation/auth_controller.dart';
import '../../data/route_board_repository.dart';
import '../../domain/models/delivery_summary.dart';
import 'delivery_detail_screen.dart';

class RouteBoardScreen extends StatefulWidget {
  const RouteBoardScreen({
    required this.storeId,
    this.storeName,
    super.key,
  });

  final String storeId;
  final String? storeName;

  @override
  State<RouteBoardScreen> createState() => _RouteBoardScreenState();
}

class _RouteBoardScreenState extends State<RouteBoardScreen> {
  final _repository = RouteBoardRepository();
  RouteBoardSnapshot? _snapshot;
  bool _loading = true;
  String _searchText = '';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final auth = context.read<AuthController>();
    final user = auth.user;
    final role = normalizeRole(user?.rol);

    setState(() => _loading = true);

    final snapshot = await _repository.getSnapshot(
      storeId: widget.storeId,
      vendorId: role == AppRole.vendor ? user?.carnet : null,
      ruteroId: role == AppRole.rutero ? user?.carnet : null,
    );

    if (mounted) {
      setState(() {
        _snapshot = snapshot;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final deliveries = _snapshot?.deliveries ?? [];
    final filteredDeliveries = deliveries.where((d) {
      if (_searchText.isEmpty) return true;
      final q = _searchText.toLowerCase();
      return (d.clientName != null && d.clientName!.toLowerCase().contains(q)) ||
          (d.clientAddress != null && d.clientAddress!.toLowerCase().contains(q));
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Ruta y Entregas', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            if (widget.storeName != null)
              Text(widget.storeName!, style: const TextStyle(fontSize: 12, color: AppTheme.slate500)),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Buscador
                  TextField(
                    onChanged: (v) => setState(() => _searchText = v),
                    decoration: InputDecoration(
                      hintText: 'Buscar por cliente o dirección...',
                      prefixIcon: const Icon(Icons.search_rounded),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Entregas Pendientes (${filteredDeliveries.length})',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.slate900),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (filteredDeliveries.isEmpty)
                    const Container(
                      padding: EdgeInsets.all(32),
                      child: Center(child: Text('No hay entregas pendientes registradas.')),
                    )
                  else
                    ...filteredDeliveries.map(
                      (d) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _DeliveryCard(
                          delivery: d,
                          onTap: () async {
                            final res = await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => DeliveryDetailScreen(delivery: d),
                              ),
                            );
                            if (res == true) _loadData();
                          },
                        ),
                      ),
                    ),
                ],
              ),
      ),
    );
  }
}

class _DeliveryCard extends StatelessWidget {
  const _DeliveryCard({
    required this.delivery,
    required this.onTap,
  });

  final DeliverySummary delivery;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.slate200),
        boxShadow: AppTheme.cardShadow,
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    delivery.clientName ?? 'Cliente General',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.red100,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      delivery.status,
                      style: const TextStyle(color: AppTheme.primary, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                delivery.clientAddress ?? 'Sin dirección especificada',
                style: const TextStyle(color: AppTheme.slate600, fontSize: 13),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${delivery.totalItems} ítem(s)',
                    style: const TextStyle(color: AppTheme.slate500, fontSize: 13),
                  ),
                  Text(
                    'C\$${delivery.total.toStringAsFixed(2)}',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.primary),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
