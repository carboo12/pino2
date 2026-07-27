import 'dart:math';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../config/api_environment.dart';

/// Cliente HTTP central de Pino Mobile.
///
/// Responsabilidades:
/// 1) Configurar baseURL/timeouts/headers.
/// 2) Inyectar access token JWT en cada request.
/// 3) Detectar 401 y notificar expiración de sesión.
class ApiClient {
  ApiClient._();

  static const _storage = FlutterSecureStorage();
  static const String keyJwtToken = 'asistencia_jwt_token';
  static const String keyUserCarnet = 'asistencia_user_carnet';
  static const String keyUserName = 'asistencia_user_name';
  static const String keyUserCorreo = 'asistencia_user_correo';
  static const String keyUserRol = 'asistencia_user_rol';

  static BaseOptions _baseOpts(String url) => BaseOptions(
        baseUrl: url,
        connectTimeout: ApiEnvironment.connectTimeout,
        receiveTimeout: ApiEnvironment.receiveTimeout,
        sendTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      );

  /// Instancia Dio para el backend NestJS de Asistencia.
  static final Dio dio = Dio(_baseOpts(ApiEnvironment.baseUrl));

  /// Instancia Dio para el Portal Corporativo (login SSO).
  static final Dio portalDio = Dio(_baseOpts(ApiEnvironment.portalBaseUrl));

  /// Callback que se ejecuta cuando la sesión expira (401).
  static VoidCallback? _onSessionExpired;

  /// Inicializa los interceptores de autenticación y logging.
  static void initialize({VoidCallback? onSessionExpired}) {
    _onSessionExpired = onSessionExpired;

    dio.interceptors.addAll([
      _createAuthInterceptor(),
      _createHeaderLogger('NEST'),
    ]);
  }

  static Interceptor _createAuthInterceptor() {
    return InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: keyJwtToken);
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          debugPrint('[ApiClient] 401 Unauthorized — sesión expirada');
          // Limpiar credenciales almacenadas
          await clearCredentials();
          // Notificar a la UI
          _onSessionExpired?.call();
        }
        handler.next(error);
      },
    );
  }

  /// Guarda el token JWT y datos del usuario en almacenamiento seguro.
  static Future<void> saveCredentials({
    required String token,
    required String carnet,
    required String nombre,
    required String correo,
    required String rol,
  }) async {
    await _storage.write(key: keyJwtToken, value: token);
    await _storage.write(key: keyUserCarnet, value: carnet);
    await _storage.write(key: keyUserName, value: nombre);
    await _storage.write(key: keyUserCorreo, value: correo);
    await _storage.write(key: keyUserRol, value: rol);
    dio.options.headers['Authorization'] = 'Bearer $token';
    debugPrint('[ApiClient] Credenciales guardadas para $carnet');
  }

  /// Lee el token JWT del almacenamiento seguro.
  static Future<String?> getToken() async {
    return _storage.read(key: keyJwtToken);
  }

  /// Lee los datos del usuario del almacenamiento seguro.
  static Future<Map<String, String?>> getUserData() async {
    return {
      'carnet': await _storage.read(key: keyUserCarnet),
      'nombre': await _storage.read(key: keyUserName),
      'correo': await _storage.read(key: keyUserCorreo),
      'rol': await _storage.read(key: keyUserRol),
    };
  }

  /// Limpia todas las credenciales almacenadas.
  static Future<void> clearCredentials() async {
    await _storage.delete(key: keyJwtToken);
    await _storage.delete(key: keyUserCarnet);
    await _storage.delete(key: keyUserName);
    await _storage.delete(key: keyUserCorreo);
    await _storage.delete(key: keyUserRol);
    dio.options.headers.remove('Authorization');
    debugPrint('[ApiClient] Credenciales eliminadas');
  }

  /// Desenvuelve respuesta envuelta en { success, data }.
  static Map<String, dynamic> unwrap(dynamic responseData) {
    if (responseData is Map<String, dynamic>) {
      if (responseData.containsKey('data') &&
          responseData.containsKey('success')) {
        final inner = responseData['data'];
        if (inner is Map<String, dynamic>) return inner;
        if (inner is List) return {'list': inner, 'raw': responseData};
      }
      return responseData;
    }
    return {};
  }

  static Interceptor _createHeaderLogger(String tag) {
    return InterceptorsWrapper(
      onRequest: (options, handler) {
        final auth = options.headers['Authorization'];
        debugPrint('[DIO/$tag] ${options.method} ${options.uri}');
        if (auth != null) {
          debugPrint(
              '[DIO/$tag] Auth: ${auth.toString().substring(0, min(40, auth.toString().length))}...');
        }
        handler.next(options);
      },
    );
  }
}
