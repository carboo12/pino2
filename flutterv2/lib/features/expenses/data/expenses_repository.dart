import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../../../core/network/api_client.dart';
import '../domain/models/expense_model.dart';

class ExpensesRepository {
  Future<List<ExpenseModel>> getExpenses({required String storeId}) async {
    try {
      final response = await ApiClient.dio.get(
        '/expenses',
        queryParameters: {'storeId': storeId},
      );
      if (response.data != null && response.data is List) {
        return (response.data as List)
            .map((e) => ExpenseModel.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
      }
    } on DioException catch (e) {
      debugPrint('Error al obtener gastos: $e');
    }
    return [];
  }

  Future<bool> createExpense({
    required String storeId,
    required String category,
    required double amount,
    String? description,
    String? receiptNumber,
  }) async {
    final payload = {
      'storeId': storeId,
      'category': category,
      'amount': amount,
      if (description != null && description.isNotEmpty) 'description': description,
      if (receiptNumber != null && receiptNumber.isNotEmpty) 'receiptNumber': receiptNumber,
    };

    try {
      final response = await ApiClient.dio.post('/expenses', data: payload);
      return response.statusCode == 200 || response.statusCode == 201;
    } on DioException catch (e) {
      debugPrint('Error al registrar gasto: $e');
      return false;
    }
  }
}
