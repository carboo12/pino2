import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../../../core/network/api_client.dart';
import '../domain/models/vendor_product.dart';

class VendorInventoryRepository {
  Future<List<VendorProduct>> getVendorInventory({required String storeId}) async {
    try {
      Response response;
      try {
        response = await ApiClient.dio.get(
          '/vendor-inventories',
          queryParameters: {'storeId': storeId},
        );
      } catch (_) {
        response = await ApiClient.dio.get(
          '/products',
          queryParameters: {'storeId': storeId, 'limit': 300},
        );
      }

      final data = response.data;
      final list = data is List ? data : (data is Map && data['data'] is List ? data['data'] : []);

      return (list as List)
          .map((e) => VendorProduct.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } on DioException catch (e) {
      debugPrint('Error al obtener inventario de vendedor: $e');
    }
    return [];
  }
}
