class SessionUser {
  final String id;
  final String carnet;
  final String nombre;
  final String correo;
  final String rol;
  final List<String> storeIds;

  const SessionUser({
    required this.id,
    required this.carnet,
    required this.nombre,
    required this.correo,
    required this.rol,
    this.storeIds = const [],
  });

  factory SessionUser.fromJson(Map<String, dynamic> json) {
    final rawStoreIds = json['storeIds'] ?? json['stores'] ?? [];
    final storeIds = rawStoreIds is List
        ? rawStoreIds.map((e) => e.toString()).toList()
        : <String>[];

    return SessionUser(
      id: (json['id'] ?? json['uid'] ?? '').toString(),
      carnet: (json['carnet'] ?? json['id'] ?? '').toString(),
      nombre: (json['name'] ?? json['nombre'] ?? json['Nombre'] ?? 'Usuario').toString(),
      correo: (json['email'] ?? json['correo'] ?? json['Correo'] ?? '').toString(),
      rol: (json['role'] ?? json['rol'] ?? json['Rol'] ?? 'gestor').toString(),
      storeIds: storeIds,
    );
  }
}
