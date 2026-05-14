import 'package:flutter/material.dart';

class ScanActionField extends StatefulWidget {
  final String label;
  final String hintText;
  final Function(String) onScan;
  final bool autofocus;
  final IconData? actionIcon;

  const ScanActionField({
    super.key,
    required this.onScan,
    this.label = 'Escáner',
    this.hintText = 'Escanear o escribir código...',
    this.autofocus = true,
    this.actionIcon,
  });

  @override
  State<ScanActionField> createState() => _ScanActionFieldState();
}

class _ScanActionFieldState extends State<ScanActionField> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();

  void _submit() {
    final code = _controller.text.trim();
    if (code.isNotEmpty) {
      widget.onScan(code);
      _controller.clear();
      _focusNode.requestFocus();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFDDE2E8)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      child: Row(
        children: [
          Icon(
            widget.actionIcon ?? Icons.qr_code_scanner,
            color: const Color(0xFF5B6673),
            size: 20,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              controller: _controller,
              focusNode: _focusNode,
              autofocus: widget.autofocus,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) => _submit(),
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF17202A),
              ),
              decoration: InputDecoration(
                hintText: widget.hintText,
                hintStyle: const TextStyle(
                  color: Color(0xFF5B6673),
                  fontSize: 14,
                ),
                border: InputBorder.none,
                isDense: true,
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.arrow_forward_ios, size: 16),
            color: const Color(0xFF0F766E),
            onPressed: _submit,
            splashRadius: 20,
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }
}
