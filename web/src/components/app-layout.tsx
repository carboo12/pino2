import apiClient from '@/services/api-client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { AppHeader } from '@/components/app-header';
import { cn } from '@/lib/utils';
import { isGlobalAdminRole, normalizeUserRole } from '@/lib/user-role';
import { useRealTimeEvents } from '@/hooks/use-real-time-events';
import {
  LayoutDashboard, Store, Briefcase, Users, WalletCards, RefreshCw,
  FileText, Map, MapPin, Settings, LifeBuoy, Package, History, Wrench,
  ShoppingCart, ClipboardCheck, AreaChart, UsersRound, Truck, HandCoins,
  ShieldCheck, SendToBack, Route, DollarSign, ListOrdered, PackagePlus, ReceiptText, Boxes, Wallet, Undo2,
  ChevronDown, PanelLeftClose, PanelLeft,
} from 'lucide-react';

// --- Nav Item Types ---
export interface NavLink {
  type: 'link';
  name: string;
  href: string;
  icon: React.ElementType;
  section?: string;
}

export interface NavGroup {
  type: 'group';
  name: string;
  icon: React.ElementType;
  children: NavLink[];
}

export interface NavSeparator {
  type: 'separator';
}

export type NavItem = NavLink | NavGroup | NavSeparator;

// Backward-compatible flat NavItem for AppHeader mobile (extracts all links from groups)
export function flattenNavItems(items: NavItem[]): NavLink[] {
  const result: NavLink[] = [];
  for (const item of items) {
    if (item.type === 'link') result.push(item);
    else if (item.type === 'group') result.push(...item.children);
  }
  return result;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  href: string;
  userId: string;
  read: boolean;
}

interface StoreSettings {
  exchangeRate?: number;
  enableDispatcherMode?: boolean;
  enableSalesManagerMode?: boolean;
  enableSupplierManagement?: boolean;
}

interface RealtimeEvent {
  type?: string;
  storeId?: string;
  payload?: Record<string, any>;
}

const translations = {
  es: {
    dashboard: 'Panel',
    stores: 'Tiendas',
    users: 'Usuarios',
    licenses: 'Licencias',
    monitor: 'Monitor',
    help: 'Ayuda',
    billing: 'Facturación',
    cashRegister: 'Caja',
    products: 'Productos',
    movements: 'Movimientos',
    adjustments: 'Ajustes',
    settings: 'Configuración',
    reports: 'Reportes',
    vendors: 'Vendedores',
    assignInventory: 'Asignar Inventario',
    myRoute: 'Ruta de Hoy',
    addClient: 'Clientes',
    sales: 'Historial Ventas',
    dispatcher: 'Despacho',
    pendingOrders: 'Comandas',
    deliveryRoute: 'Ruta de Entrega',
    registerOrder: 'Registrar Pedido',
    assignRoute: 'Asignar Ruta',
    suppliers: 'Proveedores',
    quickSale: 'Emitir Venta',
    authorizations: 'Autorizaciones',
    accountsReceivable: 'Cuentas por Cobrar',
    supplierInvoices: 'Facturas Proveedor',
    routes: 'Rutas',
    collections: 'Cobranzas',
    vendorInventory: 'Stock Actual',
    routeStaff: 'Personal de Ruta',
    returns: 'Devoluciones',
    dailyClosing: 'Cierre de Caja',
    inventory: 'Inventario',
    finances: 'Finanzas',
    commercial: 'Comercial',
    team: 'Equipo',
  },
  en: {
    dashboard: 'Dashboard',
    stores: 'Stores',
    users: 'Users',
    licenses: 'Licenses',
    monitor: 'Monitor',
    help: 'Help',
    billing: 'Billing',
    cashRegister: 'Cash Register',
    products: 'Products',
    movements: 'Movements',
    adjustments: 'Adjustments',
    settings: 'Settings',
    reports: 'Reports',
    vendors: 'Vendors',
    assignInventory: 'Assign Inventory',
    myRoute: 'My Route',
    addClient: 'Clients',
    sales: 'Sales',
    dispatcher: 'Dispatcher',
    pendingOrders: 'Orders',
    deliveryRoute: 'Delivery Route',
    registerOrder: 'Register Order',
    assignRoute: 'Assign Route',
    suppliers: 'Suppliers',
    quickSale: 'Quick Sale',
    authorizations: 'Authorizations',
    accountsReceivable: 'Accounts Receivable',
    supplierInvoices: 'Supplier Invoices',
    routes: 'Routes',
    collections: 'Collections',
    vendorInventory: 'Vendor Inventory',
    routeStaff: 'Route Staff',
    returns: 'Returns',
    dailyClosing: 'Daily Closing',
    inventory: 'Inventory',
    finances: 'Finances',
    commercial: 'Commercial',
    team: 'Team',
  }
};

