import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

enum NetworkStatus { online, offline }

/// Servicio de conectividad de red para Pino Mobile.
class ConnectivityService extends ChangeNotifier {
  ConnectivityService() {
    _init();
  }

  final Connectivity _connectivity = Connectivity();
  StreamSubscription<ConnectivityResult>? _subscription;
  NetworkStatus _status = NetworkStatus.online;

  NetworkStatus get status => _status;
  bool get isOnline => _status == NetworkStatus.online;

  void _init() async {
    _status = await getCurrentStatus();
    notifyListeners();

    _subscription = _connectivity.onConnectivityChanged.listen((result) {
      final newStatus = _mapResult(result);
      if (newStatus != _status) {
        _status = newStatus;
        notifyListeners();
      }
    });
  }

  Future<NetworkStatus> getCurrentStatus() async {
    final result = await _connectivity.checkConnectivity();
    return _mapResult(result);
  }

  NetworkStatus _mapResult(ConnectivityResult result) {
    if (result == ConnectivityResult.none) {
      return NetworkStatus.offline;
    }
    return NetworkStatus.online;
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}
