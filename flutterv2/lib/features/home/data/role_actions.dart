import 'package:flutter/material.dart';
import '../../../core/utils/role_utils.dart';

enum RouteKey {
  quickOrder,
  warehouse,
  collections,
  clients,
  catalog,
  routeBoard,
  inventoryAdjustments,
  returns,
  dailyClosing,
  vendorInventory,
  salesHistory,
  expenses,
  preventaClients,
  preventaOrder,
  preventaRoute,
}

class RoleAction {
  final String title;
  final String subtitle;
  final IconData icon;
  final RouteKey routeKey;

  const RoleAction({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.routeKey,
  });
}

List<RoleAction> actionsForRole(AppRole role) {
  switch (role) {
    case AppRole.masterAdmin:
    case AppRole.owner:
      return const [
        RoleAction(title: 'Nuevo pedido', subtitle: 'Capturar pedido de cliente.', icon: Icons.flash_on_rounded, routeKey: RouteKey.quickOrder),
        RoleAction(title: 'Bodega', subtitle: 'Recibir, alistar y cargar.', icon: Icons.warehouse_rounded, routeKey: RouteKey.warehouse),
        RoleAction(title: 'Cobros', subtitle: 'Cartera y pagos pendientes.', icon: Icons.payments_rounded, routeKey: RouteKey.collections),
        RoleAction(title: 'Catálogo', subtitle: 'Stock, precios y bultos.', icon: Icons.inventory_2_rounded, routeKey: RouteKey.catalog),
        RoleAction(title: 'Entregas', subtitle: 'Estado de pedidos y rutas.', icon: Icons.route_rounded, routeKey: RouteKey.routeBoard),
      ];

    case AppRole.storeAdmin:
      return const [
        RoleAction(title: 'Nuevo pedido', subtitle: 'Capturar pedido de cliente.', icon: Icons.flash_on_rounded, routeKey: RouteKey.quickOrder),
        RoleAction(title: 'Bodega', subtitle: 'Recibir, alistar y cargar.', icon: Icons.warehouse_rounded, routeKey: RouteKey.warehouse),
        RoleAction(title: 'Cobros', subtitle: 'Pendientes y registrar pagos.', icon: Icons.payments_rounded, routeKey: RouteKey.collections),
        RoleAction(title: 'Clientes', subtitle: 'Buscar contacto y cartera.', icon: Icons.people_alt_rounded, routeKey: RouteKey.clients),
        RoleAction(title: 'Entregas', subtitle: 'Despacho y seguimiento.', icon: Icons.route_rounded, routeKey: RouteKey.routeBoard),
      ];
    case AppRole.inventory:
      return const [
        RoleAction(title: 'Bodega', subtitle: 'Recibir, preparar y cargar.', icon: Icons.warehouse_rounded, routeKey: RouteKey.warehouse),
        RoleAction(title: 'Ajustes de Stock', subtitle: 'Escanear código y ajustar.', icon: Icons.qr_code_scanner_rounded, routeKey: RouteKey.inventoryAdjustments),
        RoleAction(title: 'Catálogo', subtitle: 'Stock, bultos y precios.', icon: Icons.inventory_2_rounded, routeKey: RouteKey.catalog),
        RoleAction(title: 'Entregas', subtitle: 'Despachos del día.', icon: Icons.local_shipping_rounded, routeKey: RouteKey.routeBoard),
      ];
    case AppRole.dispatcher:
      return const [
        RoleAction(title: 'Entregas', subtitle: 'Asignación y pendientes.', icon: Icons.alt_route_rounded, routeKey: RouteKey.routeBoard),
        RoleAction(title: 'Clientes', subtitle: 'Datos de contacto.', icon: Icons.people_alt_rounded, routeKey: RouteKey.clients),
        RoleAction(title: 'Catálogo', subtitle: 'Confirmar artículos.', icon: Icons.inventory_2_rounded, routeKey: RouteKey.catalog),
      ];
    case AppRole.rutero:
      return const [
        RoleAction(title: 'Ruta de hoy', subtitle: 'Entregas y cobro actual.', icon: Icons.map_rounded, routeKey: RouteKey.routeBoard),
        RoleAction(title: 'Cobros', subtitle: 'Registrar pagos.', icon: Icons.payments_rounded, routeKey: RouteKey.collections),
        RoleAction(title: 'Devoluciones', subtitle: 'Marcar devolución por ticket.', icon: Icons.assignment_return_rounded, routeKey: RouteKey.returns),
        RoleAction(title: 'Clientes', subtitle: 'Contacto y dirección.', icon: Icons.people_alt_rounded, routeKey: RouteKey.clients),
        RoleAction(title: 'Stock Actual', subtitle: 'Carga en mi poder.', icon: Icons.inventory_rounded, routeKey: RouteKey.vendorInventory),
        RoleAction(title: 'Cierre de Caja', subtitle: 'Consolidar y liquidar el día.', icon: Icons.wallet_rounded, routeKey: RouteKey.dailyClosing),
      ];
    case AppRole.vendor:
    case AppRole.salesManager:
      return const [
        RoleAction(title: 'Preventa', subtitle: 'Capturar pedido de cliente.', icon: Icons.flash_on_rounded, routeKey: RouteKey.quickOrder),
        RoleAction(title: 'Cobros', subtitle: 'Registrar pagos de clientes.', icon: Icons.payments_rounded, routeKey: RouteKey.collections),
        RoleAction(title: 'Devoluciones', subtitle: 'Registrar devolución.', icon: Icons.assignment_return_rounded, routeKey: RouteKey.returns),
        RoleAction(title: 'Clientes', subtitle: 'Buscar contacto.', icon: Icons.people_alt_rounded, routeKey: RouteKey.clients),
        RoleAction(title: 'Catálogo', subtitle: 'Precios, stock y bultos.', icon: Icons.inventory_2_rounded, routeKey: RouteKey.catalog),
        RoleAction(title: 'Stock Actual', subtitle: 'Carga asignada.', icon: Icons.inventory_rounded, routeKey: RouteKey.vendorInventory),
        RoleAction(title: 'Ventas del Día', subtitle: 'Tickets emitidos hoy.', icon: Icons.receipt_long_rounded, routeKey: RouteKey.salesHistory),
        RoleAction(title: 'Cierre de Caja', subtitle: 'Cuadrar el día.', icon: Icons.wallet_rounded, routeKey: RouteKey.dailyClosing),
      ];
    case AppRole.cashier:
      return const [
        RoleAction(title: 'Devoluciones', subtitle: 'Buscar ticket y devolver.', icon: Icons.assignment_return_rounded, routeKey: RouteKey.returns),
        RoleAction(title: 'Catálogo', subtitle: 'Confirmar producto y precio.', icon: Icons.inventory_2_rounded, routeKey: RouteKey.catalog),
        RoleAction(title: 'Clientes', subtitle: 'Datos del cliente.', icon: Icons.people_alt_rounded, routeKey: RouteKey.clients),
      ];
    case AppRole.auxiliar:
      return const [
        RoleAction(title: 'Ajustes de Stock', subtitle: 'Escanear y ajustar.', icon: Icons.qr_code_scanner_rounded, routeKey: RouteKey.inventoryAdjustments),
        RoleAction(title: 'Bodega', subtitle: 'Apoyo en despacho.', icon: Icons.warehouse_rounded, routeKey: RouteKey.warehouse),
        RoleAction(title: 'Catálogo', subtitle: 'Verificar precios.', icon: Icons.inventory_2_rounded, routeKey: RouteKey.catalog),
      ];
    case AppRole.supervisorCaja:
      return const [
        RoleAction(title: 'Cobros', subtitle: 'Validar pagos y cartera.', icon: Icons.payments_rounded, routeKey: RouteKey.collections),
        RoleAction(title: 'Cierre de Caja', subtitle: 'Auditar cierres.', icon: Icons.wallet_rounded, routeKey: RouteKey.dailyClosing),
        RoleAction(title: 'Catálogo', subtitle: 'Precios y productos.', icon: Icons.inventory_2_rounded, routeKey: RouteKey.catalog),
      ];
    case AppRole.supervisorPasillo:
      return const [
        RoleAction(title: 'Catálogo', subtitle: 'Consultar precios en piso.', icon: Icons.inventory_2_rounded, routeKey: RouteKey.catalog),
        RoleAction(title: 'Clientes', subtitle: 'Datos del cliente.', icon: Icons.people_alt_rounded, routeKey: RouteKey.clients),
      ];
    case AppRole.unknown:
      return const [
        RoleAction(title: 'Preventa', subtitle: 'Capturar pedido de cliente.', icon: Icons.flash_on_rounded, routeKey: RouteKey.quickOrder),
        RoleAction(title: 'Clientes', subtitle: 'Buscar contactos y cartera.', icon: Icons.people_alt_rounded, routeKey: RouteKey.clients),
        RoleAction(title: 'Catálogo', subtitle: 'Ver productos, stock y bultos.', icon: Icons.inventory_2_rounded, routeKey: RouteKey.catalog),
        RoleAction(title: 'Cobros', subtitle: 'Pagos y cuentas por cobrar.', icon: Icons.payments_rounded, routeKey: RouteKey.collections),
        RoleAction(title: 'Entregas', subtitle: 'Vista de operación y rutas.', icon: Icons.route_rounded, routeKey: RouteKey.routeBoard),
      ];
  }
}
