import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Primary Corporativo (Rojo Claro)
  static const primary = Color(0xFFDA291C);
  static const primaryDark = Color(0xFFB01E15);
  static const primaryLight = Color(0xFFFEE2E2);

  // Secondary
  static const secondary = Color(0xFF7C3AED);
  static const secondaryLight = Color(0xFFEDE9FE);

  // Accent
  static const accent = Color(0xFFF59E0B);
  static const accentLight = Color(0xFFFEF3C7);

  // Success
  static const success = Color(0xFF10B981);
  static const successLight = Color(0xFFD1FAE5);

  // Error
  static const error = Color(0xFFEF4444);
  static const errorLight = Color(0xFFFEE2E2);

  // Warning
  static const warning = Color(0xFFD97706);
  static const warningLight = Color(0xFFFEF3C7);

  // Slate Neutral Scale
  static const slate50 = Color(0xFFF8FAFC);
  static const slate100 = Color(0xFFF1F5F9);
  static const slate200 = Color(0xFFE2E8F0);
  static const slate300 = Color(0xFFCBD5E1);
  static const slate400 = Color(0xFF94A3B8);
  static const slate500 = Color(0xFF64748B);
  static const slate600 = Color(0xFF475569);
  static const slate700 = Color(0xFF334155);
  static const slate800 = Color(0xFF1E293B);
  static const slate900 = Color(0xFF0F172A);

  // Backgrounds & Surface
  static const background = Color(0xFFF8FAFC);
  static const surface = Color(0xFFFFFFFF);

  // Text
  static const textPrimary = Color(0xFF0F172A);
  static const textSecondary = Color(0xFF475569);
  static const textMuted = Color(0xFF94A3B8);

  // Border
  static const border = Color(0xFFE2E8F0);

  // Gradients
  static const heroGradient = [Color(0xFF1E293B), Color(0xFF2563EB)];
  static const loginGradient = [Color(0xFF0F172A), Color(0xFF1E293B)];

  // Sombras Corporativas
  static List<BoxShadow> get cardShadow => [
        BoxShadow(
          color: const Color(0xFF0F172A).withValues(alpha: 0.04),
          blurRadius: 12,
          offset: const Offset(0, 4),
        ),
      ];

  static List<BoxShadow> get buttonShadow => [
        BoxShadow(
          color: primary.withValues(alpha: 0.3),
          blurRadius: 10,
          offset: const Offset(0, 4),
        ),
      ];

  static List<BoxShadow> get elevatedShadow => [
        BoxShadow(
          color: const Color(0xFF0F172A).withValues(alpha: 0.08),
          blurRadius: 20,
          offset: const Offset(0, 8),
        ),
      ];
}
