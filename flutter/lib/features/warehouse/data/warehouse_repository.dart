import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/models/warehouse_models.dart';

class WarehouseSnapshot {
  const WarehouseSnapshot({
    required this.ordersByStatus,
    required this.assignees,
  });

  final Map<String, List<WarehouseOrder>> ordersByStatus;
  final List<WarehouseAssignee> assignees;
}

class WarehouseRepository {
  const WarehouseRepository(this._client);

  final AppApiClient _client;

  static const statuses = <String>[
    'RECIBIDO',
    'EN_PREPARACION',
    'ALISTADO',
    'CARGADO_CAMION',
  ];

  Future<WarehouseSnapshot> getSnapshot({
    required String storeId,
    required String accessToken,
  }) async {
    final ordersResults = await Future.wait(
      statuses.map(
        (status) => _client.getList(
          '/orders',
          bearerToken: accessToken,
          queryParameters: {'storeId': storeId, 'status': status},
        ),
      ),
    );

    final users = await _client.getList(
      '/users',
      bearerToken: accessToken,
      queryParameters: {'storeId': storeId},
    );

    final assignees = users
        .map(
          (item) => WarehouseAssignee.fromJson(
            Map<String, dynamic>.from(item as Map),
          ),
        )
        .where(
          (user) => [
            'rutero',
            'vendor',
            'vendedor ambulante',
            'sales manager',
            'gestor de ventas',
          ].contains(user.role.toLowerCase()),
        )
        .toList();

    final map = <String, List<WarehouseOrder>>{};
    for (var i = 0; i < statuses.length; i++) {
      map[statuses[i]] = ordersResults[i]
          .map(
            (item) => WarehouseOrder.fromJson(
              Map<String, dynamic>.from(item as Map),
            ),
          )
          .toList();
    }

    return WarehouseSnapshot(ordersByStatus: map, assignees: assignees);
  }

  Future<WarehouseOrder> getOrderDetail({
    required String orderId,
    required String accessToken,
  }) async {
    final response = await _client.getMap(
      '/orders/$orderId',
      bearerToken: accessToken,
    );
    return WarehouseOrder.fromJson(response);
  }

  Future<Map<String, dynamic>> updateStatus({
    required String orderId,
    required String accessToken,
    required String status,
    String? vendorId,
    String? notes,
  }) {
    return _client.patchMap(
      '/orders/$orderId/status',
      bearerToken: accessToken,
      data: {
        'status': status,
        if (vendorId != null && vendorId.isNotEmpty) 'vendorId': vendorId,
        'notes': ?notes,
      },
    );
  }

  Future<List<CargaCamion>> getCargasCamion({
    required String storeId,
    required String accessToken,
    String? fecha,
  }) async {
    final list = await _client.getList(
      '/cargas-camion',
      bearerToken: accessToken,
      queryParameters: {
        'storeId': storeId,
        'fecha': ?fecha,
      },
    );
    return list.map((e) => CargaCamion.fromJson(Map<String, dynamic>.from(e))).toList();
  }

  Future<void> despacharCarga({
    required String cargaId,
    required String accessToken,
  }) async {
    await _client.putMap(
      '/cargas-camion/$cargaId/salida',
      bearerToken: accessToken,
      data: {},
    );
  }
}

final warehouseRepositoryProvider = Provider<WarehouseRepository>((ref) {
  return WarehouseRepository(ref.read(appApiClientProvider));
});
