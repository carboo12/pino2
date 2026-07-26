import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/api_client.dart';
import '../../domain/models/client_summary.dart';

class ClientHistoryBottomSheet extends ConsumerStatefulWidget {
  const ClientHistoryBottomSheet({
    super.key,
    required this.client,
    required this.storeId,
  });

  final ClientSummary client;
  final String storeId;

  static void show(BuildContext context, ClientSummary client, String storeId) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ClientHistoryBottomSheet(
        client: client,
        storeId: storeId,
      ),
    );
  }

  @override
  ConsumerState<ClientHistoryBottomSheet> createState() =>
      _ClientHistoryBottomSheetState();
}

class _ClientHistoryBottomSheetState
    extends ConsumerState<ClientHistoryBottomSheet>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> _sales = [];
  bool _loadingSales = true;
  Map<String, dynamic>? _selectedSaleDetail;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchClientSales();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchClientSales() async {
    setState(() => _loadingSales = true);
    try {
      final api = ref.read(appApiClientProvider);
      final res = await api.getList('/sales', queryParameters: {
        'storeId': widget.storeId,
        'clientId': widget.client.id,
        'limit': 100,
      });
      if (mounted) {
        setState(() {
          _sales = res.cast<Map<String, dynamic>>();
          _loadingSales = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching client sales: $e');
      if (mounted) setState(() => _loadingSales = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = MediaQuery.of(context).size;

    return Container(
      height: size.height * 0.85,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          // Header Indicator
          const SizedBox(height: 12),
          Container(
            width: 48,
            height: 5,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          const SizedBox(height: 16),

          // Client Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: const Color(0xFF0F766E).withValues(alpha: 0.1),
                  child: const Icon(
                    Icons.person_outline_rounded,
                    color: Color(0xFF0F766E),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.client.name,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w900,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        'Expediente 360° • Histórico de Compras',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close_rounded),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Tabs Header
          TabBar(
            controller: _tabController,
            labelColor: const Color(0xFF0F766E),
            unselectedLabelColor: Colors.grey.shade600,
            indicatorColor: const Color(0xFF0F766E),
            indicatorWeight: 3,
            labelStyle: const TextStyle(fontWeight: FontWeight.w800),
            tabs: [
              Tab(text: 'Compras (${_sales.length})'),
              const Tab(text: 'Estado de Cuenta'),
            ],
          ),

          // Tab Views
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // Tab 1: Compras & Facturas
                _selectedSaleDetail != null
                    ? _buildSaleDetailView(theme)
                    : _buildSalesListView(theme),

                // Tab 2: Estado de Cuenta
                _buildAccountStatusView(theme),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSalesListView(ThemeData theme) {
    if (_loadingSales) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_sales.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.receipt_long_outlined, size: 54, color: Colors.grey.shade300),
            const SizedBox(height: 12),
            const Text(
              'Sin comprobantes registrados',
              style: TextStyle(fontWeight: FontWeight.w800, color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _sales.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final sale = _sales[index];
        final total = double.tryParse(sale['total']?.toString() ?? '0') ?? 0;
        final ticket = sale['ticketNumber'] ?? sale['id']?.toString().substring(0, 8) ?? '---';
        final dateStr = sale['createdAt']?.toString().split('T')[0] ?? '';
        final paymentType = sale['paymentType'] ?? 'CONTADO';

        return Card(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: Colors.grey.shade200),
          ),
          child: ListTile(
            onTap: () {
              setState(() {
                _selectedSaleDetail = sale;
              });
            },
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            title: Row(
              children: [
                Text(
                  'Comprobante #$ticket',
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                ),
                const Spacer(),
                Text(
                  'C\$ ${total.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                    color: Color(0xFF0F766E),
                  ),
                ),
              ],
            ),
            subtitle: Row(
              children: [
                Text(dateStr, style: const TextStyle(fontSize: 12)),
                const SizedBox(width: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.teal.shade50,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    paymentType,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Colors.teal.shade800,
                    ),
                  ),
                ),
                const Spacer(),
                const Text(
                  'Ver detalle >',
                  style: TextStyle(fontSize: 11, color: Color(0xFF0F766E), fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSaleDetailView(ThemeData theme) {
    final sale = _selectedSaleDetail!;
    final items = (sale['items'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final total = double.tryParse(sale['total']?.toString() ?? '0') ?? 0;
    final ticket = sale['ticketNumber'] ?? sale['id']?.toString().substring(0, 8) ?? '---';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back_rounded),
                onPressed: () => setState(() => _selectedSaleDetail = null),
              ),
              Expanded(
                child: Text(
                  'Detalle Comprobante #$ticket',
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          if (items.isNotEmpty) ...[
            const Text('Líneas de Producto:', style: TextStyle(fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            ...items.map((item) => Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item['description'] ?? item['name'] ?? 'Producto',
                              style: const TextStyle(fontWeight: FontWeight.w700),
                            ),
                            Text(
                              'Cant: ${item['quantity']} × C\$ ${item['unitPrice'] ?? item['price'] ?? 0}',
                              style: const TextStyle(fontSize: 12, color: Colors.grey),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        'C\$ ${item['subtotal'] ?? 0}',
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                    ],
                  ),
                )),
          ] else ...[
            // Banner de Factura Consolidada Legacy
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.amber.shade50,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.amber.shade200),
              ),
              child: Column(
                children: [
                  const Icon(Icons.inventory_2_outlined, color: Colors.amber, size: 36),
                  const SizedBox(height: 8),
                  Text(
                    'Comprobante de Resumen Legacy (Factura Consolidada)',
                    style: TextStyle(fontWeight: FontWeight.w800, color: Colors.amber.shade900),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Este registro histórico fue importado desde el sistema anterior como un monto total consolidado (C\$ ${total.toStringAsFixed(2)}) sin desglose de SKUs en el sistema origen.',
                    style: TextStyle(fontSize: 12, color: Colors.amber.shade900),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 20),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.teal.shade50,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Total de la Compra:', style: TextStyle(fontWeight: FontWeight.w800)),
                Text(
                  'C\$ ${total.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 18,
                    color: Color(0xFF0F766E),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAccountStatusView(ThemeData theme) {
    final limit = widget.client.creditLimit ?? 0;
    final balance = widget.client.balance ?? 0;
    final available = (limit - balance).clamp(0, double.infinity);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF0F766E), Color(0xFF115E59)],
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                const Text(
                  'Límite de Crédito Autorizado',
                  style: TextStyle(color: Colors.white70, fontSize: 12),
                ),
                Text(
                  'C\$ ${limit.toStringAsFixed(2)}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 24,
                  ),
                ),
                const Divider(color: Colors.white24, height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    Column(
                      children: [
                        const Text('Saldo Utilizado', style: TextStyle(color: Colors.white70, fontSize: 11)),
                        Text(
                          'C\$ ${balance.toStringAsFixed(2)}',
                          style: const TextStyle(color: Colors.amberAccent, fontWeight: FontWeight.w800),
                        ),
                      ],
                    ),
                    Column(
                      children: [
                        const Text('Disponible', style: TextStyle(color: Colors.white70, fontSize: 11)),
                        Text(
                          'C\$ ${available.toStringAsFixed(2)}',
                          style: const TextStyle(color: Colors.lightGreenAccent, fontWeight: FontWeight.w800),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
