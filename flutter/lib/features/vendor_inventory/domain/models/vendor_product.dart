import '../../../../core/utils/stock_display.dart';

class VendorProduct {
  const VendorProduct({
    required this.productId,
    required this.description,
    required this.assignedQuantity,
    required this.soldQuantity,
    required this.returnedQuantity,
    required this.currentQuantity,
    this.salePrice = 0,
    this.brand,
    this.unitsPerBulk = 1,
    this.handlesBulk = false,
  });

  final String productId;
  final String description;
  final int assignedQuantity;
  final int soldQuantity;
  final int returnedQuantity;
  final int currentQuantity;
  final double salePrice;
  final String? brand;
  final int unitsPerBulk;
  final bool handlesBulk;

  String get stockLabel => calculateStockDisplay(
        totalUnits: currentQuantity,
        handlesBulk: handlesBulk || unitsPerBulk > 1,
        unitsPerBulk: unitsPerBulk,
      ).formatted;

  factory VendorProduct.fromJson(Map<String, dynamic> json) {
    final upb = int.tryParse('${json['unitsPerBulk'] ?? json['units_per_bulk'] ?? 1}') ?? 1;
    return VendorProduct(
      productId: json['productId']?.toString() ?? json['product_id']?.toString() ?? '',
      description: json['description']?.toString() ?? json['productName']?.toString() ?? 'Producto',
      assignedQuantity: int.tryParse('${json['assignedQuantity'] ?? json['assigned_quantity'] ?? 0}') ?? 0,
      soldQuantity: int.tryParse('${json['soldQuantity'] ?? json['sold_quantity'] ?? 0}') ?? 0,
      returnedQuantity: int.tryParse('${json['returnedQuantity'] ?? json['returned_quantity'] ?? 0}') ?? 0,
      currentQuantity: int.tryParse('${json['currentQuantity'] ?? json['current_quantity'] ?? 0}') ?? 0,
      salePrice: double.tryParse('${json['salePrice'] ?? json['sale_price'] ?? 0}') ?? 0,
      brand: json['brand']?.toString(),
      unitsPerBulk: upb,
      handlesBulk: json['handlesBulk'] == true || json['handles_bulk'] == true || upb > 1,
    );
  }
}