// ===================================================================
// NAV DEFINITIONS — CONSOLIDATED WITH GROUPS
// ===================================================================

const getChainAdminNav = (lang: 'es' | 'en'): NavItem[] => [
  { type: 'link', name: translations[lang].dashboard, href: '/chain-admin/dashboard', icon: LayoutDashboard },
  { type: 'link', name: translations[lang].stores, href: '/master-admin/stores', icon: Store },
];

const getMasterAdminNav = (lang: 'es' | 'en'): NavItem[] => [
  { type: 'link', name: translations[lang].dashboard, href: '/master-admin/dashboard', icon: LayoutDashboard },
  { type: 'link', name: translations[lang].stores, href: '/master-admin/stores', icon: Store },
  { type: 'link', name: 'Cadenas', href: '/master-admin/chains', icon: Briefcase },
  { type: 'link', name: translations[lang].users, href: '/master-admin/users', icon: Users },
  { type: 'link', name: translations[lang].licenses, href: '/master-admin/licenses', icon: WalletCards },
  { type: 'separator' },
  { type: 'link', name: 'Monitor de Sincronización', href: '/master-admin/sync-monitor', icon: RefreshCw },
  { type: 'link', name: translations[lang].monitor, href: '/master-admin/monitor', icon: FileText },
  { type: 'link', name: 'Comparar Tiendas', href: '/master-admin/comparison', icon: AreaChart },
  { type: 'separator' },
  { type: 'link', name: 'Zonas Globales', href: '/master-admin/config/zones', icon: Map },
  { type: 'link', name: 'Sub-Zonas (Barrios)', href: '/master-admin/config/sub-zones', icon: MapPin },
  { type: 'link', name: 'Configuración', href: '/master-admin/config', icon: Settings },
];

