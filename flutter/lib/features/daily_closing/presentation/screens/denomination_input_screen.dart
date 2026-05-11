import 'package:flutter/material.dart';

class DenominationInputScreen extends StatefulWidget {
  const DenominationInputScreen({
    required this.expectedCash,
    super.key,
  });

  final double expectedCash;

  @override
  State<DenominationInputScreen> createState() => _DenominationInputScreenState();
}

class _DenominationInputScreenState extends State<DenominationInputScreen> {
  final Map<String, TextEditingController> _controllers = {
    '1000': TextEditingController(),
    '500': TextEditingController(),
    '200': TextEditingController(),
    '100': TextEditingController(),
    '50': TextEditingController(),
    '20': TextEditingController(),
    '10': TextEditingController(),
    '5': TextEditingController(),
    '1': TextEditingController(),
  };

  final _notesController = TextEditingController();

  double _totalEntered = 0.0;

  @override
  void initState() {
    super.initState();
    for (final controller in _controllers.values) {
      controller.addListener(_calculateTotal);
    }
  }

  @override
  void dispose() {
    for (final controller in _controllers.values) {
      controller.removeListener(_calculateTotal);
      controller.dispose();
    }
    _notesController.dispose();
    super.dispose();
  }

  void _calculateTotal() {
    double sum = 0;
    _controllers.forEach((denom, controller) {
      final count = int.tryParse(controller.text) ?? 0;
      final value = double.tryParse(denom) ?? 0;
      sum += count * value;
    });
    setState(() {
      _totalEntered = sum;
    });
  }

  void _submit() {
    final Map<String, dynamic> result = {
      'denominations': {},
      'notes': _notesController.text,
      'totalEntered': _totalEntered,
    };
    
    _controllers.forEach((denom, controller) {
      final count = int.tryParse(controller.text) ?? 0;
      if (count > 0) {
        result['denominations'][denom] = count;
      }
    });

    Navigator.pop(context, result);
  }

  Widget _buildDenominationRow(String valueText) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 70,
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: Colors.blueGrey.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            alignment: Alignment.center,
            child: Text(
              'C\$ $valueText',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ),
          const SizedBox(width: 16),
          const Text('x', style: TextStyle(fontSize: 18, color: Colors.grey)),
          const SizedBox(width: 16),
          Expanded(
            child: TextField(
              controller: _controllers[valueText],
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              decoration: InputDecoration(
                hintText: '0',
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          const Text('=', style: TextStyle(fontSize: 18, color: Colors.grey)),
          const SizedBox(width: 16),
          SizedBox(
            width: 80,
            child: Text(
              'C\$ ${((int.tryParse(_controllers[valueText]!.text) ?? 0) * double.parse(valueText)).toStringAsFixed(2)}',
              textAlign: TextAlign.right,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final difference = _totalEntered - widget.expectedCash;
    final diffColor = difference == 0
        ? Colors.green
        : difference > 0
            ? Colors.blue
            : Colors.red;

    return Scaffold(
      appBar: AppBar(title: const Text('Arqueo Físico (Denominaciones)')),
      body: SafeArea(
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              color: Colors.grey.shade100,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Total Esperado', style: TextStyle(color: Colors.grey)),
                      Text(
                        'C\$ ${widget.expectedCash.toStringAsFixed(2)}',
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      const Text('Diferencia', style: TextStyle(color: Colors.grey)),
                      Text(
                        'C\$ ${difference.toStringAsFixed(2)}',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: diffColor,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  _buildDenominationRow('1000'),
                  _buildDenominationRow('500'),
                  _buildDenominationRow('200'),
                  _buildDenominationRow('100'),
                  _buildDenominationRow('50'),
                  _buildDenominationRow('20'),
                  _buildDenominationRow('10'),
                  _buildDenominationRow('5'),
                  _buildDenominationRow('1'),
                  const SizedBox(height: 24),
                  TextField(
                    controller: _notesController,
                    minLines: 3,
                    maxLines: 5,
                    decoration: const InputDecoration(
                      labelText: 'Notas / Observaciones de Cierre',
                      alignLabelWithHint: true,
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, -5))
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Total Ingresado', style: TextStyle(color: Colors.grey, fontSize: 12)),
                      Text(
                        'C\$ ${_totalEntered.toStringAsFixed(2)}',
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900),
                      ),
                    ],
                  ),
                  FilledButton.icon(
                    onPressed: _submit,
                    icon: const Icon(Icons.check_circle),
                    label: const Text('Confirmar'),
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
