import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../../auth/presentation/auth_controller.dart';
import 'dashboard_screen.dart';
import 'attendance_screen.dart';
import 'dispatch_screen.dart';
import 'catalog_screen.dart';
import 'history_screen.dart';
import 'import_screen.dart';
import 'admin_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _selectedIndex = 0;

  final List<Widget> _screens = const [
    DashboardScreen(),
    AttendanceScreen(),
    DispatchScreen(),
    CatalogScreen(),
    HistoryScreen(),
    ImportScreen(),
    AdminScreen(),
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
    Navigator.pop(context); // Cerrar el drawer
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();

    return Scaffold(
      drawer: Drawer(
        backgroundColor: Colors.white,
        child: Column(
          children: [
            // Header
            DrawerHeader(
              decoration: const BoxDecoration(
                gradient: ClaroTheme.heroGradient,
              ),
              child: Align(
                alignment: Alignment.bottomLeft,
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          auth.user?.nombre.substring(0, 1).toUpperCase() ?? 'U',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            auth.user?.nombre ?? 'Operador',
                            style: const TextStyle(
                              fontFamily: 'Inter',
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            auth.user?.rol.toUpperCase() ?? 'DESPACHADOR',
                            style: TextStyle(
                              fontFamily: 'Inter',
                              color: Colors.white.withValues(alpha: 0.6),
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Navigation Items
            ListTile(
              leading: const Icon(Icons.dashboard_rounded),
              title: const Text('Dashboard'),
              selected: _selectedIndex == 0,
              selectedColor: ClaroTheme.primary,
              iconColor: ClaroTheme.slate500,
              textColor: ClaroTheme.slate700,
              onTap: () => _onItemTapped(0),
            ),
            ListTile(
              leading: const Icon(Icons.how_to_reg_rounded),
              title: const Text('Registro Asistencia'),
              selected: _selectedIndex == 1,
              selectedColor: ClaroTheme.primary,
              iconColor: ClaroTheme.slate500,
              textColor: ClaroTheme.slate700,
              onTap: () => _onItemTapped(1),
            ),
            ListTile(
              leading: const Icon(Icons.card_giftcard_rounded),
              title: const Text('Despacho'),
              selected: _selectedIndex == 2,
              selectedColor: ClaroTheme.primary,
              iconColor: ClaroTheme.slate500,
              textColor: ClaroTheme.slate700,
              onTap: () => _onItemTapped(2),
            ),
            ListTile(
              leading: const Icon(Icons.inventory_2_rounded),
              title: const Text('Catálogo'),
              selected: _selectedIndex == 3,
              selectedColor: ClaroTheme.primary,
              iconColor: ClaroTheme.slate500,
              textColor: ClaroTheme.slate700,
              onTap: () => _onItemTapped(3),
            ),
            ListTile(
              leading: const Icon(Icons.history_rounded),
              title: const Text('Historial'),
              selected: _selectedIndex == 4,
              selectedColor: ClaroTheme.primary,
              iconColor: ClaroTheme.slate500,
              textColor: ClaroTheme.slate700,
              onTap: () => _onItemTapped(4),
            ),
            ListTile(
              leading: const Icon(Icons.upload_file_rounded),
              title: const Text('Importar'),
              selected: _selectedIndex == 5,
              selectedColor: ClaroTheme.primary,
              iconColor: ClaroTheme.slate500,
              textColor: ClaroTheme.slate700,
              onTap: () => _onItemTapped(5),
            ),
            ListTile(
              leading: const Icon(Icons.admin_panel_settings_rounded),
              title: const Text('Usuarios'),
              selected: _selectedIndex == 6,
              selectedColor: ClaroTheme.primary,
              iconColor: ClaroTheme.slate500,
              textColor: ClaroTheme.slate700,
              onTap: () => _onItemTapped(6),
            ),

            const Spacer(),
            const Divider(height: 1, color: ClaroTheme.slate200),

            // Cerrar Sesión
            ListTile(
              leading: const Icon(Icons.logout_rounded, color: ClaroTheme.error),
              title: const Text(
                'Cerrar Sesión',
                style: TextStyle(color: ClaroTheme.error, fontWeight: FontWeight.w600),
              ),
              onTap: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Cerrar Sesión'),
                    content: const Text('¿Deseas cerrar tu sesión de operador?'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx, false),
                        child: const Text('Cancelar'),
                      ),
                      TextButton(
                        onPressed: () => Navigator.pop(ctx, true),
                        child: const Text(
                          'Cerrar Sesión',
                          style: TextStyle(color: ClaroTheme.error),
                        ),
                      ),
                    ],
                  ),
                );
                if (confirm == true && context.mounted) {
                  Navigator.pop(context); // cerrar drawer
                  await auth.logout();
                }
              },
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
      body: IndexedStack(
        index: _selectedIndex,
        children: _screens,
      ),
    );
  }
}
