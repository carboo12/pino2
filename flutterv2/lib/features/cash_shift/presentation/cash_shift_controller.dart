import 'package:flutter/foundation.dart';

import '../data/cash_shift_repository.dart';
import '../domain/models/cash_shift_model.dart';

class CashShiftController extends ChangeNotifier {
  final CashShiftRepository _repository = CashShiftRepository();

  CashShiftModel? _activeShift;
  bool _loading = false;
  bool _submitting = false;
  String? _error;

  CashShiftModel? get activeShift => _activeShift;
  bool get loading => _loading;
  bool get submitting => _submitting;
  String? get error => _error;
  bool get hasActiveShift => _activeShift != null && _activeShift!.isOpen;

  Future<void> loadActiveShift({
    required String storeId,
    String? userId,
  }) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      _activeShift = await _repository.getActiveShift(
        storeId: storeId,
        userId: userId,
      );
    } catch (e) {
      _error = 'Error al cargar turno activo';
      debugPrint('$e');
    }

    _loading = false;
    notifyListeners();
  }

  Future<bool> openShift({
    required String storeId,
    required double startingCash,
  }) async {
    _submitting = true;
    _error = null;
    notifyListeners();

    try {
      final shift = await _repository.openShift(
        storeId: storeId,
        startingCash: startingCash,
      );
      if (shift != null) {
        _activeShift = shift;
        _submitting = false;
        notifyListeners();
        return true;
      }
      _error = 'No se recibió respuesta del servidor';
    } catch (e) {
      _error = 'Error al abrir turno';
      debugPrint('$e');
    }

    _submitting = false;
    notifyListeners();
    return false;
  }

  Future<bool> registerOutflow({
    required String shiftId,
    required String storeId,
    required double amount,
    required String reason,
  }) async {
    _submitting = true;
    _error = null;
    notifyListeners();

    try {
      final success = await _repository.registerOutflow(
        shiftId: shiftId,
        storeId: storeId,
        amount: amount,
        reason: reason,
      );
      if (success) {
        await loadActiveShift(storeId: storeId);
        return true;
      }
      _error = 'Error al registrar egreso';
    } catch (e) {
      _error = 'Error al registrar egreso';
      debugPrint('$e');
    }

    _submitting = false;
    notifyListeners();
    return false;
  }

  Future<bool> closeShift({
    required String storeId,
    double? actualCash,
    double? actualUSD,
  }) async {
    _submitting = true;
    _error = null;
    notifyListeners();

    try {
      final shift = await _repository.closeShift(
        storeId: storeId,
        shiftId: _activeShift?.id,
        actualCash: actualCash,
        actualUSD: actualUSD,
      );
      if (shift != null) {
        _activeShift = shift;
        _submitting = false;
        notifyListeners();
        return true;
      }
      _error = 'No se recibió respuesta del servidor';
    } catch (e) {
      _error = 'Error al cerrar turno';
      debugPrint('$e');
    }

    _submitting = false;
    notifyListeners();
    return false;
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void reset() {
    _activeShift = null;
    _loading = false;
    _submitting = false;
    _error = null;
    notifyListeners();
  }
}
