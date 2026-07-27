import 'package:flutter/foundation.dart';
import '../../../core/network/api_client.dart';
import '../domain/models/delivery_summary.dart';
import '../domain/models/route_summary.dart';

class RouteBoardSnapshot {
  const RouteBoardSnapshot({
    required this.routes,
    required this.deliveries,
  });

  final List<RouteSummary> routes;
  final List<DeliverySummary> deliveries;
}

class RouteBoardRepository {
  Future<RouteBoardSnapshot> getSnapshot({
    required String storeId,
    String? vendorId,
    String? ruteroId,
  }) async {
    try {
      final results = await Future.wait([
        ApiClient.dio.get('/routes', queryParameters: {
          'storeId': storeId,
          if (vendorId != null && vendorId.isNotEmpty) 'vendorId': vendorId,
        }).catchError((_) => ApiClient.dio.get('/routes')),
        ApiClient.dio.get('/pending-deliveries', queryParameters: {
          'storeId': storeId,
          if (ruteroId != null && ruteroId.isNotEmpty) 'ruteroId': ruteroId,
        }).catchError((_) => ApiClient.dio.get('/pending-deliveries')),
      ]);

      final rawRoutes = results[0].data;
      final listRoutes = rawRoutes is List ? rawRoutes : (rawRoutes['data'] is List ? rawRoutes['data'] : []);
      final routes = (listRoutes as List)
          .map((item) => RouteSummary.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();

      final rawDeliveries = results[1].data;
      final listDeliveries = rawDeliveries is List ? rawDeliveries : (rawDeliveries['data'] is List ? rawDeliveries['data'] : []);
      final deliveries = (listDeliveries as List)
          .map((item) => DeliverySummary.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();

      return RouteBoardSnapshot(routes: routes, deliveries: deliveries);
    } catch (e) {
      debugPrint('[RouteBoardRepository] Error snapshot: $e');
      return const RouteBoardSnapshot(routes: [], deliveries: []);
    }
  }
}
