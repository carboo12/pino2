import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import '../../../core/config/app_config.dart';
import '../../../core/network/api_client.dart';
import '../domain/colaborador_models.dart';

/// Controlador de estado del módulo de Despacho.
/// Gestiona búsqueda de colaboradores, registro de asistencia,
/// entrega de juguetes y reversiones.
class DespachoController extends ChangeNotifier {
  LookupResult? lookupResult;
  List<Juguete> catalogoJuguetes = [];
  bool loading = false;
  bool delivering = false;
  String? error;

  // Censo y KPIs
  List<CensoItem> censoItems = [];
  List<CensoItem> _todoCenso = [];
  int censoTotal = 0;
  int censoTotalPaginas = 1;
  bool loadingCenso = false;
  Map<String, dynamic>? kpis;

  // Historial de Movimientos
  List<EntregaAudit> historialItems = [];
  int historialTotal = 0;
  int historialTotalPaginas = 1;
  bool loadingHistorial = false;

  // Admin / Roles
  List<SystemUser> usuariosSistema = [];
  bool loadingUsuarios = false;
  List<PortalUser> usuariosPortal = [];
  bool searchingPortal = false;

  Colaborador? get colaborador => lookupResult?.colaborador;
  List<Hijo> get hijos => lookupResult?.hijos ?? [];
  bool get asistio => lookupResult?.asistio ?? false;

  // Búsqueda por nombre
  List<Colaborador> resultadosBusqueda = [];
  bool buscandoPorNombre = false;

  /// Busca colaboradores por nombre/apellido (texto) o carnet (número).
  Future<bool> buscarPorNombre(String query) async {
    if (query.trim().isEmpty) return false;
    buscandoPorNombre = true;
    error = null;
    notifyListeners();

    try {
      final res = await ApiClient.dio.get(
        'attendance/search',
        queryParameters: {'q': query.trim()},
      );

      final data = res.data;
      if (data is List) {
        resultadosBusqueda = data
            .whereType<Map<String, dynamic>>()
            .map((c) => Colaborador.fromJson(c))
            .toList();
      } else {
        resultadosBusqueda = [];
      }
      return true;
    } on DioException catch (e) {
      error = 'Error al buscar: ${e.message}';
      resultadosBusqueda = [];
      return false;
    } catch (e) {
      error = 'Error inesperado: $e';
      resultadosBusqueda = [];
      return false;
    } finally {
      buscandoPorNombre = false;
      notifyListeners();
    }
  }

