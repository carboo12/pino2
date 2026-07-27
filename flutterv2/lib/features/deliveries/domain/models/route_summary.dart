class RouteSummary {
  const RouteSummary({
    required this.id,
    required this.storeId,
    required this.vendorId,
    this.name = 'Ruta Fija Cobertura',
    this.dayOfWeek = 0,
    required this.clientIds,
    required this.routeDate,
    required this.status,
    this.notes,
  });

  final String id;
  final String storeId;
  final String vendorId;
  final String name;
  final int dayOfWeek;
  final List<String> clientIds;
  final DateTime? routeDate;
  final String status;
  final String? notes;

  factory RouteSummary.fromJson(Map<String, dynamic> json) {
    final rawClientIds = json['clientIds'];
    final clientIds = rawClientIds is List
        ? rawClientIds.map((value) => value.toString()).toList()
        : <String>[];

    return RouteSummary(
      id: json['id']?.toString() ?? '',
      storeId: json['storeId']?.toString() ?? '',
      vendorId: json['vendorId']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Ruta Fija Cobertura',
      dayOfWeek: int.tryParse('${json['dayOfWeek'] ?? json['day_of_week'] ?? 0}') ?? 0,
      clientIds: clientIds,
      routeDate: DateTime.tryParse('${json['routeDate'] ?? ''}'),
      status: json['status']?.toString() ?? 'pending',
      notes: json['notes']?.toString(),
    );
  }
}
