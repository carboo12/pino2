import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/database/local_cache_repository.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/connectivity_service.dart';

class DailyClosingRepository {
  const DailyClosingRepository({
    required AppApiClient client,
    required LocalCacheRepository localCache,
    required ConnectivityService connectivity,
  })  : _client = client,
        _localCache = localCache,
        _connectivity = connectivity;

  final AppApiClient _client;
  final LocalCacheRepository _localCache;
  final ConnectivityService _connectivity;

  /// Fetch deliveries assigned to this rutero in this store.
  Future<List<Map<String, dynamic>>> fetchDeliveries({
    required String storeId,
    required String ruteroId,
    required String accessToken,
  }) async {
    final data = await _client.getList(
      '/pending-deliveries',
      queryParameters: {'storeId': storeId, 'ruteroId': ruteroId},
      bearerToken: accessToken,
    );
    return data.cast<Map<String, dynamic>>();
  }

  /// Fetch returns for today.
  Future<List<Map<String, dynamic>>> fetchReturns({
    required String storeId,
    required String ruteroId,
    required String date,
    required String accessToken,
  }) async {
    try {
      final data = await _client.getList(
        '/returns',
        queryParameters: {
          'storeId': storeId,
          'ruteroId': ruteroId,
          'fromDate': date,
          'toDate': date,
        },
        bearerToken: accessToken,
      );
      return data.cast<Map<String, dynamic>>();
    } on ApiFailure {
      return [];
    }
  }

  /// Fetch collections (accounts receivable).
  Future<List<Map<String, dynamic>>> fetchCollections({
    required String storeId,
    required String accessToken,
  }) async {
    try {
      final data = await _client.getList(
        '/accounts-receivable',
        queryParameters: {'storeId': storeId},
        bearerToken: accessToken,
      );
      return data.cast<Map<String, dynamic>>();
    } on ApiFailure {
      return [];
    }
  }

  /// Check if a closing already exists for this rutero today.
  Future<bool> hasClosingForToday({
    required String storeId,
    required String ruteroId,
    required String date,
    required String accessToken,
  }) async {
    try {
      final data = await _client.getList(
        '/daily-closings',
        queryParameters: {
          'storeId': storeId,
          'ruteroId': ruteroId,
          'date': date,
        },
        bearerToken: accessToken,
      );
      return data.isNotEmpty;
    } on ApiFailure {
      return false;
    }
  }

  Future<Map<String, dynamic>> submitClosing({
    required String storeId,
    required String ruteroId,
    required double totalSales,
    required double totalCollections,
    required double totalReturns,
    required double cashTotal,
    required String closingDate,
    required String notes,
    required String accessToken,
    Map<String, dynamic>? denominations,
  }) async {
    final payload = <String, dynamic>{
      'storeId': storeId,
      'ruteroId': ruteroId,
      'totalSales': totalSales,
      'totalCollections': totalCollections,
      'totalReturns': totalReturns,
      'cashTotal': cashTotal,
      'closingDate': closingDate,
      'notes': notes,
    };
    if (denominations != null) {
      payload['denominations'] = denominations;
    }

    final online = await _connectivity.isOnline();
    if (online) {
      try {
        return await _client.postMap(
          '/daily-closings',
          data: payload,
          bearerToken: accessToken,
        );
      } on ApiFailure catch (e) {
        if (e.isConnectivityIssue) {
          await _enqueueOffline(payload);
          return {'queuedOffline': true};
        }
        rethrow;
      }
    } else {
      await _enqueueOffline(payload);
      return {'queuedOffline': true};
    }
  }

  Future<void> _enqueueOffline(Map<String, dynamic> payload) async {
    await _localCache.enqueueSyncAction(
      method: 'POST',
      endpoint: '/daily-closings',
      operationType: 'Cierre de caja',
      payload: payload,
    );
  }
}

final dailyClosingRepositoryProvider = Provider<DailyClosingRepository>((ref) {
  return DailyClosingRepository(
    client: ref.read(appApiClientProvider),
    localCache: ref.read(localCacheRepositoryProvider),
    connectivity: ref.read(connectivityServiceProvider),
  );
});
