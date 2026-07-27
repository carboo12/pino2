import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/premium_widgets.dart';
import '../presentation/despacho_controller.dart';
import 'detail_screen.dart';

class DispatchScreen extends StatefulWidget {
  const DispatchScreen({super.key});

  @override
  State<DispatchScreen> createState() => _DispatchScreenState();
}

class _DispatchScreenState extends State<DispatchScreen> {
  final _directSearchCtrl = TextEditingController();
  final _listFilterCtrl = TextEditingController();
  Timer? _debounceTimer;
  int _pagina = 1;
  String _selectedTab = 'pendientes';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  @override
  void dispose() {
    _directSearchCtrl.dispose();
    _listFilterCtrl.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadData({bool forceReload = false}) async {
    final ctrl = context.read<DespachoController>();
    ctrl.cargarKPIs();
    await ctrl.cargarCenso(
      busqueda: _listFilterCtrl.text,
      estado: _selectedTab,
      pagina: _pagina,
      requiereAsistencia: true,
      forceReload: forceReload,
    );
  }

  void _onFilterChanged(String val) {
    if (_debounceTimer?.isActive ?? false) _debounceTimer!.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 400), () {
      setState(() { _pagina = 1; });
      _loadData();
    });
  }

  void _verFotosCompletado(String carnet) {
    // Navega a la ficha para ver las fotos de evidencia
    _navegarAFicha(carnet);
  }

  void _cambiarPagina(int offset) {
    final ctrl = context.read<DespachoController>();
    final nuevaPag = _pagina + offset;
    if (nuevaPag < 1 || nuevaPag > ctrl.censoTotalPaginas) return;
    setState(() { _pagina = nuevaPag; });
    _loadData();
    HapticFeedback.lightImpact();
  }

  void _buscarDirecto() async {
    final carnet = _directSearchCtrl.text.trim();
    if (carnet.isEmpty) return;
    final ctrl = context.read<DespachoController>();
    HapticFeedback.mediumImpact();

    showDialog(context: context, barrierDismissible: false, builder: (_) => const Center(child: CircularProgressIndicator(color: AppTheme.primary)));
    final found = await ctrl.buscarColaborador(carnet);
    if (mounted) {
      Navigator.pop(context);
      if (found) {
        _directSearchCtrl.clear();
        await Navigator.push(context, MaterialPageRoute(builder: (_) => const DetailScreen()));
        _loadData(forceReload: true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ctrl.error ?? 'Colaborador no encontrado'), backgroundColor: AppTheme.error, behavior: SnackBarBehavior.floating));
      }
    }
  }

  void _navegarAFicha(String carnet) async {
    final ctrl = context.read<DespachoController>();
    HapticFeedback.mediumImpact();
    showDialog(context: context, barrierDismissible: false, builder: (_) => const Center(child: CircularProgressIndicator(color: AppTheme.primary)));
    final found = await ctrl.buscarColaborador(carnet);
    if (mounted) {
      Navigator.pop(context);
      if (found) {
        await Navigator.push(context, MaterialPageRoute(builder: (_) => const DetailScreen()));
        _loadData(forceReload: true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ctrl.error ?? 'Error'), backgroundColor: AppTheme.error, behavior: SnackBarBehavior.floating));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final despacho = context.watch<DespachoController>();
    final kpis = despacho.kpis;
    final isMobile = MediaQuery.of(context).size.width < 600;

    final stats = [
      _buildKpiCard('Total Niños', '${kpis?['TotalNinos'] ?? 0}', const [Color(0xFF374151), Color(0xFF111827)], isMobile),
      _buildKpiCard('Entregados', '${kpis?['Entregados'] ?? 0}', const [Color(0xFF10B981), Color(0xFF059669)], isMobile),
      _buildKpiCard('Pendientes', '${kpis?['Pendientes'] ?? 0}', const [Color(0xFFDA291C), Color(0xFF991B1B)], isMobile),
    ];

    return Scaffold(
      backgroundColor: AppTheme.slate50,
      appBar: AppBar(
        title: const Text('Despacho de Juguetes'),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(icon: const Icon(Icons.menu_rounded, color: AppTheme.slate800), onPressed: () => Scaffold.of(context).openDrawer()),
      ),
      body: RefreshIndicator(
        color: AppTheme.primary,
        onRefresh: () => _loadData(forceReload: true),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.all(isMobile ? 12 : 24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1200),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                LayoutBuilder(
                  builder: (context, constraints) {
                    final gap = isMobile ? 6.0 : 12.0;
                    final cardWidth = (constraints.maxWidth - (gap * 2)) / 3;
                    return Row(
                      children: stats.map((card) {
                        final idx = stats.indexOf(card);
                        return Padding(padding: EdgeInsets.only(left: idx > 0 ? gap : 0), child: SizedBox(width: cardWidth, child: card));
                      }).toList(),
                    );
                  },
                ),
                const SizedBox(height: 16),
                _buildDirectSearchPanel(despacho),
                const SizedBox(height: 20),
                _buildTabToggleSection(),
                const SizedBox(height: 12),
                _buildListSection(despacho, isMobile),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildKpiCard(String label, String value, List<Color> gradientColors, bool isMobile) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: isMobile ? 8 : 16, vertical: 12),
      decoration: BoxDecoration(gradient: LinearGradient(colors: gradientColors, begin: Alignment.topLeft, end: Alignment.bottomRight), borderRadius: BorderRadius.circular(12)),
      child: isMobile
          ? Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(value, style: const TextStyle(fontFamily: 'Inter', fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white)),
              const SizedBox(height: 2),
              Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontFamily: 'Inter', fontSize: 9, fontWeight: FontWeight.w600, color: Colors.white.withValues(alpha: 0.85))),
            ])
          : Row(children: [
              Text(value, style: const TextStyle(fontFamily: 'Inter', fontSize: 26, fontWeight: FontWeight.w800, color: Colors.white)),
              const SizedBox(width: 8),
              Expanded(child: Text(label, style: TextStyle(fontFamily: 'Inter', fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white.withValues(alpha: 0.85)))),
            ]),
    );
  }

  Widget _buildDirectSearchPanel(DespachoController despacho) {
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: AppTheme.cardShadow, border: Border.all(color: AppTheme.slate200)),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Row(children: [Icon(Icons.search_rounded, color: Color(0xFFDA291C), size: 18), SizedBox(width: 6), Text('Búsqueda Rápida por Carnet', style: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w700, fontSize: 14, color: AppTheme.slate800))]),
          const SizedBox(height: 12),
          TextField(
            controller: _directSearchCtrl,
            keyboardType: TextInputType.text,
            textInputAction: TextInputAction.search,
            onSubmitted: (_) => _buscarDirecto(),
            style: const TextStyle(fontSize: 15, color: Color(0xFF111827)),
            decoration: InputDecoration(
              hintText: 'Ingrese carnet para abrir Ficha Familiar...',
              hintStyle: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 14),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              filled: true, fillColor: AppTheme.slate50,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE5E7EB))),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE5E7EB))),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFDA291C), width: 2.0)),
              suffixIcon: IconButton(icon: const Icon(Icons.arrow_forward_rounded, color: Color(0xFFDA291C)), onPressed: _buscarDirecto),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabToggleSection() {
    return Container(
      decoration: BoxDecoration(color: AppTheme.slate200, borderRadius: BorderRadius.circular(12)),
      padding: const EdgeInsets.all(4),
      child: Row(
        children: [
          Expanded(child: _buildTabButton('pendientes', 'Entregas Pendientes')),
          Expanded(child: _buildTabButton('completos', 'Completados')),
        ],
      ),
    );
  }

  Widget _buildTabButton(String tab, String label) {
    final active = _selectedTab == tab;
    return GestureDetector(
      onTap: () {
        if (_selectedTab != tab) { setState(() { _selectedTab = tab; _pagina = 1; }); _loadData(); }
      },
      child: Container(
        decoration: BoxDecoration(
          color: active ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          boxShadow: active ? [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4, offset: const Offset(0, 2))] : null,
        ),
        padding: const EdgeInsets.symmetric(vertical: 10),
        alignment: Alignment.center,
        child: Text(label, style: TextStyle(fontFamily: 'Inter', fontSize: 13, fontWeight: active ? FontWeight.w700 : FontWeight.w600, color: active ? AppTheme.slate900 : AppTheme.slate500)),
      ),
    );
  }

  Widget _buildListSection(DespachoController despacho, bool isMobile) {
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppTheme.slate200), boxShadow: AppTheme.cardShadow),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _listFilterCtrl,
                    onChanged: _onFilterChanged,
                    decoration: InputDecoration(
                      hintText: 'Filtrar por carnet o nombre...',
                      prefixIcon: const Icon(Icons.search_rounded, color: AppTheme.slate400, size: 20),
                      suffixIcon: _listFilterCtrl.text.isNotEmpty
                          ? IconButton(icon: const Icon(Icons.clear, color: AppTheme.slate400), onPressed: () { _listFilterCtrl.clear(); _onFilterChanged(''); })
                          : null,
                    ),
                  ),
                ),
                if (_selectedTab == 'pendientes') ...[
                  const SizedBox(width: 8),
                  SizedBox(
                    height: 48,
                    child: IconButton(
                      icon: const Icon(Icons.refresh_rounded, color: AppTheme.primary),
                      onPressed: () => _loadData(forceReload: true),
                      tooltip: 'Refrescar',
                      style: IconButton.styleFrom(backgroundColor: AppTheme.slate50, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (despacho.loadingCenso)
            const Padding(padding: EdgeInsets.all(40), child: Center(child: CircularProgressIndicator(color: AppTheme.primary)))
          else if (despacho.censoItems.isEmpty)
            PremiumEmptyState(
              icon: _selectedTab == 'pendientes' ? Icons.check_circle_outline_rounded : Icons.info_outline_rounded,
              title: _selectedTab == 'pendientes' ? '¡Todo despachado!' : 'Sin registros',
              subtitle: _selectedTab == 'pendientes' ? 'No hay colaboradores pendientes de entrega.' : 'No se encontraron colaboradores completados.',
            )
          else ...[
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: despacho.censoItems.length,
              itemBuilder: (context, index) {
                final item = despacho.censoItems[index];
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppTheme.slate200), boxShadow: AppTheme.cardShadow),
                  child: InkWell(
                    onTap: () => _navegarAFicha(item.carnet),
                    borderRadius: BorderRadius.circular(16),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          _buildAvatarCircle(item.nombre),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(item.carnet, style: const TextStyle(fontFamily: 'Inter', fontSize: 12, fontWeight: FontWeight.w800, color: AppTheme.primary)),
                                const SizedBox(height: 2),
                                Text(item.nombre, style: const TextStyle(fontFamily: 'Inter', fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.slate900)),
                                if (item.gerencia != null && item.gerencia!.isNotEmpty) ...[
                                  const SizedBox(height: 2),
                                  Text(item.gerencia!, style: const TextStyle(fontFamily: 'Inter', fontSize: 12, color: AppTheme.slate500)),
                                ],
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (_selectedTab == 'completos')
                                IconButton(
                                  icon: const Icon(Icons.camera_alt_rounded, size: 18, color: Color(0xFF6B7280)),
                                  onPressed: () => _verFotosCompletado(item.carnet),
                                  tooltip: 'Ver fotos de evidencia',
                                  padding: EdgeInsets.zero,
                                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                                ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(color: item.entregados == item.totalHijos ? const Color(0xFFD1FAE5) : const Color(0xFFFEF3C7), borderRadius: BorderRadius.circular(8)),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.card_giftcard_rounded, color: item.entregados == item.totalHijos ? const Color(0xFF065F46) : const Color(0xFF92400E), size: 16),
                                    const SizedBox(height: 2),
                                    Text('${item.entregados}/${item.totalHijos}', style: TextStyle(fontFamily: 'Inter', fontSize: 12, fontWeight: FontWeight.w800, color: item.entregados == item.totalHijos ? const Color(0xFF065F46) : const Color(0xFF92400E))),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 8),
            if (despacho.censoTotalPaginas > 1) _buildPaginationRow(despacho),
          ],
        ],
      ),
    );
  }

  Widget _buildAvatarCircle(String nombre) {
    return Container(
      width: 44, height: 44,
      decoration: const BoxDecoration(color: AppTheme.slate100, shape: BoxShape.circle),
      child: Center(child: Text(nombre.isNotEmpty ? nombre[0].toUpperCase() : '?', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFFDA291C)))),
    );
  }

  Widget _buildPaginationRow(DespachoController despacho) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(border: Border(top: BorderSide(color: AppTheme.slate200))),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text('Pág $_pagina de ${despacho.censoTotalPaginas}\n(${despacho.censoTotal} ${_selectedTab == 'pendientes' ? 'pendientes' : 'completados'})', style: const TextStyle(fontFamily: 'Inter', fontSize: 11, color: AppTheme.slate500)),
          Row(
            children: [
              IconButton(icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 14), onPressed: _pagina > 1 ? () => _cambiarPagina(-1) : null,
                style: IconButton.styleFrom(backgroundColor: Colors.white, disabledBackgroundColor: Colors.white.withValues(alpha: 0.5),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: const BorderSide(color: AppTheme.slate200)))),
              const SizedBox(width: 8),
              IconButton(icon: const Icon(Icons.arrow_forward_ios_rounded, size: 14), onPressed: _pagina < despacho.censoTotalPaginas ? () => _cambiarPagina(1) : null,
                style: IconButton.styleFrom(backgroundColor: Colors.white, disabledBackgroundColor: Colors.white.withValues(alpha: 0.5),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: const BorderSide(color: AppTheme.slate200)))),
            ],
          ),
        ],
      ),
    );
  }
}
