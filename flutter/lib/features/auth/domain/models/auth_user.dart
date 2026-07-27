class AuthUser {
  const AuthUser({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    required this.storeIds,
  });

  final String id;
  final String email;
  final String name;
  final String role;
  final List<String> storeIds;

  String? get primaryStoreId => storeIds.isEmpty ? null : storeIds.first;

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    final rawStores = json['storeIds'] ?? json['store_ids'] ?? json['stores'] ?? json['assignedStores'];
    final List<String> storeIds = [];

    if (rawStores is List) {
      for (final item in rawStores) {
        if (item is Map) {
          final id = (item['id'] ?? item['storeId'] ?? item['store_id'])?.toString();
          if (id != null && id.isNotEmpty) storeIds.add(id);
        } else if (item != null) {
          final str = item.toString().trim();
          if (str.isNotEmpty) storeIds.add(str);
        }
      }
    } else if (rawStores != null) {
      final str = rawStores.toString().trim();
      if (str.isNotEmpty) storeIds.add(str);
    }

    final singlePrimary = (json['primaryStoreId'] ?? json['primary_store_id'] ?? json['storeId'] ?? json['store_id'])?.toString();
    if (singlePrimary != null && singlePrimary.isNotEmpty && !storeIds.contains(singlePrimary)) {
      storeIds.insert(0, singlePrimary);
    }

    final rawRole = (json['role'] ?? json['rol'] ?? json['roleName'])?.toString() ?? 'usuario';

    return AuthUser(
      id: (json['id'] ?? json['userId'] ?? json['user_id'])?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      name: (json['name'] ?? json['nombre'] ?? json['fullName'])?.toString() ?? 'Usuario',
      role: rawRole,
      storeIds: storeIds,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'role': role,
      'storeIds': storeIds,
    };
  }
}
