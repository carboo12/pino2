import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/premium_widgets.dart';
import '../../auth/presentation/auth_controller.dart';
import '../presentation/despacho_controller.dart';
import 'detail_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _searchCtrl = TextEditingController();
  String? _filtroEstado; // null = Todos, 'pendientes', 'completos'
  Timer? _debounceTimer;
  int _pagina = 1;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _loadData() {
    final ctrl = context.read<DespachoController>();
    ctrl.cargarKPIs();
    ctrl.cargarCenso(
      busqueda: _searchCtrl.text,
      estado: _filtroEstado,
      pagina: _pagina,
    );
  }

  void _onSearchChanged(String val) {
    if (_debounceTimer?.isActive ?? false) _debounceTimer!.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 400), () {
      setState(() {
        _pagina = 1;
      });
      _loadData();
    });
  }

  void _setFiltro(String? estado) {
    setState(() {
      _filtroEstado = estado;
      _pagina = 1;
    });
    _loadData();
    HapticFeedback.lightImpact();
  }

  void _cambiarPagina(int offset) {
    final ctrl = context.read<DespachoController>();
    final nuevaPag = _pagina + offset;
    if (nuevaPag < 1 || nuevaPag > ctrl.censoTotalPaginas) return;

    setState(() {
      _pagina = nuevaPag;
    });
    _loadData();
    HapticFeedback.lightImpact();
  }

  void _navegarAFicha(String carnet) async {
    final ctrl = context.read<DespachoController>();
    HapticFeedback.mediumImpact();

    // Mostramos un loading overlay
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(
        child: CircularProgressIndicator(color: AppTheme.primary),
      ),
    );

    final found = await ctrl.buscarColaborador(carnet);

    if (mounted) {
      Navigator.pop(context); // quitar loading
      if (found) {
        await Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const DetailScreen()),
        );
        // Al volver, recargamos los datos para actualizar el estado
        _loadData();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(ctrl.error ?? 'Colaborador no encontrado'),
            backgroundColor: AppTheme.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final despacho = context.watch<DespachoController>();

    final totalKids = despacho.kpis?['TotalNinos'] ?? 0;
    final deliveredKids = despacho.kpis?['Entregados'] ?? 0;
    final totalAdultos = despacho.censoItems.fold(
      0,
      (s, r) => s + r.totalAdultos,
    );
    final despacharKids = totalKids - deliveredKids;

    return Scaffold(
      backgroundColor: AppTheme.slate50,
      body: RefreshIndicator(
        color: AppTheme.primary,
        onRefresh: () async {
          _loadData();
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // ── Header con Gradiente Corporativo ──
            SliverAppBar(
              expandedHeight: 140,
              floating: false,
              pinned: true,
              backgroundColor: AppTheme.slate900,
              leading: IconButton(
                icon: const Icon(Icons.menu_rounded, color: Colors.white),
                onPressed: () => Scaffold.of(context).openDrawer(),
              ),
              flexibleSpace: FlexibleSpaceBar(
                titlePadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                title: Row(
                  children: [
                    const Icon(
                      Icons.dashboard_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'Dashboard',
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontWeight: FontWeight.w700,
                        fontSize: 18,
                        color: Colors.white,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      auth.user?.nombre.split(' ').first ?? 'Operador',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 11,
                        color: Colors.white.withValues(alpha: 0.7),
                        fontWeight: FontWeight.normal,
                      ),
                    ),
                  ],
                ),
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: AppTheme.heroGradient,
                  ),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Padding(
                      padding: const EdgeInsets.only(left: 16, top: 40),
                      child: Text(
                        'Día del Niño ${DateTime.now().year}',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          color: Colors.white.withValues(alpha: 0.5),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.logout_rounded, color: Colors.white),
                  onPressed: () async {
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text('Cerrar Sesión'),
                        content: const Text(
                          '¿Deseas cerrar tu sesión de operador?',
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(ctx, false),
                            child: const Text('Cancelar'),
                          ),
                          TextButton(
                            onPressed: () => Navigator.pop(ctx, true),
                            child: const Text(
                              'Cerrar Sesión',
                              style: TextStyle(color: AppTheme.error),
                            ),
                          ),
                        ],
                      ),
                    );
                    if (confirm == true && mounted) {
                      await auth.logout();
                    }
                  },
                  tooltip: 'Cerrar Sesión',
                ),
              ],
            ),

            // ── Contenedor de KPIs ──
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Grid de KPIs con Gradientes idénticos a React
                    Row(
                      children: [
                        Expanded(
                          child: _buildKPI(
                            'Total Niños Censados',
                            totalKids,
                            const [Color(0xFF374151), Color(0xFF111827)],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildKPI(
                            'Adultos Registrados',
                            totalAdultos,
                            const [Color(0xFF2563EB), Color(0xFF1D4ED8)],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildKPI(
                            'Hijos x Despachar',
                            totalKids,
                            const [Color(0xFF10B981), Color(0xFF059669)],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildKPI('Entregados', deliveredKids, const [
                            Color(0xFF059669),
                            Color(0xFF047857),
                          ]),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildKPI(
                            'Por Despachar',
                            despacharKids,
                            const [Color(0xFFF59E0B), Color(0xFFD97706)],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Barra de Búsqueda
                    TextField(
                      controller: _searchCtrl,
                      onChanged: _onSearchChanged,
                      decoration: InputDecoration(
                        hintText: 'Buscar carnet, colaborador o hijo...',
                        prefixIcon: const Icon(
                          Icons.search,
                          color: AppTheme.slate400,
                        ),
                        suffixIcon: _searchCtrl.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(
                                  Icons.clear,
                                  color: AppTheme.slate400,
                                ),
                                onPressed: () {
                                  _searchCtrl.clear();
                                  _onSearchChanged('');
                                },
                              )
                            : null,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Filtros de Estado (Todos, Pendientes, Completos)
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildFilterButton('Todos', null),
                          const SizedBox(width: 8),
                          _buildFilterButton('Pendientes', 'pendientes'),
                          const SizedBox(width: 8),
                          _buildFilterButton('Completos', 'completos'),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ── Listado del Censo de Colaboradores ──
            if (despacho.loadingCenso)
              const SliverFillRemaining(
                child: Center(
                  child: CircularProgressIndicator(color: AppTheme.primary),
                ),
              )
            else if (despacho.censoItems.isEmpty)
              const SliverFillRemaining(
                child: PremiumEmptyState(
                  icon: Icons.search_off_rounded,
                  title: 'No se encontraron registros',
                  subtitle: 'Intenta con otro filtro o término de búsqueda.',
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate((context, index) {
                    final item = despacho.censoItems[index];
                    final fullyDelivered =
                        item.totalHijos > 0 &&
                        item.entregados == item.totalHijos;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: fullyDelivered
                              ? AppTheme.success.withValues(alpha: 0.3)
                              : AppTheme.slate200,
                          width: 1.5,
                        ),
                        boxShadow: AppTheme.cardShadow,
                      ),
                      child: InkWell(
                        onTap: () => _navegarAFicha(item.carnet),
                        borderRadius: BorderRadius.circular(16),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    item.carnet,
                                    style: const TextStyle(
                                      fontFamily: 'Inter',
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                      color: AppTheme.primary,
                                    ),
                                  ),
                                  const Spacer(),
                                  // Estado de Asistencia
                                  if (item.asistio > 0)
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 3,
                                      ),
                                      decoration: BoxDecoration(
                                        color: AppTheme.successLight,
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: const Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            Icons.check_circle_rounded,
                                            color: AppTheme.success,
                                            size: 12,
                                          ),
                                          SizedBox(width: 4),
                                          Text(
                                            'Asistió',
                                            style: TextStyle(
                                              fontFamily: 'Inter',
                                              fontSize: 10,
                                              fontWeight: FontWeight.w700,
                                              color: AppTheme.success,
                                            ),
                                          ),
                                        ],
                                      ),
                                    )
                                  else
                                    Text(
                                      'Sin registrar',
                                      style: TextStyle(
                                        fontFamily: 'Inter',
                                        fontSize: 11,
                                        color: AppTheme.slate400,
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                item.nombre,
                                style: const TextStyle(
                                  fontFamily: 'Inter',
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.slate900,
                                ),
                              ),
                              if (item.gerencia != null &&
                                  item.gerencia!.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Text(
                                  item.gerencia!,
                                  style: const TextStyle(
                                    fontFamily: 'Inter',
                                    fontSize: 12,
                                    color: AppTheme.slate500,
                                  ),
                                ),
                              ],
                              const SizedBox(height: 12),
                              const Divider(
                                height: 1,
                                color: AppTheme.slate100,
                              ),
                              const SizedBox(height: 12),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(
                                        Icons.child_care_rounded,
                                        color: AppTheme.slate400,
                                        size: 16,
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        'Hijos: ${item.totalHijos}',
                                        style: const TextStyle(
                                          fontFamily: 'Inter',
                                          fontSize: 13,
                                          color: AppTheme.slate700,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  ),
                                  Row(
                                    children: [
                                      const Icon(
                                        Icons.card_giftcard_rounded,
                                        color: AppTheme.slate400,
                                        size: 16,
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        'Entregados: ${item.entregados}/${item.totalHijos}',
                                        style: TextStyle(
                                          fontFamily: 'Inter',
                                          fontSize: 13,
                                          fontWeight: FontWeight.w700,
                                          color: fullyDelivered
                                              ? AppTheme.success
                                              : AppTheme.slate700,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }, childCount: despacho.censoItems.length),
                ),
              ),

            // ── Paginador Inferior ──
            if (!despacho.loadingCenso && despacho.censoTotalPaginas > 1)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 24,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Pág $_pagina de ${despacho.censoTotalPaginas}\n(${despacho.censoTotal} registros)',
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 12,
                          color: AppTheme.slate500,
                        ),
                      ),
                      Row(
                        children: [
                          IconButton(
                            icon: const Icon(
                              Icons.arrow_back_ios_new_rounded,
                              size: 16,
                            ),
                            onPressed: _pagina > 1
                                ? () => _cambiarPagina(-1)
                                : null,
                            style: IconButton.styleFrom(
                              backgroundColor: Colors.white,
                              disabledBackgroundColor: Colors.white.withValues(
                                alpha: 0.5,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                                side: const BorderSide(
                                  color: AppTheme.slate200,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            icon: const Icon(
                              Icons.arrow_forward_ios_rounded,
                              size: 16,
                            ),
                            onPressed: _pagina < despacho.censoTotalPaginas
                                ? () => _cambiarPagina(1)
                                : null,
                            style: IconButton.styleFrom(
                              backgroundColor: Colors.white,
                              disabledBackgroundColor: Colors.white.withValues(
                                alpha: 0.5,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                                side: const BorderSide(
                                  color: AppTheme.slate200,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

            const SliverToBoxAdapter(child: SizedBox(height: 20)),
          ],
        ),
      ),
    );
  }

  Widget _buildKPI(String label, int value, List<Color> colors) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: colors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: colors.last.withValues(alpha: 0.25),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Text(
            value.toString(),
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontFamily: 'Inter',
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: Colors.white,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 9,
              fontWeight: FontWeight.w600,
              color: Colors.white.withValues(alpha: 0.85),
              height: 1.2,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterButton(String label, String? estado) {
    final active = _filtroEstado == estado;
    return ChoiceChip(
      label: Text(label),
      selected: active,
      onSelected: (_) => _setFiltro(estado),
      selectedColor: AppTheme.primary,
      backgroundColor: AppTheme.slate100,
      labelStyle: TextStyle(
        fontFamily: 'Inter',
        fontSize: 12,
        fontWeight: FontWeight.w700,
        color: active ? Colors.white : AppTheme.slate600,
      ),
      showCheckmark: false,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
    );
  }
}
