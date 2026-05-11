import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/database/local_cache_repository.dart';
import '../../../../core/network/connectivity_service.dart';
import '../../../../core/network/sync_queue_processor.dart';
import '../../../../core/realtime/realtime_event.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../data/catalog_repository.dart';
import '../../domain/models/catalog_product.dart';

final catalogProductsProvider = FutureProvider.family
    .autoDispose<List<CatalogProduct>, String>((ref, storeId) async {
      ref.watch(networkStatusProvider);
      ref.watch(syncQueueProcessorProvider.select((state) => state.lastSyncAt));
      ref.watch(
        latestRealtimeEventProvider.select((asyncEvent) {
          final event = asyncEvent.asData?.value;
          if (event == null || event.storeId != storeId) {
            return null;
          }
          if (event.type != RealtimeEventType.inventoryTransfer) {
            return null;
          }
          return '${event.label}:${event.payload.hashCode}';
        }),
      );

      final session = ref.watch(authControllerProvider).session;
      if (session == null) {
        return <CatalogProduct>[];
      }

      return ref
          .read(catalogRepositoryProvider)
          .getProducts(storeId: storeId, accessToken: session.accessToken);
    });

class ProductCatalogScreen extends ConsumerStatefulWidget {
  const ProductCatalogScreen({
    required this.storeId,
    this.storeName,
    super.key,
  });

  final String storeId;
  final String? storeName;

  @override
  ConsumerState<ProductCatalogScreen> createState() =>
      _ProductCatalogScreenState();
}

