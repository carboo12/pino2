import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/premium_widgets.dart';
import '../presentation/despacho_controller.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  final _searchCtrl = TextEditingController();
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
    super.dispose();
  }

  void _loadData() {
    context.read<DespachoController>().cargarHistorial(
          busqueda: _searchCtrl.text,
          pagina: _pagina,
        );
  }

  void _buscar() {
    setState(() {
      _pagina = 1;
    });
    _loadData();
  }

  void _cambiarPagina(int offset) {
    final ctrl = context.read<DespachoController>();
    final nuevaPag = _pagina + offset;
    if (nuevaPag < 1 || nuevaPag > ctrl.historialTotalPaginas) return;

    setState(() {
      _pagina = nuevaPag;
    });
    _loadData();
  }

  String _formatFecha(String? fechaStr) {
    if (fechaStr == null || fechaStr.isEmpty) return '-';
    try {
      final dt = DateTime.parse(fechaStr).toLocal();
      return DateFormat('dd/MM/yyyy HH:mm').format(dt);
    } catch (_) {
      return fechaStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    final despacho = context.watch<DespachoController>();

    return Scaffold(
      backgroundColor: AppTheme.slate50,
      appBar: AppBar(
        title: const Text('Historial de Movimientos'),
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
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.slate200),
                boxShadow: AppTheme.cardShadow,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _searchCtrl,
                      textInputAction: TextInputAction.search,
                      onSubmitted: (_) => _buscar(),
                      decoration: const InputDecoration(
                        hintText: 'Buscar carnet, colaborador o hijo...',
                        fillColor: Colors.white,
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(horizontal: 16),
                      ),
                    ),
                  ),
                  if (_searchCtrl.text.isNotEmpty)
                    IconButton(
                      icon: const Icon(Icons.clear, color: AppTheme.slate400),
                      onPressed: () {
                        _searchCtrl.clear();
                        _buscar();
                      },
                    ),
                  ElevatedButton(
                    onPressed: _buscar,
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size(80, 44),
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text('Buscar', style: TextStyle(fontSize: 14)),
                  ),
                ],
              ),
            ),
          ),

          // Título de la sección e información de total
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Entregas y Reversiones',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.slate700,
                  ),
                ),
                Text(
                  '${despacho.historialTotal} registros',
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.primary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Listado
          Expanded(
            child: RefreshIndicator(
              color: AppTheme.primary,
              onRefresh: () async => _loadData(),
              child: despacho.loadingHistorial
                  ? const Center(
                      child: CircularProgressIndicator(color: AppTheme.primary),
                    )
                  : despacho.historialItems.isEmpty
                      ? const PremiumEmptyState(
                          icon: Icons.history_toggle_off_rounded,
                          title: 'No hay movimientos',
                          subtitle: 'No se encontraron entregas en este evento.',
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: despacho.historialItems.length,
                          itemBuilder: (context, index) {
                            final item = despacho.historialItems[index];
                            final isReverted = item.estado == 'REVERTED';

                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: isReverted
                                      ? AppTheme.warning.withValues(alpha: 0.3)
                                      : AppTheme.slate200,
                                  width: 1.5,
                                ),
                                boxShadow: AppTheme.cardShadow,
                              ),
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Encabezado: Colaborador e ID
                                    Row(
                                      children: [
                                        Text(
                                          item.colaboradorCarnet,
                                          style: const TextStyle(
                                            fontFamily: 'Inter',
                                            fontSize: 13,
                                            fontWeight: FontWeight.w800,
                                            color: AppTheme.primary,
                                          ),
                                        ),
                                        const Spacer(),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 8,
                                            vertical: 4,
                                          ),
                                          decoration: BoxDecoration(
                                            color: isReverted
                                                ? AppTheme.warningLight
                                                : AppTheme.successLight,
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            isReverted ? 'Reversado' : 'Entregado',
                                            style: TextStyle(
                                              fontFamily: 'Inter',
                                              fontSize: 10,
                                              fontWeight: FontWeight.w700,
                                              color: isReverted
                                                  ? AppTheme.warning
                                                  : AppTheme.success,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),

                                    // Colaborador Nombre
                                    Text(
                                      item.colaboradorNombre,
                                      style: const TextStyle(
                                        fontFamily: 'Inter',
                                        fontSize: 15,
                                        fontWeight: FontWeight.w700,
                                        color: AppTheme.slate900,
                                      ),
                                    ),
                                    const SizedBox(height: 4),

                                    // Hijo e Juguete
                                    RichText(
                                      text: TextSpan(
                                        style: const TextStyle(
                                          fontFamily: 'Inter',
                                          fontSize: 13,
                                          color: AppTheme.slate600,
                                        ),
                                        children: [
                                          const TextSpan(
                                            text: 'Hijo: ',
                                            style: TextStyle(fontWeight: FontWeight.w700),
                                          ),
                                          TextSpan(text: item.hijoNombre),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    RichText(
                                      text: TextSpan(
                                        style: const TextStyle(
                                          fontFamily: 'Inter',
                                          fontSize: 13,
                                          color: AppTheme.slate600,
                                        ),
                                        children: [
                                          const TextSpan(
                                            text: 'Juguete: ',
                                            style: TextStyle(fontWeight: FontWeight.w700),
                                          ),
                                          TextSpan(text: item.nombreJuguete),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    const Divider(height: 1, color: AppTheme.slate100),
                                    const SizedBox(height: 8),

                                    // Audit Details
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            const Text(
                                              'Despachó:',
                                              style: TextStyle(
                                                fontFamily: 'Inter',
                                                fontSize: 10,
                                                color: AppTheme.slate400,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                            Text(
                                              item.usuarioDespacho,
                                              style: const TextStyle(
                                                fontFamily: 'Inter',
                                                fontSize: 12,
                                                color: AppTheme.slate700,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ],
                                        ),
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.end,
                                          children: [
                                            const Text(
                                              'Fecha:',
                                              style: TextStyle(
                                                fontFamily: 'Inter',
                                                fontSize: 10,
                                                color: AppTheme.slate400,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                            Text(
                                              _formatFecha(item.fechaEntrega),
                                              style: const TextStyle(
                                                fontFamily: 'Inter',
                                                fontSize: 11,
                                                color: AppTheme.slate700,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),

                                    // Reversion Info if applicable
                                    if (isReverted) ...[
                                      const SizedBox(height: 12),
                                      Container(
                                        padding: const EdgeInsets.all(10),
                                        decoration: BoxDecoration(
                                          color: AppTheme.slate100,
                                          borderRadius: BorderRadius.circular(8),
                                          border: Border.all(color: AppTheme.slate200),
                                        ),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              children: [
                                                const Icon(
                                                  Icons.rotate_left_rounded,
                                                  color: AppTheme.warning,
                                                  size: 14,
                                                ),
                                                const SizedBox(width: 4),
                                                Text(
                                                  'Reversado por: ${item.usuarioReversion ?? '-'}',
                                                  style: const TextStyle(
                                                    fontFamily: 'Inter',
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.w700,
                                                    color: AppTheme.slate800,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              'Motivo: ${item.motivoReversion ?? 'Sin motivo registrado'}',
                                              style: const TextStyle(
                                                fontFamily: 'Inter',
                                                fontSize: 11,
                                                color: AppTheme.slate600,
                                                fontStyle: FontStyle.italic,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ),

          // Paginador
          if (!despacho.loadingHistorial && despacho.historialTotalPaginas > 1)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Pág $_pagina de ${despacho.historialTotalPaginas}',
                    style: const TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 12,
                      color: AppTheme.slate500,
                    ),
                  ),
                  Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 14),
                        onPressed: _pagina > 1 ? () => _cambiarPagina(-1) : null,
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.white,
                          disabledBackgroundColor: Colors.white.withValues(alpha: 0.5),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                            side: const BorderSide(color: AppTheme.slate200),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                        onPressed:
                            _pagina < despacho.historialTotalPaginas ? () => _cambiarPagina(1) : null,
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.white,
                          disabledBackgroundColor: Colors.white.withValues(alpha: 0.5),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                            side: const BorderSide(color: AppTheme.slate200),
                          ),
                        ),
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
