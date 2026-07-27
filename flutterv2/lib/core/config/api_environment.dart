/// Configuración de URLs del API por ambiente.
///
/// Configurable en compile-time con `--dart-define`:
///   flutter run --dart-define=API_BASE_URL=https://tuservidor.com/api/
class ApiEnvironment {
  /// URL del backend NestJS de Asistencia.
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://rhclaroni.com/api-dev/',
  );

  /// URL del Portal Corporativo (login SSO).
  static const String portalBaseUrl = String.fromEnvironment(
    'PORTAL_API_URL',
    defaultValue: 'https://rhclaroni.com/api-portal-test/',
  );

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 15);

  /// Convierte una ruta relativa del backend en una URL absoluta utilizando el host de baseUrl.
  static String resolveUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    if (path.startsWith('data:image')) {
      return path;
    }
    try {
      final uri = Uri.parse(baseUrl);
      final portStr = uri.port != 80 && uri.port != 443 && uri.port != 0 ? ':${uri.port}' : '';
      final host = '${uri.scheme}://${uri.host}$portStr';
      final normalizedPath = path.startsWith('/') ? path : '/$path';
      return '$host$normalizedPath';
    } catch (_) {
      return path;
    }
  }
}
