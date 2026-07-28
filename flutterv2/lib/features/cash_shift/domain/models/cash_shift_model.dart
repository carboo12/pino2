class CashOutflowModel {
  const CashOutflowModel({
    required this.id,
    required this.sessionId,
    required this.amount,
    required this.reason,
    this.receiptNumber,
    this.createdAt,
  });

  final String id;
  final String sessionId;
  final double amount;
  final String reason;
  final int? receiptNumber;
  final DateTime? createdAt;

  factory CashOutflowModel.fromJson(Map<String, dynamic> json) {
    return CashOutflowModel(
      id: json['id']?.toString() ?? '',
      sessionId: json['sessionId']?.toString() ?? json['session_id']?.toString() ?? '',
      amount: double.tryParse('${json['amount'] ?? 0}') ?? 0.0,
      reason: json['reason']?.toString() ?? '',
      receiptNumber: json['receiptNumber'] != null ? int.tryParse('${json['receiptNumber']}') : null,
      createdAt: DateTime.tryParse('${json['createdAt'] ?? ''}'),
    );
  }
}

class CashShiftModel {
  const CashShiftModel({
    required this.id,
    required this.storeId,
    this.storeName,
    required this.openedBy,
    this.openedByName,
    this.closedBy,
    this.closedByName,
    required this.openedAt,
    this.closedAt,
    required this.startingCash,
    this.actualCash,
    this.actualUSD,
    this.expectedCash,
    this.salesCash,
    this.salesCard,
    this.salesUSD,
    this.totalSales,
    this.totalReturns,
    this.difference,
    required this.status,
    this.outflows = const [],
  });

  final String id;
  final String storeId;
  final String? storeName;
  final String openedBy;
  final String? openedByName;
  final String? closedBy;
  final String? closedByName;
  final String openedAt;
  final String? closedAt;
  final double startingCash;
  final double? actualCash;
  final double? actualUSD;
  final double? expectedCash;
  final double? salesCash;
  final double? salesCard;
  final double? salesUSD;
  final double? totalSales;
  final double? totalReturns;
  final double? difference;
  final String status;
  final List<CashOutflowModel> outflows;

  bool get isOpen => status == 'OPEN';

  factory CashShiftModel.fromJson(Map<String, dynamic> json) {
    final outflowsRaw = json['outflows'] ?? json['cashOutflows'];
    List<CashOutflowModel> outflows = [];
    if (outflowsRaw is List) {
      outflows = outflowsRaw
          .map((e) => CashOutflowModel.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    }

    return CashShiftModel(
      id: json['id']?.toString() ?? '',
      storeId: json['storeId']?.toString() ?? json['store_id']?.toString() ?? '',
      storeName: json['storeName']?.toString() ?? json['store_name']?.toString(),
      openedBy: json['openedBy']?.toString() ?? json['opened_by']?.toString() ?? '',
      openedByName: json['openedByName']?.toString() ?? json['opened_by_name']?.toString(),
      closedBy: json['closedBy']?.toString() ?? json['closed_by']?.toString(),
      closedByName: json['closedByName']?.toString() ?? json['closed_by_name']?.toString(),
      openedAt: json['openedAt']?.toString() ?? json['opened_at']?.toString() ?? json['openingTime']?.toString() ?? '',
      closedAt: json['closedAt']?.toString() ?? json['closed_at']?.toString() ?? json['closingTime']?.toString(),
      startingCash: double.tryParse('${json['startingCash'] ?? json['starting_cash'] ?? json['initialAmount'] ?? 0}') ?? 0.0,
      actualCash: json['actualCash'] != null ? double.tryParse('${json['actualCash']}') : (json['actual_cash'] != null ? double.tryParse('${json['actual_cash']}') : null),
      actualUSD: json['actualUSD'] != null ? double.tryParse('${json['actualUSD']}') : (json['actual_usd'] != null ? double.tryParse('${json['actual_usd']}') : null),
      expectedCash: json['expectedCash'] != null ? double.tryParse('${json['expectedCash']}') : (json['expected_cash'] != null ? double.tryParse('${json['expected_cash']}') : null),
      salesCash: json['salesCash'] != null ? double.tryParse('${json['salesCash']}') : null,
      salesCard: json['salesCard'] != null ? double.tryParse('${json['salesCard']}') : null,
      salesUSD: json['salesUSD'] != null ? double.tryParse('${json['salesUSD']}') : null,
      totalSales: json['totalSales'] != null ? double.tryParse('${json['totalSales']}') : null,
      totalReturns: json['totalReturns'] != null ? double.tryParse('${json['totalReturns']}') : null,
      difference: json['difference'] != null ? double.tryParse('${json['difference']}') : null,
      status: json['status']?.toString() ?? 'OPEN',
      outflows: outflows,
    );
  }
}
