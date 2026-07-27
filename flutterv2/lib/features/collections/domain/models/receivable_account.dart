class ReceivableAccount {
  const ReceivableAccount({
    required this.id,
    required this.storeId,
    required this.clientId,
    required this.clientName,
    required this.totalAmount,
    required this.remainingAmount,
    required this.pendingAmount,
    required this.status,
    this.orderId,
    this.description,
  });

  final String id;
  final String storeId;
  final String clientId;
  final String clientName;
  final double totalAmount;
  final double remainingAmount;
  final double pendingAmount;
  final String status;
  final String? orderId;
  final String? description;

  factory ReceivableAccount.fromJson(Map<String, dynamic> json) {
    return ReceivableAccount(
      id: json['id']?.toString() ?? '',
      storeId: json['storeId']?.toString() ?? '',
      clientId: json['clientId']?.toString() ?? '',
      clientName: json['clientName']?.toString() ?? 'Cliente',
      totalAmount: double.tryParse('${json['totalAmount'] ?? 0}') ?? 0,
      remainingAmount: double.tryParse('${json['remainingAmount'] ?? 0}') ?? 0,
      pendingAmount: double.tryParse('${json['pendingAmount'] ?? 0}') ?? 0,
      status: json['status']?.toString() ?? 'PENDING',
      orderId: json['orderId']?.toString(),
      description: json['description']?.toString(),
    );
  }
}

class CollectionsSummary {
  const CollectionsSummary({
    required this.totalCount,
    required this.totalAmount,
    required this.cashTotal,
    required this.otherTotal,
  });

  final int totalCount;
  final double totalAmount;
  final double cashTotal;
  final double otherTotal;

  factory CollectionsSummary.fromJson(Map<String, dynamic> json) {
    return CollectionsSummary(
      totalCount: int.tryParse('${json['totalCount'] ?? 0}') ?? 0,
      totalAmount: double.tryParse('${json['totalAmount'] ?? 0}') ?? 0,
      cashTotal: double.tryParse('${json['cashTotal'] ?? 0}') ?? 0,
      otherTotal: double.tryParse('${json['otherTotal'] ?? 0}') ?? 0,
    );
  }
}
