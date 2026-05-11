import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/connectivity_service.dart';
import '../../../../core/network/sync_queue_processor.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../data/client_portfolio_repository.dart';
import '../../domain/models/client_summary.dart';

final clientPortfolioProvider = FutureProvider.family
    .autoDispose<List<ClientSummary>, String>((ref, storeId) async {
      ref.watch(networkStatusProvider);
      ref.watch(syncQueueProcessorProvider.select((state) => state.lastSyncAt));

      final session = ref.watch(authControllerProvider).session;
      if (session == null) {
        return <ClientSummary>[];
      }

      return ref
          .read(clientPortfolioRepositoryProvider)
          .getClients(storeId: storeId, accessToken: session.accessToken);
    });

class ClientPortfolioScreen extends ConsumerStatefulWidget {
  const ClientPortfolioScreen({
    required this.storeId,
    this.storeName,
    super.key,
  });

  final String storeId;
  final String? storeName;

  @override
  ConsumerState<ClientPortfolioScreen> createState() =>
      _ClientPortfolioScreenState();
}

class _ClientPortfolioScreenState extends ConsumerState<ClientPortfolioScreen> {
  final _searchController = TextEditingController();
  String _searchText = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _showEditClientDialog(BuildContext context, ClientSummary client) async {
    final limitCtrl = TextEditingController(text: client.creditLimit?.toString() ?? '0');
    final daysCtrl = TextEditingController(text: client.creditDays?.toString() ?? '0');
    
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: Text('Editar Crédito: ${client.name}'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: limitCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Límite de Crédito (C\$)'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: daysCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Días de Crédito'),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text('Guardar'),
            ),
          ],
        );
      },
    );

    if (result == true && context.mounted) {
      final session = ref.read(authControllerProvider).session;
      if (session == null) return;
      try {
        await ref.read(clientPortfolioRepositoryProvider).updateClient(
          clientId: client.id,
          accessToken: session.accessToken,
          data: {
            'limiteCredito': num.tryParse(limitCtrl.text) ?? 0,
            'diasCredito': int.tryParse(daysCtrl.text) ?? 0,
          },
        );
        ref.invalidate(clientPortfolioProvider(widget.storeId));
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Cliente actualizado exitosamente')),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error al actualizar: $e'), backgroundColor: Colors.red),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final clientsAsync = ref.watch(clientPortfolioProvider(widget.storeId));

    return Scaffold(
      appBar: AppBar(title: const Text('Clientes')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(clientPortfolioProvider(widget.storeId));
          await ref.read(clientPortfolioProvider(widget.storeId).future);
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          children: [
            _ClientHero(
              storeName: widget.storeName,
              controller: _searchController,
              onChanged: (value) {
                setState(() {
                  _searchText = value.trim().toLowerCase();
                });
              },
            ),
            const SizedBox(height: 18),
            clientsAsync.when(
              data: (clients) {
                final filtered = clients.where((client) {
                  if (_searchText.isEmpty) {
                    return true;
                  }
                  final haystack = [
                    client.name,
                    client.phone ?? '',
                    client.address ?? '',
                    client.email ?? '',
                  ].join(' ').toLowerCase();
                  return haystack.contains(_searchText);
                }).toList();

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [
                        _ClientMetric(label: 'Total', value: '${clients.length}'),
                        _ClientMetric(
                          label: 'Con teléfono',
                          value:
                              '${clients.where((c) => (c.phone ?? '').isNotEmpty).length}',
                        ),
                        _ClientMetric(
                          label: 'Visibles',
                          value: '${filtered.length}',
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),
                    if (filtered.isEmpty)
                      const _ClientEmptyState()
                    else
                      ...filtered.map(
                        (client) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _ClientCard(
                            client: client,
                            onEdit: () => _showEditClientDialog(context, client),
                          ),
                        ),
                      ),
                  ],
                );
              },
              loading: () => const _ClientLoadingState(),
              error: (error, stackTrace) => _ClientErrorState(
                message: error.toString(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ClientHero extends StatelessWidget {
  const _ClientHero({
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
          colors: [Color(0xFF1E293B), Color(0xFF0F766E)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            storeName == null ? 'Cartera de clientes' : 'Clientes • $storeName',
            style: theme.textTheme.headlineSmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Acceso rápido para búsqueda de cliente en calle o en mostrador.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: Colors.white.withValues(alpha: 0.82),
            ),
          ),
          const SizedBox(height: 18),
          TextField(
            controller: controller,
            onChanged: onChanged,
            decoration: InputDecoration(
              hintText: 'Buscar nombre, teléfono o dirección...',
              prefixIcon: const Icon(Icons.search_rounded),
              suffixIcon: controller.text.isEmpty
                  ? null
                  : IconButton(
                      onPressed: () {
                        controller.clear();
                        onChanged('');
                      },
                      icon: const Icon(Icons.close_rounded),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ClientMetric extends StatelessWidget {
  const _ClientMetric({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
          ),
        ],
      ),
    );
  }
}

class _ClientCard extends StatelessWidget {
  const _ClientCard({required this.client, this.onEdit});

  final ClientSummary client;
  final VoidCallback? onEdit;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A0F172A),
            blurRadius: 18,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  client.name,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              if (onEdit != null)
                IconButton(
                  icon: const Icon(Icons.edit_outlined, size: 20),
                  onPressed: onEdit,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
            ],
          ),
          if (client.creditLimit != null || client.creditDays != null) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                if (client.creditLimit != null && client.creditLimit! > 0)
                  Container(
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: Colors.blue.shade200),
                    ),
                    child: Text(
                      'Límite: C\$ ${client.creditLimit}',
                      style: TextStyle(fontSize: 12, color: Colors.blue.shade700, fontWeight: FontWeight.bold),
                    ),
                  ),
                if (client.creditDays != null && client.creditDays! > 0)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.amber.shade50,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: Colors.amber.shade200),
                    ),
                    child: Text(
                      'Crédito: ${client.creditDays} días',
                      style: TextStyle(fontSize: 12, color: Colors.amber.shade900, fontWeight: FontWeight.bold),
                    ),
                  ),
              ],
            ),
          ],
          const SizedBox(height: 12),
          if ((client.phone ?? '').isNotEmpty)
            _ClientLine(
              icon: Icons.phone_rounded,
              text: client.phone!,
            ),
          if ((client.email ?? '').isNotEmpty) ...[
            const SizedBox(height: 8),
            _ClientLine(
              icon: Icons.alternate_email_rounded,
              text: client.email!,
            ),
          ],
          if ((client.address ?? '').isNotEmpty) ...[
            const SizedBox(height: 8),
            _ClientLine(
              icon: Icons.location_on_outlined,
              text: client.address!,
            ),
          ],
        ],
      ),
    );
  }
}

class _ClientLine extends StatelessWidget {
  const _ClientLine({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: const Color(0xFF475569)),
        const SizedBox(width: 10),
        Expanded(child: Text(text)),
      ],
    );
  }
}

class _ClientLoadingState extends StatelessWidget {
  const _ClientLoadingState();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        children: const [
          SizedBox(
            width: 22,
            height: 22,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
          SizedBox(width: 14),
          Expanded(child: Text('Cargando clientes...')),
        ],
      ),
    );
  }
}

class _ClientErrorState extends StatelessWidget {
  const _ClientErrorState({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF1F2),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFFDA4AF)),
      ),
      child: Text(message),
    );
  }
}

class _ClientEmptyState extends StatelessWidget {
  const _ClientEmptyState();

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
          Icon(Icons.people_alt_outlined, size: 42, color: Color(0xFF64748B)),
          SizedBox(height: 12),
          Text(
            'No se encontraron clientes',
            style: TextStyle(fontWeight: FontWeight.w800),
          ),
          SizedBox(height: 6),
          Text(
            'Ajusta la búsqueda o refresca el listado.',
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
