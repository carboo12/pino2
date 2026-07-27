class ExpenseModel {
  const ExpenseModel({
    required this.id,
    required this.storeId,
    required this.category,
    required this.amount,
    this.description,
    this.receiptNumber,
    this.createdAt,
  });

  final String id;
  final String storeId;
  final String category;
  final double amount;
  final String? description;
  final String? receiptNumber;
  final DateTime? createdAt;

  factory ExpenseModel.fromJson(Map<String, dynamic> json) {
    return ExpenseModel(
      id: json['id']?.toString() ?? '',
      storeId: json['storeId']?.toString() ?? '',
      category: json['category']?.toString() ?? 'General',
      amount: double.tryParse('${json['amount'] ?? 0}') ?? 0.0,
      description: json['description']?.toString(),
      receiptNumber: json['receiptNumber']?.toString(),
      createdAt: DateTime.tryParse('${json['createdAt'] ?? ''}'),
    );
  }
}
