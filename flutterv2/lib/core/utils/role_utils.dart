enum AppRole {
  masterAdmin,
  owner,
  storeAdmin,
  cashier,
  inventory,
  dispatcher,
  rutero,
  vendor,
  salesManager,
  auxiliar,
  supervisorCaja,
  supervisorPasillo,
  unknown,
}

String _normalizeRawRole(String? value) {
  return (value ?? '')
      .toLowerCase()
      .trim()
      .replaceAll('_', '-')
      .replaceAll(' ', '-');
}

AppRole normalizeRole(String? value) {
  final normalized = _normalizeRawRole(value);
  switch (normalized) {
    case 'master-admin':
    case 'masteradmin':
    case 'super-admin':
    case 'superadmin':
    case 'chain-admin':
    case 'chainadmin':
      return AppRole.masterAdmin;
    case 'owner':
    case 'propietario':
      return AppRole.owner;
    case 'store-admin':
    case 'store-administrator':
    case 'admin':
    case 'administrador':
      return AppRole.storeAdmin;
    case 'cashier':
    case 'cajero':
      return AppRole.cashier;
    case 'inventory':
    case 'warehouse':
    case 'bodeguero':
    case 'ayudante-de-bodega':
      return AppRole.inventory;
    case 'dispatcher':
    case 'despacho':
    case 'despachador':
      return AppRole.dispatcher;
    case 'rutero':
    case 'rute':
    case 'repartidor':
    case 'chofer':
    case 'conductor':
    case 'driver':
    case 'delivery':
      return AppRole.rutero;
    case 'vendor':
    case 'vendedor':
    case 'vendedor-ambulante':
      return AppRole.vendor;
    case 'sales-manager':
    case 'gestor-de-ventas':
    case 'gestor':
    case 'preventa':
    case 'preventista':
      return AppRole.salesManager;
    case 'auxiliar':
    case 'auxiliar-administrativo':
      return AppRole.auxiliar;
    case 'supervisor-caja':
    case 'supervisor-de-caja':
      return AppRole.supervisorCaja;
    case 'supervisor-pasillo':
    case 'supervisor-de-pasillo':
      return AppRole.supervisorPasillo;
    default:
      return AppRole.unknown;
  }
}

String roleLabel(AppRole role) {
  switch (role) {
    case AppRole.masterAdmin:
      return 'Master Admin';
    case AppRole.owner:
      return 'Owner';
    case AppRole.storeAdmin:
      return 'Administrador de tienda';
    case AppRole.cashier:
      return 'Cajero';
    case AppRole.inventory:
      return 'Inventario / Bodega';
    case AppRole.dispatcher:
      return 'Despacho';
    case AppRole.rutero:
      return 'Rutero';
    case AppRole.vendor:
      return 'Vendedor';
    case AppRole.salesManager:
      return 'Gestor de ventas';
    case AppRole.auxiliar:
      return 'Auxiliar Administrativo';
    case AppRole.supervisorCaja:
      return 'Supervisor de Caja';
    case AppRole.supervisorPasillo:
      return 'Supervisor de Pasillo';
    case AppRole.unknown:
      return 'Rol no identificado';
  }
}
