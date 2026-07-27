import 'api_environment.dart';

/// Configuración global de la aplicación.
class AppConfig {
  static const String appName = 'Pino Mobile';

  /// ID del evento activo (Día del Niño 2026).
  static const int activeEventId = 1;

  /// Dominio de producción.
  static const String productionDomain = 'rhclaroni.com';

  /// Indica si la app corre en modo producción.
  static bool get isProduction =>
      ApiEnvironment.baseUrl.startsWith('https://');
}
