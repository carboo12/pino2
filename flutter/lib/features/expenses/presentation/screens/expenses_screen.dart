import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/api_client.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../domain/models/expense_model.dart';

class ExpensesScreen extends ConsumerStatefulWidget {
  const ExpensesScreen({super.key});

  @override
  ConsumerState<ExpensesScreen> createState() => _ExpensesScreenState();
}

class _ExpensesScreenState extends ConsumerState<ExpensesScreen> {
  bool _loading = true;
  List<ExpenseModel> _expenses = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadExpenses();
  }

  Future<void> _loadExpenses() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    final authState = ref.read(authNotifierProvider);
    final storeId = authState.user?.storeIds.firstOrNull ?? '';

    if (storeId.isEmpty) {
      setState(() {
        _loading = false;
        _error = 'No hay tienda seleccionada';
      });
      return;
    }

    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.get('/expenses', queryParameters: {'storeId': storeId});
      final list = (response.data as List? ?? [])
          .map((item) => ExpenseModel.fromJson(item as Map<String, dynamic>))
          .toList();

      setState(() {
        _expenses = list;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Gastos y Caja Chica'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadExpenses,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Error: $_error', style: const TextStyle(color: Colors.red)),
                      const SizedBox(height: 8),
                      ElevatedButton(
                        onPressed: _loadExpenses,
                        child: const Text('Reintentar'),
                      ),
                    ],
                  ),
                )
              : _expenses.isEmpty
                  ? const Center(
                      child: Text('No hay gastos registrados hoy'),
                    )
                  : ListView.builder(
                      itemCount: _expenses.length,
                      padding: const EdgeInsets.all(12),
                      itemBuilder: (context, index) {
                        final exp = _expenses[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            leading: const CircleAvatar(
                              backgroundColor: Colors.redAccent,
                              child: Icon(Icons.receipt, color: Colors.white),
                            ),
                            title: Text(exp.category, style: const TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: Text(exp.description),
                            trailing: Text(
                              'C\$ ${exp.amount.toStringAsFixed(2)}',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.red,
                                fontSize: 16,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
    );
  }
}
