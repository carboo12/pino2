import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/storage/offline_cache_service.dart';

class SalesHistoryRepository {
  Future<List<Map<String, dynamic>>> getSales({required String storeId}) async {
    final combined = <Map<String, dynamic>>[];

    // 1. Obtener operacionales pendientes en la cola local offline
    try {
      final pendingOps = await OfflineCacheService.getPendingOfflineOperations();
      for (final op in pendingOps) {
        final payload = op['payload'] as Map<String, dynamic>? ?? {};
        if (payload['storeId'] == storeId || payload['storeId'] == null) {
          final items = payload['items'] as List? ?? [];
          double calcTotal = 0;
          for (final item in items) {
            final price = double.tryParse(item['price']?.toString() ?? '0') ?? 0;
            final qty = double.tryParse(item['quantity']?.toString() ?? '0') ?? 0;
            calcTotal += (price * qty);
          }

          combined.add({
            'id': op['operationId'] ?? payload['externalId'] ?? 'offline_${DateTime.now().millisecondsSinceEpoch}',
            'ticketNumber': 'PREVENTA-OFFLINE',
            'clientName': payload['clientName'] ?? 'Cliente Express (Offline)',
            'total': calcTotal > 0 ? calcTotal : (payload['total'] ?? 0),
            'synced': false,
            'statusLabel': '⏳ Guardado en Celular (Pendiente de Red)',
            'queuedAt': op['queuedAt'],
          });
        }
      }
    } catch (e) {
      debugPrint('Error al leer preventas offline: $e');
    }

    // 2. Obtener ventas confirmadas en el servidor NestJS
    try {
      final response = await ApiClient.dio.get(
        '/sales',
        queryParameters: {'storeId': storeId},
      );
      final data = response.data;
      final list = data is List ? data : (data is Map && data['data'] is List ? data['data'] : []);

      for (final item in (list as List)) {
        final map = Map<String, dynamic>.from(item as Map);
        map['synced'] = true;
        map['statusLabel'] = '✅ Sincronizado en Servidor';
        combined.add(map);
      }
    } on DioException catch (e) {
      debugPrint('Error al obtener ventas de servidor: $e');
    }

    return combined;
  }
}
