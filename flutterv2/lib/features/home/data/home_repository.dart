import 'package:flutter/foundation.dart';
import '../../../core/network/api_client.dart';
import '../domain/models/store_summary.dart';

class HomeRepository {
  Future<List<StoreSummary>> getAssignedStores({
    required String userId,
  }) async {
    try {
      final response = await ApiClient.dio.get('/users/$userId/stores');
      final data = response.data;
      final list = data is List ? data : (data['data'] is List ? data['data'] : []);

      return (list as List)
          .map((item) => StoreSummary.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
    } catch (e) {
      debugPrint('[HomeRepository] Error al obtener tiendas asignadas: $e');
      return [];
    }
  }
}
