import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/documents/pdf_receipt_service.dart';
import '../../../../core/network/connectivity_service.dart';
import '../../../../core/network/sync_queue_processor.dart';
import '../../../../core/utils/role_utils.dart';
import '../../../../core/widgets/field/payment_method_selector.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../data/collections_repository.dart';
import '../../domain/models/receivable_account.dart';

class CollectionsBootstrap {
  const CollectionsBootstrap({
    required this.accounts,
    required this.summary,
  });

  final List<ReceivableAccount> accounts;
  final CollectionsSummary summary;
}

final collectionsBootstrapProvider = FutureProvider.family
    .autoDispose<CollectionsBootstrap, String>((ref, storeId) async {
      ref.watch(networkStatusProvider);
      ref.watch(syncQueueProcessorProvider.select((state) => state.lastSyncAt));

      final session = ref.watch(authControllerProvider).session;
      if (session == null) {
        return const CollectionsBootstrap(
          accounts: [],
          summary: CollectionsSummary(
            totalCount: 0,
            totalAmount: 0,
            cashTotal: 0,
            otherTotal: 0,
          ),
        );
      }

      final role = normalizeRole(session.user.role);
      final ruteroId = role == AppRole.rutero ? session.user.id : null;

      final results = await Future.wait([
        ref
            .read(collectionsRepositoryProvider)
            .getPendingAccounts(storeId: storeId, accessToken: session.accessToken),
        ref
            .read(collectionsRepositoryProvider)
            .getSummary(
              storeId: storeId,
              accessToken: session.accessToken,
              ruteroId: ruteroId,
            ),
      ]);

      return CollectionsBootstrap(
        accounts: results[0] as List<ReceivableAccount>,
        summary: results[1] as CollectionsSummary,
      );
    });

class CollectionsScreen extends ConsumerStatefulWidget {
  const CollectionsScreen({
    required this.storeId,
    this.storeName,
    super.key,
  });

  final String storeId;
  final String? storeName;

  @override
  ConsumerState<CollectionsScreen> createState() => _CollectionsScreenState();
}