  /// Busca un colaborador por su carnet en el backend.
  Future<bool> buscarColaborador(String carnet) async {
    loading = true;
    error = null;
    lookupResult = null;
    notifyListeners();

    try {
      final eventoId = AppConfig.activeEventId;
      final res = await ApiClient.dio.get(
        'attendance/lookup/$carnet',
        queryParameters: {'eventoId': eventoId},
      );

      final data = res.data as Map<String, dynamic>;
      lookupResult = LookupResult.fromJson(data);

      debugPrint('[Despacho] Colaborador encontrado: ${colaborador?.nombre}');
      debugPrint('[Despacho] Hijos: ${hijos.length}, Asistió: $asistio');
      return true;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        error = 'Colaborador no encontrado con carnet: $carnet';
      } else {
        error = 'Error de conexión. Verifica tu red.';
      }
      debugPrint('[Despacho] Error búsqueda: $e');
      return false;
    } catch (e) {
      error = 'Error inesperado: $e';
      return false;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  /// Registra la asistencia del colaborador actual.
  Future<bool> registrarAsistencia({int adultos = 1, int ninos = 0, String? asistioPor, String? nombreAsistente}) async {
    if (colaborador == null) return false;

    loading = true;
    error = null;
    notifyListeners();

    try {
      await ApiClient.dio.post('attendance/register', data: {
        'eventoId': AppConfig.activeEventId,
        'carnet': colaborador!.carnet,
        'adultos': adultos,
        'ninos': ninos,
        if (asistioPor != null) 'asistioPor': asistioPor,
        if (nombreAsistente != null && nombreAsistente.isNotEmpty) 'nombreAsistente': nombreAsistente,
      });

      // Recargar la ficha para reflejar el nuevo estado
      await buscarColaborador(colaborador!.carnet);

      HapticFeedback.mediumImpact();
      return true;
    } on DioException catch (e) {
      if (e.response?.statusCode == 409) {
        error = 'La asistencia ya fue registrada para este colaborador.';
        // Recargar para sincronizar estado
        await buscarColaborador(colaborador!.carnet);
      } else {
        error = 'Error al registrar asistencia. Intenta de nuevo.';
      }
      return false;
    } catch (e) {
      error = 'Error inesperado: $e';
      return false;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  /// Reversa la asistencia de un colaborador.
  Future<bool> reversarAsistencia(String carnet) async {
    loading = true;
    error = null;
    notifyListeners();

    try {
      final eventoId = AppConfig.activeEventId;
      await ApiClient.dio.post('attendance/revert', data: {
        'eventoId': eventoId,
        'carnet': carnet,
      });

      // Recargar la ficha si es el colaborador actual
      if (colaborador != null && colaborador!.carnet == carnet) {
        await buscarColaborador(carnet);
      }

      HapticFeedback.mediumImpact();
      return true;
    } on DioException catch (e) {
      final msg = (e.response?.data is Map)
          ? (e.response!.data['message'] ?? '').toString()
          : '';
      error = msg.isNotEmpty ? msg : 'Error al reversar la asistencia.';
      return false;
    } catch (e) {
      error = 'Error inesperado: $e';
      return false;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  /// Carga el catálogo completo de juguetes para selección alternativa.
  Future<void> cargarCatalogo() async {
    try {
      final res = await ApiClient.dio.get('catalog');
      final data = res.data;
      if (data is List) {
        catalogoJuguetes =
            data.whereType<Map<String, dynamic>>().map((j) => Juguete.fromJson(j)).toList();
      }
      debugPrint('[Despacho] Catálogo cargado: ${catalogoJuguetes.length} juguetes');
    } catch (e) {
      debugPrint('[Despacho] Error cargando catálogo: $e');
    }
  }

  /// Confirma la entrega de un juguete a un hijo.
  Future<bool> confirmarDespacho({
    required int hijoId,
    required int jugueteId,
    required String recibidoPor,
    String? nombreReceptor,
    File? fotoFile,
  }) async {
    if (colaborador == null) return false;

    delivering = true;
    error = null;
    notifyListeners();

    try {
      final formData = FormData.fromMap({
        'eventoId': AppConfig.activeEventId,
        'hijoId': hijoId,
        'jugueteId': jugueteId,
        'carnetColaborador': colaborador!.carnet,
        'recibidoPor': recibidoPor,
        if (nombreReceptor != null && nombreReceptor.isNotEmpty)
          'nombreReceptor': nombreReceptor,
        if (fotoFile != null)
          'foto': await MultipartFile.fromFile(
            fotoFile.path,
            filename: 'evidencia.webp',
          ),
      });

      final res = await ApiClient.dio.post(
        'dispatch/deliver',
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );

      debugPrint('[Despacho] Entrega exitosa: ${res.data}');

      // Vibración de éxito
      HapticFeedback.heavyImpact();

      // Recargar la ficha
      await buscarColaborador(colaborador!.carnet);
      return true;
    } on DioException catch (e) {
      final statusCode = e.response?.statusCode;
      final msg = (e.response?.data is Map)
          ? (e.response!.data['message'] ?? '').toString()
          : '';

      if (statusCode == 409) {
        error = msg.isNotEmpty ? msg : 'Este hijo ya tiene una entrega activa.';
      } else if (statusCode == 404) {
        error = msg.isNotEmpty ? msg : 'Recurso no encontrado.';
      } else {
        error = 'Error al registrar la entrega. Intenta de nuevo.';
      }
      debugPrint('[Despacho] Error entrega: $e');
      return false;
    } catch (e) {
      error = 'Error inesperado: $e';
      return false;
    } finally {
      delivering = false;
      notifyListeners();
    }
  }

  /// Reversa una entrega previamente realizada.
  Future<bool> reversarDespacho({
    required int entregaId,
    required String motivo,
  }) async {
    loading = true;
    error = null;
    notifyListeners();

    try {
      await ApiClient.dio.post('dispatch/$entregaId/revert', data: {
        'motivo': motivo,
      });

      HapticFeedback.mediumImpact();

      // Recargar la ficha
      if (colaborador != null) {
        await buscarColaborador(colaborador!.carnet);
      }
      return true;
    } on DioException catch (e) {
      final msg = (e.response?.data is Map)
          ? (e.response!.data['message'] ?? '').toString()
          : '';
      error = msg.isNotEmpty ? msg : 'Error al reversar la entrega.';
      return false;
    } catch (e) {
      error = 'Error inesperado: $e';
      return false;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  /// Actualiza la foto de evidencia de un hijo ya entregado.
  Future<bool> updateFotoEvidencia({required int hijoId, required File foto}) async {
    loading = true; error = null; notifyListeners();
    try {
      final eventoId = AppConfig.activeEventId;
      final formData = FormData.fromMap({'foto': await MultipartFile.fromFile(foto.path, filename: 'evidencia.webp')});
      await ApiClient.dio.patch('dispatch/$hijoId/foto', queryParameters: {'eventoId': eventoId}, data: formData, options: Options(contentType: 'multipart/form-data'));
      HapticFeedback.mediumImpact();
      if (colaborador != null) await buscarColaborador(colaborador!.carnet);
      return true;
    } on DioException catch (e) { error = 'Error al actualizar foto: ${e.message}'; return false; }
    catch (e) { error = 'Error inesperado: $e'; return false; }
    finally { loading = false; notifyListeners(); }
  }

  /// Limpia el estado actual (al volver al escáner).
  void limpiar() {
    lookupResult = null;
    error = null;
    notifyListeners();
  }

  /// Carga los KPIs resumen del evento actual.
  Future<void> cargarKPIs() async {
    try {
      final eventoId = AppConfig.activeEventId;
      final res = await ApiClient.dio.get('attendance/event/$eventoId/summary');
      if (res.data is Map<String, dynamic>) {
        kpis = res.data as Map<String, dynamic>;
      }
      notifyListeners();
    } catch (e) {
      debugPrint('[Despacho] Error cargando KPIs: $e');
    }
  }

  /// Carga el censo de colaboradores con filtros y búsqueda.
  Future<void> cargarCenso({
    String? busqueda,
    String? estado,
    int pagina = 1,
    bool requiereAsistencia = false,
    bool forceReload = false,
  }) async {
    if (requiereAsistencia) {
      // ── Filtrado y paginación del lado del cliente (Pantalla de Despacho) ──
      
      // Si no tenemos los datos aún, o se fuerza la recarga, traemos todo del API
      if (_todoCenso.isEmpty || forceReload) {
        loadingCenso = true;
        notifyListeners();

        try {
          final eventoId = AppConfig.activeEventId;
          final res = await ApiClient.dio.get(
            'attendance/censo',
            queryParameters: {
              'eventoId': eventoId,
              'pagina': 1,
              'porPagina': 5000, // Número grande para traer a todos los colaboradores
            },
          );

          final body = res.data;
          if (body is Map<String, dynamic>) {
            final dataList = body['data'];
            if (dataList is List) {
              _todoCenso = dataList
                  .whereType<Map<String, dynamic>>()
                  .map((c) => CensoItem.fromJson(c))
                  .toList();
            } else {
              _todoCenso = [];
            }
          }
        } catch (e) {
          debugPrint('[Despacho] Error cargando censo completo para despacho: $e');
          _todoCenso = [];
        } finally {
          loadingCenso = false;
        }
      }

      // Filtramos y paginamos localmente
      _actualizarCensoFiltrado(
        busqueda: busqueda,
        estado: estado,
        pagina: pagina,
        requiereAsistencia: true,
      );
      notifyListeners();
    } else {
      // ── Filtrado y paginación del lado del servidor (Pantalla de Dashboard) ──
      loadingCenso = true;
      notifyListeners();

      try {
        final eventoId = AppConfig.activeEventId;
        final res = await ApiClient.dio.get(
          'attendance/censo',
          queryParameters: {
            'eventoId': eventoId,
            if (busqueda != null && busqueda.trim().isNotEmpty) 'busqueda': busqueda.trim(),
            if (estado != null && estado.isNotEmpty) 'estado': estado,
            'pagina': pagina,
            'porPagina': 50,
          },
        );

        final body = res.data;
        if (body is Map<String, dynamic>) {
          final dataList = body['data'];
          if (dataList is List) {
            censoItems = dataList
                .whereType<Map<String, dynamic>>()
                .map((c) => CensoItem.fromJson(c))
                .toList();
          } else {
            censoItems = [];
          }
          censoTotal = _toInt(body['total']);
          censoTotalPaginas = _toInt(body['totalPaginas']);
        }
      } catch (e) {
        debugPrint('[Despacho] Error cargando censo: $e');
        censoItems = [];
        censoTotal = 0;
        censoTotalPaginas = 1;
      } finally {
        loadingCenso = false;
        notifyListeners();
      }
    }
  }

  void _actualizarCensoFiltrado({
    required String? busqueda,
    required String? estado,
    required int pagina,
    required bool requiereAsistencia,
    int porPagina = 15,
  }) {
    var temp = List<CensoItem>.from(_todoCenso);

    if (requiereAsistencia) {
      temp = temp.where((item) => item.asistio > 0).toList();
    }

    if (estado == 'pendientes') {
      temp = temp.where((item) => item.entregados < item.totalHijos).toList();
    } else if (estado == 'completos') {
      temp = temp.where((item) => item.totalHijos > 0 && item.entregados == item.totalHijos).toList();
    } else if (estado == 'asistidos') {
      temp = temp.where((item) => item.asistio > 0).toList();
    }

    if (busqueda != null && busqueda.trim().isNotEmpty) {
      final term = busqueda.trim().toLowerCase();
      temp = temp.where((item) {
        return item.nombre.toLowerCase().contains(term) ||
               item.carnet.toLowerCase().contains(term);
      }).toList();
    }

    censoTotal = temp.length;
    censoTotalPaginas = (censoTotal / porPagina).ceil();
    if (censoTotalPaginas < 1) censoTotalPaginas = 1;

    final startIndex = (pagina - 1) * porPagina;
    if (startIndex >= censoTotal) {
      censoItems = [];
    } else {
      final endIndex = startIndex + porPagina;
      censoItems = temp.sublist(
        startIndex,
        endIndex > censoTotal ? censoTotal : endIndex,
      );
    }
  }

  int _toInt(dynamic v) {
    if (v is int) return v;
    if (v is double) return v.toInt();
    if (v is String) return int.tryParse(v) ?? 0;
    return 0;
  }

  /// Carga el historial de movimientos de despacho con filtros y paginación.
  Future<void> cargarHistorial({String? busqueda, int pagina = 1}) async {
    loadingHistorial = true;
    notifyListeners();

    try {
      final res = await ApiClient.dio.get(
        'dispatch/event/1/summary',
        queryParameters: {
          'eventoId': AppConfig.activeEventId,
          if (busqueda != null && busqueda.trim().isNotEmpty) 'busqueda': busqueda.trim(),
          'pagina': pagina,
          'porPagina': 25,
        },
      );

      final body = res.data;
      if (body is Map<String, dynamic>) {
        final data = body['data'] ?? body;
        final dataList = data['data'];
        if (dataList is List) {
          historialItems = dataList
              .whereType<Map<String, dynamic>>()
              .map((c) => EntregaAudit.fromJson(c))
              .toList();
        } else {
          historialItems = [];
        }
        historialTotal = _toInt(data['total']);
        historialTotalPaginas = _toInt(data['totalPaginas'] ?? 1);
      }
    } catch (e) {
      debugPrint('[Despacho] Error cargando historial: $e');
      historialItems = [];
      historialTotal = 0;
      historialTotalPaginas = 1;
    } finally {
      loadingHistorial = false;
      notifyListeners();
    }
  }

  /// Importa un archivo Excel de censo o catálogo al backend.
  Future<Map<String, dynamic>> importarExcel({
    required File archivo,
    required String tipo,
  }) async {
    loading = true;
    error = null;
    notifyListeners();

    try {
      final formData = FormData.fromMap({
        'archivo': await MultipartFile.fromFile(
          archivo.path,
          filename: archivo.path.split(Platform.pathSeparator).last,
        ),
      });

      final endpoint = tipo == 'censo' ? 'imports/censo/apply' : 'imports/catalogo/apply';
      final res = await ApiClient.dio.post(
        endpoint,
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      final msg = (e.response?.data is Map)
          ? (e.response!.data['message'] ?? '').toString()
          : '';
      error = msg.isNotEmpty ? msg : 'Error al importar archivo.';
      throw Exception(error);
    } catch (e) {
      error = 'Error inesperado: $e';
      throw Exception(error);
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  /// Carga la lista de usuarios con roles asignados en el sistema.
  Future<void> cargarUsuariosSistema() async {
    loadingUsuarios = true;
    notifyListeners();

    try {
      final res = await ApiClient.dio.get('admin/users');
      final data = res.data;
      if (data is List) {
        usuariosSistema =
            data.whereType<Map<String, dynamic>>().map((u) => SystemUser.fromJson(u)).toList();
      } else {
        usuariosSistema = [];
      }
    } catch (e) {
      debugPrint('[Despacho] Error cargando usuarios: $e');
      usuariosSistema = [];
    } finally {
      loadingUsuarios = false;
      notifyListeners();
    }
  }

  /// Busca usuarios en el portal de Claro para asignarles roles en el sistema.
  Future<void> buscarUsuarioPortal(String query) async {
    if (query.trim().isEmpty) return;
    searchingPortal = true;
    notifyListeners();

    try {
      final res = await ApiClient.dio.get(
        'admin/search-portal',
        queryParameters: {'q': query.trim()},
      );
      final data = res.data;
      if (data is List) {
        usuariosPortal =
            data.whereType<Map<String, dynamic>>().map((u) => PortalUser.fromJson(u)).toList();
      } else {
        usuariosPortal = [];
      }
    } catch (e) {
      debugPrint('[Despacho] Error buscando en portal: $e');
      usuariosPortal = [];
    } finally {
      searchingPortal = false;
      notifyListeners();
    }
  }

  /// Asigna o modifica el rol de un usuario en el sistema.
  Future<bool> asignarRolUsuario(String carnet, String rol) async {
    loading = true;
    error = null;
    notifyListeners();

    try {
      await ApiClient.dio.post('admin/set-role', data: {
        'carnet': carnet,
        'rol': rol,
      });
      await cargarUsuariosSistema();
      return true;
    } on DioException catch (e) {
      final msg = (e.response?.data is Map)
          ? (e.response!.data['message'] ?? '').toString()
          : '';
      error = msg.isNotEmpty ? msg : 'Error al asignar rol.';
      return false;
    } catch (e) {
      error = 'Error inesperado: $e';
      return false;
    } finally {
      loading = false;
      notifyListeners();
    }
  }
}
