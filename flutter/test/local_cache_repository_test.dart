import 'dart:convert';
 import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pino_mobile/core/database/app_database.dart';
import 'package:pino_mobile/core/database/local_cache_repository.dart';
import 'package:pino_mobile/features/collections/domain/models/receivable_account.dart';
import 'package:pino_mobile/features/deliveries/domain/models/delivery_summary.dart';
import 'package:pino_mobile/features/deliveries/domain/models/route_summary.dart';

const _sqliteHostSkipReason =
    'SQLite native assets need a newer GLIBC than this Ubuntu 20.04 VPS. '
    'Run these tests on a newer host or CI image.';

void main() {
  late AppDatabase database;
  late LocalCacheRepository repository;

  setUp(() {
    database = AppDatabase.forTesting(NativeDatabase.memory());
    repository = LocalCacheRepository(database);
  });

  tearDown(() async {
    await database.close();
  });

  test(
    'collections summary cache keeps global and rutero scopes separate',
    () async {
    await repository.cacheCollectionsSummary(
      storeId: 'store-1',
      summary: const CollectionsSummary(
        totalCount: 12,
        totalAmount: 840.5,
        cashTotal: 500,
        otherTotal: 340.5,
      ),
    );

    await repository.cacheCollectionsSummary(
      storeId: 'store-1',
      ruteroId: 'rut-9',
      summary: const CollectionsSummary(
        totalCount: 3,
        totalAmount: 120.75,
        cashTotal: 120.75,
        otherTotal: 0,
      ),
    );

    final global = await repository.getCollectionsSummary(storeId: 'store-1');
    final rutero = await repository.getCollectionsSummary(
      storeId: 'store-1',
      ruteroId: 'rut-9',
    );

    expect(global, isNotNull);
    expect(global!.totalCount, 12);
    expect(global.totalAmount, 840.5);

    expect(rutero, isNotNull);
    expect(rutero!.totalCount, 3);
    expect(rutero.cashTotal, 120.75);
    },
    skip: _sqliteHostSkipReason,
  );

  test(
    'route and delivery cache roundtrip preserves key fields',
    () async {
    await repository.cacheRoutes(
      storeId: 'store-1',
      routes: const [
        RouteSummary(
          id: 'route-1',
          storeId: 'store-1',
          vendorId: 'vendor-1',
          clientIds: ['c-1', 'c-2'],
          routeDate: null,
          status: 'Asignada',
          notes: 'Mañana zona norte',
        ),
      ],
    );

    await repository.cacheDeliveries(
      storeId: 'store-1',
      deliveries: const [
        DeliverySummary(
          id: 'delivery-1',
          storeId: 'store-1',
          orderId: 'order-1',
          status: 'Pendiente',
          items: [
            DeliveryItemSummary(
              id: 'item-1',
              description: 'Aceite',
              quantity: 2,
              salePrice: 55,
            ),
          ],
          total: 110,
          clientId: 'c-1',
          clientName: 'Pulpería Maritza',
          clientAddress: 'Barrio central',
          ruteroId: 'rut-1',
          paymentType: 'CREDITO',
          salesManagerName: 'Carlos',
          notes: 'Cobrar al entregar',
        ),
      ],
    );

    final routes = await repository.getRoutes('store-1');
    final deliveries = await repository.getDeliveries('store-1');

    expect(routes, hasLength(1));
    expect(routes.first.vendorId, 'vendor-1');
    expect(routes.first.clientIds, ['c-1', 'c-2']);

    expect(deliveries, hasLength(1));
    expect(deliveries.first.ruteroId, 'rut-1');
    expect(deliveries.first.items, hasLength(1));
    expect(deliveries.first.items.first.description, 'Aceite');
    expect(deliveries.first.totalItems, 2);
    },
    skip: _sqliteHostSkipReason,
  );
  
  group('Sync Queue Tests', () {
    test('enqueues cash shift operation correctly', () async {
      final payload = {
        'storeId': 'store-1',
        'startingCash': 500.0,
        'openingDenominations': {'100': 5}
      };
      
      final id = await repository.enqueueSyncAction(
        method: 'POST',
        endpoint: '/api/cash-shifts',
        storeId: 'store-1',
        operationType: 'CASH_SHIFT_OPEN',
        payload: payload,
      );
      
      final pending = await repository.getPendingSyncEntries();
      
      expect(id, isPositive);
      expect(pending, hasLength(1));
      expect(pending.first.operationType, 'CASH_SHIFT_OPEN');
      expect(jsonDecode(pending.first.payloadJson!), payload);
    });

    test('enqueues order operation correctly', () async {
      final payload = {
        'clientId': 'client-1',
        'total': 1250.0,
        'items': [
          {'productId': 'p-1', 'quantity': 10, 'price': 125.0}
        ]
      };
      
      await repository.enqueueSyncAction(
        method: 'POST',
        endpoint: '/api/orders',
        storeId: 'store-1',
        operationType: 'ORDER_CREATE',
        payload: payload,
      );
      
      final pending = await repository.getPendingSyncEntries();
      
      expect(pending, hasLength(1));
      expect(pending.first.endpoint, '/api/orders');
      expect(pending.first.operationType, 'ORDER_CREATE');
    });
  }, skip: _sqliteHostSkipReason);
}
