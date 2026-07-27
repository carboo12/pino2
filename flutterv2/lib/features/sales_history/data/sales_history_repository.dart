import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../../../core/network/api_client.dart';

class SalesHistoryRepository {
  Future<List<Map<String, dynamic>>> getSales({required String storeId}) async {
    try {
      final response = await ApiClient.dio.get(
        '/sales',
        queryParameters: {'storeId': storeId},
      );
      if (response.data != null && response.data is List) {
        return (response.data as List).cast<Map<String, dynamic>>();
      }
    } on DioException catch (e) {
      debugPrint('Error al obtener ventas: $e');
    }
    return [];
  }
}
