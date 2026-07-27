import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

class OfflineCacheService {
  static const String _keyProductsPrefix = 'offline_cache_products_';
  static const String _keyClientsPrefix = 'offline_cache_clients_';
  static const String _keyPromotionsPrefix = 'offline_cache_promotions_';
  static const String _keySyncQueue = 'offline_sync_queue';

  // ──── PRODUCT CATALOG CACHE ────

  static Future<void> cacheProducts(String storeId, List<Map<String, dynamic>> products) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonStr = jsonEncode(products);
      await prefs.setString('$_keyProductsPrefix$storeId', jsonStr);
      debugPrint('📦 [Cache] Guardados ${products.length} productos para tienda $storeId');
    } catch (e) {
      debugPrint('Error al guardar caché de productos: $e');
    }
  }

  static Future<List<Map<String, dynamic>>> getCachedProducts(String storeId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonStr = prefs.getString('$_keyProductsPrefix$storeId');
      if (jsonStr != null && jsonStr.isNotEmpty) {
        final list = jsonDecode(jsonStr) as List;
        return list.cast<Map<String, dynamic>>();
      }
    } catch (e) {
      debugPrint('Error al leer caché de productos: $e');
    }
    return [];
  }

  // ──── CLIENT PORTFOLIO CACHE ────

  static Future<void> cacheClients(String storeId, List<Map<String, dynamic>> clients) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonStr = jsonEncode(clients);
      await prefs.setString('$_keyClientsPrefix$storeId', jsonStr);
      debugPrint('👥 [Cache] Guardados ${clients.length} clientes para tienda $storeId');
    } catch (e) {
      debugPrint('Error al guardar caché de clientes: $e');
    }
  }

  static Future<List<Map<String, dynamic>>> getCachedClients(String storeId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonStr = prefs.getString('$_keyClientsPrefix$storeId');
      if (jsonStr != null && jsonStr.isNotEmpty) {
        final list = jsonDecode(jsonStr) as List;
        return list.cast<Map<String, dynamic>>();
      }
    } catch (e) {
      debugPrint('Error al leer caché de clientes: $e');
    }
    return [];
  }

  // ──── PROMOTIONS CACHE ────

  static Future<void> cachePromotions(String storeId, List<Map<String, dynamic>> promotions) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonStr = jsonEncode(promotions);
      await prefs.setString('$_keyPromotionsPrefix$storeId', jsonStr);
    } catch (e) {
      debugPrint('Error al guardar caché de promociones: $e');
    }
  }

  static Future<List<Map<String, dynamic>>> getCachedPromotions(String storeId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonStr = prefs.getString('$_keyPromotionsPrefix$storeId');
      if (jsonStr != null && jsonStr.isNotEmpty) {
        final list = jsonDecode(jsonStr) as List;
        return list.cast<Map<String, dynamic>>();
      }
    } catch (e) {
      debugPrint('Error al leer caché de promociones: $e');
    }
    return [];
  }

  // ──── OFFLINE QUEUE (COLA DE OPERACIONES PENDIENTES) ────

  static Future<void> enqueueOfflineOperation({
    required String endpoint,
    required String method,
    required Map<String, dynamic> payload,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final currentQueue = await getPendingOfflineOperations();

      final operationId = payload['operationId'] ?? payload['externalId'] ?? const Uuid().v4();
      final newOp = {
        'operationId': operationId,
        'endpoint': endpoint,
        'method': method,
        'payload': payload,
        'queuedAt': DateTime.now().toIso8601String(),
      };

      currentQueue.add(newOp);
      await prefs.setString(_keySyncQueue, jsonEncode(currentQueue));
      debugPrint('⏳ [Offline Queue] Operación encolada: $method $endpoint (ID: $operationId)');
    } catch (e) {
      debugPrint('Error al encolar operación offline: $e');
    }
  }

  static Future<List<Map<String, dynamic>>> getPendingOfflineOperations() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonStr = prefs.getString(_keySyncQueue);
      if (jsonStr != null && jsonStr.isNotEmpty) {
        final list = jsonDecode(jsonStr) as List;
        return list.cast<Map<String, dynamic>>();
      }
    } catch (e) {
      debugPrint('Error al leer cola offline: $e');
    }
    return [];
  }

  static Future<void> removeOfflineOperation(String operationId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final currentQueue = await getPendingOfflineOperations();
      currentQueue.removeWhere((op) => op['operationId'] == operationId);
      await prefs.setString(_keySyncQueue, jsonEncode(currentQueue));
      debugPrint('✅ [Offline Queue] Operación $operationId completada y removida de la cola');
    } catch (e) {
      debugPrint('Error al remover operación de la cola offline: $e');
    }
  }
}
