import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../../core/network/api_client.dart';
import '../domain/models/cash_shift_model.dart';

class CashShiftRepository {
  Future<CashShiftModel?> getActiveShift({
    required String storeId,
    String? userId,
  }) async {
    try {
      final query = <String, dynamic>{'storeId': storeId};
      if (userId != null && userId.isNotEmpty) {
        query['userId'] = userId;
      }
      final response = await ApiClient.dio.get(
        '/cash-shifts/active',
        queryParameters: query,
      );
      if (response.data != null && response.data is Map<String, dynamic>) {
        return CashShiftModel.fromJson(response.data as Map<String, dynamic>);
      }
    } on DioException catch (e) {
      debugPrint('Error al obtener turno activo: $e');
    }
    return null;
  }

  Future<CashShiftModel?> openShift({
    required String storeId,
    required double startingCash,
  }) async {
    try {
      final response = await ApiClient.dio.post(
        '/cash-shifts',
        data: {
          'storeId': storeId,
          'startingCash': startingCash,
        },
      );
      if (response.data != null && response.data is Map<String, dynamic>) {
        return CashShiftModel.fromJson(response.data as Map<String, dynamic>);
      }
    } on DioException catch (e) {
      debugPrint('Error al abrir turno: $e');
    }
    return null;
  }

  Future<CashShiftModel?> closeShift({
    required String storeId,
    String? shiftId,
    double? actualCash,
    double? actualUSD,
  }) async {
    try {
      final data = <String, dynamic>{
        'storeId': storeId,
      };
      if (shiftId != null && shiftId.isNotEmpty) data['shiftId'] = shiftId;
      if (actualCash != null) data['actualCash'] = actualCash;
      if (actualUSD != null) data['actualUSD'] = actualUSD;

      final response = await ApiClient.dio.post('/cash-shifts/close', data: data);
      if (response.data != null && response.data is Map<String, dynamic>) {
        return CashShiftModel.fromJson(response.data as Map<String, dynamic>);
      }
    } on DioException catch (e) {
      debugPrint('Error al cerrar turno: $e');
    }
    return null;
  }

  Future<bool> registerOutflow({
    required String shiftId,
    required String storeId,
    required double amount,
    required String reason,
  }) async {
    try {
      final response = await ApiClient.dio.post(
        '/cash-shifts/outflow',
        data: {
          'shiftId': shiftId,
          'storeId': storeId,
          'amount': amount,
          'reason': reason,
        },
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } on DioException catch (e) {
      debugPrint('Error al registrar egreso: $e');
      return false;
    }
  }

  Future<CashShiftModel?> getShiftById(String id) async {
    try {
      final response = await ApiClient.dio.get('/cash-shifts/$id');
      if (response.data != null && response.data is Map<String, dynamic>) {
        return CashShiftModel.fromJson(response.data as Map<String, dynamic>);
      }
    } on DioException catch (e) {
      debugPrint('Error al obtener turno: $e');
    }
    return null;
  }

  Future<Map<String, dynamic>?> getShiftStats(String id) async {
    try {
      final response = await ApiClient.dio.get('/cash-shifts/stats/$id');
      if (response.data != null && response.data is Map<String, dynamic>) {
        return response.data as Map<String, dynamic>;
      }
    } on DioException catch (e) {
      debugPrint('Error al obtener estadísticas: $e');
    }
    return null;
  }

  Future<List<CashShiftModel>> listShifts({
    required String storeId,
    String? status,
    String? cashierId,
    int limit = 50,
  }) async {
    try {
      final query = <String, dynamic>{
        'storeId': storeId,
        'limit': limit,
      };
      if (status != null) query['status'] = status;
      if (cashierId != null) query['cashierId'] = cashierId;

      final response = await ApiClient.dio.get(
        '/cash-shifts',
        queryParameters: query,
      );
      if (response.data != null && response.data is List) {
        return (response.data as List)
            .map((e) => CashShiftModel.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
      }
    } on DioException catch (e) {
      debugPrint('Error al listar turnos: $e');
    }
    return [];
  }
}
