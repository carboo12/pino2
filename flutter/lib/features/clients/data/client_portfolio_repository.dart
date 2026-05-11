import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/database/local_cache_repository.dart';
import '../../../core/network/api_client.dart';
import '../domain/models/client_summary.dart';

class ClientPortfolioRepository {
  const ClientPortfolioRepository(this._client, this._localCache);

  final AppApiClient _client;
  final LocalCacheRepository _localCache;

  Future<List<ClientSummary>> getClients({
    required String storeId,
    required String accessToken,
  }) async {
    try {
      final response = await _client.getList(
        '/clients',
        bearerToken: accessToken,
        queryParameters: {'storeId': storeId},
      );

      final clients = response
          .map(
            (item) => ClientSummary.fromJson(
              Map<String, dynamic>.from(item as Map),
            ),
          )
          .toList();

      await _localCache.cacheClients(storeId: storeId, clients: clients);
      return clients;
    } catch (error) {
      final cachedClients = await _localCache.getClients(storeId);
      if (cachedClients.isNotEmpty) {
        return cachedClients;
      }
      rethrow;
    }
  }

  Future<void> updateClient({
    required String clientId,
    required String accessToken,
    required Map<String, dynamic> data,
  }) async {
    await _client.patchMap(
      '/clients/$clientId',
      data: data,
      bearerToken: accessToken,
    );
  }
}

final clientPortfolioRepositoryProvider =
    Provider<ClientPortfolioRepository>((ref) {
      return ClientPortfolioRepository(
        ref.read(appApiClientProvider),
        ref.read(localCacheRepositoryProvider),
      );
    });