class _CollectionsScreenState extends ConsumerState<CollectionsScreen> {
  final _searchController = TextEditingController();
  String _search = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _collect(ReceivableAccount account) async {
    final session = ref.read(authControllerProvider).session;
    if (session == null) {
      return;
    }

    final result = await showModalBottomSheet<_PaymentDraft>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) => _QuickCollectSheet(account: account),
    );

    if (result == null) {
      return;
    }

    try {
      final response = await ref.read(collectionsRepositoryProvider).registerPayment(
            accountId: account.id,
            storeId: widget.storeId,
            accessToken: session.accessToken,
            amount: result.amount,
            paymentMethod: result.paymentMethod,
            collectorId: session.user.id,
            collectorName: session.user.name,
            notes: result.notes,
          );
      final queuedOffline = response['queuedOffline'] == true;

      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            queuedOffline
                ? 'Cobro guardado temporalmente para ${account.clientName}. Se enviará cuando vuelva la señal.'
                : 'Cobro guardado para ${account.clientName}.',
          ),
          action: SnackBarAction(
            label: 'PDF',
            onPressed: () {
              _shareCollectionReceipt(
                account: account,
                amount: result.amount,
                paymentMethod: result.paymentMethod,
                collectorName: session.user.name,
                notes: result.notes,
              );
            },
          ),
        ),
      );
      if (!queuedOffline) {
        ref.invalidate(collectionsBootstrapProvider(widget.storeId));
      }
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString())),
      );
    }
  }

  Future<void> _shareCollectionReceipt({
    required ReceivableAccount account,
    required double amount,
    required String paymentMethod,
    required String collectorName,
    String? notes,
  }) async {
    final service = ref.read(pdfReceiptServiceProvider);

    try {
      final file = await service.saveCollectionReceipt(
        CollectionReceiptPayload(
          storeName: widget.storeName ?? 'Pino',
          createdAt: DateTime.now(),
          collectorName: collectorName,
          clientName: account.clientName,
          amount: amount,
          paymentMethod: paymentMethod,
          reference: account.id,
          notes: notes,
        ),
      );

      if (!mounted) {
        return;
      }

      await service.shareFile(
        file,
        context: context,
        subject: 'Comprobante de cobro',
        text: 'Comprobante de cobro para ${account.clientName}',
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No se pudo generar el PDF: $error')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final bootstrapAsync = ref.watch(collectionsBootstrapProvider(widget.storeId));

    return Scaffold(
      appBar: AppBar(title: const Text('Cobros rápidos')),
      floatingActionButton: bootstrapAsync.maybeWhen(
        data: (b) => _buildFloatingSummary(b.summary),
        orElse: () => null,
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(collectionsBootstrapProvider(widget.storeId));
          await ref.read(collectionsBootstrapProvider(widget.storeId).future);
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          children: [
            _CollectionsHero(
              storeName: widget.storeName,
              controller: _searchController,
              onChanged: (value) {
                setState(() {
                  _search = value.trim().toLowerCase();
                });
              },
            ),
            const SizedBox(height: 18),
            bootstrapAsync.when(
              data: (bootstrap) {
                final visibleAccounts = bootstrap.accounts.where((account) {
                  if (_search.isEmpty) {
                    return true;
                  }
                  final haystack = [
                    account.clientName,
                    account.description ?? '',
                    account.id,
                  ].join(' ').toLowerCase();
                  return haystack.contains(_search);
                }).toList();

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [
                        _CollectionsMetric(
                          label: 'Pendientes',
                          value: '${bootstrap.accounts.length}',
                          color: const Color(0xFF1D4ED8),
                        ),
                        _CollectionsMetric(
                          label: 'Cobrado hoy',
                          value: 'C\$ ${bootstrap.summary.totalAmount.toStringAsFixed(2)}',
                          color: const Color(0xFF166534),
                        ),
                        _CollectionsMetric(
                          label: 'Efectivo',
                          value: 'C\$ ${bootstrap.summary.cashTotal.toStringAsFixed(2)}',
                          color: const Color(0xFFB45309),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),
                    if (visibleAccounts.isEmpty)
                      const _CollectionsEmptyState()
                    else
                      ...visibleAccounts.map(
                        (account) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _ReceivableCard(
                            account: account,
                            onCollect: () => _collect(account),
                          ),
                        ),
                      ),
                  ],
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stackTrace) => Center(child: Text(error.toString())),
            ),
          ],
        ),
      ),
    );
  }

  Widget? _buildFloatingSummary(CollectionsSummary summary) {
    if (summary.totalAmount <= 0) return null;

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Row(
        children: [
          const Icon(Icons.account_balance_wallet_rounded,
              color: Colors.greenAccent),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('COBRADO HOY (MÓVIL)',
                    style: TextStyle(
                        color: Colors.white70,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5)),
                Text('C\$ ${summary.totalAmount.toStringAsFixed(2)}',
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 18)),
              ],
            ),
          ),
          IconButton(
            onPressed: () =>
                ref.invalidate(collectionsBootstrapProvider(widget.storeId)),
            icon: const Icon(Icons.refresh_rounded, color: Colors.white),
          ),
        ],
      ),
    );
  }
}

class _CollectionsHero extends StatelessWidget {
  const _CollectionsHero({
    required this.controller,
    required this.onChanged,
    this.storeName,
  });

  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final String? storeName;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: const LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF166534)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            storeName == null ? 'Cobranza móvil' : 'Cobranza • $storeName',
            style: theme.textTheme.headlineSmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Llegar, cobrar y guardar. Sin hojas ni navegación lenta.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: Colors.white.withValues(alpha: 0.82),
            ),
          ),
          const SizedBox(height: 18),
          TextField(
            controller: controller,
            onChanged: onChanged,
            decoration: const InputDecoration(
              hintText: 'Buscar cliente o referencia...',
              prefixIcon: Icon(Icons.search_rounded),
            ),
          ),
        ],
      ),
    );
  }
}

