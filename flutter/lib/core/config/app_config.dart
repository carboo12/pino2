class AppConfig {
  const AppConfig._();

  static const appName = 'Pino Mobile';

  // Endpoint de Producción (CONTRACT_FREEZE_1):
  static const apiBaseUrl = String.fromEnvironment(
    'PINO_API_BASE_URL',
    defaultValue: 'https://rhclaroni.com/api-dev',
  );

  // Socket base URL
  static const socketBaseUrl = String.fromEnvironment(
    'PINO_SOCKET_BASE_URL',
    defaultValue: 'https://rhclaroni.com',
  );

  // Path for socket.io
  static const socketPath = String.fromEnvironment(
    'PINO_SOCKET_PATH',
    defaultValue: '/api-dev/socket.io',
  );

  // Namespace for events
  static const socketNamespace = String.fromEnvironment(
    'PINO_SOCKET_NAMESPACE',
    defaultValue: '/events',
  );
}
