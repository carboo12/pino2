import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/premium_widgets.dart';
import '../domain/colaborador_models.dart';

/// Tarjeta de hijo con estado visual de despacho.
/// Verde = Entregado, Gris = Pendiente, Naranja = Reversado.
class ChildCard extends StatelessWidget {
  final Hijo hijo;
  final bool asistenciaRegistrada;
  final VoidCallback? onDespachar;
  final VoidCallback? onReversar;
  final VoidCallback? onUpdateFoto;

  const ChildCard({
    super.key,
    required this.hijo,
    required this.asistenciaRegistrada,
    this.onDespachar,
    this.onReversar,
    this.onUpdateFoto,
  });

  @override
  Widget build(BuildContext context) {
    final Color statusColor;
    final Color statusBg;
    final IconData statusIcon;
    final String statusLabel;

    if (hijo.entregado) {
      statusColor = AppTheme.success;
      statusBg = AppTheme.successLight;
      statusIcon = Icons.check_circle_rounded;
      statusLabel = 'Entregado';
    } else if (hijo.reversado) {
      statusColor = AppTheme.warning;
      statusBg = AppTheme.warningLight;
      statusIcon = Icons.replay_rounded;
      statusLabel = 'Reversado';
    } else {
      statusColor = AppTheme.slate500;
      statusBg = AppTheme.slate50;
      statusIcon = Icons.schedule_rounded;
      statusLabel = 'Pendiente';
    }

    final genderIcon = hijo.generoHijo.toUpperCase() == 'F'
        ? Icons.face_3_rounded
        : Icons.face_rounded;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: hijo.entregado
              ? AppTheme.success.withValues(alpha: 0.3)
              : hijo.reversado
                  ? AppTheme.warning.withValues(alpha: 0.3)
                  : AppTheme.slate200,
          width: 1.5,
        ),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header con nombre y estado ──
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: statusBg,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
            ),
            child: Row(
              children: [
                // Icono de género
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(genderIcon, color: statusColor, size: 24),
                ),
                const SizedBox(width: 12),

                // Nombre y edad
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        hijo.nombreHijo,
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.slate900,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${hijo.edadHijo} años · ${hijo.generoHijo.toUpperCase()} · ${hijo.categoria ?? "Sin cat."}',
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 12,
                          color: AppTheme.slate500,
                        ),
                      ),
                    ],
                  ),
                ),

                // Badge de estado
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(statusIcon, size: 14, color: statusColor),
                      const SizedBox(width: 4),
                      Text(
                        statusLabel,
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: statusColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── Cuerpo: Juguete sugerido y acciones ──
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Juguete
                if (hijo.jugueteSugerido != null) ...[
                  Row(
                    children: [
                       GestureDetector(
                        onTap: hijo.jugueteSugerido!.fotoUrl != null && hijo.jugueteSugerido!.fotoUrl!.isNotEmpty
                            ? () => _verFoto(context, hijo.jugueteSugerido!.fotoUrl!)
                            : null,
                        child: Container(
                         width: 32,
                         height: 32,
                         decoration: BoxDecoration(
                           borderRadius: BorderRadius.circular(6),
                           border: Border.all(color: AppTheme.slate200),
                         ),
                         child: AppImage(
                           url: hijo.jugueteSugerido!.fotoUrl,
                           width: 32,
                           height: 32,
                           borderRadius: 5,
                           fit: BoxFit.cover,
                           errorWidget: Container(
                             color: AppTheme.slate50,
                             child: const Icon(
                               Icons.card_giftcard_rounded,
                               size: 16,
                               color: AppTheme.primary,
                             ),
                           ),
                         ),
                       ),
                       ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          hijo.jugueteSugerido!.nombreJuguete,
                          style: const TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: AppTheme.slate800,
                          ),
                        ),
                      ),
                      // Stock badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: hijo.jugueteSugerido!.stockActual > 5
                              ? AppTheme.successLight
                              : hijo.jugueteSugerido!.stockActual > 0
                                  ? AppTheme.warningLight
                                  : AppTheme.errorLight,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'Stock: ${hijo.jugueteSugerido!.stockActual}',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: hijo.jugueteSugerido!.stockActual > 5
                                ? AppTheme.success
                                : hijo.jugueteSugerido!.stockActual > 0
                                    ? AppTheme.warning
                                    : AppTheme.error,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                ],

                // Info de entrega (si ya fue entregado)
                if (hijo.entregado) ...[
                  _buildInfoRow(
                    Icons.person_outline,
                    'Recibió: ${hijo.recibidoPor ?? "Colaborador"}',
                  ),
                  if (hijo.fechaEntrega != null) ...[
                    const SizedBox(height: 4),
                    _buildInfoRow(
                      Icons.access_time,
                      _formatDate(hijo.fechaEntrega!),
                    ),
                  ],
                  if (hijo.fotoEvidenciaUrl != null && hijo.fotoEvidenciaUrl!.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    GestureDetector(
                      onTap: () => _verFoto(context, hijo.fotoEvidenciaUrl!),
                      child: Container(
                        height: 140,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppTheme.slate200),
                        ),
                        child: Stack(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(9),
                              child: AppImage(
                                url: hijo.fotoEvidenciaUrl,
                                width: double.infinity,
                                height: 140,
                                fit: BoxFit.cover,
                                errorWidget: Container(
                                  color: AppTheme.slate50,
                                  child: const Center(
                                    child: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(Icons.image_not_supported_rounded, color: AppTheme.slate400, size: 28),
                                        SizedBox(height: 4),
                                        Text('Foto no disponible', style: TextStyle(fontSize: 11, color: AppTheme.slate400)),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            Positioned(
                              left: 0, right: 0, bottom: 0,
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 6),
                                decoration: BoxDecoration(
                                  borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(9), bottomRight: Radius.circular(9)),
                                  gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, Colors.black.withValues(alpha: 0.5)]),
                                ),
                                child: const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.visibility_rounded, size: 16, color: Colors.white),
                                    SizedBox(width: 4),
                                    Text('Ver foto', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                ],

                // ── Botones de acción ──
                if (hijo.entregado) ...[
                  Row(
                    children: [
                      if (onUpdateFoto != null)
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: onUpdateFoto,
                            icon: const Icon(Icons.camera_alt_rounded, size: 16),
                            label: const Text('Foto', style: TextStyle(fontSize: 11)),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFF4338CA),
                              side: const BorderSide(color: Color(0xFFC7D2FE)),
                              minimumSize: const Size(0, 40),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                          ),
                        ),
                      if (onUpdateFoto != null && onReversar != null) const SizedBox(width: 8),
                      if (onReversar != null)
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: onReversar,
                            icon: const Icon(Icons.replay_rounded, size: 16),
                            label: const Text('Reversar', style: TextStyle(fontSize: 11)),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppTheme.warning,
                              side: const BorderSide(color: AppTheme.warning),
                              minimumSize: const Size(0, 40),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                          ),
                        ),
                    ],
                  ),
                ],

                if ((hijo.pendiente || hijo.reversado) && onDespachar != null)
                  ElevatedButton.icon(
                    onPressed: asistenciaRegistrada ? onDespachar : null,
                    icon: const Icon(Icons.card_giftcard_rounded, size: 18),
                    label: Text(
                      asistenciaRegistrada ? 'Entregar Juguete' : 'Requiere Asistencia',
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: AppTheme.slate200,
                      disabledForegroundColor: AppTheme.slate400,
                      minimumSize: const Size(double.infinity, 48),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppTheme.slate400),
        const SizedBox(width: 6),
        Text(
          text,
          style: const TextStyle(
            fontFamily: 'Inter',
            fontSize: 12,
            color: AppTheme.slate500,
          ),
        ),
      ],
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('dd/MM/yyyy HH:mm', 'es').format(date);
    } catch (_) {
      return dateStr;
    }
  }

  void _verFoto(BuildContext context, String url) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => Scaffold(
          backgroundColor: Colors.black,
          appBar: AppBar(
            backgroundColor: Colors.black,
            foregroundColor: Colors.white,
            elevation: 0,
            title: const Text('Foto Evidencia'),
          ),
          body: Center(
            child: InteractiveViewer(
              minScale: 0.5,
              maxScale: 4,
              child: AppImage(
                url: url,
                width: double.infinity,
                fit: BoxFit.contain,
                errorWidget: const Center(
                  child: Text('No se pudo cargar la imagen', style: TextStyle(color: Colors.white54)),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
