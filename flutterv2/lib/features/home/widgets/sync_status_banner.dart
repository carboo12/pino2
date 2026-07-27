import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/network/connectivity_service.dart';
import '../../../core/storage/offline_cache_service.dart';
import '../../../core/storage/offline_sync_processor.dart';
import '../../../core/theme/app_theme.dart';

class SyncStatusBanner extends StatefulWidget {
  const SyncStatusBanner({super.key});

  @override
  State<SyncStatusBanner> createState() => _SyncStatusBannerState();
}

class _SyncStatusBannerState extends State<SyncStatusBanner> {
  int _pendingCount = 0;

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

  @override
  Widget build(BuildContext context) {
    final connectivity = context.watch<ConnectivityService>();

    if (connectivity.isOnline) {
      // Intentar vaciar cola offline al tener internet
      OfflineSyncProcessor.processPendingQueue().then((_) => _checkPendingCount());

      if (_pendingCount == 0) return const SizedBox.shrink();

      return Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFFEFF6FF),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFBFDBFE)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)),
                const SizedBox(width: 10),
                Text(
                  'Sincronizando $_pendingCount operaciones offline...',
                  style: const TextStyle(color: Color(0xFF1E40AF), fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            InkWell(
              onTap: () async {
                await OfflineSyncProcessor.processPendingQueue();
                _checkPendingCount();
              },
              child: const Text('Reintentar', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold, fontSize: 12)),
            ),
          ],
        ),
      );
    }

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: AppTheme.warning,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              const Icon(Icons.wifi_off_rounded, color: Colors.white, size: 18),
              const SizedBox(width: 8),
              Text(
                'Sin conexión  ·  $_pendingCount pendientes en cola',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const Text('Modo Offline', style: TextStyle(color: Colors.white70, fontSize: 11)),
        ],
      ),
    );
  }
}
