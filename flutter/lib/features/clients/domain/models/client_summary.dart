class ClientSummary {
  const ClientSummary({
    required this.id,
    required this.storeId,
    required this.name,
    this.email,
    this.phone,
    this.address,
    this.creditLimit,
    this.creditDays,
  });

  final String id;
  final String storeId;
  final String name;
  final String? email;
  final String? phone;
  final String? address;
  final num? creditLimit;
  final int? creditDays;

  factory ClientSummary.fromJson(Map<String, dynamic> json) {
    return ClientSummary(
      id: json['id']?.toString() ?? '',
      storeId: json['storeId']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Cliente',
      email: json['email']?.toString(),
      phone: json['phone']?.toString(),
      address: json['address']?.toString(),
      creditLimit: json['limiteCredito'] != null ? num.tryParse(json['limiteCredito'].toString()) : null,
      creditDays: json['diasCredito'] != null ? int.tryParse(json['diasCredito'].toString()) : null,
    );
  }
}
