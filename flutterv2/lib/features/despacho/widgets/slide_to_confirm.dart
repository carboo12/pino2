import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/app_theme.dart';

/// Slider interactivo que requiere arrastrar un botón de izquierda a derecha
/// para confirmar una acción (evita toques accidentales).
class SlideToConfirm extends StatefulWidget {
  final String text;
  final VoidCallback onConfirmed;
  final bool enabled;
  final Color? backgroundColor;
  final Color? thumbColor;

  const SlideToConfirm({
    super.key,
    this.text = 'Deslizar para confirmar',
    required this.onConfirmed,
    this.enabled = true,
    this.backgroundColor,
    this.thumbColor,
  });

  @override
  State<SlideToConfirm> createState() => _SlideToConfirmState();
}

class _SlideToConfirmState extends State<SlideToConfirm>
    with SingleTickerProviderStateMixin {
  double _dragPosition = 0;
  bool _confirmed = false;
  late AnimationController _resetController;
  late Animation<double> _resetAnimation;

  static const double _thumbSize = 56;
  static const double _threshold = 0.85;

  @override
  void initState() {
    super.initState();
    _resetController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _resetAnimation = Tween<double>(begin: 0, end: 0).animate(
      CurvedAnimation(parent: _resetController, curve: Curves.easeOut),
    );
    _resetController.addListener(() {
      setState(() => _dragPosition = _resetAnimation.value);
    });
  }

  @override
  void dispose() {
    _resetController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bgColor = widget.backgroundColor ?? AppTheme.slate100;
    final tColor = widget.thumbColor ?? AppTheme.primary;

    return LayoutBuilder(
      builder: (context, constraints) {
        final maxDrag = constraints.maxWidth - _thumbSize - 8;
        final progress = maxDrag > 0 ? (_dragPosition / maxDrag).clamp(0.0, 1.0) : 0.0;

        return AnimatedOpacity(
          opacity: widget.enabled ? 1.0 : 0.5,
          duration: const Duration(milliseconds: 200),
          child: Container(
            height: 64,
            decoration: BoxDecoration(
              color: _confirmed
                  ? AppTheme.success.withValues(alpha: 0.15)
                  : bgColor,
              borderRadius: BorderRadius.circular(32),
              border: Border.all(
                color: _confirmed
                    ? AppTheme.success.withValues(alpha: 0.3)
                    : AppTheme.slate200,
              ),
            ),
            child: Stack(
              alignment: Alignment.centerLeft,
              children: [
                // Progress fill
                AnimatedContainer(
                  duration: const Duration(milliseconds: 100),
                  width: _dragPosition + _thumbSize + 4,
                  height: 64,
                  decoration: BoxDecoration(
                    color: tColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(32),
                  ),
                ),

                // Text
                Center(
                  child: AnimatedOpacity(
                    opacity: _confirmed ? 0 : (1 - progress * 1.5).clamp(0.0, 1.0),
                    duration: const Duration(milliseconds: 150),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          widget.text,
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.slate500,
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Icon(
                          Icons.arrow_forward_rounded,
                          size: 18,
                          color: AppTheme.slate400,
                        ),
                      ],
                    ),
                  ),
                ),

                // Confirmed checkmark
                if (_confirmed)
                  Center(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.check_circle, color: AppTheme.success, size: 24),
                        const SizedBox(width: 8),
                        Text(
                          '¡Confirmado!',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.success,
                          ),
                        ),
                      ],
                    ),
                  ),

                // Draggable thumb
                Positioned(
                  left: _dragPosition + 4,
                  child: GestureDetector(
                    onHorizontalDragUpdate: widget.enabled && !_confirmed
                        ? (details) {
                            setState(() {
                              _dragPosition =
                                  (_dragPosition + details.delta.dx).clamp(0.0, maxDrag);
                            });
                          }
                        : null,
                    onHorizontalDragEnd: widget.enabled && !_confirmed
                        ? (details) {
                            if (progress >= _threshold) {
                              setState(() {
                                _confirmed = true;
                                _dragPosition = maxDrag;
                              });
                              HapticFeedback.heavyImpact();
                              widget.onConfirmed();
                            } else {
                              // Reset animation
                              _resetAnimation = Tween<double>(
                                begin: _dragPosition,
                                end: 0,
                              ).animate(CurvedAnimation(
                                parent: _resetController,
                                curve: Curves.easeOut,
                              ));
                              _resetController
                                ..reset()
                                ..forward();
                              HapticFeedback.lightImpact();
                            }
                          }
                        : null,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 100),
                      width: _thumbSize,
                      height: _thumbSize,
                      decoration: BoxDecoration(
                        color: _confirmed ? AppTheme.success : tColor,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: (_confirmed ? AppTheme.success : tColor)
                                .withValues(alpha: 0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Icon(
                        _confirmed
                            ? Icons.check_rounded
                            : Icons.arrow_forward_rounded,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  /// Resetear el slider para permitir otra entrega.
  void reset() {
    setState(() {
      _confirmed = false;
      _dragPosition = 0;
    });
  }
}
