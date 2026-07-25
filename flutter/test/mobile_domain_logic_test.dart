import 'package:flutter_test/flutter_test.dart';
import 'package:pino_mobile/core/realtime/realtime_event.dart';
import 'package:pino_mobile/core/utils/role_utils.dart';
import 'package:pino_mobile/core/utils/stock_display.dart';
import 'package:pino_mobile/features/warehouse/domain/models/warehouse_models.dart';

void main() {
  group('stock_display utility', () {
    test('calculateStockDisplay formats bulks and units correctly', () {
      expect(
        calculateStockDisplay(totalUnits: 53, handlesBulk: true, unitsPerBulk: 10).formatted,
        '5 bultos + 3 unidades',
      );
      expect(
        calculateStockDisplay(totalUnits: 50, handlesBulk: true, unitsPerBulk: 10).formatted,
        '5 bultos',
      );
      expect(
        calculateStockDisplay(totalUnits: 53, handlesBulk: false, unitsPerBulk: 10).formatted,
        '53 unidades',
      );
    });

    test('bulkUnitsToTotal converts bulks + units into total', () {
      expect(bulkUnitsToTotal(bulks: 2, units: 3, unitsPerBulk: 10, handlesBulk: true), 23);
    });

    test('splitIntoBulkUnits splits total units correctly', () {
      final res = splitIntoBulkUnits(totalUnits: 53, unitsPerBulk: 10);
      expect(res.bulks, 5);
      expect(res.units, 3);
    });
  });
  group('role normalization', () {
    test('maps Spanish operational roles correctly', () {
      expect(normalizeRole('Bodeguero'), AppRole.inventory);
      expect(normalizeRole('Gestor de Ventas'), AppRole.salesManager);
      expect(normalizeRole('Vendedor Ambulante'), AppRole.vendor);
      expect(normalizeRole('Rutero'), AppRole.rutero);
    });
  });

  group('warehouse item picking math', () {
    test('converts bulks into total units and split picks', () {
      const item = WarehouseOrderItem(
        id: '1',
        productId: 'p1',
        productName: 'Arroz',
        quantity: 3,
        unitsPerBulk: 6,
        presentation: 'BULTO',
      );

      expect(item.totalUnits, 18);
      expect(item.pickingBulks, 3);
      expect(item.pickingUnits, 0);
    });

    test('keeps loose units without inventing bulks', () {
      const item = WarehouseOrderItem(
        id: '2',
        productId: 'p2',
        productName: 'Refresco',
        quantity: 15,
        unitsPerBulk: 6,
        presentation: 'UNIT',
      );

      expect(item.totalUnits, 15);
      expect(item.pickingBulks, 2);
      expect(item.pickingUnits, 3);
    });
  });

  group('realtime event mapping', () {
    test('maps sync socket payload into inventory transfer event', () {
      final event = RealtimeEvent.fromSocket('sync_update', {
        'type': 'INVENTORY_TRANSFER',
        'storeId': 'store-1',
        'payload': {'orderId': 'o1', 'vendorId': 'v1'},
      });

      expect(event.type, RealtimeEventType.inventoryTransfer);
      expect(event.label, 'INVENTORY_TRANSFER');
      expect(event.storeId, 'store-1');
      expect(event.payload['orderId'], 'o1');
    });
  });
}
