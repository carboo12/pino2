import 'package:flutter/foundation.dart';
import '../../../core/network/api_client.dart';
import '../domain/models/client_summary.dart';

class ClientPortfolioRepository {
  Future<List<ClientSummary>> getClients({
    required String storeId,
  }) async {
    try {
      final response = await ApiClient.dio.get('/stores/$storeId/clients');
      final data = response.data;
      final list = data is List ? data : (data['data'] is List ? data['data'] : []);

      return (list as List)
          .map((item) => ClientSummary.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
    } catch (e) {
      debugPrint('[ClientPortfolioRepository] Error al obtener clientes: $e');
      return [];
    }
  }
}
