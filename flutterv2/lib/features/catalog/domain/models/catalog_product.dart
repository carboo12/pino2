import '../../../../core/utils/stock_display.dart';

class CatalogProduct {
  const CatalogProduct({
    required this.id,
    required this.storeId,
    required this.description,
    required this.salePrice,
    required this.currentStock,
    required this.unitsPerBulk,
    required this.stockBulks,
    required this.stockUnits,
    this.handlesBulk = false,
    this.barcode,
    this.alternateBarcodes = const [],
    this.brand,
    this.department,
    this.subDepartment,
    this.minStock = 0,
    this.wholesalePrice = 0,
    this.price1 = 0,
    this.price2 = 0,
    this.price3 = 0,
    this.price4 = 0,
    this.price5 = 0,
    this.bulkPrice1 = 0,
    this.bulkPrice2 = 0,
    this.bulkPrice3 = 0,
    this.bulkPrice4 = 0,
    this.bulkPrice5 = 0,
  });

  final String id;
  final String storeId;
  final String description;
  final double salePrice;
  final int currentStock;
  final int unitsPerBulk;
  final int stockBulks;
  final int stockUnits;
  final bool handlesBulk;
  final String? barcode;
  final List<String> alternateBarcodes;
  final String? brand;
  final String? department;
  final String? subDepartment;
  final int minStock;
  final double wholesalePrice;
  final double price1;
  final double price2;
  final double price3;
  final double price4;
  final double price5;
  final double bulkPrice1;
  final double bulkPrice2;
  final double bulkPrice3;
  final double bulkPrice4;
  final double bulkPrice5;

  bool get isLowStock => currentStock <= minStock;

  String get stockLabel => calculateStockDisplay(
        totalUnits: currentStock,
        handlesBulk: handlesBulk || unitsPerBulk > 1,
        unitsPerBulk: unitsPerBulk,
      ).formatted;

  double priceForLevel(int level) {
    final prices = [price1, price2, price3, price4, price5];
    if (level >= 1 && level <= 5) {
      final p = prices[level - 1];
      return p > 0 ? p : salePrice;
    }
    return salePrice;
  }

  factory CatalogProduct.fromJson(Map<String, dynamic> json) {
    final rawSp = json['salePrice'] ?? json['sale_price'] ?? 0;
    final sp = double.tryParse('$rawSp') ?? 0;

    final rawCs = json['currentStock'] ?? json['current_stock'] ?? json['stock'] ?? 0;
    final cs = int.tryParse('$rawCs') ?? 0;

    final upb = int.tryParse('${json['unitsPerBulk'] ?? json['units_per_bulk'] ?? 1}') ?? 1;

    final rawSb = json['stockBulks'] ?? json['stock_bulks'] ?? (upb > 1 ? cs ~/ upb : 0);
    final sb = int.tryParse('$rawSb') ?? 0;

    final rawSu = json['stockUnits'] ?? json['stock_units'] ?? (upb > 1 ? cs % upb : cs);
    final su = int.tryParse('$rawSu') ?? 0;

    final desc = json['description']?.toString() ?? json['name']?.toString() ?? 'Producto';

    return CatalogProduct(
      id: json['id']?.toString() ?? '',
      storeId: json['storeId']?.toString() ?? json['store_id']?.toString() ?? '',
      description: desc,
      salePrice: sp,
      currentStock: cs,
      unitsPerBulk: upb,
      handlesBulk: json['handlesBulk'] == true || json['handles_bulk'] == true || upb > 1,
      stockBulks: sb,
      stockUnits: su,
      barcode: json['barcode']?.toString(),
      alternateBarcodes: (json['alternateBarcodes'] as List<dynamic>?)
              ?.map((e) => e['barcode']?.toString())
              .whereType<String>()
              .toList() ??
          [],
      brand: json['brand']?.toString(),
      department: json['departmentName']?.toString() ?? json['department_id']?.toString() ?? json['department']?.toString(),
      subDepartment: json['subDepartment']?.toString() ?? json['sub_department']?.toString(),
      minStock: int.tryParse('${json['minStock'] ?? json['min_stock'] ?? 0}') ?? 0,
      wholesalePrice: double.tryParse('${json['wholesalePrice'] ?? json['wholesale_price'] ?? 0}') ?? 0,
      price1: double.tryParse('${json['price1'] ?? sp}') ?? sp,
      price2: double.tryParse('${json['price2'] ?? sp}') ?? sp,
      price3: double.tryParse('${json['price3'] ?? sp}') ?? sp,
      price4: double.tryParse('${json['price4'] ?? sp}') ?? sp,
      price5: double.tryParse('${json['price5'] ?? sp}') ?? sp,
      bulkPrice1: double.tryParse('${json['bulkPrice1'] ?? json['bulk_price_1'] ?? 0}') ?? 0,
      bulkPrice2: double.tryParse('${json['bulkPrice2'] ?? json['bulk_price_2'] ?? 0}') ?? 0,
      bulkPrice3: double.tryParse('${json['bulkPrice3'] ?? json['bulk_price_3'] ?? 0}') ?? 0,
      bulkPrice4: double.tryParse('${json['bulkPrice4'] ?? json['bulk_price_4'] ?? 0}') ?? 0,
      bulkPrice5: double.tryParse('${json['bulkPrice5'] ?? json['bulk_price_5'] ?? 0}') ?? 0,
    );
  }
}
