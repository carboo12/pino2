import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';

import '../../../core/theme/app_theme.dart';
import '../presentation/despacho_controller.dart';

class ImportScreen extends StatefulWidget {
  const ImportScreen({super.key});

  @override
  State<ImportScreen> createState() => _ImportScreenState();
}

class _ImportScreenState extends State<ImportScreen> with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  File? _selectedFile;
  bool _importing = false;
  Map<String, dynamic>? _result;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
    _tabCtrl.addListener(() {
      setState(() {
        _selectedFile = null;
        _result = null;
        _error = null;
      });
    });
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickFile() async {
    try {
      final res = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['xlsx'],
      );

      if (res != null && res.files.single.path != null) {
        setState(() {
          _selectedFile = File(res.files.single.path!);
          _result = null;
          _error = null;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al seleccionar archivo: $e'),
            backgroundColor: ClaroTheme.error,
          ),
        );
      }
    }
  }

  void _clearFile() {
    setState(() {
      _selectedFile = null;
      _result = null;
      _error = null;
    });
  }

  Future<void> _import() async {
    if (_selectedFile == null) return;

    setState(() {
      _importing = true;
      _result = null;
      _error = null;
    });

    final ctrl = context.read<DespachoController>();
    final tipo = _tabCtrl.index == 0 ? 'censo' : 'catalogo';

    try {
      final res = await ctrl.importarExcel(
        archivo: _selectedFile!,
        tipo: tipo,
      );

      setState(() {
        _result = res;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Importación exitosa'),
            backgroundColor: ClaroTheme.success,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _error = ctrl.error ?? e.toString();
      });
    } finally {
      setState(() {
        _importing = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final tipo = _tabCtrl.index == 0 ? 'censo' : 'catalogo';

    return Scaffold(
      backgroundColor: ClaroTheme.slate50,
      appBar: AppBar(
        title: const Text('Importar Excel'),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded, color: ClaroTheme.slate800),
          onPressed: () => Scaffold.of(context).openDrawer(),
        ),
        bottom: TabBar(
          controller: _tabCtrl,
          indicatorColor: ClaroTheme.primary,
          labelColor: ClaroTheme.primary,
          unselectedLabelColor: ClaroTheme.slate500,
          labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontFamily: 'Inter'),
          tabs: const [
            Tab(text: 'Censo de Familias'),
            Tab(text: 'Catálogo de Juguetes'),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Card Principal
            Container(
              padding: const EdgeInsets.all(20),
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
                      const Icon(Icons.file_present_rounded, color: ClaroTheme.primary, size: 22),
                      const SizedBox(width: 8),
                      Text(
                        'Archivo de Importación (${tipo.toUpperCase()})',
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: ClaroTheme.slate900,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Área de Carga / Selección
                  GestureDetector(
                    onTap: _importing ? null : _pickFile,
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 16),
                      decoration: BoxDecoration(
                        color: ClaroTheme.slate50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _selectedFile != null ? ClaroTheme.success : ClaroTheme.slate300,
                          style: BorderStyle.solid,
                          width: 1.5,
                        ),
                      ),
                      child: Column(
                        children: [
                          Icon(
                            Icons.upload_file_rounded,
                            size: 44,
                            color: _selectedFile != null ? ClaroTheme.success : ClaroTheme.slate400,
                          ),
                          const SizedBox(height: 12),
                          if (_selectedFile == null) ...[
                            const Text(
                              'Seleccione archivo .xlsx',
                              style: TextStyle(
                                fontFamily: 'Inter',
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: ClaroTheme.slate800,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              tipo == 'censo'
                                  ? 'PADRE_HIJOS.xlsx'
                                  : 'JUGUETES_2026.xlsx',
                              style: const TextStyle(
                                fontFamily: 'Inter',
                                fontSize: 11,
                                color: ClaroTheme.slate400,
                              ),
                            ),
                          ] else ...[
                            Text(
                              _selectedFile!.path.split(Platform.pathSeparator).last,
                              style: const TextStyle(
                                fontFamily: 'Inter',
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: ClaroTheme.slate800,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 8),
                            TextButton.icon(
                              onPressed: _importing ? null : _clearFile,
                              icon: const Icon(Icons.delete_outline_rounded, size: 16),
                              label: const Text('Quitar archivo'),
                              style: TextButton.styleFrom(
                                foregroundColor: ClaroTheme.error,
                                padding: EdgeInsets.zero,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Botón de Importar
                  ElevatedButton(
                    onPressed: (_selectedFile == null || _importing) ? null : _import,
                    child: _importing
                        ? const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              ),
                              SizedBox(width: 12),
                              Text('Procesando...'),
                            ],
                          )
                        : const Text('Comenzar Importación'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Resultados de éxito
            if (_result != null)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: ClaroTheme.successLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: ClaroTheme.success.withValues(alpha: 0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '✅ Importación exitosa',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: ClaroTheme.success,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (tipo == 'censo') ...[
                      Text(
                        'Colaboradores procesados: ${_result!['colaboradores'] ?? '-'}',
                        style: const TextStyle(fontSize: 13, color: ClaroTheme.success),
                      ),
                      Text(
                        'Hijos registrados: ${_result!['hijos'] ?? '-'}',
                        style: const TextStyle(fontSize: 13, color: ClaroTheme.success),
                      ),
                    ] else ...[
                      Text(
                        'Juguetes importados: ${_result!['juguetes'] ?? '-'}',
                        style: const TextStyle(fontSize: 13, color: ClaroTheme.success),
                      ),
                    ],
                  ],
                ),
              ),

            // Resultados de error
            if (_error != null)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: ClaroTheme.errorLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: ClaroTheme.error.withValues(alpha: 0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '❌ Error al importar',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: ClaroTheme.error,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _error!,
                      style: const TextStyle(fontSize: 13, color: ClaroTheme.error),
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
