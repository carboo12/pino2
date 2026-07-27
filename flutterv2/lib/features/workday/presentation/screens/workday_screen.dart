import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_theme.dart';

class WorkdayScreen extends StatefulWidget {
  const WorkdayScreen({
    required this.storeId,
    this.storeName,
    super.key,
  });

  final String storeId;
  final String? storeName;

  @override
  State<WorkdayScreen> createState() => _WorkdayScreenState();
}

class _WorkdayScreenState extends State<WorkdayScreen> {
  bool _workdayActive = false;
  bool _loading = false;
  DateTime? _startTime;

  Future<void> _toggleWorkday() async {
    setState(() => _loading = true);

    try {
      final endpoint = _workdayActive ? '/visit-logs/end-day' : '/visit-logs/start-day';
      final response = await ApiClient.dio.post(
        endpoint,
        data: {'storeId': widget.storeId},
      );

      if (mounted && (response.statusCode == 200 || response.statusCode == 201)) {
        setState(() {
          _workdayActive = !_workdayActive;
          _startTime = _workdayActive ? DateTime.now() : null;
          _loading = false;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_workdayActive ? '✅ Jornada laboral iniciada.' : '🔴 Jornada laboral finalizada.'),
            backgroundColor: _workdayActive ? const Color(0xFF10B981) : AppTheme.slate700,
          ),
        );
      }
    } on DioException catch (e) {
      debugPrint('Error al cambiar estado de jornada: $e');
      if (mounted) {
        // Fallback local toggle to ensure user is never blocked
        setState(() {
          _workdayActive = !_workdayActive;
          _startTime = _workdayActive ? DateTime.now() : null;
          _loading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_workdayActive ? '✅ Jornada iniciada en modo local.' : '🔴 Jornada finalizada.'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Control de Jornada Laboral', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            if (widget.storeName != null)
              Text(widget.storeName!, style: const TextStyle(fontSize: 12, color: AppTheme.slate500)),
          ],
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: _workdayActive ? const Color(0xFFECFDF5) : AppTheme.slate100,
                shape: BoxShape.circle,
                border: Border.all(
                  color: _workdayActive ? const Color(0xFFA7F3D0) : AppTheme.slate300,
                  width: 4,
                ),
              ),
              child: Icon(
                _workdayActive ? Icons.timer_rounded : Icons.timer_off_rounded,
                size: 80,
                color: _workdayActive ? const Color(0xFF10B981) : AppTheme.slate600,
              ),
            ),
            const SizedBox(height: 32),
            Text(
              _workdayActive ? 'Jornada Activa' : 'Jornada Inactiva',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: _workdayActive ? const Color(0xFF065F46) : AppTheme.slate800,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _workdayActive
                  ? 'Inicio: ${_startTime?.hour.toString().padLeft(2, '0')}:${_startTime?.minute.toString().padLeft(2, '0')} hs  ·  GPS Activo'
                  : 'Presiona el botón para registrar el inicio de tus actividades de campo.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppTheme.slate600, fontSize: 14),
            ),
            const SizedBox(height: 48),
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton.icon(
                onPressed: _loading ? null : _toggleWorkday,
                icon: _loading
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Icon(_workdayActive ? Icons.stop_circle_rounded : Icons.play_circle_rounded, size: 28),
                label: Text(
                  _loading
                      ? 'Cargando...'
                      : _workdayActive
                          ? 'Finalizar Jornada Laboral'
                          : 'Iniciar Jornada Laboral',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _workdayActive ? AppTheme.error : const Color(0xFF10B981),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
