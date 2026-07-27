import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/offline_cache_service.dart';
import '../domain/models/client_summary.dart';

class ClientPortfolioRepository {
  Future<List<ClientSummary>> getClients({
    required String storeId,
  }) async {
    try {
      Response response;
      try {
        response = await ApiClient.dio.get('/clients', queryParameters: {
          'storeId': storeId,
          'limit': 300,
          'allClients': 'true',
        });
      } catch (_) {
        response = await ApiClient.dio.get('/stores/$storeId/clients');
      }
      final data = response.data;
      final list = data is List ? data : (data is Map && data['data'] is List ? data['data'] : []);

      final rawList = (list as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
      await OfflineCacheService.cacheClients(storeId, rawList);

      return rawList
          .map((item) => ClientSummary.fromJson(item))
          .toList();
    } catch (e) {
      debugPrint('[ClientPortfolioRepository] Error en red, leyendo cartera offline: $e');
      final cached = await OfflineCacheService.getCachedClients(storeId);
      if (cached.isNotEmpty) {
        return cached.map((item) => ClientSummary.fromJson(item)).toList();
      }
      return [];
    }
  }

  Future<ClientSummary?> createExpressClient({
    required String storeId,
    required String name,
    String? phone,
    String? address,
    double? lat,
    double? lng,
  }) async {
    final payload = <String, dynamic>{
      'storeId': storeId,
      'name': name.trim(),
      if (phone != null && phone.trim().isNotEmpty) 'phone': phone.trim(),
      if (address != null && address.trim().isNotEmpty) 'address': address.trim(),
      ...?lat != null ? {'lat': lat} : null,
      ...?lng != null ? {'lng': lng} : null,
    };

    try {
      final response = await ApiClient.dio.post('/clients', data: payload);
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = Map<String, dynamic>.from(response.data as Map);
        return ClientSummary.fromJson(data);
      }
    } on DioException catch (e) {
      debugPrint('[ClientPortfolioRepository] Error al guardar cliente online, guardando offline: $e');
      await OfflineCacheService.enqueueOfflineOperation(
        endpoint: '/clients',
        method: 'POST',
        payload: payload,
      );

      return ClientSummary(
        id: (payload['externalId'] ?? 'temp_${DateTime.now().millisecondsSinceEpoch}').toString(),
        storeId: storeId,
        name: name,
        phone: phone,
        address: address,
      );
    }
    return null;
  }
}
