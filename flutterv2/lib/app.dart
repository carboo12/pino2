import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/theme/app_theme.dart';
import 'features/auth/presentation/auth_controller.dart';
import 'features/auth/presentation/login_screen.dart';
import 'features/despacho/presentation/despacho_controller.dart';
import 'features/despacho/presentation/home_shell.dart';

class AsistenciaApp extends StatelessWidget {
  const AsistenciaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthController()..initialize()),
        ChangeNotifierProvider(create: (_) => DespachoController()),
      ],
      child: MaterialApp(
        title: 'Claro Despacho',
        debugShowCheckedModeBanner: false,
        theme: ClaroTheme.theme,
        home: const _AppRoot(),
      ),
    );
  }
}

/// Widget raíz que decide qué pantalla mostrar según el estado de autenticación.
class _AppRoot extends StatelessWidget {
  const _AppRoot();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();

    // Splash / Loading
    if (!auth.initialized || auth.loading) {
      return Scaffold(
        backgroundColor: ClaroTheme.slate50,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  gradient: ClaroTheme.heroGradient,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: const Icon(
                  Icons.card_giftcard_rounded,
                  color: Colors.white,
                  size: 36,
                ),
              ),
              const SizedBox(height: 24),
              const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: ClaroTheme.primary,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Claro Despacho',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: ClaroTheme.slate900,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Iniciando...',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 13,
                  color: ClaroTheme.slate400,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return auth.isAuthenticated ? const HomeShell() : const LoginScreen();
  }
}
