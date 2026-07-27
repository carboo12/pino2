import 'package:dio/dio.dart';
import 'package:uuid/uuid.dart';

import '../../../../core/network/api_client.dart';
import '../domain/models/sale_lookup.dart';

import 'package:flutter/foundation.dart';

class ReturnsRepository {
  Future<SaleLookup?> findSale({
    required String saleReference,
    required String storeId,
  }) async {
    try {
      final response = await ApiClient.dio.get<Map<String, dynamic>>(
        '/sales/$saleReference',
        queryParameters: {'storeId': storeId},
      );
      if (response.data != null) {
        return SaleLookup.fromJson(response.data!);
      }
    } on DioException catch (e) {
      debugPrint('Error al buscar ticket de venta: $e');
    }
    return null;
  }

  Future<bool> createReturn({
    required String storeId,
    required String saleId,
    required List<Map<String, dynamic>> items,
    String? notes,
  }) async {
    final payload = {
      'storeId': storeId,
      'saleId': saleId,
      'externalId': const Uuid().v4(),
      if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
      'items': items,
    };

    try {
      final response = await ApiClient.dio.post('/returns', data: payload);
      return response.statusCode == 200 || response.statusCode == 201;
    } on DioException catch (e) {
      debugPrint('Error al registrar devolución: $e');
      return false;
    }
  }
}
