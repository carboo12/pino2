import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import '../../../core/network/api_client.dart';
import '../domain/models/receivable_account.dart';

class CollectionsRepository {
  Future<List<ReceivableAccount>> getPendingAccounts({
    required String storeId,
  }) async {
    try {
      final response = await ApiClient.dio.get('/accounts-receivable', queryParameters: {
        'storeId': storeId,
        'pending': 'true',
      }).catchError((_) => ApiClient.dio.get('/accounts-receivable'));

      final rawData = response.data;
      final list = rawData is List ? rawData : (rawData['data'] is List ? rawData['data'] : []);
      return (list as List)
          .map((item) => ReceivableAccount.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
    } catch (e) {
      debugPrint('[CollectionsRepository] Error al obtener cuentas por cobrar: $e');
      return [];
    }
  }

  Future<CollectionsSummary> getSummary({
    required String storeId,
    String? ruteroId,
  }) async {
    try {
      final response = await ApiClient.dio.get('/collections/summary', queryParameters: {
        'storeId': storeId,
        if (ruteroId != null && ruteroId.isNotEmpty) 'ruteroId': ruteroId,
      });
      final rawData = response.data;
      if (rawData is Map<String, dynamic>) {
        return CollectionsSummary.fromJson(rawData);
      }
      return const CollectionsSummary(totalCount: 0, totalAmount: 0, cashTotal: 0, otherTotal: 0);
    } catch (e) {
      debugPrint('[CollectionsRepository] Error resumen cobros: $e');
      return const CollectionsSummary(totalCount: 0, totalAmount: 0, cashTotal: 0, otherTotal: 0);
    }
  }

  Future<Map<String, dynamic>> registerPayment({
    required String accountId,
    required String storeId,
    required double amount,
    required String paymentMethod,
    required String collectorId,
    String? collectorName,
    String? notes,
  }) async {
    final payload = {
      'amount': amount,
      'paymentMethod': paymentMethod,
      'vendorId': collectorId,
      'externalId': const Uuid().v4(),
      if (collectorName?.trim().isNotEmpty ?? false) 'vendorName': collectorName!.trim(),
      if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
    };

    try {
      final response = await ApiClient.dio.post('/accounts-receivable/$accountId/payments', data: payload);
      final raw = response.data;
      return raw is Map<String, dynamic> ? raw : {'success': true};
    } catch (e) {
      debugPrint('[CollectionsRepository] Error registrar pago: $e');
      rethrow;
    }
  }
}
