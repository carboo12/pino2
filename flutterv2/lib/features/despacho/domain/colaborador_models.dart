// Modelos de datos para el módulo de Despacho.
// Mapean las respuestas del backend NestJS.

class Juguete {
  final int id;
  final String nombreJuguete;
  final int stockActual;
  final String? fotoUrl;
  final String? categoria;
  final String? genero;

  const Juguete({
    required this.id,
    required this.nombreJuguete,
    required this.stockActual,
    this.fotoUrl,
    this.categoria,
    this.genero,
  });

  factory Juguete.fromJson(Map<String, dynamic> json) {
    return Juguete(
      id: _toInt(json['id'] ?? json['Id']),
      nombreJuguete: (json['nombreJuguete'] ?? json['NombreJuguete'] ?? '').toString(),
      stockActual: _toInt(json['stockActual'] ?? json['StockActual'] ?? json['stockInicial'] ?? 0),
      fotoUrl: json['fotoUrl']?.toString() ?? json['FotoUrl']?.toString(),
      categoria: json['categoria']?.toString() ?? json['Categoria']?.toString(),
      genero: json['genero']?.toString() ?? json['Genero']?.toString(),
    );
  }
}

class Hijo {
  final int id;
  final String nombreHijo;
  final int edadHijo;
  final String generoHijo;
  final String? categoria;
  final String? estadoEntrega; // 'DELIVERED', 'REVERTED', null
  final int? entregaId;
  final String? fechaEntrega;
  final String? recibidoPor;
  final String? fotoEvidenciaUrl;
  final Juguete? jugueteSugerido;

  const Hijo({
    required this.id,
    required this.nombreHijo,
    required this.edadHijo,
    required this.generoHijo,
    this.categoria,
    this.estadoEntrega,
    this.entregaId,
    this.fechaEntrega,
    this.recibidoPor,
    this.fotoEvidenciaUrl,
    this.jugueteSugerido,
  });

  bool get entregado => estadoEntrega == 'DELIVERED';
  bool get reversado => estadoEntrega == 'REVERTED';
  bool get pendiente => estadoEntrega == null || estadoEntrega!.isEmpty;

  factory Hijo.fromJson(Map<String, dynamic> json) {
    return Hijo(
      id: _toInt(json['id'] ?? json['Id']),
      nombreHijo: (json['nombreHijo'] ?? json['NombreHijo'] ?? '').toString(),
      edadHijo: _toInt(json['edadHijo'] ?? json['EdadHijo'] ?? 0),
      generoHijo: (json['generoHijo'] ?? json['GeneroHijo'] ?? '').toString(),
      categoria: json['categoria']?.toString() ?? json['Categoria']?.toString(),
      estadoEntrega: json['estadoEntrega']?.toString() ?? json['EstadoEntrega']?.toString(),
      entregaId: json['entregaId'] != null ? _toInt(json['entregaId']) : null,
      fechaEntrega: json['fechaEntrega']?.toString(),
      recibidoPor: json['recibidoPor']?.toString(),
      fotoEvidenciaUrl: json['fotoEvidenciaUrl']?.toString(),
      jugueteSugerido: json['jugueteSugerido'] != null
          ? Juguete.fromJson(json['jugueteSugerido'] as Map<String, dynamic>)
          : null,
    );
  }
}

class Colaborador {
  final String carnet;
  final String nombre;
  final String? puesto;
  final String? gerencia;
  final String? ubicacion;
  final String? edificio;
  final String? departamentoGeografico;
  final bool inactivo;

  const Colaborador({
    required this.carnet,
    required this.nombre,
    this.puesto,
    this.gerencia,
    this.ubicacion,
    this.edificio,
    this.departamentoGeografico,
    this.inactivo = false,
  });

  factory Colaborador.fromJson(Map<String, dynamic> json) {
    return Colaborador(
      carnet: (json['carnet'] ?? json['Carnet'] ?? '').toString(),
      nombre: (json['nombre'] ?? json['Nombre'] ?? '').toString(),
      puesto: json['puesto']?.toString() ?? json['Puesto']?.toString(),
      gerencia: json['gerencia']?.toString() ?? json['Gerencia']?.toString(),
      ubicacion: json['ubicacion']?.toString() ?? json['Ubicacion']?.toString(),
      edificio: json['edificio']?.toString() ?? json['Edificio']?.toString(),
      departamentoGeografico: json['departamentoGeografico']?.toString() ?? json['DepartamentoGeografico']?.toString(),
      inactivo: json['inactivo'] == true,
    );
  }
}

