import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../network/api_client.dart';
import 'offline_cache_service.dart';

class OfflineSyncProcessor {
  static bool _isSyncing = false;

  static Future<void> processPendingQueue() async {
    if (_isSyncing) return;
    _isSyncing = true;

    try {
      final queue = await OfflineCacheService.getPendingOfflineOperations();
      if (queue.isEmpty) {
        _isSyncing = false;
        return;
      }

      debugPrint('🔄 [Sync Processor] Procesando ${queue.length} operaciones offline pendientes...');

      for (final op in queue) {
        final endpoint = op['endpoint'] as String;
        final method = op['method'] as String;
        final payload = op['payload'] as Map<String, dynamic>;
        final opId = op['operationId'] as String;

        try {
          Response response;
          if (method.toUpperCase() == 'POST') {
            response = await ApiClient.dio.post(endpoint, data: payload);
          } else if (method.toUpperCase() == 'PATCH') {
            response = await ApiClient.dio.patch(endpoint, data: payload);
          } else {
            response = await ApiClient.dio.put(endpoint, data: payload);
          }

          if (response.statusCode == 200 || response.statusCode == 201) {
            await OfflineCacheService.removeOfflineOperation(opId);
          }
        } on DioException catch (e) {
          debugPrint('⚠️ [Sync Processor] Reintento falló para $opId: $e');
          // Permanece en cola para el siguiente reintento
        }
      }
    } catch (e) {
      debugPrint('Error en procesador de sincronización offline: $e');
    } finally {
      _isSyncing = false;
    }
  }
}
