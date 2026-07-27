import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../../core/network/api_client.dart';
import '../domain/session_user.dart';

/// Repositorio de autenticación.
///
/// Flujo SSO de dos pasos:
/// 1. Login en Portal → obtener ticket temporal.
/// 2. Canje de ticket en NestJS → obtener JWT de Asistencia.
class AuthRepository {
  AuthRepository();

  /// Login directo con el backend de producción (/auth/login).
  Future<SessionUser> login({
    required String usuario,
    required String password,
  }) async {
    debugPrint('[Auth] Iniciando login directo en /auth/login para $usuario...');
    final response = await ApiClient.dio.post('auth/login', data: {
      'email': usuario,
      'password': password,
    });

    final data = response.data as Map<String, dynamic>;
    final accessToken = (data['accessToken'] ?? data['access_token'] ?? data['token'] ?? '') as String;

    if (accessToken.isEmpty) {
      throw Exception('No se obtuvo token de acceso.');
    }

    final userData = (data['user'] ?? data['usuario'] ?? <String, dynamic>{}) as Map<String, dynamic>;
    final user = SessionUser.fromJson(userData);

    // Guardar credenciales en almacenamiento seguro
    await ApiClient.saveCredentials(
      token: accessToken,
      carnet: user.carnet,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol,
    );

    debugPrint('[Auth] Login exitoso para ${user.correo} (${user.rol})');
    return user;
  }

  /// Restaura la sesión desde el almacenamiento seguro.
  /// Verifica que el token sea válido consultando al backend.
  Future<SessionUser?> restoreSession() async {
    final token = await ApiClient.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[Auth] No hay token almacenado');
      return null;
    }

    // Inyectar token en el header
    ApiClient.dio.options.headers['Authorization'] = 'Bearer $token';

    try {
      // Verificar que el token sea válido
      final res = await ApiClient.dio.get('auth/me');
      final data = res.data;

      if (data is! Map<String, dynamic>) {
        debugPrint('[Auth] Respuesta inválida de /auth/me');
        await ApiClient.clearCredentials();
        return null;
      }

      debugPrint('[Auth] Sesión restaurada para ${data['carnet']}');
      return SessionUser.fromJson(data);
    } on DioException catch (e) {
      debugPrint('[Auth] Error validando token: ${e.response?.statusCode}');
      await ApiClient.clearCredentials();
      return null;
    }
  }

  /// Cierra la sesión eliminando todas las credenciales.
  Future<void> logout() async {
    await ApiClient.clearCredentials();
    debugPrint('[Auth] Sesión cerrada');
  }
}
