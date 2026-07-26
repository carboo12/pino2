import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/api_client.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
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

    final authState = ref.read(authControllerProvider);
    final token = authState.session?.accessToken;
    final storeId = authState.session?.user.primaryStoreId ?? '';

    if (storeId.isEmpty) {
      setState(() {
        _loading = false;
        _error = 'No hay tienda seleccionada';
      });
      return;
    }

    try {
      final apiClient = ref.read(appApiClientProvider);
      final response = await apiClient.getList('/expenses', queryParameters: {'storeId': storeId}, bearerToken: token);
      final list = response
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

  void _showAddExpenseDialog() {
    final categoryCtrl = TextEditingController(text: 'Combustible');
    final amountCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    final receiptCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom + 16,
            left: 16,
            right: 16,
            top: 20,
          ),
          child: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Registrar Nuevo Gasto', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                  ],
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: categoryCtrl.text.isNotEmpty ? categoryCtrl.text : 'Combustible',
                  decoration: const InputDecoration(labelText: 'Categoría', border: OutlineInputBorder()),
                  items: const [
                    DropdownMenuItem(value: 'Combustible', child: Text('Combustible / Gasolina')),
                    DropdownMenuItem(value: 'Mantenimiento', child: Text('Mantenimiento Vehículo')),
                    DropdownMenuItem(value: 'Viáticos', child: Text('Viáticos / Comida')),
                    DropdownMenuItem(value: 'Suministros', child: Text('Suministros y Empaque')),
                    DropdownMenuItem(value: 'Otros', child: Text('Otros Gastos Operativos')),
                  ],
                  onChanged: (val) => categoryCtrl.text = val ?? 'Combustible',
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: amountCtrl,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(labelText: 'Monto (C\$)', prefixText: 'C\$ ', border: OutlineInputBorder()),
                  validator: (v) => (v == null || double.tryParse(v) == null || double.parse(v) <= 0) ? 'Monto inválido' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: descCtrl,
                  decoration: const InputDecoration(labelText: 'Descripción / Motivo', border: OutlineInputBorder()),
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Ingrese una descripción' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: receiptCtrl,
                  decoration: const InputDecoration(labelText: 'No. Comprobante / Recibo (Opcional)', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, foregroundColor: Colors.white),
                    onPressed: () async {
                      if (!formKey.currentState!.validate()) return;
                      final authState = ref.read(authControllerProvider);
                      final token = authState.session?.accessToken;
                      final storeId = authState.session?.user.primaryStoreId ?? '';
                      final userId = authState.session?.user.id ?? '';

                      final navigator = Navigator.of(context);
                      final messenger = ScaffoldMessenger.of(context);

                      try {
                        final apiClient = ref.read(appApiClientProvider);
                        await apiClient.postMap(
                          '/expenses',
                          bearerToken: token,
                          data: {
                            'storeId': storeId,
                            'createdByUserId': userId,
                            'category': categoryCtrl.text,
                            'amount': double.parse(amountCtrl.text),
                            'description': descCtrl.text,
                            'receiptNumber': receiptCtrl.text.isNotEmpty ? receiptCtrl.text : null,
                          },
                        );
                        if (!mounted) return;
                        navigator.pop();
                        messenger.showSnackBar(
                          const SnackBar(content: Text('Gasto registrado con éxito')),
                        );
                        _loadExpenses();
                      } catch (err) {
                        if (!mounted) return;
                        messenger.showSnackBar(
                          SnackBar(content: Text('Error al guardar: $err'), backgroundColor: Colors.red),
                        );
                      }
                    },
                    child: const Text('Guardar Gasto', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
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
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddExpenseDialog,
        backgroundColor: Colors.redAccent,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Nuevo Gasto'),
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
                            subtitle: Text('${exp.description}${exp.receiptNumber != null ? " (Comprobante: ${exp.receiptNumber})" : ""}'),
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
