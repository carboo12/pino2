import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/api_client.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../domain/models/promotion_model.dart';

class PromotionsScreen extends ConsumerStatefulWidget {
  const PromotionsScreen({super.key});

  @override
  ConsumerState<PromotionsScreen> createState() => _PromotionsScreenState();
}

class _PromotionsScreenState extends ConsumerState<PromotionsScreen> {
  bool _loading = true;
  List<PromotionModel> _allPromotions = [];
  List<PromotionModel> _filteredPromotions = [];
  final TextEditingController _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadPromotions();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadPromotions() async {
    final authState = ref.read(authControllerProvider);
    final token = authState.session?.accessToken;
    final storeId = authState.session?.user.primaryStoreId ?? '';

    if (storeId.isEmpty) {
      setState(() => _loading = false);
      return;
    }

    try {
      final apiClient = ref.read(appApiClientProvider);
      final response = await apiClient.getList('/promotions', queryParameters: {'storeId': storeId}, bearerToken: token);
      final list = response
          .map((item) => PromotionModel.fromJson(item as Map<String, dynamic>))
          .toList();

      setState(() {
        _allPromotions = list;
        _filteredPromotions = list;
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  void _filterPromotions(String query) {
    if (query.trim().isEmpty) {
      setState(() => _filteredPromotions = _allPromotions);
      return;
    }

    final q = query.toLowerCase();
    setState(() {
      _filteredPromotions = _allPromotions.where((p) {
        return p.name.toLowerCase().contains(q) ||
            (p.description?.toLowerCase().contains(q) ?? false);
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Promociones Vigentes'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadPromotions,
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _searchCtrl,
              onChanged: _filterPromotions,
              decoration: InputDecoration(
                hintText: 'Buscar promoción por nombre...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchCtrl.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchCtrl.clear();
                          _filterPromotions('');
                        },
                      )
                    : null,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _filteredPromotions.isEmpty
                    ? const Center(child: Text('No hay promociones activas'))
                    : ListView.builder(
                        itemCount: _filteredPromotions.length,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        itemBuilder: (context, index) {
                          final promo = _filteredPromotions[index];
                          final textValue = promo.discountType == 'PERCENTAGE'
                              ? '${promo.discountValue}% OFF'
                              : 'C\$ ${promo.discountValue} OFF';
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              leading: const CircleAvatar(
                                backgroundColor: Colors.green,
                                child: Icon(Icons.percent, color: Colors.white),
                              ),
                              title: Text(promo.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                              subtitle: Text(promo.description ?? 'Aplica en catálogo general'),
                              trailing: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: Colors.green.shade50,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: Colors.green.shade200),
                                ),
                                child: Text(
                                  textValue,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.green,
                                    fontSize: 15,
                                  ),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
