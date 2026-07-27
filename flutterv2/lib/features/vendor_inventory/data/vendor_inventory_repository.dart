import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../../../core/network/api_client.dart';
import '../domain/models/vendor_product.dart';

class VendorInventoryRepository {
  Future<List<VendorProduct>> getVendorInventory({required String storeId}) async {
    try {
      final response = await ApiClient.dio.get(
        '/vendor-inventories',
        queryParameters: {'storeId': storeId},
      );
      if (response.data != null && response.data is List) {
        return (response.data as List)
            .map((e) => VendorProduct.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
      }
    } on DioException catch (e) {
      debugPrint('Error al obtener inventario de vendedor: $e');
    }
    return [];
  }
}
