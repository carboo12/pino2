import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/premium_widgets.dart';
import '../domain/colaborador_models.dart';
import '../presentation/despacho_controller.dart';
import '../../auth/presentation/auth_controller.dart';
import '../widgets/child_card.dart';
import '../widgets/delivery_sheet.dart';

class DetailScreen extends StatefulWidget {
  const DetailScreen({super.key});

  @override
  State<DetailScreen> createState() => _DetailScreenState();
}

class _DetailScreenState extends State<DetailScreen> {
  File? _colaboradorFoto;
  String _recibidoPor = 'COLABORADOR';
  final _nombreReceptorCtrl = TextEditingController();

  @override
  void dispose() {
    _nombreReceptorCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final despacho = context.watch<DespachoController>();
    final lookup = despacho.lookupResult;
    final canRevert = auth.userRol == 'admin' || auth.userRol == 'supervisor';

    if (lookup == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Ficha')),
        body: const PremiumEmptyState(
          icon: Icons.person_off_outlined,
          title: 'Sin datos',
          subtitle: 'No se encontró información del colaborador.',
        ),
      );
    }

    final colab = lookup.colaborador;
    final hijos = lookup.hijos;
    final pendientes = hijos.where((h) => !h.entregado).toList();
    final tieneFotoEvidencia = hijos.any((h) => h.fotoEvidenciaUrl != null && h.fotoEvidenciaUrl!.isNotEmpty);

