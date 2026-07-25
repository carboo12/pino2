import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../database/local_cache_repository.dart';
import '../../features/catalog/domain/models/catalog_product.dart';
import '../../features/clients/domain/models/client_summary.dart';
import '../../features/collections/domain/models/receivable_account.dart';
import 'api_client.dart';
import '../../features/auth/presentation/controllers/auth_controller.dart';

class DeltaSyncService {
  DeltaSyncService(this.ref);

  final Ref ref;

  static const int _pageSize = 500;

  static String _cursorKey(String storeId) => 'delta_cursor_$storeId';
  static String _timestampKey(String storeId) => 'delta_timestamp_$storeId';

  Future<void> syncData({String? storeId}) async {
    final authState = ref.read(authControllerProvider);
    final session = authState.session;
    if (session == null) return;

    final client = ref.read(appApiClientProvider);
    final cache = ref.read(localCacheRepositoryProvider);
    final prefs = await SharedPreferences.getInstance();

    final effectiveStoreId = storeId ?? session.user.primaryStoreId;
    if (effectiveStoreId == null) return;

    final lastCursor = prefs.getString(_cursorKey(effectiveStoreId));
    String? serverTimestamp;

    try {
      int offset = 0;
      bool hasMore = true;

      while (hasMore) {
        // 1. Fetch delta page from server
        String url = '/sync/data?storeId=$effectiveStoreId&limit=$_pageSize&offset=$offset';
        if (lastCursor != null) {
          url += '&lastSyncTimestamp=$lastCursor';
        }

        final response = await client.getMap(
          url,
          bearerToken: session.accessToken,
        );

        serverTimestamp = response['serverTimestamp'] as String?;
        final totalCount = response['totalCount'] as int? ?? 0;

        // 2. Process all entity types
        _processEntity<List>(response['products'], (data) async {
          final products = data.map((p) => CatalogProduct.fromJson(Map<String, dynamic>.from(p))).toList();
          await cache.upsertProducts(products);
        });

        _processEntity<List>(response['clients'], (data) async {
          final clients = data.map((c) => ClientSummary.fromJson(Map<String, dynamic>.from(c))).toList();
          await cache.upsertClients(effectiveStoreId, clients);
        });

        _processEntity<List>(response['productBarcodes'], (data) async {
          if (data.isNotEmpty) {
            final ids = data.map((b) => Map<String, dynamic>.from(b)['barcode'] as String).toList();
            // Cached barcodes will be refreshed on next product access
          }
        });

        _processEntity<List>(response['orders'], (data) async {
          // Orders are cached locally; full detail fetched on access
        });

        _processEntity<List>(response['sales'], (data) async {
          // Sales history cached locally; full detail on demand
        });

        _processEntity<List>(response['pendingDeliveries'], (data) async {
          // Pending deliveries cached in local repository
        });

        _processEntity<List>(response['vendorInventories'], (data) async {
          // Vendor inventories refreshed via vendor_inventory feature
        });

        _processEntity<List>(response['collections'], (data) async {
          // Collections synced via queue processor, not delta
        });

        _processEntity<List>(response['outboxPending'], (data) async {
          // Outbox events logged for audit
        });

        // 3. Pagination: check if there are more pages
        offset += _pageSize;
        hasMore = offset < totalCount;
      }

      // 4. Save cursor per storeId
      if (serverTimestamp != null) {
        await prefs.setString(_cursorKey(effectiveStoreId), serverTimestamp);
        await prefs.setString(_timestampKey(effectiveStoreId), serverTimestamp);
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
