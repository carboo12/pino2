import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../../core/network/api_client.dart';
import '../domain/models/store_summary.dart';

class HomeRepository {
  Future<List<StoreSummary>> getAssignedStores({
    required String userId,
  }) async {
    try {
      Response response;
      try {
        response = await ApiClient.dio.get('/stores');
      } catch (_) {
        response = await ApiClient.dio.get('/users/$userId/stores');
      }

      final data = response.data;
      final list = data is List ? data : (data is Map && data['data'] is List ? data['data'] : []);

      final result = (list as List)
          .map((item) => StoreSummary.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();

      if (result.isNotEmpty) {
        return result;
      }
    } catch (e) {
      debugPrint('[HomeRepository] Error al obtener tiendas asignadas: $e');
    }

    // Fallback garantizado a la tienda principal si el backend no devuelve lista de tiendas
    return const [
      StoreSummary(
        id: '9321856d-19ba-42b8-ba47-cf35c0d133dd',
        name: 'Tienda Principal',
      ),
    ];
  }
}
