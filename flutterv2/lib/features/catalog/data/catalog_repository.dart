import 'package:flutter/foundation.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/offline_cache_service.dart';
import '../domain/models/catalog_product.dart';

class CatalogRepository {
  Future<List<CatalogProduct>> getProducts({
    required String storeId,
  }) async {
    try {
      final response = await ApiClient.dio.get('/stores/$storeId/products');
      final data = response.data;
      final list = data is List ? data : (data['data'] is List ? data['data'] : []);

      final rawList = (list as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
      await OfflineCacheService.cacheProducts(storeId, rawList);

      return rawList
          .map((item) => CatalogProduct.fromJson(item))
          .toList();
    } catch (e) {
      debugPrint('[CatalogRepository] Error en red, leyendo caché local offline: $e');
      final cached = await OfflineCacheService.getCachedProducts(storeId);
      if (cached.isNotEmpty) {
        return cached.map((item) => CatalogProduct.fromJson(item)).toList();
      }
      return [];
    }
  }
}
