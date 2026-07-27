import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../presentation/despacho_controller.dart';
import '../domain/colaborador_models.dart';

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  final _searchCtrl = TextEditingController();
  final List<String> _roles = const ['admin', 'supervisor', 'despachador', 'consulta'];
  bool _showSearchResults = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DespachoController>().cargarUsuariosSistema();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _buscarPortal() async {
    final query = _searchCtrl.text.trim();
    if (query.isEmpty) return;

    final ctrl = context.read<DespachoController>();
    await ctrl.buscarUsuarioPortal(query);
    setState(() {
      _showSearchResults = true;
    });
  }

  void _cambiarRol(String carnet, String nuevoRol) async {
    final ctrl = context.read<DespachoController>();
    final success = await ctrl.asignarRolUsuario(carnet, nuevoRol);

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Rol $nuevoRol asignado a $carnet con éxito.'),
            backgroundColor: ClaroTheme.success,
          ),
        );
        setState(() {
          _showSearchResults = false;
          _searchCtrl.clear();
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(ctrl.error ?? 'Error al asignar rol.'),
            backgroundColor: ClaroTheme.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final despacho = context.watch<DespachoController>();

    return Scaffold(
      backgroundColor: ClaroTheme.slate50,
      appBar: AppBar(
        title: const Text('Usuarios y Roles'),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded, color: ClaroTheme.slate800),
          onPressed: () => Scaffold.of(context).openDrawer(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── SECCIÓN 1: BUSCADOR EN PORTAL ──
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: ClaroTheme.slate200),
                boxShadow: ClaroTheme.cardShadow,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.search_rounded, color: ClaroTheme.primary, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'Buscar usuario en Portal Claro',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: ClaroTheme.slate900,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _searchCtrl,
                          textInputAction: TextInputAction.search,
                          onSubmitted: (_) => _buscarPortal(),
                          decoration: const InputDecoration(
                            hintText: 'Carnet, nombre o correo...',
                            contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: despacho.searchingPortal ? null : _buscarPortal,
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size(60, 52),
                          padding: EdgeInsets.zero,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: despacho.searchingPortal
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(Icons.search_rounded),
                      ),
                    ],
                  ),

                  // Resultados de búsqueda
                  if (_showSearchResults) ...[
                    const SizedBox(height: 16),
                    const Divider(height: 1, color: ClaroTheme.slate200),
                    const SizedBox(height: 12),
                    if (despacho.usuariosPortal.isEmpty)
                      const Text(
                        'No se encontraron usuarios en el portal.',
                        style: TextStyle(color: ClaroTheme.slate400, fontStyle: FontStyle.italic),
                      )
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: despacho.usuariosPortal.length,
                        itemBuilder: (context, idx) {
                          final user = despacho.usuariosPortal[idx];
                          final existInSystem = despacho.usuariosSistema.any(
                            (x) => x.carnet == user.carnet,
                          );
                          final currentSystemUser = despacho.usuariosSistema.firstWhere(
                            (x) => x.carnet == user.carnet,
                            orElse: () => SystemUser(
                              id: 0,
                              carnet: '',
                              nombre: '',
                              rol: '',
                              activo: false,
                            ),
                          );

                          return Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: ClaroTheme.slate50,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: ClaroTheme.slate200),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            user.nombre,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w700,
                                              fontSize: 14,
                                              color: ClaroTheme.slate900,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            '${user.carnet} ${user.gerencia != null ? '· ${user.gerencia}' : ''}',
                                            style: const TextStyle(
                                              fontSize: 12,
                                              color: ClaroTheme.slate500,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    if (existInSystem)
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 3,
                                        ),
                                        decoration: BoxDecoration(
                                          color: ClaroTheme.primary.withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          'Rol: ${currentSystemUser.rol.toUpperCase()}',
                                          style: const TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.w700,
                                            color: ClaroTheme.primary,
                                          ),
                                        ),
                                      )
                                    else
                                      const Text(
                                        'Sin acceso al sistema',
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: ClaroTheme.slate400,
                                          fontStyle: FontStyle.italic,
                                        ),
                                      ),
                                    DropdownButton<String>(
                                      hint: const Text('Asignar Rol', style: TextStyle(fontSize: 12)),
                                      underline: const SizedBox(),
                                      icon: const Icon(Icons.arrow_drop_down_rounded,
                                          color: ClaroTheme.slate600),
                                      items: _roles.map((rol) {
                                        return DropdownMenuItem<String>(
                                          value: rol,
                                          child: Text(rol.toUpperCase(),
                                              style: const TextStyle(fontSize: 12)),
                                        );
                                      }).toList(),
                                      onChanged: (val) {
                                        if (val != null) {
                                          _cambiarRol(user.carnet, val);
                                        }
                                      },
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 20),

            // ── SECCIÓN 2: USUARIOS DEL SISTEMA ──
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: ClaroTheme.slate200),
                boxShadow: ClaroTheme.cardShadow,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.admin_panel_settings_rounded,
                          color: ClaroTheme.primary, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'Usuarios del Sistema (${despacho.usuariosSistema.length})',
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: ClaroTheme.slate900,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (despacho.loadingUsuarios)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(16.0),
                        child: CircularProgressIndicator(color: ClaroTheme.primary),
                      ),
                    )
                  else if (despacho.usuariosSistema.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Text(
                        'No hay usuarios registrados en el sistema.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: ClaroTheme.slate400,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    )
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: despacho.usuariosSistema.length,
                      separatorBuilder: (_, _) => const Divider(color: ClaroTheme.slate100),
                      itemBuilder: (context, idx) {
                        final u = despacho.usuariosSistema[idx];

                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          u.nombre,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w700,
                                            fontSize: 14,
                                            color: ClaroTheme.slate900,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          'Carnet: ${u.carnet}',
                                          style: const TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w700,
                                            color: ClaroTheme.primary,
                                          ),
                                        ),
                                        if (u.correo != null && u.correo!.isNotEmpty) ...[
                                          const SizedBox(height: 2),
                                          Text(
                                            u.correo!,
                                            style: const TextStyle(
                                              fontSize: 11,
                                              color: ClaroTheme.slate500,
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: u.activo ? ClaroTheme.successLight : ClaroTheme.errorLight,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      u.activo ? 'Activo' : 'Inactivo',
                                      style: TextStyle(
                                        fontSize: 9,
                                        fontWeight: FontWeight.w700,
                                        color: u.activo ? ClaroTheme.success : ClaroTheme.error,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: ClaroTheme.slate100,
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(color: ClaroTheme.slate200),
                                    ),
                                    child: Text(
                                      u.rol.toUpperCase(),
                                      style: const TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w800,
                                        color: ClaroTheme.slate700,
                                      ),
                                    ),
                                  ),
                                  DropdownButton<String>(
                                    value: u.rol,
                                    underline: const SizedBox(),
                                    icon: const Icon(Icons.arrow_drop_down_rounded,
                                        color: ClaroTheme.slate600),
                                    items: _roles.map((rol) {
                                      return DropdownMenuItem<String>(
                                        value: rol,
                                        child: Text(rol.toUpperCase(),
                                            style: const TextStyle(fontSize: 12)),
                                      );
                                    }).toList(),
                                    onChanged: (val) {
                                      if (val != null && val != u.rol) {
                                        _cambiarRol(u.carnet, val);
                                      }
                                    },
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
