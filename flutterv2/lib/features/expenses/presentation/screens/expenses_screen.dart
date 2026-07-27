import 'package:flutter/material.dart';

import '../../../../core/theme/app_theme.dart';
import '../../data/expenses_repository.dart';
import '../../domain/models/expense_model.dart';

class ExpensesScreen extends StatefulWidget {
  const ExpensesScreen({
    required this.storeId,
    this.storeName,
    super.key,
  });

  final String storeId;
  final String? storeName;

  @override
  State<ExpensesScreen> createState() => _ExpensesScreenState();
}

class _ExpensesScreenState extends State<ExpensesScreen> {
  final _repository = ExpensesRepository();
  List<ExpenseModel> _expenses = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadExpenses();
  }

  Future<void> _loadExpenses() async {
    setState(() => _loading = true);
    final expenses = await _repository.getExpenses(storeId: widget.storeId);
    if (mounted) {
      setState(() {
        _expenses = expenses;
        _loading = false;
      });
    }
  }

  void _showAddExpenseDialog() {
    final categoryCtrl = TextEditingController(text: 'Combustible');
    final amountCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    final receiptCtrl = TextEditingController();

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
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Registrar Nuevo Gasto', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                // ignore: deprecated_member_use
                value: categoryCtrl.text,
                decoration: InputDecoration(
                  labelText: 'Categoría',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
                items: const [
                  DropdownMenuItem(value: 'Combustible', child: Text('Combustible')),
                  DropdownMenuItem(value: 'Alimentación', child: Text('Alimentación')),
                  DropdownMenuItem(value: 'Mantenimiento', child: Text('Mantenimiento')),
                  DropdownMenuItem(value: 'Peaje / Estacionamiento', child: Text('Peaje / Estacionamiento')),
                  DropdownMenuItem(value: 'Otros', child: Text('Otros')),
                ],
                onChanged: (v) {
                  if (v != null) categoryCtrl.text = v;
                },
              ),
              const SizedBox(height: 12),
              TextField(
                controller: amountCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: InputDecoration(
                  labelText: 'Monto del Gasto (C\$)',
                  prefixIcon: const Icon(Icons.attach_money_rounded),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: receiptCtrl,
                decoration: InputDecoration(
                  labelText: 'Número de Comprobante / Factura (Opcional)',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: descCtrl,
                decoration: InputDecoration(
                  labelText: 'Descripción / Detalle (Opcional)',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () async {
                    final amount = double.tryParse(amountCtrl.text.trim()) ?? 0.0;
                    if (amount <= 0) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Ingresa un monto válido mayor a 0.')),
                      );
                      return;
                    }

                    final nav = Navigator.of(context);
                    final messenger = ScaffoldMessenger.of(context);
                    nav.pop();

                    final success = await _repository.createExpense(
                      storeId: widget.storeId,
                      category: categoryCtrl.text,
                      amount: amount,
                      description: descCtrl.text.trim(),
                      receiptNumber: receiptCtrl.text.trim(),
                    );

                    if (mounted) {
                      if (success) {
                        messenger.showSnackBar(
                          const SnackBar(
                            content: Text('✅ Gasto registrado con éxito.'),
                            backgroundColor: Color(0xFF10B981),
                          ),
                        );
                        _loadExpenses();
                      } else {
                        messenger.showSnackBar(
                          const SnackBar(
                            content: Text('❌ Error al registrar gasto.'),
                            backgroundColor: AppTheme.error,
                          ),
                        );
                      }
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Guardar Gasto', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final totalAmount = _expenses.fold<double>(
      0,
      (sum, e) => sum + e.amount,
    );

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Gastos Operativos', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            if (widget.storeName != null)
              Text(widget.storeName!, style: const TextStyle(fontSize: 12, color: AppTheme.slate500)),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddExpenseDialog,
        backgroundColor: AppTheme.primary,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text('Registrar Gasto', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: RefreshIndicator(
        onRefresh: _loadExpenses,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.slate200),
                      boxShadow: AppTheme.cardShadow,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Total Gastos del Período', style: TextStyle(color: AppTheme.slate600, fontSize: 13)),
                            const SizedBox(height: 4),
                            Text(
                              'C\$${totalAmount.toStringAsFixed(2)}',
                              style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold, fontSize: 24),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.receipt_rounded, color: AppTheme.primary, size: 28),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Gastos Registrados (${_expenses.length})',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.slate900),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  if (_expenses.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(32),
                      child: const Center(child: Text('No hay gastos registrados en esta sucursal.')),
                    )
                  else
                    ..._expenses.map(
                      (exp) => Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.slate200),
                          boxShadow: AppTheme.cardShadow,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(exp.category, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                const SizedBox(height: 2),
                                if (exp.description != null && exp.description!.isNotEmpty)
                                  Text(exp.description!, style: const TextStyle(color: AppTheme.slate600, fontSize: 13)),
                                if (exp.receiptNumber != null && exp.receiptNumber!.isNotEmpty)
                                  Text('Comprobante: ${exp.receiptNumber}', style: const TextStyle(color: AppTheme.slate500, fontSize: 12)),
                              ],
                            ),
                            Text(
                              'C\$${exp.amount.toStringAsFixed(2)}',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary, fontSize: 16),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
      ),
    );
  }
}
