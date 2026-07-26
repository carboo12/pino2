import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../../core/config/app_colors.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/delta_sync_service.dart';
import '../../../../core/network/sync_queue_processor.dart';
import '../../../../core/widgets/premium_widgets.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';

class PreventaHomeScreen extends ConsumerStatefulWidget {
  const PreventaHomeScreen({super.key});

  @override
  ConsumerState<PreventaHomeScreen> createState() => _PreventaHomeScreenState();
}

class _PreventaHomeScreenState extends ConsumerState<PreventaHomeScreen> {
  Map<String, dynamic> _metrics = {
    'visits': 0,
    'totalVisits': 0,
    'totalSold': 0.0,
    'ordersCount': 0,
    'pendingSync': 0,
  };
  List<Map<String, dynamic>> _recentOrders = [];
  bool _loadingMetrics = true;

  @override
  void initState() {
    super.initState();
    _loadMetrics();
  }

  Future<void> _loadMetrics() async {
    final session = ref.read(authControllerProvider).session;
    if (session == null) return;
    final apiClient = ref.read(appApiClientProvider);
    final token = session.accessToken;
    final userId = session.user.id;
    final storeId = session.user.primaryStoreId;
    if (storeId == null) return;

    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());

    try {
      final results = await Future.wait([
        apiClient
            .getList('/visit-logs?vendorId=$userId&date=$today', bearerToken: token)
            .catchError((_) => <dynamic>[]),
        apiClient
            .getList('/orders?vendorId=$userId&storeId=$storeId&fromDate=$today', bearerToken: token)
            .catchError((_) => <dynamic>[]),
      ]);

      final visitLogs = results[0];
      final orders = results[1];

      double totalSold = 0;
      for (final o in orders) {
        totalSold += double.tryParse(o['total']?.toString() ?? '0') ?? 0;
      }

      setState(() {
        _metrics = {
          'visits': visitLogs.length,
          'totalVisits': visitLogs.length,
          'totalSold': totalSold,
          'ordersCount': orders.length,
          'pendingSync': 0,
        };
        _recentOrders = orders.take(5).map((o) => {
          'client': o['clientName'] ?? o['client_id'] ?? 'Cliente',
          'total': o['total']?.toString() ?? '0',
          'time': o['createdAt']?.toString() ?? '',
          'synced': o['status'] != 'PENDIENTE',
        }).toList();
        _loadingMetrics = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loadingMetrics = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final session = authState.session;

    if (session == null) return const Scaffold();

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final todayStr = DateFormat('EEE d \'de\' MMMM', 'es').format(DateTime.now());

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : AppColors.slate50,
      appBar: AppBar(
        title: const Text('Preventa', style: TextStyle(fontWeight: FontWeight.w800)),
        elevation: 0,
        backgroundColor: Colors.transparent,
        actions: [
          IconButton(
            tooltip: 'Sincronizar ahora',
            icon: const Icon(Icons.sync_rounded),
            onPressed: () async {
              await ref.read(deltaSyncServiceProvider).syncData();
              await ref.read(syncQueueProcessorProvider.notifier).processPendingQueue();
              await _loadMetrics();
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Sincronización finalizada')),
                );
              }
            },
          ),
          IconButton(
            tooltip: 'Cerrar sesión',
            icon: const Icon(Icons.logout_rounded),
            onPressed: () => ref.read(authControllerProvider.notifier).logout(),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        children: [
          // Hero Section
          StaggeredFadeIn(
            index: 0,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(22),
                gradient: const LinearGradient(
                  colors: [Color(0xFF047857), Color(0xFF065F46)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF047857).withValues(alpha: 0.3),
                    blurRadius: 16,
                    offset: const Offset(0, 8),
                  )
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Buenos días, ${session.user.name.split(' ').first}',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.calendar_today_rounded, color: Colors.white70, size: 16),
                      const SizedBox(width: 6),
                      Text(
                        todayStr.toUpperCase(),
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withValues(alpha: 0.9),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 24),

          // KPI Grid
          if (_loadingMetrics)
            const Center(child: Padding(
              padding: EdgeInsets.all(32),
              child: CircularProgressIndicator(),
            ))
          else
            StaggeredFadeIn(
              index: 1,
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final isSmall = constraints.maxWidth < 360;
                  return GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: isSmall ? 10 : 16,
                    mainAxisSpacing: isSmall ? 10 : 16,
                    childAspectRatio: isSmall ? 1.15 : 1.35,
                    children: [
                      _buildKpiCard(
                        title: 'Visitas',
                        value: '${_metrics['visits']}',
                        subtitle: 'de ${_metrics['totalVisits']} registradas',
                        icon: Icons.storefront_rounded,
                        color: const Color(0xFF3B82F6),
                      ),
                      _buildKpiCard(
                        title: 'Vendido',
                        value: 'C\$ ${NumberFormat('#,##0', 'es').format(_metrics['totalSold'])}',
                        subtitle: 'Total del día',
                        icon: Icons.attach_money_rounded,
                        color: const Color(0xFF10B981),
                      ),
                      _buildKpiCard(
                        title: 'Pedidos',
                        value: '${_metrics['ordersCount']}',
                        subtitle: 'Emitidos hoy',
                        icon: Icons.shopping_basket_rounded,
                        color: const Color(0xFFF59E0B),
                      ),
                      _buildKpiCard(
                        title: 'Pendientes',
                        value: '${_metrics['pendingSync']}',
                        subtitle: 'Por sincronizar',
                        icon: Icons.cloud_upload_rounded,
                        color: const Color(0xFFEF4444),
                      ),
                    ],
                  );
                },
              ),
            ),

          const SizedBox(height: 24),

          // Main Action
          StaggeredFadeIn(
            index: 2,
            child: FilledButton.icon(
              onPressed: () => context.push('/preventa-route'),
              icon: const Icon(Icons.directions_car_rounded, size: 22),
              label: const Text('Iniciar Ruta'),
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF047857),
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 56),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 3,
                shadowColor: const Color(0xFF047857).withValues(alpha: 0.4),
                textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
              ),
            ),
          ),