const getStoreAdminNav = (storeId: string, lang: 'es' | 'en', settings: StoreSettings, storeType: string): NavItem[] => {
  const t = translations[lang];
  const nav: NavItem[] = [];

  const isSupermercado = storeType === 'SUPERMERCADO';
  const isDistribuidora = storeType === 'DISTRIBUIDORA';
  const isBodega = storeType === 'BODEGA';

  // 1. Caja — Always visible, primary action
  nav.push({ type: 'link', name: t.cashRegister, href: `/store/${storeId}/cash-register`, icon: WalletCards });

  // 2. Facturación (+ Comandas si están activas)
  if (settings.enableDispatcherMode || isDistribuidora) {
    nav.push({ type: 'link', name: t.pendingOrders, href: `/store/${storeId}/pending-orders`, icon: ClipboardCheck });
  }
  nav.push({ type: 'link', name: t.billing, href: `/store/${storeId}/facturacion`, icon: ShoppingCart });

  // 3. Panel
  nav.push({ type: 'link', name: t.dashboard, href: `/store/${storeId}/dashboard`, icon: LayoutDashboard });

  nav.push({ type: 'separator' });

  // 4. Inventario (group) — Productos + Entrada + Movimientos + Bodega + Proveedores + Facturas
  const invChildren: NavLink[] = [
    { type: 'link', name: 'Bodega', href: `/store/${storeId}/warehouse`, icon: Boxes },
    { type: 'link', name: t.products, href: `/store/${storeId}/products`, icon: Package },
    { type: 'link', name: 'Entrada', href: `/store/${storeId}/inventory/entry`, icon: PackagePlus },
    { type: 'link', name: t.movements, href: `/store/${storeId}/inventory/movements`, icon: History },
  ];
  if (settings.enableSupplierManagement) {
    invChildren.push(
      { type: 'link', name: t.suppliers, href: `/store/${storeId}/suppliers`, icon: Briefcase },
      { type: 'link', name: t.supplierInvoices, href: `/store/${storeId}/suppliers/invoice`, icon: ReceiptText },
    );
  }
  nav.push({ type: 'group', name: t.inventory, icon: Package, children: invChildren });

  // 5. Finanzas (group) - Oculto parcial en supermercados
  if (!isSupermercado) {
    nav.push({
      type: 'group',
      name: t.finances,
      icon: Wallet,
      children: [
        { type: 'link', name: t.accountsReceivable, href: `/store/${storeId}/finance/receivables`, icon: HandCoins },
        { type: 'link', name: 'Arqueo de Ruteros', href: `/store/${storeId}/finance/arqueo`, icon: WalletCards },
        { type: 'link', name: 'Liquidación de Ruta', href: `/store/${storeId}/finance/liquidation`, icon: ClipboardCheck },
        { type: 'link', name: 'Aging Cartera', href: `/store/${storeId}/finance/aging`, icon: History },
        { type: 'link', name: 'Cuentas por Pagar', href: `/store/${storeId}/finance/payables`, icon: Wallet },
      ],
    });
  } else {
    // Supermercado solo Cuentas por Pagar (Proveedores)
    nav.push({
      type: 'group',
      name: t.finances,
      icon: Wallet,
      children: [
        { type: 'link', name: 'Cuentas por Pagar', href: `/store/${storeId}/finance/payables`, icon: Wallet },
      ],
    });
  }

  // 6. Comercial / Ventas en Calle (group)
  nav.push({
    type: 'group',
    name: t.reports,
    icon: AreaChart,
    children: [
      { type: 'link', name: 'Reporte de Ventas', href: `/store/${storeId}/reports`, icon: AreaChart },
      { type: 'link', name: 'Inventario Valorizado', href: `/store/${storeId}/reports/inventory-valuation`, icon: Package },
    ],
  });

  if (settings.enableSalesManagerMode || isDistribuidora || isBodega) {
    nav.push({
      type: 'group',
      name: t.commercial,
      icon: Truck,
      children: [
        { type: 'link', name: t.vendors, href: `/store/${storeId}/vendors`, icon: UsersRound },
        { type: 'link', name: 'Rutas y Despacho', href: `/store/${storeId}/vendors/routes`, icon: MapPin },
        { type: 'link', name: 'Zonas y Barrios', href: `/store/${storeId}/vendors/zones`, icon: Map },
        { type: 'link', name: 'Flujo de Pedidos', href: `/store/${storeId}/orders-pipeline`, icon: ListOrdered },
      ],
    });

    nav.push({
      type: 'group',
      name: 'Clientes',
      icon: Users,
      children: [
        { type: 'link', name: 'Listado de Clientes', href: `/store/${storeId}/vendors/clients`, icon: Users },
        { type: 'link', name: 'Grupos de Clientes', href: `/store/${storeId}/clients/groups`, icon: UsersRound },
        { type: 'link', name: 'Grupos Económicos', href: `/store/${storeId}/clients/economic-groups`, icon: Briefcase },
        { type: 'link', name: 'Reasignación', href: `/store/${storeId}/clients/reassign`, icon: Undo2 },
      ]
    });

    nav.push({
      type: 'group',
      name: 'Despacho',
      icon: SendToBack,
      children: [
        { type: 'link', name: 'Panel de Despacho', href: `/store/${storeId}/dispatch`, icon: LayoutDashboard },
        { type: 'link', name: 'Cargas del Día', href: `/store/${storeId}/dispatch/cargas`, icon: Truck },
      ]
    });
  }

  nav.push({ type: 'separator' });

  // 7. Equipo (group)
  nav.push({
    type: 'group',
    name: t.team,
    icon: Users,
    children: [
      { type: 'link', name: t.users, href: `/store/${storeId}/users`, icon: UsersRound },
      { type: 'link', name: 'Autorizaciones', href: `/store/${storeId}/authorizations`, icon: ShieldCheck },
      { type: 'link', name: 'Precios Pendientes', href: `/store/${storeId}/authorizations/prices`, icon: DollarSign },
    ],
  });

  // 8. Configuración — link directo
  nav.push({ type: 'link', name: t.settings, href: `/store/${storeId}/settings`, icon: Settings });

  return nav;
};

