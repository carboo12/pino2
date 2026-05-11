import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../data/daily_closing_repository.dart';
import 'denomination_input_screen.dart';

class DailyClosingScreen extends ConsumerStatefulWidget {
  const DailyClosingScreen({required this.storeId, this.storeName, super.key});

  final String storeId;
  final String? storeName;

  @override
  ConsumerState<DailyClosingScreen> createState() => _DailyClosingScreenState();
}

class _DailyClosingScreenState extends ConsumerState<DailyClosingScreen> {
  bool _isLoading = true;
  bool _isSubmitting = false;
  bool _alreadyClosed = false;

  List<Map<String, dynamic>> _deliveries = [];
  List<Map<String, dynamic>> _returns = [];
  List<Map<String, dynamic>> _collections = [];

  String get _today {
    final now = DateTime.now();
    return '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
  }

  String get _todayFormatted {
    final now = DateTime.now();
    const months = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ];
    const days = [
      'lunes',
      'martes',
      'miércoles',
      'jueves',
      'viernes',
      'sábado',
      'domingo',
    ];
    final dayName = days[now.weekday - 1];
    final monthName = months[now.month - 1];
    return '$dayName ${now.day} de $monthName, ${now.year}';
  }

  // ──── Computed stats ────

  int get _deliveredCount =>
      _deliveries.where((d) => d['status'] == 'Entregado').length;
  int get _pendingCount =>
      _deliveries.where((d) => d['status'] == 'Pendiente').length;

  double get _totalSales => _deliveries
      .where((d) => d['status'] == 'Entregado' && (d['paymentType']?.toUpperCase() == 'CASH' || d['paymentType']?.toUpperCase() == 'CONTADO'))
      .fold<double>(0, (s, d) => s + (double.tryParse('${d['total']}') ?? 0));

  double get _totalReturns => _returns.fold<double>(
    0,
    (s, r) => s + (double.tryParse('${r['total']}') ?? 0),
  );

  double get _totalCollections => _collections.fold<double>(
    0,
    (s, c) =>
        s + (double.tryParse('${c['amount'] ?? c['pendingAmount']}') ?? 0),
  );

  double get _cashTotal {
    return _totalSales + _totalCollections;
  }

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    super.dispose();
  }

  Future<void> _loadData() async {
    final session = ref.read(authControllerProvider).session;
    if (session == null) return;
    setState(() => _isLoading = true);

    try {
      final repo = ref.read(dailyClosingRepositoryProvider);
      final token = session.accessToken;
      final results = await Future.wait([
        repo.fetchDeliveries(
          storeId: widget.storeId,
          ruteroId: session.user.id,
          accessToken: token,
        ),
        repo.fetchReturns(
          storeId: widget.storeId,
          ruteroId: session.user.id,
          date: _today,
          accessToken: token,
        ),
        repo.fetchCollections(storeId: widget.storeId, accessToken: token),
      ]);

      final closed = await repo.hasClosingForToday(
        storeId: widget.storeId,
        ruteroId: session.user.id,
        date: _today,
        accessToken: token,
      );

      if (!mounted) return;
      setState(() {
        _deliveries = results[0];
        _returns = results[1];
        _collections = results[2];
        _alreadyClosed = closed;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error al cargar datos: $e')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _submitClosing(Map<String, dynamic> result) async {
    final session = ref.read(authControllerProvider).session;
    if (session == null) return;

    setState(() => _isSubmitting = true);
    final repo = ref.read(dailyClosingRepositoryProvider);

    try {
      final finalNotes = (result['notes'] as String?)?.isNotEmpty == true
          ? result['notes'] as String
          : 'Cierre de caja — ${session.user.name} — $_todayFormatted';

      final repoResult = await repo.submitClosing(
        storeId: widget.storeId,
        ruteroId: session.user.id,
        totalSales: _totalSales,
        totalCollections: _totalCollections,
        totalReturns: _totalReturns,
        cashTotal: _cashTotal,
        closingDate: _today,
        notes: finalNotes,
        denominations: result['denominations'] as Map<String, dynamic>?,
        accessToken: session.accessToken,
      );

      if (!mounted) return;
      final queued = repoResult['queuedOffline'] == true;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            queued
                ? 'Cierre guardado temporalmente. Se enviará cuando vuelva la señal.'
                : 'Caja cerrada. Efectivo: C\$ ${_cashTotal.toStringAsFixed(2)}',
          ),
        ),
      );

      setState(() => _alreadyClosed = true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _showConfirmDialog() async {
    final result = await Navigator.push<Map<String, dynamic>?>(
      context,
      MaterialPageRoute(
        builder: (context) => DenominationInputScreen(
          expectedCash: _cashTotal,
        ),
      ),
    );

    if (result != null && mounted) {
      _submitClosing(result);
    }
  }

  // ──── BUILD ────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Cierre de Caja')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
                children: [
                  // ── Hero card ──
                  _ClosingHero(
                    storeName: widget.storeName,
                    todayFormatted: _todayFormatted,
                    alreadyClosed: _alreadyClosed,
                  ),
                  const SizedBox(height: 18),

                  // ── Metric chips ──
                  // ── Simple status card ──
                  // ── Detailed Summary Card ──
                  _RouteSummaryDetails(
                    totalAssigned: _deliveries.length,
                    delivered: _deliveredCount,
                    rejected: _deliveries.where((d) => d['status'] == 'RECHAZO_TOTAL').length,
                    contadoIncome: _totalSales,
                    creditoIncome: _totalCollections,
                    returnsValue: _totalReturns,
                    returnsCount: _returns.length,
                  ),
                  const SizedBox(height: 24),

                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Column(
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.info_outline_rounded, color: Color(0xFF475569)),
                            SizedBox(width: 12),
                            Text('Información de Cierre', style: TextStyle(fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Al confirmar el cierre, se notificará a la administración. Deberás entregar C\$ ${_cashTotal.toStringAsFixed(2)} en efectivo y realizar el arqueo de productos devueltos en bodega.',
                          style: const TextStyle(fontSize: 13, color: Colors.black87),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
      bottomSheet: _isLoading
          ? null
          : _ClosingFooter(
              alreadyClosed: _alreadyClosed,
              pendingCount: _pendingCount,
              isSubmitting: _isSubmitting,
              cashTotal: _cashTotal,
              onSubmit: _showConfirmDialog,
            ),
    );
  }
}

// ═══════════════════════════════════════════════════
//  Sub-widgets
// ═══════════════════════════════════════════════════

class _ClosingHero extends StatelessWidget {
  const _ClosingHero({
    this.storeName,
    required this.todayFormatted,
    required this.alreadyClosed,
  });

  final String? storeName;
  final String todayFormatted;
  final bool alreadyClosed;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: const LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF064E3B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (alreadyClosed)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF22C55E).withValues(alpha: 0.22),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.check_circle_rounded,
                    color: Color(0xFF86EFAC),
                    size: 16,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'CIERRE FINALIZADO',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: const Color(0xFF86EFAC),
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
            ),
          Text(
            storeName != null
                ? 'Arqueo de Ruta • $storeName'
                : 'Arqueo de Ruta',
            style: theme.textTheme.headlineSmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            todayFormatted.toUpperCase(),
            style: theme.textTheme.bodyMedium?.copyWith(
              color: Colors.white.withValues(alpha: 0.72),
              letterSpacing: 1.2,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

class _RouteSummaryDetails extends StatelessWidget {
  const _RouteSummaryDetails({
    required this.totalAssigned,
    required this.delivered,
    required this.rejected,
    required this.contadoIncome,
    required this.creditoIncome,
    required this.returnsValue,
    required this.returnsCount,
  });

  final int totalAssigned;
  final int delivered;
  final int rejected;
  final double contadoIncome;
  final double creditoIncome;
  final double returnsValue;
  final int returnsCount;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('RESUMEN AUTOMÁTICO DEL DÍA', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 1.1, color: Colors.blueGrey)),
            const Divider(height: 32),
            _SummaryRow(label: 'Pedidos asignados', value: '$totalAssigned', icon: Icons.assignment),
            _SummaryRow(label: 'Entregados exitosos', value: '$delivered', icon: Icons.check_circle, color: Colors.green),
            _SummaryRow(label: 'Rechazos totales', value: '$rejected', icon: Icons.cancel, color: Colors.red),
            const Divider(height: 32),
            const Text('INGRESOS DE EFECTIVO', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.blueGrey)),
            _SummaryRow(label: 'Cobros contado (Hoy)', value: 'C\$ ${contadoIncome.toStringAsFixed(2)}', icon: Icons.payments),
            _SummaryRow(label: 'Cobros crédito (Arreglos)', value: 'C\$ ${creditoIncome.toStringAsFixed(2)}', icon: Icons.request_quote),
            const Divider(height: 32),
            const Text('CONTROL DE INVENTARIO', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.blueGrey)),
            _SummaryRow(label: 'Items para devolver', value: '$returnsCount unids', icon: Icons.inventory),
            _SummaryRow(label: 'Valor en devoluciones', value: 'C\$ ${returnsValue.toStringAsFixed(2)}', icon: Icons.money_off),
            const Divider(height: 48),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('EFECTIVO A ENTREGAR', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                Text('C\$ ${(contadoIncome + creditoIncome).toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 22, color: Color(0xFF0F172A))),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({required this.label, required this.value, required this.icon, this.color});
  final String label;
  final String value;
  final IconData icon;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: color ?? Colors.grey.shade600),
          const SizedBox(width: 12),
          Text(label, style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.w500)),
          const Spacer(),
          Text(value, style: TextStyle(fontWeight: FontWeight.bold, color: color ?? Colors.black87, fontSize: 15)),
        ],
      ),
    );
  }
}