class FamiliarHcm {
  final String nombre;
  final String? tipoRela;
  final int edad;

  const FamiliarHcm({
    required this.nombre,
    this.tipoRela,
    required this.edad,
  });

  factory FamiliarHcm.fromJson(Map<String, dynamic> json) {
    return FamiliarHcm(
      nombre: (json['nombre'] ?? '').toString(),
      tipoRela: json['tipoRela']?.toString(),
      edad: _toInt(json['edad'] ?? 0),
    );
  }
}

/// Resultado completo de la consulta de un carnet.
class LookupResult {
  final Colaborador colaborador;
  final bool inactivo;
  final String? terminationDate;
  final bool asistio;
  final String? fechaAsistencia;
  final int adultos;
  final int ninos;
  final String? asistioPor;
  final String? nombreAsistente;
  final String? fotoHcm;
  final List<Hijo> hijos;
  final List<FamiliarHcm> familiaresHcm;

  bool get activo => !inactivo;

  const LookupResult({
    required this.colaborador,
    this.inactivo = false,
    this.terminationDate,
    required this.asistio,
    this.fechaAsistencia,
    this.adultos = 1,
    this.ninos = 0,
    this.asistioPor,
    this.nombreAsistente,
    this.fotoHcm,
    required this.hijos,
    this.familiaresHcm = const [],
  });

  factory LookupResult.fromJson(Map<String, dynamic> json) {
    final colabJson = json['colaborador'] as Map<String, dynamic>? ?? json;
    final hijosJson = json['hijos'] as List<dynamic>? ?? [];
    final familiaresJson = json['familiaresHcm'] as List<dynamic>? ?? [];

    return LookupResult(
      colaborador: Colaborador.fromJson(colabJson),
      inactivo: json['inactivo'] == true,
      terminationDate: json['terminationDate']?.toString(),
      asistio: json['asistio'] == true,
      fechaAsistencia: json['fechaAsistencia']?.toString(),
      adultos: _toInt(json['adultos'] ?? 1),
      ninos: _toInt(json['ninos'] ?? 0),
      asistioPor: json['asistioPor']?.toString(),
      nombreAsistente: json['nombreAsistente']?.toString(),
      fotoHcm: json['fotoHcm']?.toString(),
      hijos: hijosJson
          .whereType<Map<String, dynamic>>()
          .map((h) => Hijo.fromJson(h))
          .toList(),
      familiaresHcm: familiaresJson
          .whereType<Map<String, dynamic>>()
          .map((f) => FamiliarHcm.fromJson(f))
          .toList(),
    );
  }
}

class CensoItem {
  final String carnet;
  final String nombre;
  final String? gerencia;
  final int totalHijos;
  final int entregados;
  final int asistio;
  final int totalAdultos;
  final int totalNinos;
  final String? fechaAsistencia;
  final String? registradoPor;
  final String? asistioPor;
  final String? nombreAsistente;

  const CensoItem({
    required this.carnet,
    required this.nombre,
    this.gerencia,
    required this.totalHijos,
    required this.entregados,
    required this.asistio,
    this.totalAdultos = 0,
    this.totalNinos = 0,
    this.fechaAsistencia,
    this.registradoPor,
    this.asistioPor,
    this.nombreAsistente,
  });

  factory CensoItem.fromJson(Map<String, dynamic> json) {
    return CensoItem(
      carnet: (json['Carnet'] ?? json['carnet'] ?? '').toString(),
      nombre: (json['Nombre'] ?? json['nombre'] ?? '').toString(),
      gerencia: json['Gerencia']?.toString() ?? json['gerencia']?.toString(),
      totalHijos: _toInt(json['TotalHijos'] ?? json['totalHijos'] ?? 0),
      entregados: _toInt(json['Entregados'] ?? json['entregados'] ?? 0),
      asistio: _toInt(json['Asistio'] ?? json['asistio'] ?? 0),
      totalAdultos: _toInt(json['TotalAdultos'] ?? json['totalAdultos'] ?? json['adultos'] ?? 0),
      totalNinos: _toInt(json['TotalNinos'] ?? json['totalNinos'] ?? json['ninos'] ?? 0),
      fechaAsistencia: json['FechaAsistencia']?.toString() ?? json['fechaAsistencia']?.toString(),
      registradoPor: json['RegistradoPor']?.toString() ?? json['registradoPor']?.toString(),
      asistioPor: json['AsistioPor']?.toString() ?? json['asistioPor']?.toString(),
      nombreAsistente: json['NombreAsistente']?.toString() ?? json['nombreAsistente']?.toString(),
    );
  }
}