// --- Simple role navs (already compact) ---
const getBodegueroNav = (storeId: string, lang: 'es' | 'en'): NavItem[] => {
  const t = translations[lang];
  return [
    { type: 'link', name: 'Bodega', href: `/store/${storeId}/warehouse`, icon: Boxes },
    { type: 'separator' },
    {
      type: 'group',
      name: t.inventory,
      icon: Package,
      children: [
        { type: 'link', name: t.products, href: `/store/${storeId}/products`, icon: Package },
        { type: 'link', name: 'Entrada', href: `/store/${storeId}/inventory/entry`, icon: PackagePlus },
        { type: 'link', name: t.movements, href: `/store/${storeId}/inventory/movements`, icon: History },
        { type: 'link', name: t.adjustments, href: `/store/${storeId}/inventory/adjustments`, icon: Wrench },
        { type: 'link', name: t.suppliers, href: `/store/${storeId}/suppliers`, icon: Briefcase },
        { type: 'link', name: t.supplierInvoices, href: `/store/${storeId}/suppliers/invoice`, icon: ReceiptText },
      ],
    },
  ];
};

const getCashierNav = (storeId: string, lang: 'es' | 'en', settings: StoreSettings): NavItem[] => {
  const nav: NavItem[] = [
    { type: 'link', name: translations[lang].billing, href: `/store/${storeId}/facturacion`, icon: ShoppingCart },
  ];
  if (settings.enableDispatcherMode) {
    nav.push({ type: 'link', name: translations[lang].pendingOrders, href: `/store/${storeId}/pending-orders`, icon: ClipboardCheck });
  }
  nav.push({ type: 'link', name: translations[lang].cashRegister, href: `/store/${storeId}/cash-register`, icon: WalletCards });
  return nav;
};

const getDespachoNav = (storeId: string, lang: 'es' | 'en'): NavItem[] => [
  { type: 'link', name: translations[lang].dispatcher, href: `/store/${storeId}/dispatcher`, icon: SendToBack },
  { type: 'link', name: 'Bodega', href: `/store/${storeId}/warehouse`, icon: Boxes },
];

const getAuxiliarNav = (storeId: string, lang: 'es' | 'en'): NavItem[] => {
  const t = translations[lang];
  return [
    { type: 'link', name: t.adjustments, href: `/store/${storeId}/inventory/adjustments`, icon: Wrench },
    { type: 'link', name: 'Bodega', href: `/store/${storeId}/warehouse`, icon: Boxes },
    { type: 'link', name: t.products, href: `/store/${storeId}/products`, icon: Package },
  ];
};

const getSupervisorCajaNav = (storeId: string, lang: 'es' | 'en'): NavItem[] => {
  const t = translations[lang];
  return [
    { type: 'link', name: t.accountsReceivable, href: `/store/${storeId}/finance/receivables`, icon: HandCoins },
    { type: 'link', name: t.dailyClosing, href: `/store/${storeId}/cash-register`, icon: WalletCards }, // Reutilizando para auditoría
    { type: 'link', name: t.products, href: `/store/${storeId}/products`, icon: Package },
  ];
};

