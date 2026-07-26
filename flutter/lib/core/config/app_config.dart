class AppConfig {
  const AppConfig._();

  static const appName = 'Pino Mobile';

  // PRODUCCIÓN / REMOTO (Conservado en comentarios):
  // defaultValue: 'https://www.rhclaroni.com/api-dev',
  static const apiBaseUrl = String.fromEnvironment(
    'PINO_API_BASE_URL',
    defaultValue: 'http://localhost:3010/api',
  );

  // Socket base URL (Producción conservado: 'https://www.rhclaroni.com/api-dev')
  static const socketBaseUrl = String.fromEnvironment(
    'PINO_SOCKET_BASE_URL',
    defaultValue: 'http://localhost:3010',
  );

  // Path for socket.io
  static const socketPath = String.fromEnvironment(
    'PINO_SOCKET_PATH',
    defaultValue: '/socket.io',
  );

  // Namespace for events
  static const socketNamespace = String.fromEnvironment(
    'PINO_SOCKET_NAMESPACE',
    defaultValue: '/events',
  );
}
