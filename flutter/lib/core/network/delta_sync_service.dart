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

  static const String _lastSyncKey = 'last_sync_timestamp';

  Future<void> syncData() async {
    final authState = ref.read(authControllerProvider);
    final session = authState.session;
    if (session == null) return;

    final client = ref.read(appApiClientProvider);
    final cache = ref.read(localCacheRepositoryProvider);
    final prefs = await SharedPreferences.getInstance();
    
    final lastSync = prefs.getString(_lastSyncKey);
    final storeId = session.user.primaryStoreId;
    if (storeId == null) return;

    try {
      // 1. Fetch delta data from server
      final response = await client.getMap(
        '/sync/data?storeId=$storeId${lastSync != null ? '&lastSyncTimestamp=$lastSync' : ''}',
        bearerToken: session.accessToken,
      );

      final serverTimestamp = response['serverTimestamp'] as String;
      final productsData = response['products'] as List?;
      final clientsData = response['clients'] as List?;

      // 2. Update local Products
      if (productsData != null) {
        final products = productsData.map((p) => CatalogProduct.fromJson(Map<String, dynamic>.from(p))).toList();
        await cache.upsertProducts(products);
      }

      // 3. Update local Clients
      if (clientsData != null) {
        final clients = clientsData.map((c) => ClientSummary.fromJson(Map<String, dynamic>.from(c))).toList();
        await cache.upsertClients(storeId, clients);
      }

      // 4. Save new timestamp
      await prefs.setString(_lastSyncKey, serverTimestamp);
      
    } catch (e) {
      // Log or handle error appropriately for background sync
      // ignore: avoid_print
      print('DeltaSync Error: $e');
    }
  }
}

final deltaSyncServiceProvider = Provider<DeltaSyncService>((ref) {
  return DeltaSyncService(ref);
});
