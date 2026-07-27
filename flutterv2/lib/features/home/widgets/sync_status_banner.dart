import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/network/connectivity_service.dart';
import '../../../core/storage/offline_cache_service.dart';
import '../../../core/storage/offline_sync_processor.dart';
import '../../../core/theme/app_theme.dart';
import '../../catalog/data/catalog_repository.dart';
import '../../clients/data/client_portfolio_repository.dart';

class SyncStatusBanner extends StatefulWidget {
  const SyncStatusBanner({
    this.storeId,
    super.key,
  });

  final String? storeId;

  @override
  State<SyncStatusBanner> createState() => _SyncStatusBannerState();
}

class _SyncStatusBannerState extends State<SyncStatusBanner> {
  int _pendingCount = 0;
  bool _isSyncing = false;

  @override
  void initState() {
    super.initState();
    _checkPendingCount();
  }

  Future<void> _checkPendingCount() async {
    final queue = await OfflineCacheService.getPendingOfflineOperations();
    if (mounted) {
      setState(() => _pendingCount = queue.length);
    }
  }

  Future<void> _triggerManualSync() async {
    if (_isSyncing) return;
    setState(() => _isSyncing = true);

    try {
      // 1. Vaciar cola offline enviando registros al backend
      await OfflineSyncProcessor.processPendingQueue();
      await _checkPendingCount();

      // 2. Si se proporciona storeId, refrescar la caché local de catálogo y clientes
      if (widget.storeId != null && widget.storeId!.isNotEmpty) {
        await CatalogRepository().getProducts(storeId: widget.storeId!);
        await ClientPortfolioRepository().getClients(storeId: widget.storeId!);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Sincronización completada. Base local actualizada con éxito.'),
            backgroundColor: Color(0xFF10B981),
            duration: Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      debugPrint('Error en sincronización manual: $e');
    } finally {
      if (mounted) {
        setState(() => _isSyncing = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final connectivity = context.watch<ConnectivityService>();
    final isOnline = connectivity.isOnline;

    if (isOnline) {
      // Intento en segundo plano de procesar la cola
      OfflineSyncProcessor.processPendingQueue().then((_) => _checkPendingCount());
    }

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: isOnline ? const Color(0xFFA7F3D0) : const Color(0xFFFDE68A),
          width: 1.5,
        ),
      ),
      color: isOnline ? const Color(0xFFECFDF5) : const Color(0xFFFFFBEB),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isOnline ? const Color(0xFFD1FAE5) : const Color(0xFFFEF3C7),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    isOnline ? Icons.cloud_done_rounded : Icons.phone_android_rounded,
                    color: isOnline ? const Color(0xFF059669) : const Color(0xFFD97706),
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: isOnline ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            isOnline
                                ? '🟢 Conectado al Servidor (En vivo)'
                                : '📱 Base Local del Teléfono (Offline)',
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 13,
                              color: isOnline ? const Color(0xFF065F46) : const Color(0xFF92400E),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        isOnline
                            ? (_pendingCount > 0
                                ? '$_pendingCount preventas pendientes en cola...'
                                : 'Catálogo y clientes sincronizados')
                            : 'Tus pedidos se guardan en la base local del teléfono y se sincronizarán al volver el internet.',
                        style: TextStyle(
                          fontSize: 11,
                          color: isOnline ? const Color(0xFF047857) : const Color(0xFFB45309),
                        ),
                      ),
                    ],
                  ),
                ),
                if (isOnline)
                  SizedBox(
                    height: 38,
                    child: ElevatedButton.icon(
                      onPressed: _isSyncing ? null : _triggerManualSync,
                      icon: _isSyncing
                          ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.sync_rounded, size: 16),
                      label: Text(_isSyncing ? 'Sincronizando...' : 'Sincronizar'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