class _ClosingFooter extends StatelessWidget {
  const _ClosingFooter({
    required this.alreadyClosed,
    required this.pendingCount,
    required this.isSubmitting,
    required this.cashTotal,
    required this.onSubmit,
  });

  final bool alreadyClosed;
  final int pendingCount;
  final bool isSubmitting;
  final double cashTotal;
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
            if (pendingCount > 0 && !alreadyClosed)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(
                  '⚠ Tienes $pendingCount entrega(s) pendiente(s). Completa tus entregas antes de cerrar.',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFFDC2626),
                    fontWeight: FontWeight.w600,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            if (alreadyClosed)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFBBF7D0)),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.check_circle_rounded,
                      color: Color(0xFF16A34A),
                      size: 20,
                    ),
                    SizedBox(width: 8),
                    Text(
                      'Caja cerrada. ¡Buen trabajo!',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF166534),
                      ),
                    ),
                  ],
                ),
              )
            else
              SizedBox(
                width: double.infinity,
                height: 56,
                child: FilledButton.icon(
                  onPressed: (pendingCount > 0 || isSubmitting)
                      ? null
                      : onSubmit,
                  icon: isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.wallet_rounded),
                  label: Text(
                    isSubmitting ? 'Cerrando...' : 'Cerrar caja del día',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.5,
                    ),
                  ),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF4F46E5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(18),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}


