import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/models/auth_session.dart';
import '../domain/models/auth_user.dart';

class AuthRepository {
  const AuthRepository(this._client);

  final AppApiClient _client;

  Future<AuthSession> login(String email, String password) async {
    final response = await _client.postMap(
      '/auth/login',
      data: {'email': email, 'password': password},
    );

    return _mapSession(response);
  }

  Future<AuthSession> refresh(String refreshToken) async {
    final response = await _client.postMap(
      '/auth/refresh',
      bearerToken: refreshToken,
    );

    return _mapSession(response);
  }

  Future<AuthUser> getProfile(String accessToken) async {
    try {
      final response = await _client.getMap(
        '/auth/me',
        bearerToken: accessToken,
      );
      return AuthUser.fromJson(response);
    } catch (_) {
      final response = await _client.getMap(
        '/auth/profile',
        bearerToken: accessToken,
      );
      return AuthUser.fromJson(response);
    }
  }

  AuthSession _mapSession(Map<String, dynamic> json) {
    final rawUser = json['user'] ?? (json['data'] is Map ? json['data']['user'] : null) ?? json;
    final userMap = rawUser is Map ? Map<String, dynamic>.from(rawUser) : <String, dynamic>{};

    final accessToken = (json['accessToken'] ?? json['access_token'] ?? json['token'] ??
            (json['data'] is Map ? json['data']['accessToken'] ?? json['data']['access_token'] : ''))
        .toString();
    final refreshToken = (json['refreshToken'] ?? json['refresh_token'] ??
            (json['data'] is Map ? json['data']['refreshToken'] ?? json['data']['refresh_token'] : ''))
        .toString();

    return AuthSession(
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: AuthUser.fromJson(userMap),
    );
  }
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.read(appApiClientProvider));
});
