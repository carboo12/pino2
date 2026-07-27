import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';

import '../../../../core/network/api_client.dart';

class DailyClosingRepository {
  Future<bool> hasClosingForToday({
    required String storeId,
    required String date,
  }) async {
    try {
      final response = await ApiClient.dio.get(
        '/daily-closings',
        queryParameters: {
          'storeId': storeId,
          'date': date,
        },
      );
      if (response.data != null && response.data is List) {
        return (response.data as List).isNotEmpty;
      }
    } on DioException catch (e) {
      debugPrint('Error al verificar cierre diario: $e');
    }
    return false;
  }

  Future<bool> submitClosing({
    required String storeId,
    required double totalSales,
    required double totalCollections,
    required double totalReturns,
    required double cashTotal,
    required String closingDate,
    required String notes,
  }) async {
    final payload = <String, dynamic>{
      'externalId': const Uuid().v4(),
      'storeId': storeId,
      'totalSales': totalSales,
      'totalCollections': totalCollections,
      'totalReturns': totalReturns,
      'cashTotal': cashTotal,
      'closingDate': closingDate,
      'notes': notes,
    };

    try {
      final response = await ApiClient.dio.post('/daily-closings', data: payload);
      return response.statusCode == 200 || response.statusCode == 201;
    } on DioException catch (e) {
      debugPrint('Error al enviar cierre diario: $e');
      return false;
    }
  }
}