class _CollectionsMetric extends StatelessWidget {
  const _CollectionsMetric({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }
}

class _ReceivableCard extends StatelessWidget {
  const _ReceivableCard({
    required this.account,
    required this.onCollect,
  });

  final ReceivableAccount account;
  final VoidCallback onCollect;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            account.clientName,
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
          ),
          const SizedBox(height: 6),
          Text(
            account.description?.isNotEmpty == true
                ? account.description!
                : 'Cuenta pendiente',
            style: const TextStyle(color: Colors.black54),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _CollectionsPill(
                icon: Icons.receipt_long_outlined,
                text: 'Saldo C\$ ${account.remainingAmount.toStringAsFixed(2)}',
              ),
              _CollectionsPill(
                icon: Icons.request_quote_outlined,
                text: 'Total C\$ ${account.totalAmount.toStringAsFixed(2)}',
              ),
            ],
          ),
          const SizedBox(height: 14),
          FilledButton.icon(
            onPressed: onCollect,
            icon: const Icon(Icons.payments_rounded),
            label: const Text('Cobrar ahora'),
          ),
        ],
      ),
    );
  }
}

class _CollectionsPill extends StatelessWidget {
  const _CollectionsPill({
    required this.icon,
    required this.text,
  });

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

class _CollectionsEmptyState extends StatelessWidget {
  const _CollectionsEmptyState();

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
          Icon(Icons.task_alt_rounded, size: 42, color: Color(0xFF64748B)),
          SizedBox(height: 12),
          Text(
            'No hay cuentas visibles',
            style: TextStyle(fontWeight: FontWeight.w800),
          ),
          SizedBox(height: 6),
          Text(
            'No hay saldos pendientes para el filtro actual.',
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _QuickCollectSheet extends StatefulWidget {
  const _QuickCollectSheet({required this.account});

  final ReceivableAccount account;

  @override
  State<_QuickCollectSheet> createState() => _QuickCollectSheetState();
}

class _QuickCollectSheetState extends State<_QuickCollectSheet> {
  late final TextEditingController _amountController;
  final TextEditingController _notesController = TextEditingController();
  String _paymentMethod = 'CASH';

  @override
  void initState() {
    super.initState();
    _amountController = TextEditingController(
      text: widget.account.remainingAmount.toStringAsFixed(2),
    );
  }

  @override
  void dispose() {
    _amountController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 8,
          bottom: MediaQuery.of(context).viewInsets.bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Cobrar a ${widget.account.clientName}',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Monto',
                prefixText: 'C\$ ',
              ),
            ),
            const SizedBox(height: 12),
            PaymentMethodSelector(
              selected: _paymentMethod,
              onSelected: (method) => setState(() => _paymentMethod = method),
              label: 'Método de pago',
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _notesController,
              minLines: 2,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Nota rápida',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 14),
            FilledButton.icon(
              onPressed: () {
                final amount =
                    double.tryParse(_amountController.text.trim()) ?? 0;
                if (amount <= 0) {
                  return;
                }
                Navigator.of(context).pop(
                  _PaymentDraft(
                    amount: amount,
                    paymentMethod: _paymentMethod,
                    notes: _notesController.text,
                  ),
                );
              },
              icon: const Icon(Icons.check_circle_rounded),
              label: const Text('Guardar cobro'),
            ),
          ],
        ),
      ),
    );
  }
}



class _PaymentDraft {
  const _PaymentDraft({
    required this.amount,
    required this.paymentMethod,
    required this.notes,
  });

  final double amount;
  final String paymentMethod;
  final String notes;
}
