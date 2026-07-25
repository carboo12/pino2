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
  List<PromotionModel> _promotions = [];

  @override
  void initState() {
    super.initState();
    _loadPromotions();
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
        _promotions = list;
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Promociones Vigentes')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _promotions.isEmpty
              ? const Center(child: Text('No hay promociones activas'))
              : ListView.builder(
                  itemCount: _promotions.length,
                  padding: const EdgeInsets.all(12),
                  itemBuilder: (context, index) {
                    final promo = _promotions[index];
                    final textValue = promo.discountType == 'PERCENTAGE'
                        ? '${promo.discountValue}% OFF'
                        : 'C\$ ${promo.discountValue} OFF';
                    return Card(
                      child: ListTile(
                        leading: const CircleAvatar(
                          backgroundColor: Colors.green,
                          child: Icon(Icons.percent, color: Colors.white),
                        ),
                        title: Text(promo.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(promo.description ?? 'Aplica en catálogo'),
                        trailing: Text(
                          textValue,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.green,
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
