import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/utils/stock_display.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../data/returns_repository.dart';
import '../../domain/models/sale_lookup.dart';

class ReturnsScreen extends ConsumerStatefulWidget {
  const ReturnsScreen({
    required this.storeId,
    this.storeName,
    super.key,
  });

  final String storeId;
  final String? storeName;

  @override
  ConsumerState<ReturnsScreen> createState() => _ReturnsScreenState();
}

class _ReturnsScreenState extends ConsumerState<ReturnsScreen> {
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
    final session = ref.read(authControllerProvider).session;
    if (session == null) {
      return;
    }
    final saleReference = _ticketController.text.trim();
    if (saleReference.isEmpty) {
      return;
    }

    setState(() {
      _isSearching = true;
    });

    try {
      final sale = await ref.read(returnsRepositoryProvider).findSale(
            saleReference: saleReference,
            storeId: widget.storeId,
            accessToken: session.accessToken,
          );

      setState(() {
        _sale = sale;
        _returnQuantities
          ..clear()
          ..addEntries(sale.items.map((item) => MapEntry(item.productId, 0)));
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString())),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSearching = false;
        });
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
    final session = ref.read(authControllerProvider).session;
    final sale = _sale;
    if (session == null || sale == null) {
      return;
    }

    final items = sale.items
        .where((item) => (_returnQuantities[item.productId] ?? 0) > 0)
        .map(
          (item) {
            final totalQty = _returnQuantities[item.productId] ?? 0;
            final split = splitIntoBulkUnits(totalUnits: totalQty, unitsPerBulk: item.unitsPerBulk);
            return {
              'productId': item.productId,
              'quantity': totalQty,
              'quantityBulks': split.bulks,
              'quantityUnits': split.units,
            };
          },
        )
        .toList();

    if (items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Selecciona al menos una unidad a devolver.')),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final response = await ref.read(returnsRepositoryProvider).createReturn(
            accessToken: session.accessToken,
            storeId: widget.storeId,
            saleId: sale.id,
            items: items,
            notes: _notesController.text,
          );
      final queuedOffline = response['queuedOffline'] == true;

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            queuedOffline
                ? 'Devolución guardada temporalmente para ticket ${sale.ticketNumber}. Se enviará cuando vuelva la señal.'
                : 'Devolución guardada para ticket ${sale.ticketNumber}.',
          ),
        ),
      );
      setState(() {
        _sale = null;
        _ticketController.clear();
        _notesController.clear();
        _returnQuantities.clear();
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString())),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final selectedItems = _returnQuantities.values.where((q) => q > 0).length;

    return Scaffold(
      appBar: AppBar(title: const Text('Devolución rápida')),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
              children: [
                _ReturnsHero(storeName: widget.storeName),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _ticketController,
                        textInputAction: TextInputAction.search,
                        decoration: const InputDecoration(
                          hintText: 'Número de ticket',
                          prefixIcon: Icon(Icons.confirmation_number_outlined),
                        ),
                        onSubmitted: (_) => _searchSale(),
                      ),
                    ),
                    const SizedBox(width: 12),
                    FilledButton.icon(
                      onPressed: _isSearching ? null : _searchSale,
                      icon: _isSearching
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.search_rounded),
                      label: const Text('Buscar'),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                if (_sale != null) ...[
                  _SaleHeaderCard(sale: _sale!),
                  const SizedBox(height: 12),
                  ..._sale!.items.map(
                    (item) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _ReturnItemCard(
                        item: item,
                        selectedQuantity: _returnQuantities[item.productId] ?? 0,
                        onIncrease: () => _changeQuantity(item, 1),
                        onDecrease: () => _changeQuantity(item, -1),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _notesController,
                    minLines: 2,
                    maxLines: 4,
                    decoration: const InputDecoration(
                      labelText: 'Motivo / nota',
                      alignLabelWithHint: true,
                    ),
                  ),
                ] else
                  const _ReturnEmptyState(),
                const SizedBox(height: 110),
              ],
            ),
          ),
          _ReturnsFooter(
            selectedItems: selectedItems,
            isSubmitting: _isSubmitting,
            onSubmit: _submitReturn,
          ),
        ],
      ),
    );
  }
}

class _ReturnsHero extends StatelessWidget {
  const _ReturnsHero({this.storeName});

  final String? storeName;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: const LinearGradient(
          colors: [Color(0xFF7C2D12), Color(0xFFB45309)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            storeName == null ? 'Devoluciones' : 'Devoluciones • $storeName',
            style: theme.textTheme.headlineSmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Buscar ticket, marcar unidades y guardar rápido.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: Colors.white.withValues(alpha: 0.82),
            ),
          ),
        ],
      ),
    );
  }
}

class _SaleHeaderCard extends StatelessWidget {
  const _SaleHeaderCard({required this.sale});

  final SaleLookup sale;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Wrap(
        spacing: 10,
        runSpacing: 10,
        children: [
          _ReturnPill(
            icon: Icons.confirmation_number_outlined,
            text: sale.ticketNumber,
          ),
          _ReturnPill(
            icon: Icons.inventory_2_outlined,
            text: '${sale.items.length} líneas',
          ),
          _ReturnPill(
            icon: Icons.payments_outlined,
            text: 'C\$ ${sale.total.toStringAsFixed(2)}',
          ),
        ],
      ),
    );
  }
}

class _ReturnItemCard extends StatelessWidget {
  const _ReturnItemCard({
    required this.item,
    required this.selectedQuantity,
    required this.onIncrease,
    required this.onDecrease,
  });

  final SaleLookupItem item;
  final int selectedQuantity;
  final VoidCallback onIncrease;
  final VoidCallback onDecrease;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: selectedQuantity > 0
              ? const Color(0xFFB45309)
              : Colors.grey.shade200,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.description,
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 6),
                Text(
                  'Vendidas ${item.quantity} • C\$ ${item.salePrice.toStringAsFixed(2)}',
                  style: const TextStyle(color: Colors.black54),
                ),
              ],
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(18),
            ),
            child: Row(
              children: [
                IconButton(
                  onPressed: onDecrease,
                  icon: const Icon(Icons.remove_circle_outline_rounded),
                ),
                Text(
                  '$selectedQuantity',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                ),
                IconButton(
                  onPressed: selectedQuantity >= item.quantity ? null : onIncrease,
                  icon: const Icon(Icons.add_circle_outline_rounded),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ReturnsFooter extends StatelessWidget {
  const _ReturnsFooter({
    required this.selectedItems,
    required this.isSubmitting,
    required this.onSubmit,
  });

  final int selectedItems;
  final bool isSubmitting;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 18),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Colors.grey.shade200)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Seleccionados',
                          style: TextStyle(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '$selectedItems líneas',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: isSubmitting ? null : onSubmit,
              icon: isSubmitting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.assignment_return_rounded),
              label: Text(isSubmitting ? 'Guardando...' : 'Guardar devolución'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReturnPill extends StatelessWidget {
  const _ReturnPill({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: const Color(0xFF475569)),
          const SizedBox(width: 8),
          Text(text),
        ],
      ),
    );
  }
}

class _ReturnEmptyState extends StatelessWidget {
  const _ReturnEmptyState();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: const Column(
        children: [
          Icon(Icons.search_rounded, size: 42, color: Color(0xFF64748B)),
          SizedBox(height: 12),
          Text(
            'Busca un ticket',
            style: TextStyle(fontWeight: FontWeight.w800),
          ),
          SizedBox(height: 6),
          Text(
            'Carga la venta primero para devolver solo lo necesario.',
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
