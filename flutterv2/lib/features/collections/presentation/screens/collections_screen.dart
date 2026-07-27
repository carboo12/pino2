import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/role_utils.dart';
import '../../../auth/presentation/auth_controller.dart';
import '../../data/collections_repository.dart';
import '../../domain/models/receivable_account.dart';

class CollectionsScreen extends StatefulWidget {
  const CollectionsScreen({
    required this.storeId,
    this.storeName,
    super.key,
  });

  final String storeId;
  final String? storeName;

  @override
  State<CollectionsScreen> createState() => _CollectionsScreenState();
}

class _CollectionsScreenState extends State<CollectionsScreen> {
  final _repository = CollectionsRepository();
  final _searchController = TextEditingController();

  List<ReceivableAccount> _accounts = [];
  CollectionsSummary? _summary;
  bool _loading = true;
  String _search = '';

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

    final results = await Future.wait([
      _repository.getPendingAccounts(storeId: widget.storeId),
      _repository.getSummary(
        storeId: widget.storeId,
        ruteroId: role == AppRole.rutero ? user?.carnet : null,
      ),
    ]);

    if (mounted) {
      setState(() {
        _accounts = results[0] as List<ReceivableAccount>;
        _summary = results[1] as CollectionsSummary;
        _loading = false;
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _collect(ReceivableAccount account) async {
    final auth = context.read<AuthController>();
    final user = auth.user;
    if (user == null) return;

    final amountCtrl = TextEditingController(text: account.remainingAmount > 0 ? account.remainingAmount.toStringAsFixed(2) : account.totalAmount.toStringAsFixed(2));
    String paymentMethod = 'EFECTIVO';

    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          top: 20,
          left: 20,
          right: 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Registrar Cobro: ${account.clientName}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 16),
            TextField(
              controller: amountCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Monto a Cobrar (C\$)', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Confirmar Pago', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );

    if (confirmed == true) {
      final amount = double.tryParse(amountCtrl.text.trim()) ?? 0;
      if (amount <= 0) return;

      try {
        await _repository.registerPayment(
          accountId: account.id,
          storeId: widget.storeId,
          amount: amount,
          paymentMethod: paymentMethod,
          collectorId: user.carnet,
          collectorName: user.nombre,
        );

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Pago de C\$${amount.toStringAsFixed(2)} registrado exitosamente.'), backgroundColor: AppTheme.success),
          );
          _loadData();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error al registrar pago: $e')));
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _accounts.where((a) {
      if (_search.isEmpty) return true;
      final q = _search.toLowerCase();
      return a.clientName.toLowerCase().contains(q) || (a.description != null && a.description!.toLowerCase().contains(q));
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Gestion de Cobros', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
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
                  // Card Resumen de Cobros
                  if (_summary != null)
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: AppTheme.heroGradient,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: AppTheme.elevatedShadow,
                      ),
                      child: Column(
                        children: [
                          const Text('TOTAL COBRADO HOY', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text(
                            'C\$${_summary!.totalAmount.toStringAsFixed(2)}',
                            style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _searchController,
                    onChanged: (v) => setState(() => _search = v),
                    decoration: InputDecoration(
                      hintText: 'Buscar por cliente...',
                      prefixIcon: const Icon(Icons.search_rounded),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Cuentas por Cobrar (${filtered.length})',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.slate900),
                  ),
                  const SizedBox(height: 12),
                  if (filtered.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(32),
                      child: const Center(child: Text('No hay cuentas pendientes de cobro.')),
                    )
                  else
                    ...filtered.map(
                      (acc) => Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.slate200),
                          boxShadow: AppTheme.cardShadow,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(acc.clientName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Pendiente: C\$${(acc.remainingAmount > 0 ? acc.remainingAmount : acc.totalAmount).toStringAsFixed(2)}',
                                    style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold, fontSize: 14),
                                  ),
                                ],
                              ),
                            ),
                            ElevatedButton(
                              onPressed: () => _collect(acc),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primary,
                                minimumSize: const Size(80, 40),
                              ),
                              child: const Text('Cobrar'),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
      ),
    );
  }
}
