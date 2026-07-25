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
    this.type, // VENTA_ESTANDAR, ABASTECIMIENTO_INTERNO, etc.
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
              .map(
                (item) => WarehouseOrderItem.fromJson(
                  Map<String, dynamic>.from(item as Map),
                ),
              )
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

class CargaCamion {
  const CargaCamion({
    required this.id,
    required this.storeId,
    required this.vendorId,
    required this.vendorName,
    required this.plate,
    required this.status,
    required this.items,
    required this.orderCount,
    required this.clientCount,
  });

  final String id;
  final String storeId;
  final String vendorId;
  final String vendorName;
  final String plate;
  final String status; // PENDIENTE, EN_RUTA, LIQUIDADO
  final List<CargaCamionItem> items;
  final int orderCount;
  final int clientCount;

  factory CargaCamion.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'];
    final itemsList = rawItems is List
        ? rawItems.map((e) => CargaCamionItem.fromJson(Map<String, dynamic>.from(e))).toList()
        : <CargaCamionItem>[];

    return CargaCamion(
      id: json['id']?.toString() ?? '',
      storeId: json['storeId']?.toString() ?? '',
      vendorId: json['vendorId']?.toString() ?? '',
      vendorName: json['vendorName']?.toString() ?? 'Rutero',
      plate: json['plate']?.toString() ?? '-',
      status: json['status']?.toString() ?? 'PENDIENTE',
      items: itemsList,
      orderCount: int.tryParse('${json['orderCount'] ?? 0}') ?? 0,
      clientCount: int.tryParse('${json['clientCount'] ?? 0}') ?? 0,
    );
  }
}

class CargaCamionItem {
  const CargaCamionItem({
    required this.productId,
    required this.productName,
    required this.totalBulks,
    required this.totalUnits,
    required this.presentation,
  });

  final String productId;
  final String productName;
  final int totalBulks;
  final int totalUnits;
  final String presentation;

  factory CargaCamionItem.fromJson(Map<String, dynamic> json) {
    return CargaCamionItem(
      productId: json['productId']?.toString() ?? '',
      productName: json['productName']?.toString() ?? 'Producto',
      totalBulks: int.tryParse('${json['totalBulks'] ?? 0}') ?? 0,
      totalUnits: int.tryParse('${json['totalUnits'] ?? 0}') ?? 0,
      presentation: json['presentation']?.toString() ?? 'BULTO',
    );
  }
}

class WarehouseAssignee {
  const WarehouseAssignee({
    required this.id,
    required this.name,
    required this.role,
  });

  final String id;
  final String name;
  final String role;

  factory WarehouseAssignee.fromJson(Map<String, dynamic> json) {
    return WarehouseAssignee(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Usuario',
      role: json['role']?.toString() ?? '',
    );
  }
}