const getSupervisorPasilloNav = (storeId: string, lang: 'es' | 'en'): NavItem[] => {
  const t = translations[lang];
  return [
    { type: 'link', name: t.products, href: `/store/${storeId}/products`, icon: Package },
    { type: 'link', name: 'Listado de Clientes', href: `/store/${storeId}/vendors/clients`, icon: Users },
  ];
};

const getRuteroNav = (storeId: string, lang: 'es' | 'en', _settings: StoreSettings): NavItem[] => {
  return [
    { type: 'link', name: translations[lang].deliveryRoute, href: `/store/${storeId}/delivery-route`, icon: Route },
    { type: 'link', name: translations[lang].collections, href: `/store/${storeId}/vendors/collections`, icon: HandCoins },
    { type: 'link', name: translations[lang].returns, href: `/store/${storeId}/vendors/returns`, icon: Undo2 },
    { type: 'link', name: translations[lang].dailyClosing, href: `/store/${storeId}/daily-closing`, icon: WalletCards },
  ];
};

const getVendedorAmbulanteNav = (storeId: string, lang: 'es' | 'en'): NavItem[] => [
  { type: 'link', name: translations[lang].quickSale, href: `/store/${storeId}/vendors/quick-sale`, icon: DollarSign },
  { type: 'link', name: translations[lang].addClient, href: `/store/${storeId}/vendors/clients`, icon: Users },
  { type: 'link', name: translations[lang].sales, href: `/store/${storeId}/vendors/sales`, icon: ListOrdered },
  { type: 'link', name: translations[lang].collections, href: `/store/${storeId}/vendors/collections`, icon: HandCoins },
  { type: 'link', name: translations[lang].returns, href: `/store/${storeId}/vendors/returns`, icon: Undo2 },
];

const getGestorVentasNav = (storeId: string, lang: 'es' | 'en'): NavItem[] => [
  { type: 'link', name: 'Tablero de Ventas', href: `/store/${storeId}/vendors/dashboard`, icon: Route },
  { type: 'link', name: 'Rutas y Despacho', href: `/store/${storeId}/vendors/routes`, icon: MapPin },
  { type: 'separator' },
  {
    type: 'group',
    name: translations[lang].commercial,
    icon: Truck,
    children: [
      { type: 'link', name: translations[lang].sales, href: `/store/${storeId}/vendors/sales`, icon: PackagePlus },
      { type: 'link', name: translations[lang].addClient, href: `/store/${storeId}/vendors/clients`, icon: Users },
      { type: 'link', name: 'Gestionar Zonas', href: `/store/${storeId}/vendors/zones`, icon: Map },
      { type: 'link', name: translations[lang].collections, href: `/store/${storeId}/vendors/collections`, icon: HandCoins },
      { type: 'link', name: translations[lang].vendorInventory, href: `/store/${storeId}/vendors/inventory`, icon: Boxes },
      { type: 'link', name: translations[lang].routeStaff, href: `/store/${storeId}/vendors`, icon: UsersRound },
    ],
  },
];


// ===================================================================
// REALTIME NOTIFICATIONS (unchanged)
// ===================================================================

const buildNotificationKey = (event: RealtimeEvent | null) => {
  if (!event) return '';
  return [
    event.type,
    event.storeId,
    event.payload?.id,
    event.payload?.productId,
    event.payload?.reference,
    event.payload?.createdAt,
    event.payload?.updatedAt,
  ]
    .filter(Boolean)
    .join(':');
};

