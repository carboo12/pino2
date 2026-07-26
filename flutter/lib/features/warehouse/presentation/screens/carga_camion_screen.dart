import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/models/warehouse_models.dart';
import '../../data/warehouse_repository.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../../../core/widgets/field/load_item_count_card.dart';

class CargaCamionScreen extends ConsumerStatefulWidget {
  const CargaCamionScreen({
    required this.storeId,
    super.key,
  });

  final String storeId;

  @override
  ConsumerState<CargaCamionScreen> createState() => _CargaCamionScreenState();
}

class _CargaCamionScreenState extends ConsumerState<CargaCamionScreen> {
  bool _isLoading = true;
  List<CargaCamion> _cargas = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchCargas();
  }

  Future<void> _fetchCargas() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final session = ref.read(authControllerProvider).session;
      if (session == null) return;

      final cargas = await ref.read(warehouseRepositoryProvider).getCargasCamion(
        storeId: widget.storeId,
        accessToken: session.accessToken,
      );
      setState(() { _cargas = cargas; _isLoading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  Future<void> _confirmSalida(CargaCamion carga) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirmar despacho'),
        content: Text('¿Confirmas que el camión ${carga.plate} con el rutero ${carga.vendorName} ha sido cargado completamente y está listo para salir?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('CANCELAR')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('CONFIRMAR SALIDA')),
        ],
      )
    );

    if (confirmed == true) {
      try {
        final session = ref.read(authControllerProvider).session;
        if (session == null) return;

        await ref.read(warehouseRepositoryProvider).despacharCarga(
          cargaId: carga.id,
          accessToken: session.accessToken,
        );
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Carga despachada exitosamente.')));
          _fetchCargas();
        }
      } catch (e) {
        if (mounted) {
           ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return Scaffold(body: const Center(child: CircularProgressIndicator()));
    if (_error != null) return Scaffold(body: Center(child: Text(_error!)));

    return Scaffold(
      appBar: AppBar(title: const Text('Cargas del Camión')),
      body: _cargas.isEmpty 
        ? const Center(child: Text('No hay cargas pendientes para hoy.'))
        : ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _cargas.length,
            itemBuilder: (context, index) {
              final c = _cargas[index];
              return _CargaCard(carga: c, onConfirm: () => _confirmSalida(c));
            },
          ),
    );
  }
}

class _CargaCard extends StatelessWidget {
  const _CargaCard({required this.carga, required this.onConfirm});

  final CargaCamion carga;
  final VoidCallback onConfirm;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isEnRuta = carga.status == 'EN_RUTA';

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('🚛 ${carga.plate}', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: isEnRuta ? Colors.blue.shade100 : Colors.amber.shade100,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(carga.status, style: TextStyle(color: isEnRuta ? Colors.blue.shade800 : Colors.amber.shade800, fontSize: 10, fontWeight: FontWeight.bold)),
                    )
                  ],
                ),
                Text('Rutero: ${carga.vendorName}', style: const TextStyle(color: Colors.black54)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _InfoMiniTag(label: 'Pedidos', value: '${carga.orderCount}'),
                    const SizedBox(width: 8),
                    _InfoMiniTag(label: 'Clientes', value: '${carga.clientCount}'),
                  ],
                ),
                const Divider(height: 24),
                const Text('CONSOLIDADO DE CARGA:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.1)),
                const SizedBox(height: 12),
                ...carga.items.map((i) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: LoadItemCountCard(
                    productName: i.productName,
                    plannedUnits: i.totalUnits,
                    loadedUnits: i.totalUnits,
                    acceptedUnits: i.totalUnits,
                    handlesBulk: i.presentation == 'BULTO',
                  ),
                )),
              ],
            ),
          ),
          if (!isEnRuta)
            InkWell(
              onTap: onConfirm,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  color: Color(0xFF0F172A),
                  borderRadius: BorderRadius.only(bottomLeft: Radius.circular(20), bottomRight: Radius.circular(20)),
                ),
                alignment: Alignment.center,
                child: const Text('CONFIRMAR CARGA COMPLETA', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
        ],
      ),
    );
  }
}

class _InfoMiniTag extends StatelessWidget {
  const _InfoMiniTag({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(12)),
      child: Text('$label: $value', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
    );
  }
}