          const SizedBox(height: 24),

          // Ultimos pedidos
          if (_recentOrders.isNotEmpty) ...[
            StaggeredFadeIn(
              index: 3,
              child: Text(
                'Últimos pedidos del día',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: AppColors.slate900,
                ),
              ),
            ),
            const SizedBox(height: 12),
            StaggeredFadeIn(
              index: 4,
              child: Container(
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: AppColors.cardShadow,
                  border: Border.all(color: AppColors.slate200),
                ),
                child: Column(
                  children: _recentOrders.map((o) {
                    final idx = _recentOrders.indexOf(o);
                    return Column(
                      children: [
                        if (idx > 0) const Divider(height: 1, color: AppColors.slate200),
                        _buildRecentOrderRow(
                          o['client'] as String,
                          'C\$ ${NumberFormat('#,##0.00', 'es').format(double.tryParse(o['total']?.toString() ?? '0') ?? 0)}',
                          _formatTime(o['time'] as String),
                          o['synced'] as bool,
                        ),
                      ],
                    );
                  }).toList(),
                ),
              ),
            ),
          ],
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        selectedItemColor: const Color(0xFF047857),
        unselectedItemColor: AppColors.slate500,
        backgroundColor: Colors.white,
        elevation: 8,
        onTap: (index) {
          switch (index) {
            case 1:
              context.push('/preventa-clients');
              break;
            case 2:
              final storeId = session.user.primaryStoreId ?? '';
              context.push('/catalog/$storeId');
              break;
          }
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_rounded), label: 'Inicio'),
          BottomNavigationBarItem(icon: Icon(Icons.people_alt_rounded), label: 'Clientes'),
          BottomNavigationBarItem(icon: Icon(Icons.inventory_2_rounded), label: 'Catálogo'),
        ],
      ),
    );
  }

  String _formatTime(String dateStr) {
    if (dateStr.isEmpty) return '';
    try {
      final dt = DateTime.parse(dateStr);
      return DateFormat('HH:mm', 'es').format(dt);
    } catch (_) {
      return dateStr;
    }
  }

  Widget _buildKpiCard({
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.slate200),
        boxShadow: AppColors.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  color: AppColors.slate600,
                  fontSize: 13,
                ),
              ),
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 18),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 22,
                  letterSpacing: -0.5,
                  color: AppColors.slate900,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(
                  color: AppColors.slate500,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildRecentOrderRow(String client, String ammount, String time, bool synced) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.slate100,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.receipt_rounded, size: 20, color: AppColors.slate700),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  client,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                    color: AppColors.slate900,
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    const Icon(Icons.access_time_rounded, size: 12, color: AppColors.slate400),
                    const SizedBox(width: 4),
                    Text(
                      time,
                      style: const TextStyle(color: AppColors.slate500, fontSize: 12),
                    ),
                  ],
                )
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                ammount,
                style: const TextStyle(
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF047857),
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 4),
              Icon(
                synced ? Icons.cloud_done_rounded : Icons.cloud_upload_rounded,
                size: 14,
                color: synced ? AppColors.success : AppColors.warning,
              ),
            ],
          )
        ],
      ),
    );
  }
}
