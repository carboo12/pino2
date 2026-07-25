import '../../../../core/utils/stock_display.dart';

class DeliveryItemSummary {
  const DeliveryItemSummary({
    required this.id,
    required this.description,
    required this.quantity,
    required this.salePrice,
    this.unitsPerBulk = 1,
    this.handlesBulk = false,
  });

  final String id;
  final String description;
  final int quantity;
  final double salePrice;
  final int unitsPerBulk;
  final bool handlesBulk;

  String get displayLabel => calculateStockDisplay(
        totalUnits: quantity,
        handlesBulk: handlesBulk || unitsPerBulk > 1,
        unitsPerBulk: unitsPerBulk,
      ).formatted;

  factory DeliveryItemSummary.fromJson(Map<String, dynamic> json) {
    final upb = int.tryParse('${json['unitsPerBulk'] ?? json['units_per_bulk'] ?? 1}') ?? 1;
    return DeliveryItemSummary(
      id: json['id']?.toString() ?? '',
      description: json['description']?.toString() ?? 'Producto',
      quantity: int.tryParse('${json['quantity'] ?? 0}') ?? 0,
      salePrice: double.tryParse('${json['salePrice'] ?? 0}') ?? 0,
      unitsPerBulk: upb,
      handlesBulk: json['handlesBulk'] == true || json['handles_bulk'] == true || upb > 1,
    );
  }
}

class DeliverySummary {
  const DeliverySummary({
    required this.id,
    required this.storeId,
    required this.orderId,
    required this.status,
    required this.items,
    required this.total,
    this.clientId,
    this.clientName,
    this.clientAddress,
    this.ruteroId,
    this.paymentType,
    this.salesManagerName,
    this.notes,
  });

  final String id;
  final String storeId;
  final String orderId;
  final String status;
  final List<DeliveryItemSummary> items;
  final double total;
  final String? clientId;
  final String? clientName;
  final String? clientAddress;
  final String? ruteroId;
  final String? paymentType;
  final String? salesManagerName;
  final String? notes;

  int get totalItems => items.fold(0, (sum, item) => sum + item.quantity);

  factory DeliverySummary.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'];
    final items = rawItems is List
        ? rawItems
              .map(
                (item) => DeliveryItemSummary.fromJson(
                  Map<String, dynamic>.from(item as Map),
                ),
              )
              .toList()
        : <DeliveryItemSummary>[];

    return DeliverySummary(
      id: json['id']?.toString() ?? '',
      storeId: json['storeId']?.toString() ?? '',
      orderId: json['orderId']?.toString() ?? '',
      status: json['status']?.toString() ?? 'Pendiente',
      items: items,
      total: double.tryParse('${json['total'] ?? 0}') ?? 0,
      clientId: json['clientId']?.toString(),
      clientName: json['clientName']?.toString(),
      clientAddress: json['clientAddress']?.toString(),
      ruteroId: json['ruteroId']?.toString(),
      paymentType: json['paymentType']?.toString(),
      salesManagerName: json['salesManagerName']?.toString(),
      notes: json['notes']?.toString(),
    );
  }
}
