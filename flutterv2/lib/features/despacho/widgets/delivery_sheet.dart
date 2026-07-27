import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/premium_widgets.dart';
import '../domain/colaborador_models.dart';
import '../presentation/despacho_controller.dart';

/// BottomSheet modal para confirmar la entrega de un juguete.
class DeliverySheet extends StatefulWidget {
  final Hijo hijo;
  final String carnetColaborador;
  final File? fotoColaborador;

  const DeliverySheet({
    super.key,
    required this.hijo,
    required this.carnetColaborador,
    this.fotoColaborador,
  });

  @override
  State<DeliverySheet> createState() => _DeliverySheetState();
}

class _DeliverySheetState extends State<DeliverySheet> {
  String _recibidoPor = 'COLABORADOR';
  final _nombreReceptorCtrl = TextEditingController();
  File? _fotoFile;
  Juguete? _jugueteSeleccionado;
  bool _processing = false;
  String? _localError;

  @override
  void initState() {
    super.initState();
    _jugueteSeleccionado = widget.hijo.jugueteSugerido;
    // Precargar catálogo para alternativas
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DespachoController>().cargarCatalogo();
    });
  }

  @override
  void dispose() {
    _nombreReceptorCtrl.dispose();
    super.dispose();
  }

  bool get _isValid {
    if (_jugueteSeleccionado == null) return false;
    if (_recibidoPor == 'TERCERO' && _nombreReceptorCtrl.text.trim().length < 3) return false;
    if (_fotoFile == null && widget.fotoColaborador == null) return false;
    return true;
  }

  @override
  Widget build(BuildContext context) {
    final despacho = context.watch<DespachoController>();
    final catalogo = despacho.catalogoJuguetes;

    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              // ── Handle ──
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppTheme.slate300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),

              // ── Scrollable content ──
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  children: [
                    // ── Header: Info del niño ──
                    Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Icon(
                            widget.hijo.generoHijo.toUpperCase() == 'F'
                                ? Icons.face_3_rounded
                                : Icons.face_rounded,
                            color: AppTheme.primary,
                            size: 28,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Entregar a ${widget.hijo.nombreHijo}',
                                style: const TextStyle(
                                  fontFamily: 'Inter',
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.slate900,
                                ),
                              ),
                              Text(
                                '${widget.hijo.edadHijo} años · ${widget.hijo.generoHijo.toUpperCase()} · ${widget.hijo.categoria ?? ""}',
                                style: const TextStyle(
                                  fontFamily: 'Inter',
                                  fontSize: 13,
                                  color: AppTheme.slate500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),
                    _buildDivider('Juguete'),

                    // ── Juguete: selector filtrado por categoría + género ──
                    _buildToySelector(catalogo),

                    const SizedBox(height: 16),
                    _buildDivider('¿Quién recibe?'),

                    // ── Selector de receptor ──
                    Row(
                      children: [
                        _buildReceiverChip('COLABORADOR', 'Colaborador', Icons.person),
                        const SizedBox(width: 8),
                        _buildReceiverChip('CONYUGE', 'Cónyuge', Icons.people),
                        const SizedBox(width: 8),
                        _buildReceiverChip('TERCERO', 'Tercero', Icons.person_add),
                      ],
                    ),

                    // Campo de nombre del tercero
                    if (_recibidoPor == 'TERCERO') ...[
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _nombreReceptorCtrl,
                        decoration: InputDecoration(
                          labelText: 'Nombre del tercero',
                          hintText: 'Mínimo 3 caracteres',
                          prefixIcon: const Icon(Icons.person_outline),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onChanged: (_) => setState(() {}),
                      ),
                    ],

                    const SizedBox(height: 20),
                    _buildDivider('Foto de Evidencia (Requerida)'),

                    // ── Captura de foto ──
                    if (_fotoFile != null)
                      Stack(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.file(
                              _fotoFile!,
                              height: 180,
                              width: double.infinity,
                              fit: BoxFit.cover,
                            ),
                          ),
                          Positioned(
                            top: 8,
                            right: 8,
                            child: GestureDetector(
                              onTap: () => setState(() => _fotoFile = null),
                              child: Container(
                                padding: const EdgeInsets.all(6),
                                decoration: const BoxDecoration(
                                  color: Colors.black54,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.close, color: Colors.white, size: 18),
                              ),
                            ),
                          ),
                        ],
                      )
                    else
                      OutlinedButton.icon(
                        onPressed: _processing ? null : _tomarFoto,
                        icon: const Icon(Icons.camera_alt_outlined, size: 20),
                        label: const Text('Tomar Foto'),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size(double.infinity, 52),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),

                    const SizedBox(height: 24),

                    // ── Errores ──
                    if (_localError != null || despacho.error != null)
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: AppTheme.errorLight,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppTheme.red200),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline, color: AppTheme.error, size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _localError ?? despacho.error ?? '',
                                style: const TextStyle(
                                  color: AppTheme.error,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                    // ── Validaciones ──
                    _buildValidationRow(
                      _jugueteSeleccionado != null && _jugueteSeleccionado!.stockActual > 0,
                      'Stock disponible',
                    ),
                    const SizedBox(height: 4),
                    _buildValidationRow(
                      _recibidoPor != 'TERCERO' ||
                          _nombreReceptorCtrl.text.trim().length >= 3,
                      'Receptor identificado',
                    ),

                    const SizedBox(height: 24),

                    // ── Botón de confirmación ──
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton.icon(
                        onPressed: (_isValid && !_processing && !despacho.delivering)
                            ? _confirmarEntrega
                            : null,
                        icon: despacho.delivering
                            ? const SizedBox(
                                width: 18, height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Icon(Icons.check_rounded, size: 20),
                        label: Text(
                          despacho.delivering ? 'Entregando...' : 'Completar Entrega',
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 0,
                        ),
                      ),
                    ),

                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDivider(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        label,
        style: const TextStyle(
          fontFamily: 'Inter',
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: AppTheme.slate500,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildReceiverChip(String value, String label, IconData icon) {
    final selected = _recibidoPor == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _recibidoPor = value),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: selected
                ? AppTheme.primary.withValues(alpha: 0.1)
                : AppTheme.slate50,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: selected ? AppTheme.primary : AppTheme.slate200,
              width: selected ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(
                icon,
                size: 20,
                color: selected ? AppTheme.primary : AppTheme.slate400,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 11,
                  fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                  color: selected ? AppTheme.primary : AppTheme.slate500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildValidationRow(bool valid, String label) {
    return Row(
      children: [
        Icon(
          valid ? Icons.check_circle : Icons.radio_button_unchecked,
          size: 16,
          color: valid ? AppTheme.success : AppTheme.slate300,
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: TextStyle(
            fontFamily: 'Inter',
            fontSize: 12,
            color: valid ? AppTheme.success : AppTheme.slate400,
          ),
        ),
      ],
    );
  }

  Future<void> _tomarFoto() async {
    try {
      final picker = ImagePicker();
      final xFile = await picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1920,
        imageQuality: 90,
      );

      if (xFile == null) return;

      setState(() => _processing = true);

      // Comprimir a WebP
      final tempDir = await getTemporaryDirectory();
      final targetPath = '${tempDir.path}/${const Uuid().v4()}.webp';

      final compressed = await FlutterImageCompress.compressAndGetFile(
        xFile.path,
        targetPath,
        format: CompressFormat.webp,
        quality: 80,
        minWidth: 1024,
        minHeight: 768,
      );

      if (compressed != null) {
        setState(() {
          _fotoFile = File(compressed.path);
          _processing = false;
        });
        debugPrint('[Delivery] Foto comprimida: ${await _fotoFile!.length()} bytes');
      } else {
        // Usar foto original sin comprimir
        setState(() {
          _fotoFile = File(xFile.path);
          _processing = false;
        });
      }
    } catch (e) {
      debugPrint('[Delivery] Error capturando foto: $e');
      setState(() => _processing = false);
    }
  }

  // ignore: unused_element
  void _showJugueteSelector(List<Juguete> catalogo) {
    // Filtrar por categoría del hijo si es posible
    final filtrados = catalogo
        .where((j) => j.stockActual > 0)
        .toList();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.3,
        maxChildSize: 0.8,
        expand: false,
        builder: (ctx, sc) => Column(
          children: [
            const SizedBox(height: 16),
            const Text(
              'Seleccionar Juguete',
              style: TextStyle(
                fontFamily: 'Inter',
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: ListView.builder(
                controller: sc,
                itemCount: filtrados.length,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                itemBuilder: (ctx, i) {
                  final j = filtrados[i];
                  final selected = j.id == _jugueteSeleccionado?.id;
                  return ListTile(
                    leading: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: AppTheme.slate200),
                      ),
                      child: AppImage(
                        url: j.fotoUrl,
                        width: 40,
                        height: 40,
                        borderRadius: 5,
                        fit: BoxFit.cover,
                        errorWidget: Container(
                          color: AppTheme.slate50,
                          child: Icon(
                            Icons.card_giftcard,
                            color: selected ? AppTheme.primary : AppTheme.slate400,
                          ),
                        ),
                      ),
                    ),
                    title: Text(j.nombreJuguete),
                    subtitle: Text(
                      '${j.categoria ?? ""} · ${j.genero ?? ""} · Stock: ${j.stockActual}',
                    ),
                    trailing: selected
                        ? const Icon(Icons.check_circle, color: AppTheme.primary)
                        : null,
                    selected: selected,
                    onTap: () {
                      setState(() => _jugueteSeleccionado = j);
                      Navigator.pop(ctx);
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildToySelector(List<Juguete> catalogo) {
    final opciones = catalogo.where((j) =>
      j.stockActual > 0 &&
      j.categoria != null &&
      _jugueteSeleccionado?.categoria != null &&
      j.categoria == _jugueteSeleccionado!.categoria &&
      (j.genero == widget.hijo.generoHijo || j.genero == 'TODOS' || j.genero == null)
    ).toList();

    final multiple = opciones.length > 1;

    if (_jugueteSeleccionado == null) return const SizedBox.shrink();

    if (multiple) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        decoration: BoxDecoration(
          color: AppTheme.slate50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.slate200),
        ),
        child: DropdownButtonFormField<int>(
          value: _jugueteSeleccionado!.id,
          decoration: const InputDecoration(
            border: InputBorder.none,
            contentPadding: EdgeInsets.zero,
          ),
          isExpanded: true,
          items: opciones.map((j) => DropdownMenuItem(
            value: j.id,
            child: Row(
              children: [
                Container(
                  width: 32, height: 32,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: AppTheme.slate200),
                  ),
                  child: AppImage(
                    url: j.fotoUrl, width: 32, height: 32,
                    borderRadius: 5, fit: BoxFit.cover,
                    errorWidget: const Icon(Icons.card_giftcard_rounded, size: 16, color: AppTheme.primary),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text('${j.nombreJuguete} (Stock: ${j.stockActual})', style: const TextStyle(fontSize: 13)),
                ),
              ],
            ),
          )).toList(),
          onChanged: (id) {
            if (id != null) {
              setState(() => _jugueteSeleccionado = opciones.firstWhere((j) => j.id == id));
            }
          },
        ),
      );
    }

    // Solo 1 opción: mostrar directamente
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.slate50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.slate200),
      ),
      child: Row(
        children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppTheme.slate200),
            ),
            child: AppImage(
              url: _jugueteSeleccionado!.fotoUrl, width: 44, height: 44,
              borderRadius: 7, fit: BoxFit.cover,
              errorWidget: Container(
                color: Colors.white,
                child: const Icon(Icons.card_giftcard_rounded, color: AppTheme.primary, size: 22),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_jugueteSeleccionado!.nombreJuguete, style: const TextStyle(fontFamily: 'Inter', fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.slate800)),
                Text('Stock: ${_jugueteSeleccionado!.stockActual} disponibles', style: TextStyle(fontFamily: 'Inter', fontSize: 12, color: _jugueteSeleccionado!.stockActual > 0 ? AppTheme.success : AppTheme.error, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmarEntrega() async {
    if (!_isValid) {
      setState(() => _localError = 'Completa todos los campos requeridos.');
      return;
    }

    final despacho = context.read<DespachoController>();
    final fotoUsar = _fotoFile ?? widget.fotoColaborador;
    final success = await despacho.confirmarDespacho(
      hijoId: widget.hijo.id,
      jugueteId: _jugueteSeleccionado!.id,
      recibidoPor: _recibidoPor,
      nombreReceptor: _recibidoPor == 'TERCERO'
          ? _nombreReceptorCtrl.text.trim()
          : null,
      fotoFile: fotoUsar,
    );

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '🎁 ${_jugueteSeleccionado!.nombreJuguete} entregado a ${widget.hijo.nombreHijo}',
                ),
              ),
            ],
          ),
          backgroundColor: AppTheme.success,
          behavior: SnackBarBehavior.floating,
        ),
      );
      Navigator.pop(context, true);
    }
  }
}
