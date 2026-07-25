class PromotionModel {
  const PromotionModel({
    required this.id,
    required this.name,
    this.description,
    required this.discountType,
    required this.discountValue,
    required this.status,
  });

  final String id;
  final String name;
  final String? description;
  final String discountType;
  final double discountValue;
  final String status;

  factory PromotionModel.fromJson(Map<String, dynamic> json) {
    return PromotionModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString(),
      discountType: json['discount_type']?.toString() ?? 'PERCENTAGE',
      discountValue: double.tryParse('${json['discount_value'] ?? 0}') ?? 0.0,
      status: json['status']?.toString() ?? 'ACTIVE',
    );
  }
}
