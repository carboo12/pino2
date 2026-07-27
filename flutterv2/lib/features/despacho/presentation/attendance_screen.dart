import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../presentation/despacho_controller.dart';
import '../domain/colaborador_models.dart';


class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  final _searchCtrl = TextEditingController();
  final _filterCtrl = TextEditingController();
  Timer? _debounceTimer;

  int _adultos = 1;
  int _ninos = 0;
  String _asistioPor = 'COLABORADOR';
  final _nombreAsistenteCtrl = TextEditingController();
  String? _infoCarnet;

  int _pagina = 1;
  static const _porPagina = 5;

  List<CensoItem> _allAsistidos = [];
  bool _loadingCenso = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DespachoController>().cargarKPIs();
      _loadAllAsistidos();
    });
  }

  Future<void> _loadAllAsistidos() async {
    final ctrl = context.read<DespachoController>();
    if (mounted) setState(() => _loadingCenso = true);

    try {
      await ctrl.cargarCenso(
        estado: 'asistidos',
        pagina: 1,
        requiereAsistencia: true,
        forceReload: true,
      );
      List<CensoItem> allItems = List.from(ctrl.censoItems);
      for (int p = 2; p <= ctrl.censoTotalPaginas; p++) {
        await ctrl.cargarCenso(
          estado: 'asistidos',
          pagina: p,
          requiereAsistencia: true,
          forceReload: false,
        );
        allItems.addAll(ctrl.censoItems);
      }
      if (mounted) {
        setState(() {
          _allAsistidos = allItems;
          _loadingCenso = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingCenso = false);
    }
  }

  List<CensoItem> get _filtrados {
    final q = _filterCtrl.text.toUpperCase().trim();
    if (q.isEmpty) return _allAsistidos;
    return _allAsistidos.where((r) => '${r.carnet} ${r.nombre}'.toUpperCase().contains(q)).toList();
  }

  int get _totalFiltrados => _filtrados.length;
  int get _totalPaginas => max(1, (_totalFiltrados / _porPagina).ceil());
  List<CensoItem> get _paginados {
    final start = (_pagina - 1) * _porPagina;
    return _filtrados.skip(start).take(_porPagina).toList();
  }

  void _onFilterChanged(String val) {
    if (_debounceTimer?.isActive ?? false) _debounceTimer!.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 300), () {
      if (mounted) {
        setState(() {
          _pagina = 1;
        });
      }
    });
  }

  bool _mostrarResultados = false;

  Future<void> _buscar() async {
    final input = _searchCtrl.text.trim();
    if (input.isEmpty) return;

    final ctrl = context.read<DespachoController>();
    final esNumerico = RegExp(r'^\d{4,}$').hasMatch(input);

    if (esNumerico) {
      setState(() => _mostrarResultados = false);
      ctrl.resultadosBusqueda = [];
      final found = await ctrl.buscarColaborador(input);
      if (mounted) {
        if (found) {
          setState(() => _ninos = ctrl.lookupResult?.hijos.length ?? 0);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(ctrl.error ?? 'Colaborador no encontrado'), backgroundColor: ClaroTheme.error, behavior: SnackBarBehavior.floating),
          );
        }
      }
    } else {
      await ctrl.buscarPorNombre(input);
      if (mounted) {
        setState(() {
          _mostrarResultados = ctrl.resultadosBusqueda.isNotEmpty;
        });
        if (!_mostrarResultados) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(ctrl.error ?? 'No se encontraron colaboradores'),
              backgroundColor: ClaroTheme.error,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    }
  }

  Future<void> _seleccionarResultado(String carnet) async {
    setState(() => _mostrarResultados = false);
    _searchCtrl.text = carnet;
    await _buscar();
  }

  Future<void> _registrar() async {
    final ctrl = context.read<DespachoController>();
    if (ctrl.colaborador == null) return;

    if (ctrl.lookupResult?.inactivo == true && mounted) {
      final confirm = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('¿Registrar colaborador dado de baja?', style: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w700)),
          content: Text('${ctrl.colaborador!.nombre} está dado de baja en el Portal. ¿Confirma que desea registrar su asistencia?'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
            TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Sí, registrar', style: TextStyle(color: Color(0xFFDA291C), fontWeight: FontWeight.w700))),
          ],
        ),
      );
      if (confirm != true) return;
    }

    final success = await ctrl.registrarAsistencia(
      adultos: _adultos,
      ninos: _ninos,
      asistioPor: _asistioPor,
      nombreAsistente: _asistioPor == 'TERCERO' ? _nombreAsistenteCtrl.text.trim() : null,
    );
    if (mounted) {
      if (success) {
        HapticFeedback.mediumImpact();
        setState(() {
          _adultos = 1;
          _ninos = 0;
          _asistioPor = 'COLABORADOR';
          _nombreAsistenteCtrl.clear();
        });
        await _loadAllAsistidos();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(ctrl.error ?? 'Error al registrar'),
            backgroundColor: ClaroTheme.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Future<void> _reversar(String carnet) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Reversar Asistencia'),
        content: Text('¿Reversar la asistencia de $carnet?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Confirmar', style: TextStyle(color: ClaroTheme.error)),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      final ctrl = context.read<DespachoController>();
      final success = await ctrl.reversarAsistencia(carnet);
      if (mounted) {
        if (success) {
          await _loadAllAsistidos();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(ctrl.error ?? 'Error al reversar'),
              backgroundColor: ClaroTheme.error,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    }
  }

  void _handleExportExcel() {
    final headers = ['Carnet', 'Nombre', 'Gerencia', 'Adultos', 'Niños', 'Hijos', 'Entregados'];
    final rows = _filtrados.map((r) => [
      r.carnet,
      r.nombre,
      r.gerencia ?? '',
      r.totalAdultos.toString(),
      r.totalNinos.toString(),
      r.totalHijos.toString(),
      '${r.entregados}/${r.totalHijos}',
    ].join(','));
    final csv = '${headers.join(',')}\n${rows.join('\n')}';

    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('CSV copiado al portapapeles'),
        behavior: SnackBarBehavior.floating,
        action: SnackBarAction(label: 'OK', onPressed: () {}),
      ),
    );
    Clipboard.setData(ClipboardData(text: csv));
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _filterCtrl.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }  @override
  Widget build(BuildContext context) {
    final despacho = context.watch<DespachoController>();
    final kpis = despacho.kpis;
    final isMobile = MediaQuery.of(context).size.width < 600;

    int totalAdultosCalc = 0, totalNinosCalc = 0;
    for (final r in _allAsistidos) {
      totalAdultosCalc += r.totalAdultos;
      totalNinosCalc += r.totalNinos;
    }

    final stats = [
      _buildKpiCard('Total Niños Censados', '${kpis?['TotalNinos'] ?? 0}', const [Color(0xFF374151), Color(0xFF111827)], isMobile),
      _buildKpiCard('Adultos Registrados', '$totalAdultosCalc', const [Color(0xFFDA291C), Color(0xFF991B1B)], isMobile),
      _buildKpiCard('Niños Registrados', '$totalNinosCalc', const [Color(0xFF10B981), Color(0xFF059669)], isMobile),
    ];

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text('Registro de Asistencia'),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded, color: ClaroTheme.slate800),
          onPressed: () => Scaffold.of(context).openDrawer(),
        ),
      ),
      body: RefreshIndicator(
        color: ClaroTheme.primary,
        onRefresh: () async {
          await context.read<DespachoController>().cargarKPIs();
          await _loadAllAsistidos();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.all(isMobile ? 12 : 24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1200),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // ── KPIs ──
                LayoutBuilder(
                  builder: (context, constraints) {
                    final gap = isMobile ? 6.0 : 12.0;
                    final cardWidth = (constraints.maxWidth - (gap * 2)) / 3;
                    return Row(
                      children: stats.map((card) {
                        final idx = stats.indexOf(card);
                        return Padding(
                          padding: EdgeInsets.only(
                            left: idx > 0 ? gap : 0,
                          ),
                          child: SizedBox(width: cardWidth, child: card),
                        );
                      }).toList(),
                    );
                  },
                ),
                const SizedBox(height: 24),

                // ── BUSCAR COLABORADOR ──
                _buildSearchPanel(despacho),
                const SizedBox(height: 20),

                // ── INFORMACIÓN FAMILIAR ──
                _buildFamilyInfoPanel(despacho),
                const SizedBox(height: 24),

                // ── TABLE SECTION ──
                _buildTableSection(despacho),
                const SizedBox(height: 24),
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
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: gradientColors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(10),
      ),
      child: isMobile 
        ? Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 9,
                  fontWeight: FontWeight.w600,
                  color: Colors.white.withValues(alpha: 0.85),
                ),
              ),
            ],
          )
        : Row(
            children: [
              Text(
                value,
                style: const TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: Colors.white.withValues(alpha: 0.85),
                  ),
                ),
              ),
            ],
          ),
    );
  }

  Widget _buildSearchPanel(DespachoController despacho) {
    final colaborador = despacho.colaborador;
    final lookup = despacho.lookupResult;
    final buscando = despacho.loading;
    final isMobile = MediaQuery.of(context).size.width < 600;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(
          color: Colors.black.withValues(alpha: 0.08),
          blurRadius: 12,
          offset: const Offset(0, 4),
        )],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: const BoxDecoration(
              color: Color(0xFFDA291C),
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: const Row(
              children: [
                Icon(Icons.search_rounded, color: Colors.white, size: 18),
                SizedBox(width: 6),
                Text(
                  'Buscar Colaborador',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          // Body
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(
                  controller: _searchCtrl,
                  keyboardType: TextInputType.text,
                  textInputAction: TextInputAction.search,
                  onSubmitted: (_) => _buscar(),
                  onChanged: (_) { if (_mostrarResultados) setState(() => _mostrarResultados = false); },
                  style: const TextStyle(fontSize: 15, color: Color(0xFF111827)),
                  decoration: InputDecoration(
                    hintText: 'Carnet o nombre del colaborador',
                    hintStyle: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 15),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: const BorderSide(color: Color(0xFFD1D5DB), width: 1.5),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: const BorderSide(color: Color(0xFFD1D5DB), width: 1.5),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: const BorderSide(color: Color(0xFFDA291C), width: 2.0),
                    ),
                    suffixIcon: buscando
                        ? const SizedBox(
                            width: 20, height: 20,
                            child: Padding(
                              padding: EdgeInsets.all(12),
                              child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFFDA291C)),
                            ),
                          )
                        : IconButton(
                            icon: const Icon(Icons.search_rounded, color: Color(0xFFDA291C)),
                            onPressed: _buscar,
                          ),
                  ),
                ),
                const SizedBox(height: 12),

                // Resultados de búsqueda por nombre
                if (_mostrarResultados && context.watch<DespachoController>().resultadosBusqueda.isNotEmpty) ...[
                  Container(
                    constraints: const BoxConstraints(maxHeight: 200),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFD1D5DB)),
                      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 8)],
                    ),
                    child: ListView.separated(
                      shrinkWrap: true,
                      padding: EdgeInsets.zero,
                      itemCount: context.watch<DespachoController>().resultadosBusqueda.length,
                      separatorBuilder: (_, _) => const Divider(height: 1, color: Color(0xFFF3F4F6)),
                      itemBuilder: (ctx, i) {
                        final r = context.watch<DespachoController>().resultadosBusqueda[i];
                        return InkWell(
                          onTap: () => _seleccionarResultado(r.carnet),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            child: Row(
                              children: [
                                Container(
                                  width: 36, height: 36,
                                  decoration: const BoxDecoration(color: Color(0xFFDA291C), shape: BoxShape.circle),
                                  child: Center(
                                    child: Text(r.nombre.isNotEmpty ? r.nombre[0].toUpperCase() : '?',
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14)),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(r.nombre, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))),
                                      Text('Carnet: ${r.carnet}', style: const TextStyle(fontSize: 11, color: Color(0xFFDA291C), fontWeight: FontWeight.w600)),
                                    ],
                                  ),
                                ),
                                const Icon(Icons.chevron_right_rounded, size: 18, color: Color(0xFF9CA3AF)),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 12),
                ],

                // Result
                if (colaborador != null && lookup != null) ...[
                  if (isMobile) ...[
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            ClipOval(
                              child: SizedBox(
                                width: 64,
                                height: 64,
                                child: lookup.fotoHcm != null && lookup.fotoHcm!.isNotEmpty
                                    ? Image.network(
                                        lookup.fotoHcm!,
                                        fit: BoxFit.cover,
                                        errorBuilder: (ctx, err, stack) => _buildAvatar(colaborador.nombre, 64),
                                        loadingBuilder: (_, child, progress) {
                                          if (progress == null) return child;
                                          return Center(
                                            child: CircularProgressIndicator(
                                              value: progress.expectedTotalBytes != null
                                                  ? progress.cumulativeBytesLoaded / progress.expectedTotalBytes!
                                                  : null,
                                              strokeWidth: 2,
                                            ),
                                          );
                                        },
                                      )
                                    : _buildAvatar(colaborador.nombre, 64),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    colaborador.nombre,
                                    style: const TextStyle(
                                      fontFamily: 'Inter',
                                      fontWeight: FontWeight.w700,
                                      fontSize: 16,
                                      color: Color(0xFF1F2937),
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Carnet: ${colaborador.carnet}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFFDA291C),
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${colaborador.gerencia ?? '-'} · ${colaborador.ubicacion ?? '-'}',
                                    style: const TextStyle(
                                      fontSize: 13,
                                      color: Color(0xFF6B7280),
                                    ),
                                  ),
                                  if (lookup.inactivo)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 6),
                                      child: Container(
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(color: const Color(0xFFFEE2E2), borderRadius: BorderRadius.circular(8), border: Border.all(color: const Color(0xFFDC2626), width: 2)),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            const Text('⛔ Este colaborador está dado de baja en el Portal.', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFFDC2626))),
                                            if (lookup.terminationDate != null) ...[
                                              const SizedBox(height: 4),
                                              Text('Último día trabajado: ${_formatFecha(lookup.terminationDate!)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFFDC2626))),
                                            ],
                                          ],
                                        ),
                                      ),
                                    ),
                                  if (!lookup.inactivo && colaborador.departamentoGeografico != null && colaborador.departamentoGeografico!.toUpperCase() != 'MANAGUA')
                                    Padding(
                                      padding: const EdgeInsets.only(top: 6),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(color: const Color(0xFFFEE2E2), borderRadius: BorderRadius.circular(6)),
                                        child: Text('⚠ No es de MANAGUA (${colaborador.departamentoGeografico}). No aplica para despacho.',
                                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFFDC2626))),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        if (lookup.asistio)
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFD1FAE5),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.check_rounded, size: 16, color: Color(0xFF065F46)),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Asistió${lookup.fechaAsistencia != null ? ' ${_formatHora(lookup.fechaAsistencia!)}' : ''}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                        color: Color(0xFF065F46),
                                      ),
                                    ),
                                    if (lookup.asistioPor != null && lookup.asistioPor != 'COLABORADOR')
                                      Padding(
                                        padding: const EdgeInsets.only(left: 4),
                                        child: Text(
                                          '(${lookup.asistioPor == 'CONYUGE' ? 'Cónyuge' : (lookup.nombreAsistente ?? 'Tercero')})',
                                          style: const TextStyle(fontSize: 10, color: Color(0xFF065F46)),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                              SizedBox(
                                height: 32,
                                child: OutlinedButton.icon(
                                  onPressed: () => _reversar(colaborador.carnet),
                                  icon: const Icon(Icons.rotate_left_rounded, size: 14),
                                  label: const Text('Reversar', style: TextStyle(fontSize: 11)),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: const Color(0xFFDC2626),
                                    side: const BorderSide(color: Color(0xFFFECACA)),
                                    backgroundColor: const Color(0xFFFEE2E2),
                                    padding: const EdgeInsets.symmetric(horizontal: 12),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          )
                        else ...[
                          Row(
                            children: [
                              _buildNumberInput('Adultos', _adultos, (v) {
                                if (v >= 0) setState(() => _adultos = v);
                              }),
                              const SizedBox(width: 12),
                              _buildNumberInput('Niños', _ninos, (v) {
                                if (v >= 0) setState(() => _ninos = v);
                              }),
                            ],
                          ),
                          const SizedBox(height: 10),
                          _buildAsistioPorSelector(),
                          const SizedBox(height: 12),
                          SizedBox(
                            width: double.infinity,
                            height: 44,
                            child: ElevatedButton.icon(
                              onPressed: despacho.loading ? null : _registrar,
                              icon: despacho.loading
                                  ? const SizedBox(
                                      width: 16, height: 16,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                    )
                                  : const Icon(Icons.check_rounded, size: 18),
                              label: const Text('Registrar Asistencia'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF10B981),
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ] else ...[
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ClipOval(
                          child: SizedBox(
                            width: 100,
                            height: 100,
                            child: lookup.fotoHcm != null && lookup.fotoHcm!.isNotEmpty
                                ? Image.network(
                                    lookup.fotoHcm!,
                                    fit: BoxFit.cover,
                                    errorBuilder: (ctx, err, stack) => _buildAvatar(colaborador.nombre, 100),
                                    loadingBuilder: (_, child, progress) {
                                      if (progress == null) return child;
                                      return Center(
                                        child: CircularProgressIndicator(
                                          value: progress.expectedTotalBytes != null
                                              ? progress.cumulativeBytesLoaded / progress.expectedTotalBytes!
                                              : null,
                                          strokeWidth: 2,
                                        ),
                                      );
                                    },
                                  )
                                : _buildAvatar(colaborador.nombre, 100),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                colaborador.nombre,
                                style: const TextStyle(
                                  fontFamily: 'Inter',
                                  fontWeight: FontWeight.w700,
                                  fontSize: 16,
                                  color: Color(0xFF1F2937),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Carnet: ${colaborador.carnet}',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFFDA291C),
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${colaborador.gerencia ?? '-'} · ${colaborador.ubicacion ?? '-'}',
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: Color(0xFF6B7280),
                                ),
                              ),
                              const SizedBox(height: 10),
                              if (lookup.asistio)
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFD1FAE5),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(Icons.check_rounded, size: 16, color: Color(0xFF065F46)),
                                          const SizedBox(width: 6),
                                          Text(
                                            'Asistió${lookup.fechaAsistencia != null ? ' ${_formatHora(lookup.fechaAsistencia!)}' : ''}',
                                            style: const TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w700,
                                              color: Color(0xFF065F46),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    SizedBox(
                                      height: 32,
                                      child: OutlinedButton.icon(
                                        onPressed: () => _reversar(colaborador.carnet),
                                        icon: const Icon(Icons.rotate_left_rounded, size: 14),
                                        label: const Text('Reversar', style: TextStyle(fontSize: 11)),
                                        style: OutlinedButton.styleFrom(
                                          foregroundColor: const Color(0xFFDC2626),
                                          side: const BorderSide(color: Color(0xFFFECACA)),
                                          backgroundColor: const Color(0xFFFEE2E2),
                                          padding: const EdgeInsets.symmetric(horizontal: 12),
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                )
                              else ...[
                                Row(
                                  children: [
                                    _buildNumberInput('Adultos', _adultos, (v) {
                                      if (v >= 0) setState(() => _adultos = v);
                                    }),
                                    const SizedBox(width: 12),
                                    _buildNumberInput('Niños', _ninos, (v) {
                                      if (v >= 0) setState(() => _ninos = v);
                                    }),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                _buildAsistioPorSelector(),
                                const SizedBox(height: 10),
                                SizedBox(
                                  height: 40,
                                  child: ElevatedButton.icon(
                                    onPressed: despacho.loading ? null : _registrar,
                                    icon: despacho.loading
                                        ? const SizedBox(
                                            width: 16, height: 16,
                                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                          )
                                        : const Icon(Icons.check_rounded, size: 18),
                                    label: const Text('Registrar Asistencia'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF10B981),
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      padding: const EdgeInsets.symmetric(horizontal: 20),
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ] else if (!buscando) ...[
                  const SizedBox(height: 20),
                  Icon(Icons.search_rounded, size: 40, color: Colors.grey.shade300),
                  const SizedBox(height: 12),
                  Text(
                    'Ingrese un carnet para buscar',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 14,
                      color: Colors.grey.shade400,
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvatar(String nombre, double size) {
    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(
        color: Color(0xFFE2E8F0),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          nombre.isNotEmpty ? nombre[0].toUpperCase() : '?',
          style: TextStyle(
            fontSize: size * 0.36,
            fontWeight: FontWeight.w700,
            color: const Color(0xFFDA291C),
          ),
        ),
      ),
    );
  }

  Widget _buildAsistioPorSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('¿Quién asiste?', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF6B7280))),
        const SizedBox(height: 6),
        Row(
          children: [
            _asistioPorChip('COLABORADOR', 'Colaborador'),
            const SizedBox(width: 6),
            _asistioPorChip('CONYUGE', 'Cónyuge'),
            const SizedBox(width: 6),
            _asistioPorChip('TERCERO', 'Tercero'),
          ],
        ),
        if (_asistioPor == 'TERCERO') ...[
          const SizedBox(height: 6),
          TextField(
            controller: _nombreAsistenteCtrl,
            decoration: const InputDecoration(
              hintText: 'Nombre de quien asiste',
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              isDense: true,
            ),
          ),
        ],
      ],
    );
  }

  Widget _asistioPorChip(String value, String label) {
    final selected = _asistioPor == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() { _asistioPor = value; if (value != 'TERCERO') _nombreAsistenteCtrl.clear(); }),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: selected ? const Color(0xFFDA291C).withValues(alpha: 0.1) : const Color(0xFFF3F4F6),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: selected ? const Color(0xFFDA291C) : const Color(0xFFE5E7EB), width: selected ? 2 : 1),
          ),
          child: Text(label, textAlign: TextAlign.center, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: selected ? const Color(0xFFDA291C) : const Color(0xFF6B7280))),
        ),
      ),
    );
  }

  Widget _buildNumberInput(String label, int value, ValueChanged<int> onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: Color(0xFF6B7280),
          ),
        ),
        const SizedBox(height: 4),
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFFD1D5DB)),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                icon: const Icon(Icons.remove_rounded, size: 16, color: Color(0xFF374151)),
                onPressed: value > 0 ? () => onChanged(value - 1) : null,
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                padding: EdgeInsets.zero,
              ),
              Container(
                width: 32,
                alignment: Alignment.center,
                child: Text(
                  '$value',
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: Color(0xFF111827)),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.add_rounded, size: 16, color: Color(0xFF374151)),
                onPressed: () => onChanged(value + 1),
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                padding: EdgeInsets.zero,
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _formatHora(String fecha) {
    try {
      return DateFormat('HH:mm').format(DateTime.parse(fecha).toLocal());
    } catch (_) {
      return '';
    }
  }

  Widget _buildFamilyInfoPanel(DespachoController despacho) {
    final lookup = despacho.lookupResult;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(
          color: Colors.black.withValues(alpha: 0.08),
          blurRadius: 12,
          offset: const Offset(0, 4),
        )],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: const BoxDecoration(
              color: Color(0xFFDA291C),
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: const Row(
              children: [
                Icon(Icons.people_alt_rounded, color: Colors.white, size: 18),
                SizedBox(width: 6),
                Text(
                  'Información Familiar',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: lookup != null
                ? (lookup.hijos.isNotEmpty
                    ? _buildChildrenTable(lookup)
                    : _buildEmptyState(Icons.people_alt_rounded, 'No hay hijos registrados para este colaborador.'))
                : _buildEmptyState(Icons.people_alt_rounded, 'Seleccione un colaborador para ver su información familiar'),
          ),
        ],
      ),
    );
  }

  Widget _buildChildrenTable(LookupResult lookup) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _tableHeader(['Nombre', 'Edad', 'Género', 'Categoría', 'Estado']),
        ...lookup.hijos.map((hijo) => Container(
          decoration: BoxDecoration(
            color: hijo.edadHijo <= 12 ? const Color(0xFFFFFACD) : null,
            border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            children: [
              Expanded(flex: 3, child: Text(hijo.nombreHijo, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13))),
              Expanded(flex: 1, child: Text('${hijo.edadHijo}', style: const TextStyle(fontSize: 13))),
              Expanded(flex: 2, child: Text(hijo.generoHijo == 'F' ? 'Femenino' : 'Masculino', style: const TextStyle(fontSize: 13))),
              Expanded(flex: 2, child: Text(hijo.categoria ?? '-', style: const TextStyle(fontSize: 13))),
              Expanded(flex: 2, child: _buildStatusBadge(hijo.entregado)),
            ],
          ),
        )),
        _buildHcmContacts(lookup),
      ],
    );
  }

  Widget _buildStatusBadge(bool entregado) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: entregado ? const Color(0xFFD1FAE5) : const Color(0xFFFEF3C7),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        entregado ? 'Entregado' : 'Pendiente',
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: entregado ? const Color(0xFF065F46) : const Color(0xFF92400E),
        ),
      ),
    );
  }

  Widget _buildHcmContacts(LookupResult lookup) {
    if (lookup.familiaresHcm.isEmpty) return const SizedBox.shrink();
    final nombresHijos = lookup.hijos.map((h) => _normalizar(h.nombreHijo)).toSet();
    final contactos = lookup.familiaresHcm.where((f) => !nombresHijos.contains(_normalizar(f.nombre))).toList();
    if (contactos.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Contactos',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: Color(0xFFDA291C),
            ),
          ),
          const SizedBox(height: 8),
          _tableHeader(['Nombre', 'Parentesco', 'Edad']),
          ...contactos.map((f) => Container(
            decoration: BoxDecoration(
              color: f.tipoRela?.toUpperCase().contains('HIJO') == true && f.edad <= 12
                  ? const Color(0xFFFFFACD) : null,
              border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            child: Row(
              children: [
                Expanded(flex: 3, child: Text(f.nombre, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
                Expanded(flex: 2, child: Text(f.tipoRela ?? '-', style: const TextStyle(fontSize: 12))),
                Expanded(flex: 1, child: Text('${f.edad}', style: const TextStyle(fontSize: 12))),
              ],
            ),
          )),
        ],
      ),
    );
  }

  String _normalizar(String n) {
    final parts = n.toUpperCase().trim().replaceAll(RegExp(r'\s+'), ' ').split(' ');
    parts.sort();
    return parts.join(' ');
  }

  Widget _tableHeader(List<String> labels) {
    return Container(
      color: const Color(0xFFDA291C),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: labels.map((l) {
          return Expanded(
            flex: l == labels.first ? 3 : (l == 'Nombre' ? 3 : (l == 'Parentesco' ? 2 : (l == 'Edad' ? 1 : 2))),
            child: Text(
              l,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildEmptyState(IconData icon, String text) {
    return Column(
      children: [
        const SizedBox(height: 24),
        Icon(icon, size: 40, color: Colors.grey.shade300),
        const SizedBox(height: 12),
        Text(
          text,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey.shade400,
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildTableSection(DespachoController despacho) {
    final isMobile = MediaQuery.of(context).size.width < 600;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(
          color: Colors.black.withValues(alpha: 0.08),
          blurRadius: 12,
          offset: const Offset(0, 4),
        )],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: const BoxDecoration(
              color: Color(0xFFDA291C),
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _filterCtrl,
                    onChanged: _onFilterChanged,
                    style: const TextStyle(fontSize: 12, color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Filtrar por nombre o carnet...',
                      hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 12),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      filled: true,
                      fillColor: Colors.white.withValues(alpha: 0.15),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(6),
                        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.3)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(6),
                        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.3)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(6),
                        borderSide: const BorderSide(color: Colors.white),
                      ),
                      prefixIcon: Icon(Icons.search_rounded, size: 16, color: Colors.white.withValues(alpha: 0.5)),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  height: 32,
                  child: OutlinedButton(
                    onPressed: _handleExportExcel,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: BorderSide(color: Colors.white.withValues(alpha: 0.3)),
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                    ),
                    child: const Text('📥 Excel', style: TextStyle(fontSize: 11)),
                  ),
                ),
              ],
            ),
          ),
          // Table body
          if (_loadingCenso)
            const Padding(
              padding: EdgeInsets.all(32),
              child: Center(child: CircularProgressIndicator(color: Color(0xFFDA291C))),
            )
          else if (_totalFiltrados == 0)
            Padding(
              padding: const EdgeInsets.all(32),
              child: Center(
                child: Text(
                  'No hay colaboradores que hayan asistido',
                  style: TextStyle(fontSize: 14, color: Colors.grey.shade400),
                ),
              ),
            )
          else
            isMobile ? _buildMobileCardList() : _buildDataTable(),
          // Pagination
          if (_totalFiltrados > 0)
            _buildPagination(),
        ],
      ),
    );
  }

  Widget _buildMobileCardList() {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _paginados.length,
      itemBuilder: (context, index) {
        final item = _paginados[index];
        final fullyDelivered = item.totalHijos > 0 && item.entregados == item.totalHijos;
        final isExpanded = _infoCarnet == item.carnet;

        return Container(
          decoration: BoxDecoration(
            border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    item.carnet,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                      color: Color(0xFFDA291C),
                    ),
                  ),
                  Text(
                    item.fechaAsistencia != null ? _formatHora(item.fechaAsistencia!) : '-',
                    style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                item.nombre,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                  color: Color(0xFF1F2937),
                ),
              ),
              if (item.gerencia != null && item.gerencia!.isNotEmpty) ...[
                const SizedBox(height: 2),
                Text(
                  item.gerencia!,
                  style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                ),
              ],
              const SizedBox(height: 8),
              // Badges row
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  _buildMiniBadge('Adultos: ${item.totalAdultos}', const Color(0xFFF3F4F6), const Color(0xFF374151)),
                  _buildMiniBadge('Niños: ${item.totalNinos}', const Color(0xFFF3F4F6), const Color(0xFF374151)),
                  _buildMiniBadge(
                    'Juguetes: ${item.entregados}/${item.totalHijos}',
                    fullyDelivered ? const Color(0xFFD1FAE5) : const Color(0xFFFEF3C7),
                    fullyDelivered ? const Color(0xFF065F46) : const Color(0xFF92400E),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              // Action buttons row
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  IconButton(
                    icon: Icon(
                      isExpanded ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                      size: 20,
                      color: const Color(0xFF6B7280),
                    ),
                    onPressed: () {
                      setState(() {
                        _infoCarnet = isExpanded ? null : item.carnet;
                      });
                    },
                    constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                    padding: EdgeInsets.zero,
                    tooltip: 'Ver detalles de registro',
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    height: 32,
                    child: OutlinedButton.icon(
                      onPressed: () => _reversar(item.carnet),
                      icon: const Icon(Icons.rotate_left_rounded, size: 12),
                      label: const Text('Reversar', style: TextStyle(fontSize: 11)),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFFDC2626),
                        side: const BorderSide(color: Color(0xFFFECACA)),
                        backgroundColor: const Color(0xFFFEE2E2),
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      ),
                    ),
                  ),
                ],
              ),
              if (isExpanded) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF9FAFB),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Registrado por: ${item.registradoPor ?? '—'}',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF374151)),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Detalle del registro: ${item.totalAdultos} adultos y ${item.totalNinos} niños adicionales asistieron.',
                        style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildMiniBadge(String label, Color bgColor, Color textColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: textColor,
        ),
      ),
    );
  }

  Widget _buildDataTable() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        headingRowHeight: 40,
        dataRowMinHeight: 40,
        dataRowMaxHeight: 56,
        horizontalMargin: 12,
        columnSpacing: 16,
        headingRowColor: WidgetStateProperty.all(const Color(0xFFF8FAFC)),
        border: TableBorder(
          horizontalInside: BorderSide(color: Colors.grey.shade200),
        ),
        columns: [
          DataColumn(label: _headerText('Carnet')),
          DataColumn(label: _headerText('Nombre')),
          DataColumn(label: _headerText('Adultos'), numeric: true),
          DataColumn(label: _headerText('Niños'), numeric: true),
          DataColumn(label: _headerText('Asiste')),
          DataColumn(label: _headerText('Hijos'), numeric: true),
          DataColumn(label: _headerText('Entreg.'), numeric: true),
          DataColumn(label: _headerText('Fecha'), numeric: true),
          DataColumn(label: _headerText('Reg.')),
          DataColumn(label: _headerText('Acción')),
        ],
        rows: _buildDataRows(),
      ),
    );
  }

  List<DataRow> _buildDataRows() {
    int sumAdultos = 0, sumNinos = 0;
    final result = <DataRow>[];
    for (final item in _paginados) {
      sumAdultos += item.totalAdultos;
      sumNinos += item.totalNinos;
      final fullyDelivered = item.totalHijos > 0 && item.entregados == item.totalHijos;
      result.add(DataRow(cells: [
        DataCell(Text(item.carnet, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: Color(0xFFDA291C)))),
        DataCell(Text(item.nombre, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13))),
        DataCell(Text('${item.totalAdultos}', style: const TextStyle(fontSize: 13))),
        DataCell(Text('${item.totalNinos}', style: const TextStyle(fontSize: 13))),
        DataCell(Text(_asisteLabel(item), style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)))),
        DataCell(Text('${item.totalHijos}', style: const TextStyle(fontSize: 13))),
        DataCell(Text(
          '${item.entregados}/${item.totalHijos}',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 13,
            color: fullyDelivered ? const Color(0xFF10B981) : const Color(0xFF6B7280),
          ),
        )),
        DataCell(Text(
          item.fechaAsistencia != null ? _formatFecha(item.fechaAsistencia!) : '-',
          style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
        )),
        DataCell(
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.visibility_rounded, size: 18, color: Color(0xFF6B7280)),
                onPressed: () => setState(() => _infoCarnet = _infoCarnet == item.carnet ? null : item.carnet),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
              ),
              if (_infoCarnet == item.carnet)
                Positioned(
                  top: 32,
                  left: 0,
                  child: Material(
                    elevation: 4,
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Registrado por: ${item.registradoPor ?? '—'}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                          Text('Adultos: ${item.totalAdultos}', style: const TextStyle(fontSize: 11)),
                          Text('Niños: ${item.totalNinos}', style: const TextStyle(fontSize: 11)),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
        DataCell(
          SizedBox(
            height: 28,
            child: OutlinedButton(
              onPressed: () => _reversar(item.carnet),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFFDC2626),
                side: const BorderSide(color: Color(0xFFFECACA)),
                backgroundColor: const Color(0xFFFEE2E2),
                padding: const EdgeInsets.symmetric(horizontal: 10),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.rotate_left_rounded, size: 12),
                  SizedBox(width: 4),
                  Text('Reversar', style: TextStyle(fontSize: 11)),
                ],
              ),
            ),
          ),
        ),
      ]));
    }

    if (result.isNotEmpty) {
      result.add(DataRow(
        color: WidgetStateProperty.all(const Color(0xFFF1F5F9)),
        cells: [
          const DataCell(Text('', style: TextStyle(fontSize: 12))),
          const DataCell(Text('TOTALES:', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12))),
          DataCell(Text('$sumAdultos', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: Color(0xFFDA291C)))),
          DataCell(Text('$sumNinos', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: Color(0xFFDA291C)))),
          const DataCell(Text('')),
          const DataCell(Text('')),
          const DataCell(Text('')),
          const DataCell(Text('')),
          const DataCell(Text('')),
          const DataCell(Text('')),
        ],
      ));
    }

    return result;
  }

  String _asisteLabel(CensoItem item) {
    if (item.asistioPor == null || item.asistioPor!.isEmpty) return '-';
    if (item.asistioPor == 'COLABORADOR') return 'Colaborador';
    if (item.asistioPor == 'CONYUGE') return 'Cónyuge';
    return item.nombreAsistente ?? 'Tercero';
  }

  String _formatFecha(String fecha) {
    try {
      return DateFormat('dd/MM/yy HH:mm').format(DateTime.parse(fecha).toLocal());
    } catch (_) {
      return fecha;
    }
  }

  Widget _buildPagination() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Pág $_pagina de $_totalPaginas ($_totalFiltrados registros)',
            style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
          ),
          Row(
            children: [
              _pageButton('← Anterior', _pagina > 1, () {
                if (_pagina > 1) setState(() => _pagina--);
              }),
              const SizedBox(width: 6),
              _pageButton('Siguiente →', _pagina < _totalPaginas, () {
                if (_pagina < _totalPaginas) setState(() => _pagina++);
              }),
            ],
          ),
        ],
      ),
    );
  }

  Widget _pageButton(String text, bool enabled, VoidCallback onPressed) {
    return SizedBox(
      height: 32,
      child: OutlinedButton(
        onPressed: enabled ? onPressed : null,
        style: OutlinedButton.styleFrom(
          foregroundColor: enabled ? const Color(0xFF374151) : const Color(0xFFD1D5DB),
          side: BorderSide(color: enabled ? const Color(0xFFE5E7EB) : const Color(0xFFF3F4F6)),
          padding: const EdgeInsets.symmetric(horizontal: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
        ),
        child: Text(text, style: const TextStyle(fontSize: 12)),
      ),
    );
  }
}

Widget _headerText(String text) {
  return Text(
    text,
    style: const TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w700,
      color: Color(0xFF6B7280),
    ),
  );
}
