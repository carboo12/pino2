import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../../../core/network/api_client.dart';
import '../domain/models/warehouse_models.dart';

class WarehouseRepository {
  Future<List<WarehouseOrder>> getPendingOrders({required String storeId}) async {
    try {
      final response = await ApiClient.dio.get(
        '/pending-orders',
        queryParameters: {'storeId': storeId},
      );
      if (response.data != null && response.data is List) {
        return (response.data as List)
            .map((e) => WarehouseOrder.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
      }
    } on DioException catch (e) {
      debugPrint('Error al obtener pedidos de bodega: $e');
    }
    return [];
  }

  Future<bool> updateOrderStatus({
    required String orderId,
    required String status,
    String? vendorId,
  }) async {
    try {
      final response = await ApiClient.dio.patch(
        '/pending-orders/$orderId/status',
        data: {
          'status': status,
          'vendorId': vendorId,
        },
      );
      return response.statusCode == 200;
    } on DioException catch (e) {
      debugPrint('Error al actualizar estado de pedido en bodega: $e');
      return false;
    }
  }
}