const buildRealtimeNotification = (
  event: RealtimeEvent | null,
  currentUserId?: string,
  fallbackStoreId?: string,
  isGlobalAdmin = false,
): Notification | null => {
  if (!event) return null;
  const effectiveStoreId = event.storeId || event.payload?.storeId || fallbackStoreId;
  const baseStorePath = effectiveStoreId ? `/store/${effectiveStoreId}` : null;
  const fallbackHref = isGlobalAdmin ? '/master-admin/monitor' : '/';
  const id = buildNotificationKey(event);

  if (!event.type || !id) {
    return null;
  }

  switch (event.type) {
    case 'NEW_ORDER':
      return {
        id,
        title: 'Nuevo pedido',
        description: `Pedido ${event.payload?.id || ''} por C$ ${Number(event.payload?.total || 0).toFixed(2)}`.trim(),
        href: baseStorePath ? `${baseStorePath}/pending-orders` : fallbackHref,
        userId: currentUserId || 'system',
        read: false,
      };
    case 'NEW_VISIT':
      return {
        id,
        title: 'Nueva visita',
        description: `Visita registrada${event.payload?.clientId ? ` para cliente ${event.payload.clientId}` : ''}`,
        href: baseStorePath ? `${baseStorePath}/vendors/dashboard` : fallbackHref,
        userId: currentUserId || 'system',
        read: false,
      };
    case 'PRODUCT_CREATED':
      return {
        id,
        title: 'Producto creado',
        description: event.payload?.description || 'Se registró un producto nuevo.',
        href: baseStorePath ? `${baseStorePath}/products` : fallbackHref,
        userId: currentUserId || 'system',
        read: false,
      };
    case 'PRODUCT_UPDATED':
      return {
        id,
        title: 'Producto actualizado',
        description: event.payload?.description || 'Se actualizó un producto.',
        href: baseStorePath ? `${baseStorePath}/products` : fallbackHref,
        userId: currentUserId || 'system',
        read: false,
      };
    case 'NOTIFICATION':
      return {
        id,
        title: event.payload?.title || 'Nuevo Aviso',
        description: event.payload?.message || 'Tienes una nueva notificación.',
        href: fallbackHref,
        userId: currentUserId || 'system',
        read: false,
      };
    case 'ORDER_STATUS_CHANGE':
      return {
        id,
        title: `Pedido ${event.payload?.orderId?.substring(0, 8)}`,
        description: `Ha cambiado a estado: ${event.payload?.status?.replace('_', ' ')}`,
        href: baseStorePath ? `${baseStorePath}/pending-orders` : fallbackHref,
        userId: currentUserId || 'system',
        read: false,
      };
    case 'INVENTORY_UPDATE':
      return {
        id,
        title: 'Inventario actualizado',
        description: `Movimiento ${event.payload?.type || ''}${event.payload?.quantity ? ` por ${event.payload.quantity}` : ''}`.trim(),
        href: baseStorePath ? `${baseStorePath}/inventory/movements` : fallbackHref,
        userId: currentUserId || 'system',
        read: false,
      };
    default:
      return null;
  }
};


// ===================================================================
// COLLAPSIBLE NAV GROUP COMPONENT
// ===================================================================

