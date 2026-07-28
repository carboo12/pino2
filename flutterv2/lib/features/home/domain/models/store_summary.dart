class StoreSummary {
  const StoreSummary({
    required this.id,
    required this.name,
    this.address,
    this.phone,
    this.chainId,
    this.storeType,
  });

  final String id;
  final String name;
  final String? address;
  final String? phone;
  final String? chainId;
  final String? storeType;

  factory StoreSummary.fromJson(Map<String, dynamic> json) {
    return StoreSummary(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      address: json['address']?.toString(),
      phone: json['phone']?.toString(),
      chainId: json['chainId']?.toString() ?? json['chain_id']?.toString(),
      storeType: json['storeType']?.toString() ?? json['store_type']?.toString(),
    );
  }
}