class _ProductCatalogScreenState extends ConsumerState<ProductCatalogScreen> {
  final _searchController = TextEditingController();
  String _searchText = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(catalogProductsProvider(widget.storeId));
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Catálogo móvil')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(catalogProductsProvider(widget.storeId));
          await ref.read(catalogProductsProvider(widget.storeId).future);
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          children: [
            _CatalogHero(
              storeName: widget.storeName,
              searchController: _searchController,
              onSearchChanged: (value) {
                setState(() {
                  _searchText = value.trim().toLowerCase();
                });
              },
            ),
            const SizedBox(height: 18),
            productsAsync.when(
              data: (products) {
                final visibleProducts = products.where((product) {
                  if (_searchText.isEmpty) {
                    return true;
                  }
                  final haystack = [
                    product.description,
                    product.brand ?? '',
                    product.barcode ?? '',
                    product.department ?? '',
                    product.subDepartment ?? '',
                  ].join(' ').toLowerCase();
                  return haystack.contains(_searchText);
                }).toList();

                final lowStockCount =
                    products.where((product) => product.isLowStock).length;

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [
                        _MetricChip(
                          label: 'Productos',
                          value: '${products.length}',
                          color: theme.colorScheme.primary,
                        ),
                        _MetricChip(
                          label: 'Stock bajo',
                          value: '$lowStockCount',
                          color: const Color(0xFFB45309),
                        ),
                        _MetricChip(
                          label: 'Visibles',
                          value: '${visibleProducts.length}',
                          color: const Color(0xFF0F766E),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),
                    if (visibleProducts.isEmpty)
                      const _EmptyStateCard(
                        title: 'No hay coincidencias',
                        message:
                            'Prueba otro texto o refresca para volver a cargar el catálogo.',
                      )
                    else
                      ...visibleProducts.map(
                        (product) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _ProductCard(product: product),
                        ),
                      ),
                  ],
                );
              },
              loading: () => const _LoadingCard(
                title: 'Cargando catálogo operativo...',
              ),
              error: (error, stackTrace) => _ErrorCard(
                title: 'No se pudo cargar el catálogo',
                message: error.toString(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CatalogHero extends StatelessWidget {
  const _CatalogHero({
    required this.searchController,
    required this.onSearchChanged,
    this.storeName,
  });

  final TextEditingController searchController;
  final ValueChanged<String> onSearchChanged;
  final String? storeName;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: const LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF14532D)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            storeName == null ? 'Catálogo operativo' : 'Catálogo • $storeName',
            style: theme.textTheme.headlineSmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Búsqueda rápida para vendedor, bodega o ruta. Sin saltar entre pantallas.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: Colors.white.withValues(alpha: 0.82),
              height: 1.35,
            ),
          ),
          const SizedBox(height: 18),
          TextField(
            controller: searchController,
            onChanged: onSearchChanged,
            textInputAction: TextInputAction.search,
            decoration: InputDecoration(
              hintText: 'Buscar producto, marca o código...',
              prefixIcon: const Icon(Icons.search_rounded),
              suffixIcon: searchController.text.isEmpty
                  ? null
                  : IconButton(
                      onPressed: () {
                        searchController.clear();
                        onSearchChanged('');
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

class _ProductCard extends StatelessWidget {
  const _ProductCard({required this.product});

  final CatalogProduct product;

  static bool _hasBulkPrices(CatalogProduct p) {
    return p.bulkPrice1 > 0 ||
        p.bulkPrice2 > 0 ||
        p.bulkPrice3 > 0 ||
        p.bulkPrice4 > 0 ||
        p.bulkPrice5 > 0;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final lowStock = product.isLowStock;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: lowStock ? const Color(0xFFF59E0B) : Colors.grey.shade200,
        ),
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
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.description,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      [
                        if ((product.brand ?? '').isNotEmpty) product.brand!,
                        if ((product.department ?? '').isNotEmpty)
                          product.department!,
                      ].join(' • '),
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: Colors.black54,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: lowStock
                      ? const Color(0xFFFFF7ED)
                      : const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Text(
                  lowStock ? 'Stock bajo' : 'Disponible',
                  style: TextStyle(
                    color: lowStock
                        ? const Color(0xFFB45309)
                        : const Color(0xFF166534),
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _InfoPill(
                icon: Icons.inventory_2_outlined,
                label: product.stockLabel,
              ),
              _InfoPill(
                icon: Icons.sell_outlined,
                label: 'C\$ ${product.salePrice.toStringAsFixed(2)}',
              ),
              if ((product.barcode ?? '').isNotEmpty)
                _InfoPill(
                  icon: Icons.qr_code_2_rounded,
                  label: product.barcode!,
                ),
              _InfoPill(
                icon: Icons.widgets_outlined,
                label: 'UPB ${product.unitsPerBulk}',
              ),
            ],
          ),
          if (_hasBulkPrices(product)) ...[
            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 10),
            Text(
              'PRECIOS POR BULTO',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: Colors.blueGrey.shade400,
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (product.bulkPrice1 > 0)
                  _BulkPricePill(label: 'Detalle', price: product.bulkPrice1),
                if (product.bulkPrice2 > 0)
                  _BulkPricePill(label: 'Semi-May', price: product.bulkPrice2),
                if (product.bulkPrice3 > 0)
                  _BulkPricePill(label: 'Mayoreo', price: product.bulkPrice3),
                if (product.bulkPrice4 > 0)
                  _BulkPricePill(label: 'Especial', price: product.bulkPrice4),
                if (product.bulkPrice5 > 0)
                  _BulkPricePill(label: 'Mínimo', price: product.bulkPrice5),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _MetricChip extends StatelessWidget {
  const _MetricChip({
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
          Text(
            label,
            style: TextStyle(color: color, fontWeight: FontWeight.w700),
          ),
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

class _InfoPill extends StatelessWidget {
  const _InfoPill({required this.icon, required this.label});

  final IconData icon;
  final String label;

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
          Text(label),
        ],
      ),
    );
  }
}

class _BulkPricePill extends StatelessWidget {
  const _BulkPricePill({required this.label, required this.price});

  final String label;
  final double price;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFBBF7D0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: Color(0xFF166534),
            ),
          ),
          Text(
            'C\$ ${price.toStringAsFixed(2)}',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: Color(0xFF15803D),
            ),
          ),
        ],
      ),
    );
  }
}

class _LoadingCard extends StatelessWidget {
  const _LoadingCard({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        children: [
          const SizedBox(
            width: 22,
            height: 22,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
          const SizedBox(width: 14),
          Expanded(child: Text(title)),
        ],
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.title, required this.message});

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF1F2),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFFDA4AF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: theme.textTheme.titleMedium?.copyWith(
              color: const Color(0xFF9F1239),
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            message,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: const Color(0xFF9F1239),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyStateCard extends StatelessWidget {
  const _EmptyStateCard({required this.title, required this.message});

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          const Icon(Icons.search_off_rounded, size: 42, color: Color(0xFF64748B)),
          const SizedBox(height: 12),
          Text(title, style: const TextStyle(fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          Text(message, textAlign: TextAlign.center),
        ],
      ),
    );
  }
}
