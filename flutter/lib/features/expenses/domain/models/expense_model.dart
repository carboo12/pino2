class ExpenseModel {
  const ExpenseModel({
    required this.id,
    required this.category,
    required this.amount,
    required this.description,
    this.paymentMethod = 'CASH',
    this.registeredByName,
    this.receiptNumber,
    this.createdAt,
  });

  final String id;
  final String category;
  final double amount;
  final String description;
  final String paymentMethod;
  final String? registeredByName;
  final String? receiptNumber;
  final DateTime? createdAt;

  factory ExpenseModel.fromJson(Map<String, dynamic> json) {
    return ExpenseModel(
      id: json['id']?.toString() ?? '',
      category: json['category']?.toString() ?? 'CAJA_CHICA',
      amount: double.tryParse('${json['amount'] ?? 0}') ?? 0.0,
      description: json['description']?.toString() ?? '',
      paymentMethod: json['payment_method']?.toString() ?? 'CASH',
      registeredByName: json['registered_by_name']?.toString(),
      receiptNumber: json['receipt_number']?.toString(),
      createdAt: json['created_at'] != null
          ? DateTime.tryParse('${json['created_at']}')
          : null,
    );
  }
}