/// Helper para convertir valores numéricos mixtos.
int _toInt(dynamic v) {
  if (v is int) return v;
  if (v is double) return v.toInt();
  if (v is String) return int.tryParse(v) ?? 0;
  return 0;
}

class EntregaAudit {
  final int entregaId;
  final int eventoId;
  final String? eventoNombre;
  final String colaboradorCarnet;
  final String colaboradorNombre;
  final String hijoNombre;
  final String nombreJuguete;
  final String estado; // 'DELIVERED', 'REVERTED'
  final String recibidoPor;
  final String? fechaEntrega;
  final String usuarioDespacho;
  final String? fechaReversion;
  final String? usuarioReversion;
  final String? motivoReversion;
  final String? receptorFinal;

  const EntregaAudit({
    required this.entregaId,
    required this.eventoId,
    this.eventoNombre,
    required this.colaboradorCarnet,
    required this.colaboradorNombre,
    required this.hijoNombre,
    required this.nombreJuguete,
    required this.estado,
    required this.recibidoPor,
    this.fechaEntrega,
    required this.usuarioDespacho,
    this.fechaReversion,
    this.usuarioReversion,
    this.motivoReversion,
    this.receptorFinal,
  });

  factory EntregaAudit.fromJson(Map<String, dynamic> json) {
    return EntregaAudit(
      entregaId: _toInt(json['entregaId'] ?? json['EntregaId'] ?? 0),
      eventoId: _toInt(json['eventoId'] ?? json['EventoId'] ?? 0),
      eventoNombre: json['eventoNombre']?.toString() ?? json['EventoNombre']?.toString(),
      colaboradorCarnet: (json['colaboradorCarnet'] ?? json['ColaboradorCarnet'] ?? '').toString(),
      colaboradorNombre: (json['colaboradorNombre'] ?? json['ColaboradorNombre'] ?? '').toString(),
      hijoNombre: (json['hijoNombre'] ?? json['HijoNombre'] ?? '').toString(),
      nombreJuguete: (json['nombreJuguete'] ?? json['NombreJuguete'] ?? '').toString(),
      estado: (json['estado'] ?? json['Estado'] ?? '').toString(),
      recibidoPor: (json['recibidoPor'] ?? json['RecibidoPor'] ?? '').toString(),
      fechaEntrega: json['fechaEntrega']?.toString() ?? json['FechaEntrega']?.toString(),
      usuarioDespacho: (json['usuarioDespacho'] ?? json['UsuarioDespacho'] ?? '').toString(),
      fechaReversion: json['fechaReversion']?.toString() ?? json['FechaReversion']?.toString(),
      usuarioReversion: json['usuarioReversion']?.toString() ?? json['UsuarioReversion']?.toString(),
      motivoReversion: json['motivoReversion']?.toString() ?? json['MotivoReversion']?.toString(),
      receptorFinal: json['receptorFinal']?.toString() ?? json['ReceptorFinal']?.toString() ?? json['receptor']?.toString(),
    );
  }
}

class SystemUser {
  final int id;
  final String carnet;
  final String nombre;
  final String? correo;
  final String rol;
  final bool activo;

  const SystemUser({
    required this.id,
    required this.carnet,
    required this.nombre,
    this.correo,
    required this.rol,
    required this.activo,
  });

  factory SystemUser.fromJson(Map<String, dynamic> json) {
    return SystemUser(
      id: _toInt(json['id']),
      carnet: (json['carnet'] ?? '').toString(),
      nombre: (json['nombre'] ?? '').toString(),
      correo: json['correo']?.toString(),
      rol: (json['rol'] ?? '').toString(),
      activo: json['activo'] == true,
    );
  }
}

class PortalUser {
  final String carnet;
  final String nombre;
  final String? gerencia;
  final bool activo;
  final String? rol;

  const PortalUser({
    required this.carnet,
    required this.nombre,
    this.gerencia,
    required this.activo,
    this.rol,
  });

  factory PortalUser.fromJson(Map<String, dynamic> json) {
    return PortalUser(
      carnet: (json['carnet'] ?? '').toString(),
      nombre: (json['nombre'] ?? '').toString(),
      gerencia: json['gerencia']?.toString(),
      activo: json['activo'] == true,
      rol: json['rol']?.toString(),
    );
  }
}
