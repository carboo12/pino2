import 'package:flutter/foundation.dart';

import '../data/auth_repository.dart';
import '../domain/session_user.dart';

/// Controlador de estado de autenticación.
/// Usa ChangeNotifier para integrarse con Provider.
class AuthController extends ChangeNotifier {
  AuthController({AuthRepository? repository})
      : _repository = repository ?? AuthRepository();

  final AuthRepository _repository;

  SessionUser? user;
  bool loading = false;
  bool initialized = false;
  String? error;

  bool get isAuthenticated => user != null;
  String? get userCarnet => user?.carnet;
  String? get userRol => user?.rol;

  /// Inicializa la sesión al arrancar la app.
  Future<void> initialize() async {
    loading = true;
    notifyListeners();

    try {
      user = await _repository.restoreSession();
    } catch (e) {
      debugPrint('[AuthController] Error al restaurar sesión: $e');
      user = null;
    } finally {
      loading = false;
      initialized = true;
      notifyListeners();
    }
  }

  /// Login con usuario y contraseña.
  Future<bool> login(String usuario, String password) async {
    loading = true;
    error = null;
    notifyListeners();

    try {
      user = await _repository.login(usuario: usuario, password: password);
      return true;
    } catch (e) {
      final msg = e.toString();
      if (msg.contains('Credenciales') || msg.contains('401')) {
        error = 'Credenciales incorrectas. Verifica tu usuario y contraseña.';
      } else if (msg.contains('SocketException') || msg.contains('timeout')) {
        error = 'Sin conexión al servidor. Verifica tu red.';
      } else {
        error = 'No se pudo iniciar sesión. Intenta de nuevo.';
      }
      debugPrint('[AuthController] Error login: $e');
      return false;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  /// Cierra la sesión.
  Future<void> logout() async {
    await _repository.logout();
    user = null;
    notifyListeners();
  }

  /// Forzar deslogueo por expiración de sesión (401).
  void forceLogout() {
    user = null;
    error = 'Tu sesión expiró. Inicia sesión nuevamente.';
    notifyListeners();
  }
}
