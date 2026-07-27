import 'package:flutter/foundation.dart';
import '../../../core/network/api_client.dart';
import '../domain/models/catalog_product.dart';

class CatalogRepository {
  Future<List<CatalogProduct>> getProducts({
    required String storeId,
  }) async {
    try {
      final response = await ApiClient.dio.get('/stores/$storeId/products');
      final data = response.data;
      final list = data is List ? data : (data['data'] is List ? data['data'] : []);

      return (list as List)
          .map((item) => CatalogProduct.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
    } catch (e) {
      debugPrint('[CatalogRepository] Error al obtener catálogo: $e');
      return [];
    }
  }
}
