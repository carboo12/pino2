import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/premium_widgets.dart';
import '../presentation/despacho_controller.dart';

class CatalogScreen extends StatefulWidget {
  const CatalogScreen({super.key});

  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  final _searchCtrl = TextEditingController();
  String _filtroQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DespachoController>().cargarCatalogo();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final despacho = context.watch<DespachoController>();

    final filtrados = despacho.catalogoJuguetes.where((j) {
      if (_filtroQuery.isEmpty) return true;
      final q = _filtroQuery.toLowerCase();
      final nombreMatch = j.nombreJuguete.toLowerCase().contains(q);
      final catMatch = (j.categoria ?? '').toLowerCase().contains(q);
      return nombreMatch || catMatch;
    }).toList();

    return Scaffold(
      backgroundColor: AppTheme.slate50,
      appBar: AppBar(
        title: const Text('Catálogo de Juguetes'),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded, color: AppTheme.slate800),
          onPressed: () => Scaffold.of(context).openDrawer(),
        ),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Buscador superior
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchCtrl,
              onChanged: (val) {
                setState(() {
                  _filtroQuery = val;
                });
              },
              decoration: InputDecoration(
                hintText: 'Buscar juguete...',
                prefixIcon: const Icon(Icons.search, color: AppTheme.slate400),
                suffixIcon: _searchCtrl.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: AppTheme.slate400),
                        onPressed: () {
                          _searchCtrl.clear();
                          setState(() {
                            _filtroQuery = '';
                          });
                        },
                      )
                    : null,
              ),
            ),
          ),

          // Listado
          Expanded(
            child: RefreshIndicator(
              color: AppTheme.primary,
              onRefresh: () => despacho.cargarCatalogo(),
              child: filtrados.isEmpty
                  ? const PremiumEmptyState(
                      icon: Icons.inventory_2_outlined,
                      title: 'No hay juguetes',
                      subtitle: 'No se encontraron juguetes en el inventario.',
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: filtrados.length,
                      itemBuilder: (context, index) {
                        final juguete = filtrados[index];
                        final Color statusColor = juguete.stockActual <= 5
                            ? AppTheme.error
                            : juguete.stockActual <= 10
                                ? AppTheme.warning
                                : AppTheme.success;

                        final Color statusBg = juguete.stockActual <= 5
                            ? AppTheme.errorLight
                            : juguete.stockActual <= 10
                                ? AppTheme.warningLight
                                : AppTheme.successLight;

                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppTheme.slate200),
                            boxShadow: AppTheme.cardShadow,
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                // Thumbnail de foto
                                Container(
                                  width: 50,
                                  height: 50,
                                  margin: const EdgeInsets.only(right: 12),
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: AppTheme.slate200),
                                  ),
                                  child: AppImage(
                                    url: juguete.fotoUrl,
                                    width: 50,
                                    height: 50,
                                    borderRadius: 6,
                                    fit: BoxFit.cover,
                                    errorWidget: Container(
                                      color: AppTheme.slate100,
                                      child: const Icon(
                                        Icons.inventory_2_rounded,
                                        color: AppTheme.slate400,
                                        size: 24,
                                      ),
                                    ),
                                  ),
                                ),

                                // Detalles del juguete
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        juguete.nombreJuguete,
                                        style: const TextStyle(
                                          fontFamily: 'Inter',
                                          fontSize: 15,
                                          fontWeight: FontWeight.w700,
                                          color: AppTheme.slate900,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          Text(
                                            juguete.categoria ?? 'Sin cat.',
                                            style: const TextStyle(
                                              fontFamily: 'Inter',
                                              fontSize: 11,
                                              color: AppTheme.slate500,
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: juguete.genero == 'F'
                                                  ? const Color(0xFFFCE7F3)
                                                  : juguete.genero == 'M'
                                                      ? const Color(0xFFDBEAFE)
                                                      : AppTheme.slate100,
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: Text(
                                              juguete.genero == 'F'
                                                  ? 'Niñas'
                                                  : juguete.genero == 'M'
                                                      ? 'Niños'
                                                      : 'Unisex',
                                              style: const TextStyle(
                                                fontFamily: 'Inter',
                                                fontSize: 9,
                                                fontWeight: FontWeight.w700,
                                                color: AppTheme.slate700,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),

                                const SizedBox(width: 12),

                                // Stock badge
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: statusBg,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(
                                    juguete.stockActual.toString(),
                                    style: TextStyle(
                                      fontFamily: 'Inter',
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                      color: statusColor,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
