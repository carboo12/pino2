class SaleLookupItem {
  const SaleLookupItem({
    required this.id,
    required this.productId,
    required this.description,
    required this.quantity,
    required this.salePrice,
    this.unitsPerBulk = 1,
    this.handlesBulk = false,
  });

  final String id;
  final String productId;
  final String description;
  final int quantity;
  final double salePrice;
  final int unitsPerBulk;
  final bool handlesBulk;

  factory SaleLookupItem.fromJson(Map<String, dynamic> json) {
    final upb = int.tryParse('${json['unitsPerBulk'] ?? json['units_per_bulk'] ?? 1}') ?? 1;
    return SaleLookupItem(
      id: json['saleItemId']?.toString() ?? json['id']?.toString() ?? '',
      productId: json['productId']?.toString() ?? json['id']?.toString() ?? '',
      description: json['description']?.toString() ?? 'Producto',
      quantity: int.tryParse('${json['quantity'] ?? 0}') ?? 0,
      salePrice: double.tryParse('${json['salePrice'] ?? json['unitPrice'] ?? 0}') ?? 0,
      unitsPerBulk: upb,
      handlesBulk: json['handlesBulk'] == true || json['handles_bulk'] == true || upb > 1,
    );
  }
}

class SaleLookup {
  const SaleLookup({
    required this.id,
    required this.ticketNumber,
    required this.total,
    required this.items,
  });

  final String id;
  final String ticketNumber;
  final double total;
  final List<SaleLookupItem> items;

  factory SaleLookup.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'];
    final items = rawItems is List
        ? rawItems
            .map((item) => SaleLookupItem.fromJson(Map<String, dynamic>.from(item as Map)))
            .toList()
        : <SaleLookupItem>[];

    return SaleLookup(
      id: json['saleId']?.toString() ?? json['id']?.toString() ?? '',
      ticketNumber: json['ticketNumber']?.toString() ?? '',
      total: double.tryParse('${json['total'] ?? 0}') ?? 0,
      items: items,
    );
  }
}
