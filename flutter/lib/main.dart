import 'dart:developer';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/services/push_notification_service.dart';

import 'app/app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Push Notifications (non-blocking — app works without Firebase)
  try {
    await PushNotificationService.instance.initialize();
  } catch (e, st) {
    log('⚠️ Push notifications init failed (app continues): $e',
        error: e, stackTrace: st, name: 'MAIN');
  }
  
  runApp(const ProviderScope(child: PinoApp()));
}