function NavGroupItem({
  item,
  onLinkClick,
}: {
  item: NavGroup;
  onLinkClick?: () => void;
}) {
  const location = useLocation();
  const pathname = location.pathname;

  // Auto-expand if any child is active
  const isChildActive = item.children.some(child => pathname.startsWith(child.href));
  const [isOpen, setIsOpen] = useState(isChildActive);

  useEffect(() => {
    if (isChildActive) setIsOpen(true);
  }, [isChildActive]);

  const Icon = item.icon;

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-between w-full gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted/50',
          isChildActive && 'text-primary font-medium'
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-4 w-4" />
          <span>{item.name}</span>
        </div>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border/50 pl-2">
          {item.children.map((child) => {
            const ChildIcon = child.icon;
            const isActive = pathname.startsWith(child.href);
            return (
              <Link
                key={child.href}
                to={child.href}
                onClick={onLinkClick}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-all hover:text-primary hover:bg-muted/50',
                  isActive && 'bg-muted text-primary font-medium'
                )}
              >
                <ChildIcon className="h-3.5 w-3.5" />
                {child.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}


// ===================================================================
// MAIN NAV RENDERER
// ===================================================================

function MainNav({
  navItems,
  onLinkClick,
}: {
  navItems: NavItem[];
  onLinkClick?: () => void;
}) {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <>
      {navItems.map((item, index) => {
        if (item.type === 'separator') {
          return <div key={`sep-${index}`} className="my-2 border-t border-border/40" />;
        }

        if (item.type === 'group') {
          return (
            <NavGroupItem
              key={item.name}
              item={item}
              onLinkClick={onLinkClick}
            />
          );
        }

        // Regular link
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href) && item.href !== '/' || (pathname === '/' && item.href === '/');

        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={onLinkClick}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted/50',
              isActive && 'bg-muted text-primary font-medium'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </>
  );
}


// ===================================================================
// APP LAYOUT
// ===================================================================

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { storeId } = useParams();
  const { user } = useAuth();
  const [language, setLanguage] = useState<'es' | 'en'>('es');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [storeType, setStoreType] = useState<string>('BODEGA');
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    enableDispatcherMode: false,
    enableSalesManagerMode: false,
    enableSupplierManagement: false,
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const seenNotificationIds = useRef<Set<string>>(new Set());
  const location = useLocation();
  const pathname = location.pathname;
  const { lastEvent, connected } = useRealTimeEvents(storeId);

  useEffect(() => {
    if (!storeId) return;
    const fetchStoreSettings = async () => {
      try {
        const res = await apiClient.get(`/stores/${storeId}`);
        if (res.data) {
          if (res.data.settings) setStoreSettings(res.data.settings);
          if (res.data.store_type) setStoreType(res.data.store_type);
        }
      } catch (error) {
         // ignore
      }
    };
    fetchStoreSettings();
  }, [storeId]);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as 'es' | 'en');
  };

  const handleNotificationClick = (notificationId: string) => {
    setNotifications((prev: Notification[]) =>
      prev.map((n: Notification) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  useEffect(() => {
    seenNotificationIds.current.clear();
    setNotifications([]);
  }, [storeId, user?.id]);

  useEffect(() => {
    const notification = buildRealtimeNotification(
      lastEvent,
      user?.id,
      storeId,
      isGlobalAdminRole(user?.role),
    );

    if (!notification || seenNotificationIds.current.has(notification.id)) {
      return;
    }

    seenNotificationIds.current.add(notification.id);
    setNotifications((prev) => [notification, ...prev].slice(0, 12));
  }, [lastEvent, storeId, user?.id, user?.role]);

  const navItems = useMemo(() => {
    const roleId = normalizeUserRole(user?.role);
    switch (roleId) {
      case 'master-admin':
      case 'owner':
        if (storeId) {
          // When master-admin is inside a store, show store nav
          return getStoreAdminNav(storeId, language, storeSettings, storeType);
        }
        return getMasterAdminNav(language);
      case 'chain-admin':
        if (storeId) {
          return getStoreAdminNav(storeId, language, storeSettings, storeType);
        }
        return getChainAdminNav(language);
      case 'store-admin':
        return getStoreAdminNav(storeId || '', language, storeSettings, storeType);
      case 'inventory':
        return getBodegueroNav(storeId || '', language);
      case 'cashier':
        return getCashierNav(storeId || '', language, storeSettings);
      case 'dispatcher':
        return getDespachoNav(storeId || '', language);
      case 'rutero':
        return getRuteroNav(storeId || '', language, storeSettings);
      case 'vendor':
        return getVendedorAmbulanteNav(storeId || '', language);
      case 'sales-manager':
        return getGestorVentasNav(storeId || '', language);
      case 'auxiliar':
        return getAuxiliarNav(storeId || '', language);
      case 'supervisor-caja':
        return getSupervisorCajaNav(storeId || '', language);
      case 'supervisor-pasillo':
        return getSupervisorPasilloNav(storeId || '', language);
      default:
        return storeId ? getStoreAdminNav(storeId, language, storeSettings, storeType) : [];
    }
  }, [user, language, storeId, storeSettings, storeType]);

  // Flatten for AppHeader (mobile hamburger menu still uses flat list)
  const flatNav = useMemo(() => flattenNavItems(navItems), [navItems]);

  const nav = <MainNav navItems={navItems} onLinkClick={() => {}} />;

  if (pathname === '/' && !isGlobalAdminRole(user?.role)) {
    return <>{children}</>;
  }

  const helpHref = storeId ? `/store/${storeId}/help` : '/master-admin/help';

  const sidebarWidth = sidebarCollapsed ? '64px' : '280px';

  return (
    <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-[var(--sidebar-w)_1fr]" style={{ '--sidebar-w': sidebarWidth } as React.CSSProperties}>
      <div className={cn(
        'hidden border-r bg-muted/40 md:block transition-all duration-300 ease-in-out overflow-hidden',
      )} style={{ width: sidebarWidth, minWidth: sidebarWidth }}>
        <div className="flex h-full max-h-screen flex-col">
          <div className="flex h-16 items-center border-b px-2 lg:h-[60px] justify-between">
            {!sidebarCollapsed ? (
              <Link 
                to={
                  normalizeUserRole(user?.role) === 'master-admin' || normalizeUserRole(user?.role) === 'owner' 
                    ? '/master-admin/dashboard' 
                    : normalizeUserRole(user?.role) === 'chain-admin' 
                      ? '/chain-admin/dashboard' 
                      : (storeId ? `/store/${storeId}/dashboard` : '/')
                } 
                className="flex items-center gap-2 font-semibold pl-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-primary flex-shrink-0"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
                <span className="whitespace-nowrap">MultiTienda</span>
              </Link>
            ) : (
              <Link 
                to={
                  normalizeUserRole(user?.role) === 'master-admin' || normalizeUserRole(user?.role) === 'owner' 
                    ? '/master-admin/dashboard' 
                    : normalizeUserRole(user?.role) === 'chain-admin' 
                      ? '/chain-admin/dashboard' 
                      : (storeId ? `/store/${storeId}/dashboard` : '/')
                } 
                className="flex items-center justify-center w-full"
                title="MultiTienda"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-primary"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
              </Link>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-primary flex-shrink-0"
              title={sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
            >
              {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {!sidebarCollapsed && storeId && (normalizeUserRole(user?.role) === 'master-admin' || normalizeUserRole(user?.role) === 'owner' || normalizeUserRole(user?.role) === 'chain-admin') && (
              <div className="px-2 pb-2 mb-1 border-b border-border/50 lg:px-4">
                <Link
                  to={normalizeUserRole(user?.role) === 'chain-admin' ? '/chain-admin/dashboard' : '/master-admin/stores'}
                  className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg transition-colors hover:bg-primary/90"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  Regresar a Tiendas
                </Link>
              </div>
            )}
            {sidebarCollapsed ? (
              <nav className="flex flex-col items-center gap-1 px-1">
                {flatNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href) && item.href !== '/' || (pathname === '/' && item.href === '/');
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      title={item.name}
                      className={cn(
                        'flex items-center justify-center rounded-lg p-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-muted/50',
                        isActive && 'bg-muted text-primary'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </Link>
                  );
                })}
              </nav>
            ) : (
              <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-0.5">
                {nav}
              </nav>
            )}
          </div>

          {/* Help pinned to sidebar footer */}
          <div className="border-t p-2">
            <Link
              to={helpHref}
              title={translations[language].help}
              className={cn(
                'flex items-center rounded-lg px-3 py-2 text-xs text-muted-foreground transition-all hover:text-primary hover:bg-muted/50',
                sidebarCollapsed ? 'justify-center' : 'gap-3'
              )}
            >
              <LifeBuoy className="h-4 w-4 flex-shrink-0" />
              {!sidebarCollapsed && translations[language].help}
            </Link>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <AppHeader
          navItems={flatNav}
          language={language}
          onLanguageChange={handleLanguageChange}
          exchangeRate={storeSettings.exchangeRate}
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          isSocketConnected={connected}
        />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background overflow-x-hidden">
          {children}
        </main>

        <footer className="flex items-center justify-between p-4 text-xs text-muted-foreground border-t">
          <span>© {new Date().getFullYear()} World Wide All in One Programing. Todos los derechos reservados.</span>
        </footer>
      </div>
    </div>
  );
}
