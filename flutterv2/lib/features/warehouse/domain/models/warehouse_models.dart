import '../../../../core/utils/stock_display.dart';

class WarehouseOrderItem {
  const WarehouseOrderItem({
    required this.id,
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.unitsPerBulk,
    required this.presentation,
    this.handlesBulk = false,
  });

  final String id;
  final String productId;
  final String productName;
  final int quantity;
  final int unitsPerBulk;
  final String presentation;
  final bool handlesBulk;

  int get totalUnits =>
      presentation.toUpperCase() == 'BULTO' ? quantity * unitsPerBulk : quantity;

  int get pickingBulks => splitIntoBulkUnits(
        totalUnits: totalUnits,
        unitsPerBulk: unitsPerBulk,
      ).bulks;

  int get pickingUnits => splitIntoBulkUnits(
        totalUnits: totalUnits,
        unitsPerBulk: unitsPerBulk,
      ).units;

  String get pickingLabel => calculateStockDisplay(
        totalUnits: totalUnits,
        handlesBulk: handlesBulk || unitsPerBulk > 1,
        unitsPerBulk: unitsPerBulk,
      ).formatted;

  factory WarehouseOrderItem.fromJson(Map<String, dynamic> json) {
    final upb = int.tryParse('${json['unitsPerBulk'] ?? json['units_per_bulk'] ?? 1}') ?? 1;
    return WarehouseOrderItem(
      id: json['id']?.toString() ?? '',
      productId: json['productId']?.toString() ?? '',
      productName: json['productName']?.toString() ?? 'Producto',
      quantity: int.tryParse('${json['quantity'] ?? 0}') ?? 0,
      unitsPerBulk: upb,
      handlesBulk: json['handlesBulk'] == true || json['handles_bulk'] == true || upb > 1,
      presentation: json['presentation']?.toString() ?? 'UNIT',
    );
  }
}

class WarehouseOrder {
  const WarehouseOrder({
    required this.id,
    required this.storeId,
    required this.status,
    required this.total,
    this.clientName,
    this.vendorId,
    this.salesManagerName,
    this.notes,
    this.createdAt,
    this.type,
    this.items = const [],
  });

  final String id;
  final String storeId;
  final String status;
  final double total;
  final String? clientName;
  final String? vendorId;
  final String? salesManagerName;
  final String? notes;
  final DateTime? createdAt;
  final String? type;
  final List<WarehouseOrderItem> items;

  factory WarehouseOrder.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'];
    final items = rawItems is List
        ? rawItems
            .map((item) => WarehouseOrderItem.fromJson(Map<String, dynamic>.from(item as Map)))
            .toList()
        : <WarehouseOrderItem>[];

    return WarehouseOrder(
      id: json['id']?.toString() ?? '',
      storeId: json['storeId']?.toString() ?? '',
      status: json['status']?.toString() ?? 'RECIBIDO',
      total: double.tryParse('${json['total'] ?? 0}') ?? 0,
      clientName: json['clientName']?.toString(),
      vendorId: json['vendorId']?.toString(),
      salesManagerName: json['salesManagerName']?.toString(),
      notes: json['notes']?.toString(),
      createdAt: DateTime.tryParse('${json['createdAt'] ?? ''}'),
      type: json['type']?.toString() ?? 'VENTA_ESTANDAR',
      items: items,
    );
  }
}
