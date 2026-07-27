import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../clients/data/client_portfolio_repository.dart';
import '../../../clients/domain/models/client_summary.dart';
import 'quick_order_screen.dart';

class ExpressVisitScreen extends StatefulWidget {
  const ExpressVisitScreen({
    required this.storeId,
    this.storeName,
    super.key,
  });

  final String storeId;
  final String? storeName;

  @override
  State<ExpressVisitScreen> createState() => _ExpressVisitScreenState();
}

class _ExpressVisitScreenState extends State<ExpressVisitScreen> {
  final _clientsRepo = ClientPortfolioRepository();
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();

  bool _isGettingGps = false;
  bool _isSaving = false;
  double? _lat;
  double? _lng;

  @override
  void initState() {
    super.initState();
    _fetchGpsLocation();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _addressCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchGpsLocation() async {
    setState(() => _isGettingGps = true);
    try {
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.whileInUse || perm == LocationPermission.always) {
        final pos = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
        if (mounted) {
          setState(() {
            _lat = pos.latitude;
            _lng = pos.longitude;
          });
        }
      }
    } catch (e) {
      debugPrint('Error obteniendo ubicación GPS: $e');
    } finally {
      if (mounted) setState(() => _isGettingGps = false);
    }
  }

  Future<void> _saveAndStartOrder() async {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ingresa el nombre del cliente o establecimiento.')),
      );
      return;
    }

    setState(() => _isSaving = true);

    final client = await _clientsRepo.createExpressClient(
      storeId: widget.storeId,
      name: name,
      phone: _phoneCtrl.text.trim(),
      address: _addressCtrl.text.trim(),
      lat: _lat,
      lng: _lng,
    );

    if (mounted) {
      setState(() => _isSaving = false);
      if (client != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('📍 Cliente ${client.name} registrado con GPS (${_lat?.toStringAsFixed(4)}, ${_lng?.toStringAsFixed(4)}).'),
            backgroundColor: const Color(0xFF10B981),
          ),
        );

        // Pasar directamente a la pantalla de captura de pedido express
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => QuickOrderScreen(
              storeId: widget.storeId,
              storeName: widget.storeName,
            ),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('❌ Error al registrar el cliente express.'),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Visita / Venta Express en Calle', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            if (widget.storeName != null)
              Text(widget.storeName!, style: const TextStyle(fontSize: 12, color: AppTheme.slate500)),
          ],
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Banner GPS
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _lat != null ? const Color(0xFFECFDF5) : AppTheme.slate100,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: _lat != null ? const Color(0xFFA7F3D0) : AppTheme.slate300),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.my_location_rounded,
                  color: _lat != null ? const Color(0xFF10B981) : AppTheme.slate600,
                  size: 28,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _isGettingGps
                            ? 'Obteniendo GPS...'
                            : _lat != null
                                ? 'GPS Capturado Automáticamente'
                                : 'Ubicación GPS no disponible',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: _lat != null ? const Color(0xFF065F46) : AppTheme.slate800,
                          fontSize: 14,
                        ),
                      ),
                      if (_lat != null)
                        Text(
                          'Lat: ${_lat!.toStringAsFixed(5)}  ·  Lng: ${_lng!.toStringAsFixed(5)}',
                          style: const TextStyle(color: Color(0xFF047857), fontSize: 12),
                        ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.refresh_rounded),
                  onPressed: _fetchGpsLocation,
                  tooltip: 'Actualizar GPS',
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          const Text('Datos del Nuevo Cliente', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),

          TextField(
            controller: _nameCtrl,
            decoration: InputDecoration(
              labelText: 'Nombre Comercial / Cliente *',
              hintText: 'Ej. Pulpería Rosita',
              prefixIcon: const Icon(Icons.store_rounded),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(height: 12),

          TextField(
            controller: _phoneCtrl,
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(
              labelText: 'Teléfono / WhatsApp',
              hintText: '8888-8888',
              prefixIcon: const Icon(Icons.phone_rounded),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(height: 12),

          TextField(
            controller: _addressCtrl,
            maxLines: 2,
            decoration: InputDecoration(
              labelText: 'Dirección / Referencia de Ubicación',
              hintText: 'De la iglesia 2c al sur, portón azul',
              prefixIcon: const Icon(Icons.map_rounded),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(height: 32),

          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              onPressed: _isSaving ? null : _saveAndStartOrder,
              icon: _isSaving
                  ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.shopping_bag_rounded, size: 24),
              label: Text(
                _isSaving ? 'Guardando...' : 'Guardar Cliente y Tomar Venta Rápida',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
