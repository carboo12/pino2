import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../database/local_cache_repository.dart';
import '../../features/catalog/domain/models/catalog_product.dart';
import '../../features/clients/domain/models/client_summary.dart';
import 'api_client.dart';
import '../../features/auth/presentation/controllers/auth_controller.dart';

class DeltaSyncService {
  DeltaSyncService(this.ref);

  final Ref ref;

  static const int _pageSize = 500;

  static String _cursorKey(String storeId, String entity) =>
      'delta_cursor_${storeId}_$entity';
  static String _timestampKey(String storeId) => 'delta_timestamp_$storeId';

  static String? _extractCursor(List<dynamic> items) {
    if (items.isEmpty) return null;
    final lastItem = Map<String, dynamic>.from(items.last);
    return lastItem['updated_at'] as String?;
  }

  Future<void> syncData({String? storeId}) async {
    final authState = ref.read(authControllerProvider);
    final session = authState.session;
    if (session == null) return;

    final client = ref.read(appApiClientProvider);
    final cache = ref.read(localCacheRepositoryProvider);
    final prefs = await SharedPreferences.getInstance();

    final effectiveStoreId = storeId ?? session.user.primaryStoreId;
    if (effectiveStoreId == null) return;

    try {
      final productCursor =
          prefs.getString(_cursorKey(effectiveStoreId, 'products'));
      final clientCursor =
          prefs.getString(_cursorKey(effectiveStoreId, 'clients'));
      final barcodeCursor =
          prefs.getString(_cursorKey(effectiveStoreId, 'productBarcodes'));

      final allCursors = [
        productCursor,
        clientCursor,
        barcodeCursor,
      ].where((c) => c != null).map((c) => c!).toList();

      final lastCursor = allCursors.isNotEmpty
          ? allCursors.reduce((a, b) => a.compareTo(b) > 0 ? a : b)
          : null;

      String url =
          '/sync/data?storeId=$effectiveStoreId&limit=$_pageSize';
      if (lastCursor != null) {
        url += '&lastSyncTimestamp=$lastCursor';
      }

      final response = await client.getMap(
        url,
        bearerToken: session.accessToken,
      );

      final serverTimestamp = response['serverTimestamp'] as String?;
      final entities = response['entities'] as Map<String, dynamic>?;
      if (entities == null) return;

      // Products
      await _processEntity<Map<String, dynamic>>(
          entities['products'], (data) async {
        final items = (data['items'] as List?) ?? [];
        if (items.isNotEmpty) {
          final products = items
              .map((p) =>
                  CatalogProduct.fromJson(Map<String, dynamic>.from(p)))
              .toList();
          await cache.upsertProducts(products);
          final cursor = _extractCursor(items) ?? serverTimestamp ?? '';
          if (cursor.isNotEmpty) {
            await prefs.setString(
                _cursorKey(effectiveStoreId, 'products'), cursor);
          }
        }
      });

      // Clients
      await _processEntity<Map<String, dynamic>>(
          entities['clients'], (data) async {
        final items = (data['items'] as List?) ?? [];
        if (items.isNotEmpty) {
          final clients = items
              .map((c) =>
                  ClientSummary.fromJson(Map<String, dynamic>.from(c)))
              .toList();
          await cache.upsertClients(effectiveStoreId, clients);
          final cursor = _extractCursor(items) ?? serverTimestamp ?? '';
          if (cursor.isNotEmpty) {
            await prefs.setString(
                _cursorKey(effectiveStoreId, 'clients'), cursor);
          }
        }
      });

      // Product barcodes
      await _processEntity<Map<String, dynamic>>(
          entities['productBarcodes'], (data) async {
        final items = (data['items'] as List?) ?? [];
        if (items.isNotEmpty) {
          final cursor = _extractCursor(items) ?? serverTimestamp ?? '';
          if (cursor.isNotEmpty) {
            await prefs.setString(
                _cursorKey(effectiveStoreId, 'productBarcodes'), cursor);
          }
        }
      });

      if (serverTimestamp != null) {
        await prefs.setString(
            _timestampKey(effectiveStoreId), serverTimestamp);
      }
    } catch (e) {
      print('DeltaSync Error for store $effectiveStoreId: $e');
    }
  }

  Future<void> _processEntity<T>(
    dynamic rawData,
    Future<void> Function(T data) handler,
  ) async {
    if (rawData == null) return;
    try {
      await handler(rawData as T);
    } catch (e) {
      print('DeltaSync: error processing entity: $e');
    }
  }
}

final deltaSyncServiceProvider = Provider<DeltaSyncService>((ref) {
  return DeltaSyncService(ref);
});
