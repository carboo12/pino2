import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/delta_sync_service.dart';
import '../../../../core/network/sync_queue_processor.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import 'package:intl/intl.dart';

class PreventaHomeScreen extends ConsumerStatefulWidget {
  const PreventaHomeScreen({super.key});

  @override
  ConsumerState<PreventaHomeScreen> createState() => _PreventaHomeScreenState();
}

class _PreventaHomeScreenState extends ConsumerState<PreventaHomeScreen> {
  Map<String, dynamic> _metrics = {
    'visits': 0, 'totalVisits': 0,
    'totalSold': 0.0, 'ordersCount': 0, 'pendingSync': 0,
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
        // visits today
        apiClient.getList('/visit-logs?vendorId=$userId&date=$today', bearerToken: token).catchError((_) => <dynamic>[]),
        // orders today (to get total and count)
        apiClient.getList('/orders?vendorId=$userId&storeId=$storeId&fromDate=$today', bearerToken: token).catchError((_) => <dynamic>[]),
      ]);

      final visitLogs = results[0] as List;
      final orders = results[1] as List;

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
    
    final todayStr = DateFormat('EEEE d \'de\' MMMM', 'es').format(DateTime.now());

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Preventa'),
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
           // Hero Session
           Container(
             padding: const EdgeInsets.all(22),
             decoration: BoxDecoration(
               borderRadius: BorderRadius.circular(24),
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
               ]
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
                 const SizedBox(height: 16),
               ],
             ),
           ),

           const SizedBox(height: 24),

           // KPI Grid
           if (_loadingMetrics)
             const Center(child: CircularProgressIndicator())
           else
             GridView.count(
               crossAxisCount: 2,
               shrinkWrap: true,
               physics: const NeverScrollableScrollPhysics(),
               crossAxisSpacing: 16,
               mainAxisSpacing: 16,
               childAspectRatio: 1.4,
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
             ),

           const SizedBox(height: 24),

           // Main Action
           ElevatedButton(
             onPressed: () {
                context.push('/preventa-route');
             },
             style: ElevatedButton.styleFrom(
               backgroundColor: const Color(0xFF0F172A),
               foregroundColor: Colors.white,
               padding: const EdgeInsets.symmetric(vertical: 20),
               shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
               elevation: 8,
               shadowColor: const Color(0xFF0F172A).withValues(alpha: 0.4),
             ),
             child: const Row(
               mainAxisAlignment: MainAxisAlignment.center,
               children: [
                 Icon(Icons.directions_car_rounded, size: 24),
                 SizedBox(width: 12),
                 Text('INICIAR RUTA DEL DÍA', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
               ],
             ),
           ),

           const SizedBox(height: 24),

           // Ultimos pedidos
           if (_recentOrders.isNotEmpty) ...[
             Text(
               'Últimos pedidos del día',
               style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
             ),
             const SizedBox(height: 12),
             Container(
               decoration: BoxDecoration(
                 color: isDark ? const Color(0xFF1E293B) : Colors.white,
                 borderRadius: BorderRadius.circular(20),
                 boxShadow: [
                   BoxShadow(
                     color: Colors.black.withValues(alpha: 0.03),
                     blurRadius: 10,
                     offset: const Offset(0, 4),
                   )
                 ],
                 border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
               ),
               child: Column(
                 children: _recentOrders.map((o) {
                   final idx = _recentOrders.indexOf(o);
                   return Column(
                     children: [
                       if (idx > 0) const Divider(height: 1),
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
           ],
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        selectedItemColor: const Color(0xFF047857),
        unselectedItemColor: Colors.grey,
        onTap: (index) {
          if (index == 1) {
            context.push('/preventa-clients');
          }
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_rounded), label: 'Inicio'),
          BottomNavigationBarItem(icon: Icon(Icons.people_alt_rounded), label: 'Mis Clientes'),
          BottomNavigationBarItem(icon: Icon(Icons.shopping_bag_rounded), label: 'Catálogo'),
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

  Widget _buildKpiCard({required String title, required String value, required String subtitle, required IconData icon, required Color color}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 4),
          )
        ]
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black54, fontSize: 13)),
              Icon(icon, color: color, size: 20),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 24, letterSpacing: -0.5)),
              Text(subtitle, style: const TextStyle(color: Colors.black45, fontSize: 11, fontWeight: FontWeight.w600)),
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
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.receipt_rounded, size: 20, color: Colors.black54),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(client, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Icon(Icons.access_time_rounded, size: 12, color: Colors.grey.shade500),
                    const SizedBox(width: 4),
                    Text(time, style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                  ],
                )
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(ammount, style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF047857))),
              const SizedBox(height: 4),
              Icon(
                synced ? Icons.cloud_done_rounded : Icons.cloud_upload_rounded, 
                size: 14, 
                color: synced ? Colors.green : Colors.orange
              ),
            ],
          )
        ],
      ),
    );
  }
}