    return Scaffold(
      backgroundColor: ClaroTheme.slate50,
      appBar: AppBar(
        title: const Text('Ficha Familiar'),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: despacho.loading
                ? null
                : () => despacho.buscarColaborador(colab.carnet),
            tooltip: 'Recargar',
          ),
        ],
      ),
      body: RefreshIndicator(
        color: ClaroTheme.primary,
        onRefresh: () => despacho.buscarColaborador(colab.carnet),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            StaggeredFadeIn(index: 0, child: _buildColaboradorCard(colab, lookup)),
            const SizedBox(height: 16),
            StaggeredFadeIn(index: 1, child: _buildAsistenciaCard(lookup, despacho)),

            if (!lookup.asistio) ...[
              const SizedBox(height: 16),
              StaggeredFadeIn(
                index: 2,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: ClaroTheme.red50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: ClaroTheme.red200),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.warning_amber_rounded, color: ClaroTheme.primary, size: 24),
                      SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Asistencia No Registrada', style: TextStyle(fontFamily: 'Inter', fontSize: 14, color: ClaroTheme.primaryDark, fontWeight: FontWeight.w700)),
                            SizedBox(height: 6),
                            Text('El colaborador no ha registrado su asistencia al evento. Para poder despachar los juguetes de sus hijos, primero debe registrar su asistencia.', style: TextStyle(fontFamily: 'Inter', fontSize: 13, color: ClaroTheme.primaryDark, fontWeight: FontWeight.w500)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],

            if (lookup.asistio) ...[
              const SizedBox(height: 20),

              // ── Validación MANAGUA ──
              if (colab.departamentoGeografico != null && colab.departamentoGeografico!.toUpperCase() != 'MANAGUA')
                Container(
                  padding: const EdgeInsets.all(14),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(color: const Color(0xFFFEF2F2), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFFECACA))),
                  child: const Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.gpp_bad_rounded, color: Color(0xFFDC2626), size: 22),
                      SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Fuera de cobertura', style: TextStyle(fontFamily: 'Inter', fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF991B1B))),
                            SizedBox(height: 4),
                            Text('Este colaborador no pertenece a MANAGUA. El despacho de juguetes solo aplica para personal de Managua.', style: TextStyle(fontSize: 12, color: Color(0xFFB91C1C))),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

              // ── Foto evidencia (1 por colaborador) ──
              StaggeredFadeIn(
                index: 2,
                child: _buildFotoEvidenciaSection(tieneFotoEvidencia, despacho),
              ),
              const SizedBox(height: 16),

              // ── "Despachar Todo" ──
              if (pendientes.length > 1 && colab.departamentoGeografico?.toUpperCase() == 'MANAGUA')
                StaggeredFadeIn(
                  index: 3,
                  child: _buildDespacharTodoSection(pendientes, colab.carnet, despacho),
                ),
              if (pendientes.length > 1) const SizedBox(height: 16),

              // ── Sección de Hijos ──
              StaggeredFadeIn(
                index: pendientes.length > 1 ? 4 : 3,
                child: Row(
                  children: [
                    const Icon(Icons.child_care_rounded, color: ClaroTheme.primary, size: 20),
                    const SizedBox(width: 8),
                    Text('Hijos (${_hijosEntregados(hijos)}/${hijos.length} entregados)', style: const TextStyle(fontFamily: 'Inter', fontSize: 16, fontWeight: FontWeight.w700, color: ClaroTheme.slate900)),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              if (hijos.isEmpty)
                const PremiumEmptyState(icon: Icons.child_care_outlined, title: 'Sin hijos registrados', subtitle: 'Este colaborador no tiene hijos en el censo para este evento.'),

              ...List.generate(hijos.length, (i) {
                final hijo = hijos[i];
                return StaggeredFadeIn(
                  index: (pendientes.length > 1 ? 4 : 3) + i + 1,
                  child: ChildCard(
                    hijo: hijo,
                    asistenciaRegistrada: lookup.asistio,
                    onDespachar: (hijo.pendiente || hijo.reversado) && colab.departamentoGeografico?.toUpperCase() == 'MANAGUA'
                        ? () => _abrirDeliverySheet(hijo, colab.carnet)
                        : null,
                    onReversar: (hijo.entregado && canRevert)
                        ? () => _mostrarDialogReversar(hijo, despacho)
                        : null,
                    onUpdateFoto: hijo.entregado
                        ? () => _actualizarFotoEvidencia(hijo)
                        : null,
                  ),
                );
              }),
            ],

            if (despacho.error != null)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: ClaroTheme.errorLight,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: ClaroTheme.red200),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: ClaroTheme.error, size: 18),
                      const SizedBox(width: 8),
                      Expanded(child: Text(despacho.error!, style: const TextStyle(color: ClaroTheme.error, fontSize: 13))),
                    ],
                  ),
                ),
              ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildColaboradorCard(Colaborador colab, LookupResult lookup) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), boxShadow: ClaroTheme.cardShadow),
      child: Row(
        children: [
          Container(
            width: 64, height: 64,
            decoration: BoxDecoration(gradient: ClaroTheme.heroGradient, borderRadius: BorderRadius.circular(16)),
            child: AppImage(
              url: lookup.fotoHcm, width: 64, height: 64, borderRadius: 16, fit: BoxFit.cover,
              errorWidget: const Icon(Icons.person, color: Colors.white, size: 32),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(colab.nombre, style: const TextStyle(fontFamily: 'Inter', fontSize: 18, fontWeight: FontWeight.w700, color: ClaroTheme.slate900)),
                const SizedBox(height: 4),
                Text('Carnet: ${colab.carnet}', style: const TextStyle(fontFamily: 'Inter', fontSize: 14, color: ClaroTheme.slate500, fontWeight: FontWeight.w500)),
                if (colab.gerencia != null) ...[
                  const SizedBox(height: 2),
                  Text(colab.gerencia!, style: const TextStyle(fontFamily: 'Inter', fontSize: 12, color: ClaroTheme.slate400)),
                ],
                if (colab.departamentoGeografico != null) ...[
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                        decoration: BoxDecoration(
                          color: colab.departamentoGeografico!.toUpperCase() == 'MANAGUA' ? ClaroTheme.successLight : ClaroTheme.slate100,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(colab.departamentoGeografico!, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: colab.departamentoGeografico!.toUpperCase() == 'MANAGUA' ? ClaroTheme.success : ClaroTheme.slate500)),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAsistenciaCard(LookupResult lookup, DespachoController despacho) {
    if (lookup.asistio) {
      final auth = context.read<AuthController>();
      final canRevert = auth.userRol == 'admin' || auth.userRol == 'supervisor';
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: ClaroTheme.successLight, borderRadius: BorderRadius.circular(16), border: Border.all(color: ClaroTheme.success.withValues(alpha: 0.3))),
        child: Row(
          children: [
            Container(
              width: 40, height: 40,
              decoration: BoxDecoration(color: ClaroTheme.success.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(10)),
              child: const Icon(Icons.check_circle_rounded, color: ClaroTheme.success, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Asistencia Registrada', style: TextStyle(fontFamily: 'Inter', fontSize: 15, fontWeight: FontWeight.w600, color: ClaroTheme.success)),
                  if (lookup.fechaAsistencia != null)
                    Text('${lookup.adultos} adultos · ${lookup.ninos} niños', style: const TextStyle(fontFamily: 'Inter', fontSize: 12, color: ClaroTheme.slate500)),
                ],
              ),
            ),
            if (canRevert)
              TextButton.icon(
                onPressed: despacho.loading ? null : () async {
                  final confirm = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      title: const Text('Reversar Asistencia'),
                      content: Text('¿Reversar la asistencia de ${lookup.colaborador.nombre}?'),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
                        TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Confirmar', style: TextStyle(color: ClaroTheme.error))),
                      ],
                    ),
                  );
                  if (confirm == true) await despacho.reversarAsistencia(lookup.colaborador.carnet);
                },
                icon: const Icon(Icons.rotate_left_rounded, color: ClaroTheme.error, size: 16),
                label: const Text('Reversar', style: TextStyle(fontFamily: 'Inter', fontSize: 12, fontWeight: FontWeight.w700, color: ClaroTheme.error)),
                style: TextButton.styleFrom(backgroundColor: ClaroTheme.error.withValues(alpha: 0.1), padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
              ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: ClaroTheme.slate200), boxShadow: ClaroTheme.cardShadow),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 40, height: 40,
                decoration: BoxDecoration(color: ClaroTheme.warningLight, borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.schedule_rounded, color: ClaroTheme.warning, size: 22),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Asistencia Pendiente', style: TextStyle(fontFamily: 'Inter', fontSize: 15, fontWeight: FontWeight.w600, color: ClaroTheme.warning)),
                    Text('Registra la asistencia para habilitar despacho', style: TextStyle(fontFamily: 'Inter', fontSize: 12, color: ClaroTheme.slate500)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: despacho.loading ? null : () => despacho.registrarAsistencia(),
            icon: const Icon(Icons.how_to_reg_rounded, size: 20),
            label: despacho.loading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Registrar Asistencia'),
            style: ElevatedButton.styleFrom(backgroundColor: ClaroTheme.primary, foregroundColor: Colors.white, minimumSize: const Size(double.infinity, 52), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
          ),
        ],
      ),
    );
  }

  Widget _buildFotoEvidenciaSection(bool tieneFoto, DespachoController despacho) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: ClaroTheme.slate50, borderRadius: BorderRadius.circular(12), border: Border.all(color: ClaroTheme.slate200)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.camera_alt_rounded, size: 18, color: ClaroTheme.slate600),
              const SizedBox(width: 8),
              const Text('Foto de Evidencia', style: TextStyle(fontFamily: 'Inter', fontSize: 13, fontWeight: FontWeight.w700, color: ClaroTheme.slate800)),
              const Spacer(),
              if (tieneFoto)
                const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.check_circle, size: 14, color: ClaroTheme.success),
                    SizedBox(width: 4),
                    Text('Foto registrada', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: ClaroTheme.success)),
                  ],
                ),
            ],
          ),
          const SizedBox(height: 2),
          const Text('1 foto por colaborador (opcional)', style: TextStyle(fontSize: 11, color: ClaroTheme.slate400)),
          const SizedBox(height: 10),
          if (_colaboradorFoto != null)
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.file(_colaboradorFoto!, height: 120, width: double.infinity, fit: BoxFit.cover),
                ),
                Positioned(
                  top: 6, right: 6,
                  child: GestureDetector(
                    onTap: () => setState(() => _colaboradorFoto = null),
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                      child: const Icon(Icons.close, color: Colors.white, size: 16),
                    ),
                  ),
                ),
              ],
            )
          else if (!tieneFoto)
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _tomarFoto,
                    icon: const Icon(Icons.camera_alt_outlined, size: 18),
                    label: const Text('Tomar Foto', style: TextStyle(fontSize: 12)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }

  Future<void> _tomarFoto() async {
    try {
      final picker = ImagePicker();
      final xFile = await picker.pickImage(source: ImageSource.camera, maxWidth: 1920, imageQuality: 90);
      if (xFile != null) setState(() => _colaboradorFoto = File(xFile.path));
    } catch (_) {}
  }

  Widget _buildDespacharTodoSection(List<Hijo> pendientes, String carnet, DespachoController despacho) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: const Color(0xFFFEFCE8), borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFFDE68A))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.bolt_rounded, size: 18, color: Color(0xFF92400E)),
              SizedBox(width: 6),
              Text('Despachar todos los hijos de una sola vez', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF92400E))),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _buildReceiverChip('COLABORADOR', 'Colaborador'),
              const SizedBox(width: 6),
              _buildReceiverChip('CONYUGE', 'Cónyuge'),
              const SizedBox(width: 6),
              _buildReceiverChip('TERCERO', 'Tercero'),
            ],
          ),
          if (_recibidoPor == 'TERCERO') ...[
            const SizedBox(height: 8),
            TextField(
              controller: _nombreReceptorCtrl,
              decoration: const InputDecoration(
                hintText: 'Nombre de quien recibe',
                contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                isDense: true,
              ),
            ),
          ],
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            height: 40,
            child: ElevatedButton.icon(
              onPressed: () => _despacharTodo(pendientes, carnet, despacho),
              icon: const Icon(Icons.rocket_launch_rounded, size: 16),
              label: Text('Despachar Todo (${pendientes.length} hijos)', style: const TextStyle(fontSize: 12)),
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFDA291C), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6))),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReceiverChip(String value, String label) {
    final selected = _recibidoPor == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() { _recibidoPor = value; if (value != 'TERCERO') _nombreReceptorCtrl.clear(); }),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: selected ? ClaroTheme.primary.withValues(alpha: 0.1) : ClaroTheme.slate50,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: selected ? ClaroTheme.primary : ClaroTheme.slate200, width: selected ? 2 : 1),
          ),
          child: Text(label, textAlign: TextAlign.center, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, height: 1.3, color: selected ? ClaroTheme.primary : ClaroTheme.slate500)),
        ),
      ),
    );
  }

  Future<void> _despacharTodo(List<Hijo> pendientes, String carnet, DespachoController despacho) async {
    if (_recibidoPor == 'TERCERO' && _nombreReceptorCtrl.text.trim().length < 3) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Debe ingresar el nombre de la persona que recibe'), backgroundColor: ClaroTheme.error));
      return;
    }
    if (_colaboradorFoto == null) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Debe tomar una foto de evidencia primero'), backgroundColor: ClaroTheme.error));
      return;
    }
    for (final hijo in pendientes) {
      final success = await despacho.confirmarDespacho(
        hijoId: hijo.id,
        jugueteId: hijo.jugueteSugerido?.id ?? 0,
        recibidoPor: _recibidoPor,
        nombreReceptor: _recibidoPor == 'TERCERO' ? _nombreReceptorCtrl.text.trim() : null,
        fotoFile: _colaboradorFoto,
      );
      if (!success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al entregar a ${hijo.nombreHijo}: ${despacho.error ?? "error"}'), backgroundColor: ClaroTheme.error),
        );
        return;
      }
    }
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Row(children: [Icon(Icons.check_circle, color: Colors.white, size: 18), SizedBox(width: 8), Text('Todos los juguetes entregados')]), backgroundColor: Color(0xFF10B981)),
      );
    }
  }

  Future<void> _abrirDeliverySheet(Hijo hijo, String carnet) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => DeliverySheet(hijo: hijo, carnetColaborador: carnet, fotoColaborador: _colaboradorFoto),
    );
    if (result == true && mounted) Navigator.pop(context);
  }

  void _mostrarDialogReversar(Hijo hijo, DespachoController despacho) {
    final motivoCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: ClaroTheme.warning, size: 24),
            SizedBox(width: 8),
            Text('Reversar Entrega', style: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w700)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('¿Reversar la entrega de ${hijo.nombreHijo}?', style: const TextStyle(fontSize: 14, color: ClaroTheme.slate600)),
            const SizedBox(height: 16),
            TextField(
              controller: motivoCtrl,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Motivo (mínimo 10 caracteres)', border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12)))),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancelar')),
          TextButton(
            onPressed: () async {
              if (motivoCtrl.text.trim().length < 10) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('El motivo debe tener al menos 10 caracteres'), backgroundColor: ClaroTheme.error));
                return;
              }
              Navigator.pop(ctx);
              await despacho.reversarDespacho(entregaId: hijo.entregaId!, motivo: motivoCtrl.text.trim());
            },
            child: const Text('Confirmar Reversión', style: TextStyle(color: ClaroTheme.error, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  int _hijosEntregados(List<Hijo> hijos) => hijos.where((h) => h.entregado).length;

  Future<void> _actualizarFotoEvidencia(Hijo hijo) async {
    final source = await showDialog<ImageSource>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Actualizar Foto', style: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w700)),
        content: const Text('Selecciona el origen de la foto'),
        actions: [
          TextButton.icon(onPressed: () => Navigator.pop(ctx, ImageSource.camera), icon: const Icon(Icons.camera_alt_rounded), label: const Text('Cámara')),
          TextButton.icon(onPressed: () => Navigator.pop(ctx, ImageSource.gallery), icon: const Icon(Icons.photo_library_rounded), label: const Text('Galería')),
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancelar')),
        ],
      ),
    );
    if (source == null) return;
    final picker = ImagePicker();
    final xFile = await picker.pickImage(source: source, maxWidth: 1920, imageQuality: 85);
    if (xFile == null) return;

    final foto = File(xFile.path);
    final despacho = context.read<DespachoController>();
    final success = await despacho.updateFotoEvidencia(hijoId: hijo.id, foto: foto);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(success ? '✅ Foto de evidencia actualizada' : 'Error: ${despacho.error}'),
        backgroundColor: success ? const Color(0xFF10B981) : ClaroTheme.error,
      ));
    }
  }
}
