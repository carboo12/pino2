import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import '../../../core/network/api_client.dart';

class QuickOrderRepository {
  Future<Map<String, dynamic>> createOrder({
    required String storeId,
    required String clientId,
    required String clientName,
    String? vendorId,
    String? salesManagerName,
    required String paymentType,
    String? notes,
    required List<Map<String, dynamic>> items,
  }) async {
    final payload = {
      'storeId': storeId,
      'clientId': clientId,
      'clientName': clientName,
      'vendorId': vendorId,
      'salesManagerName': salesManagerName,
      'paymentType': paymentType,
      'externalId': const Uuid().v4(),
      if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
      'items': items,
    };

    try {
      final response = await ApiClient.dio.post('/orders', data: payload);
      final data = response.data;
      if (data is Map<String, dynamic>) {
        return data;
      }
      return {'success': true, 'raw': data};
    } catch (e) {
      debugPrint('[QuickOrderRepository] Error al crear pedido: $e');
      rethrow;
    }
  }
}
