import apiClient from '@/services/api-client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { AppHeader } from '@/components/app-header';
import { cn } from '@/lib/utils';
import { isGlobalAdminRole, normalizeUserRole } from '@/lib/user-role';
import { MVP_FEATURES } from '@/lib/mvp-features';
import { useRealTimeEvents } from '@/hooks/use-real-time-events';
import { CommandSearch } from '@/components/workspace/command-search';
import {
  LayoutDashboard, Store, Briefcase, Users, WalletCards, RefreshCw,
  FileText, Map, MapPin, Settings, LifeBuoy, Package, History, Wrench,
  ShoppingCart, ClipboardCheck, AreaChart, UsersRound, Truck, HandCoins,
  ShieldCheck, SendToBack, Route, DollarSign, ListOrdered, PackagePlus, ReceiptText, Boxes, Wallet, Undo2,
  ChevronDown, PanelLeftClose, PanelLeft, Command, TreePine, ShoppingBag, ArrowDownRight,
  ShieldAlert, UserCheck, UserCog, FileCheck, Tag, Layers
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

// ===================================================================
// NAV DEFINITIONS — CONSOLIDATED WITH GROUPS BY STORE TYPE
// ===================================================================

const getChainAdminNav = (): NavItem[] => [
  ...(MVP_FEATURES.chainDashboard ? [{ type: 'link' as const, name: 'Panel', href: '/chain-admin/dashboard', icon: LayoutDashboard }] : []),
  { type: 'link', name: 'Tiendas', href: '/master-admin/stores', icon: Store },
];

const getMasterAdminNav = (activeStoreId = '9321856d-19ba-42b8-ba47-cf35c0d133dd'): NavItem[] => [
  { type: 'link', name: 'Panel Maestro', href: '/master-admin/dashboard', icon: LayoutDashboard },
  { type: 'link', name: 'Tiendas', href: '/master-admin/stores', icon: Store },
  { type: 'link', name: 'Usuarios', href: '/master-admin/users', icon: Users },
  { type: 'separator' },
  { type: 'link', name: 'Bodega Central', href: `/store/${activeStoreId}/warehouse`, icon: Boxes },
  { type: 'link', name: 'Rutas & Campo', href: `/store/${activeStoreId}/routes`, icon: Map },
  { type: 'link', name: 'Ventas Globales', href: `/store/${activeStoreId}/work/sales`, icon: Route },
  { type: 'link', name: 'Finanzas Globales', href: `/store/${activeStoreId}/work/finance`, icon: Wallet },
  { type: 'link', name: 'Catálogo General', href: `/store/${activeStoreId}/work/catalog`, icon: Package },
  { type: 'separator' },
  { type: 'group', name: 'Monitor Global', icon: AreaChart, children: [
    { type: 'link', name: 'Monitor de Sincronización', href: '/master-admin/sync-monitor', icon: RefreshCw, section: 'ops' },
    { type: 'link', name: 'Comparar Tiendas', href: '/master-admin/comparison', icon: AreaChart, section: 'ops' },
    { type: 'link', name: 'Bitácora de Actividades', href: '/master-admin/monitor', icon: FileText, section: 'ops' },
  ]},
  { type: 'separator' },
  { type: 'link', name: 'Configuración', href: '/master-admin/config', icon: Settings },
];

// --- 🛒 1. SUPERMERCADO (Venta Minorista / POS / Proveedores Directos) ---
const getSupermarketNav = (storeId: string): NavItem[] => [
  { type: 'link', name: 'Panel Supermercado', href: `/store/${storeId}/dashboard`, icon: LayoutDashboard },
  { type: 'separator' },
  { type: 'group', name: 'Ventas & Cajas (POS)', icon: ShoppingCart, children: [
    { type: 'link', name: 'POS Cobro Minorista', href: `/store/${storeId}/work/sales`, icon: Route },
    { type: 'link', name: 'Arqueos & Control de Caja', href: `/store/${storeId}/cash-register`, icon: DollarSign },
    { type: 'link', name: 'Promociones & Ofertas', href: `/store/${storeId}/promotions`, icon: Tag },
  ]},
  { type: 'group', name: 'Inventario & Góndolas', icon: Boxes, children: [
    { type: 'link', name: 'Sugerido de Góndola', href: `/store/${storeId}/gondola-restock`, icon: Layers },
    { type: 'link', name: 'Catálogo & Factor X', href: `/store/${storeId}/products`, icon: Package },
    { type: 'link', name: 'Movimientos & Kárdex', href: `/store/${storeId}/inventory/movements`, icon: FileText },
    { type: 'link', name: 'Conteos Ciegos', href: `/store/${storeId}/inventory/counts`, icon: ClipboardCheck },
    { type: 'link', name: 'Ajustes de Stock', href: `/store/${storeId}/inventory/adjustments`, icon: ShieldCheck },
  ]},
  { type: 'group', name: 'Proveedores & CxP', icon: Wallet, children: [
    { type: 'link', name: 'Recepción Proveedores Directos', href: `/store/${storeId}/supplier-invoices`, icon: ArrowDownRight },
    { type: 'link', name: 'Proveedores Locales', href: `/store/${storeId}/suppliers`, icon: Store },
    { type: 'link', name: 'Cuentas por Pagar (CxP)', href: `/store/${storeId}/finance/payables`, icon: WalletCards },
    { type: 'link', name: 'Reportes Venta Minorista', href: `/store/${storeId}/reports`, icon: AreaChart },
  ]},
  { type: 'separator' },
  { type: 'link', name: 'Usuarios & Personal', href: `/store/${storeId}/users`, icon: UserCog },
  { type: 'link', name: 'Autorizaciones & Pines', href: `/store/${storeId}/authorizations`, icon: ShieldAlert },
];

// --- 🏢 2. DISTRIBUIDORA (Venta Mayorista / Mostrador / Recibe SOLO de Bodega Central) ---
const getDistributorNav = (storeId: string): NavItem[] => [
  { type: 'link', name: 'Panel Distribuidora', href: `/store/${storeId}/dashboard`, icon: LayoutDashboard },
  { type: 'separator' },
  { type: 'group', name: 'Ventas & Mostrador', icon: ShoppingCart, children: [
    { type: 'link', name: 'Comandas de Mostrador', href: `/store/${storeId}/pending-orders`, icon: ShoppingBag },
    { type: 'link', name: 'Cobro & Facturación en Caja', href: `/store/${storeId}/work/sales`, icon: Route },
    { type: 'link', name: 'Clientes & Cartera', href: `/store/${storeId}/vendors/clients`, icon: Users },
    { type: 'link', name: 'Cuentas por Cobrar (CxC)', href: `/store/${storeId}/finance/receivables`, icon: HandCoins },
  ]},
  { type: 'group', name: 'Almacén & Despacho', icon: Boxes, children: [
    { type: 'link', name: 'Control Despacho Portón', href: `/store/${storeId}/dispatcher`, icon: MapPin },
    { type: 'link', name: 'Solicitar a Bodega Central', href: `/store/${storeId}/inventory/adjustments`, icon: SendToBack },
    { type: 'link', name: 'Inventario & Factor X', href: `/store/${storeId}/products`, icon: Package },
    { type: 'link', name: 'Movimientos & Kárdex', href: `/store/${storeId}/inventory/movements`, icon: FileText },
    { type: 'link', name: 'Conteos Ciegos', href: `/store/${storeId}/inventory/counts`, icon: ClipboardCheck },
  ]},
  { type: 'group', name: 'Caja & Reportes', icon: Wallet, children: [
    { type: 'link', name: 'Arqueos & Cortes de Caja', href: `/store/${storeId}/cash-register`, icon: DollarSign },
    { type: 'link', name: 'Reportes Venta Mayorista', href: `/store/${storeId}/reports`, icon: AreaChart },
  ]},
  { type: 'separator' },
  { type: 'link', name: 'Usuarios de Distribuidora', href: `/store/${storeId}/users`, icon: UserCog },
  { type: 'link', name: 'Autorizaciones & Sobregiros', href: `/store/${storeId}/authorizations`, icon: ShieldAlert },
];

// --- 📦 3. BODEGA CENTRAL (Matriz / Rutas / Preventa / Cargas) ---
const getWarehouseCentralNav = (storeId: string): NavItem[] => [
  { type: 'link', name: 'Panel Bodega Central', href: `/store/${storeId}/dashboard`, icon: LayoutDashboard },
  { type: 'separator' },
  { type: 'group', name: 'Rutas & Preventa', icon: Map, children: [
    { type: 'link', name: 'Preventas & Pedidos Campo', href: `/store/${storeId}/pending-orders`, icon: ShoppingBag },
    { type: 'link', name: 'Definición & Rutas Comercial', href: `/store/${storeId}/routes`, icon: MapPin },
    { type: 'link', name: 'Gestores de Venta (Móvil)', href: `/store/${storeId}/vendors`, icon: UserCheck },
    { type: 'link', name: 'Clientes & Cartera Global', href: `/store/${storeId}/vendors/clients`, icon: Users },
  ]},
  { type: 'group', name: 'Logística & Reparto', icon: Truck, children: [
    { type: 'link', name: 'Armado Carga Camión', href: `/store/${storeId}/routes`, icon: Truck },
    { type: 'link', name: 'Control Despacho Camiones', href: `/store/${storeId}/dispatcher`, icon: MapPin },
    { type: 'link', name: 'Liquidación de Rutas', href: `/store/${storeId}/daily-closing`, icon: FileCheck },
  ]},
  { type: 'group', name: 'Inventario Masivo & Compras', icon: Boxes, children: [
    { type: 'link', name: 'Catálogo General & Factor X', href: `/store/${storeId}/products`, icon: Package },
    { type: 'link', name: 'Recepción Compras Proveedores', href: `/store/${storeId}/suppliers`, icon: Store },
    { type: 'link', name: 'Movimientos & Kárdex General', href: `/store/${storeId}/inventory/movements`, icon: FileText },
    { type: 'link', name: 'Conteos Ciegos', href: `/store/${storeId}/inventory/counts`, icon: ClipboardCheck },
    { type: 'link', name: 'Ajustes de Kárdex', href: `/store/${storeId}/inventory/adjustments`, icon: ShieldCheck },
  ]},
  { type: 'group', name: 'Finanzas & Supervisión', icon: Wallet, children: [
    { type: 'link', name: 'Cuentas por Cobrar (CxC)', href: `/store/${storeId}/finance/receivables`, icon: HandCoins },
    { type: 'link', name: 'Cuentas por Pagar (CxP)', href: `/store/${storeId}/finance/payables`, icon: WalletCards },
    { type: 'link', name: 'Reportes Consolidados', href: `/store/${storeId}/reports`, icon: AreaChart },
  ]},
  { type: 'separator' },
  { type: 'link', name: 'Usuarios & Privilegios', href: `/store/${storeId}/users`, icon: UserCog },
  { type: 'link', name: 'Autorizaciones Emergencia', href: `/store/${storeId}/authorizations`, icon: ShieldAlert },
];

const getStoreAdminNav = (storeId: string, storeType = 'SUPERMERCADO'): NavItem[] => {
  const normalizedType = (storeType || '').toUpperCase();
  if (normalizedType.includes('DISTRIB')) {
    return getDistributorNav(storeId);
  }
  if (normalizedType.includes('BODEGA') || normalizedType.includes('CENTRAL')) {
    return getWarehouseCentralNav(storeId);
  }
  return getSupermarketNav(storeId);
};

// --- Simple role navs (already compact) ---
const getBodegueroNav = (storeId: string): NavItem[] => [
  { type: 'link', name: 'Kárdex & Movimientos', href: `/store/${storeId}/inventory/movements`, icon: Boxes },
  { type: 'link', name: 'Arqueos (Conteo Ciego)', href: `/store/${storeId}/inventory/counts`, icon: ClipboardCheck },
  { type: 'link', name: 'Solicitud Ajustes', href: `/store/${storeId}/inventory/adjustments`, icon: FileText },
  { type: 'link', name: 'Catálogo', href: `/store/${storeId}/work/catalog`, icon: Package },
];

const getAuxiliarNav = (storeId: string): NavItem[] => [
  { type: 'link', name: 'Recepción Compras', href: `/store/${storeId}/supplier-invoices`, icon: ArrowDownRight },
  { type: 'link', name: 'Armado Carga Camión', href: `/store/${storeId}/routes`, icon: Truck },
  { type: 'link', name: 'Devoluciones Campo', href: `/store/${storeId}/vendors/returns`, icon: Undo2 },
  { type: 'link', name: 'Cuentas por Cobrar', href: `/store/${storeId}/cxc`, icon: HandCoins },
];

const getSupervisorCajaNav = (storeId: string): NavItem[] => [
  { type: 'link', name: 'Caja', href: `/store/${storeId}/work/cash`, icon: WalletCards },
  { type: 'link', name: 'Finanzas', href: `/store/${storeId}/work/finance`, icon: Wallet },
];

const getSupervisorPasilloNav = (storeId: string): NavItem[] => [
  { type: 'link', name: 'Catálogo', href: `/store/${storeId}/work/catalog`, icon: Package },
];

const getRuteroNav = (storeId: string): NavItem[] => [
  { type: 'link', name: 'Ruta', href: `/store/${storeId}/delivery-route`, icon: Route },
  { type: 'link', name: 'Cobros', href: `/store/${storeId}/vendors/collections`, icon: HandCoins },
  { type: 'link', name: 'Devolución', href: `/store/${storeId}/vendors/returns`, icon: Undo2 },
  { type: 'link', name: 'Cierre', href: `/store/${storeId}/daily-closing`, icon: WalletCards },
];

const getVendedorAmbulanteNav = (storeId: string): NavItem[] => [
  { type: 'link', name: 'Ruta/Ventas', href: `/store/${storeId}/work/sales`, icon: Route },
  { type: 'link', name: 'Cobros', href: `/store/${storeId}/vendors/collections`, icon: HandCoins },
  { type: 'link', name: 'Devolución', href: `/store/${storeId}/vendors/returns`, icon: Undo2 },
  { type: 'link', name: 'Cierre', href: `/store/${storeId}/daily-closing`, icon: WalletCards },
];

const getGestorVentasNav = (storeId: string): NavItem[] => [
  { type: 'link', name: 'Ventas/Ruta', href: `/store/${storeId}/work/sales`, icon: Route },
  { type: 'link', name: 'Admin', href: `/store/${storeId}/work/admin`, icon: ShieldCheck },
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
          'flex items-center justify-between w-full gap-3 rounded-xl px-3 py-2.5 text-muted-foreground transition-all duration-150 hover:text-primary hover:bg-muted/50',
          isChildActive && 'text-primary font-semibold'
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
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-all duration-150 hover:text-primary hover:bg-muted/50',
                  isActive && 'bg-primary/10 text-primary font-semibold'
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
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground transition-all duration-150 hover:text-primary hover:bg-muted/50',
              isActive && 'bg-primary/10 text-primary font-semibold'
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [storeType, setStoreType] = useState<string>('BODEGA');
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    enableDispatcherMode: false,
    enableSalesManagerMode: false,
    enableSupplierManagement: false,
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [allStores, setAllStores] = useState<Array<{ id: string; name: string }>>([]);
  const seenNotificationIds = useRef<Set<string>>(new Set());
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const isWorkspace = pathname.includes('/work/');
  const [isImpersonating] = useState(() => localStorage.getItem('impersonated') === 'true');
  const { lastEvent, connected } = useRealTimeEvents(storeId);

  const stopImpersonating = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('impersonated');
    window.location.href = '/login';
  };

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await apiClient.get('/stores');
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setAllStores(list.map((s: any) => ({ id: s.id, name: s.name })));
      } catch {}
    };
    const fetchStoreNames = async (ids: string[]) => {
      try {
        const names = await Promise.all(
          ids.map(async (id) => {
            const res = await apiClient.get(`/stores/${id}`);
            return res.data ? { id, name: res.data.name || id } : { id, name: id };
          })
        );
        setAllStores(names);
      } catch {
        setAllStores(ids.map((id) => ({ id, name: id })));
      }
    };
    if (normalizeUserRole(user?.role) === 'admin' || normalizeUserRole(user?.role) === 'super-admin') {
      fetchStores();
    } else if (user?.storeIds?.length) {
      fetchStoreNames(user.storeIds);
    }
  }, [user]);

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
    const activeStore = storeId || user?.storeIds?.[0] || allStores?.[0]?.id || '9321856d-19ba-42b8-ba47-cf35c0d133dd';

    switch (roleId) {
      case 'admin':
        // JEFE / ENCARGADO DE SUCURSAL: Navegación inteligente adaptada al storeType
        return getStoreAdminNav(activeStore, storeType);
      case 'super-admin':
        // ADMINISTRADOR GENERAL: Navegación de tienda activa si hay storeId seleccionado
        if (storeId) {
          return getStoreAdminNav(storeId, storeType);
        }
        return getMasterAdminNav(activeStore);
      case 'inventory':
        return getBodegueroNav(activeStore);
      case 'rutero':
        return getRuteroNav(activeStore);
      case 'gestor':
        return getGestorVentasNav(activeStore);
      case 'auxiliar':
        return getAuxiliarNav(activeStore);
      default:
        return getStoreAdminNav(activeStore, storeType);
    }
  }, [user, storeId, storeType, allStores]);

  // Flatten for AppHeader (mobile hamburger menu still uses flat list)
  const flatNav = useMemo(() => flattenNavItems(navItems), [navItems]);

  const nav = <MainNav navItems={navItems} onLinkClick={() => {}} />;

  if (pathname === '/' && !isGlobalAdminRole(user?.role)) {
    return <>{children}</>;
  }

  const helpHref = storeId ? `/store/${storeId}/help` : '/master-admin/help';

  const logoHref = (() => {
    const role = normalizeUserRole(user?.role);
    if (role === 'admin' || role === 'super-admin') return '/master-admin/dashboard';
    return storeId ? `/store/${storeId}/dashboard` : '/';
  })();

  const sidebarWidth = sidebarCollapsed ? '64px' : '248px';

  return (
    <>
      {isImpersonating && (
        <div className="sticky top-0 z-50 w-full bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm">
          <span>🔍 Estás viendo como otro usuario</span>
          <button onClick={stopImpersonating} className="underline font-semibold hover:text-amber-100">
            Salir del modo vista
          </button>
        </div>
      )}
      <CommandSearch />
      <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-[var(--sidebar-w)_1fr]" style={{ '--sidebar-w': sidebarWidth } as React.CSSProperties}>
      <div className={cn(
        'hidden border-r bg-muted/40 md:block transition-all duration-300 ease-in-out overflow-hidden',
      )} style={{ width: sidebarWidth, minWidth: sidebarWidth }}>
        <div className="flex h-full max-h-screen flex-col">
          <div className="flex h-16 items-center border-b px-4 lg:h-[60px] justify-between">
            {!sidebarCollapsed ? (
              <Link 
                to={logoHref}
                className="flex items-center gap-2.5 font-semibold"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primaryDark flex items-center justify-center shadow-sm">
                  <TreePine className="h-4 w-4 text-white" />
                </div>
                <span className="whitespace-nowrap text-base">Pino</span>
              </Link>
            ) : (
              <Link 
                to={logoHref}
                className="flex items-center justify-center w-full"
                title="Pino"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primaryDark flex items-center justify-center shadow-sm">
                  <TreePine className="h-4 w-4 text-white" />
                </div>
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
            {!sidebarCollapsed && storeId && (normalizeUserRole(user?.role) === 'admin' || normalizeUserRole(user?.role) === 'super-admin') && (
              <div className="px-2 pb-2 mb-1 border-b border-border/50 lg:px-4">
                <Link
                  to={'/master-admin/stores'}
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
                        'flex items-center justify-center rounded-xl p-2.5 text-muted-foreground transition-all duration-150 hover:text-primary hover:bg-muted/50',
                        isActive && 'bg-primary/10 text-primary'
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

          {MVP_FEATURES.help && (
            <div className="border-t p-2">
              <Link
                to={helpHref}
                title="Ayuda"
                className={cn(
                  'flex items-center rounded-xl px-3 py-2.5 text-xs text-muted-foreground transition-all duration-150 hover:text-primary hover:bg-muted/50',
                  sidebarCollapsed ? 'justify-center' : 'gap-3'
                )}
              >
                <LifeBuoy className="h-4 w-4 flex-shrink-0" />
                {!sidebarCollapsed && 'Ayuda'}
              </Link>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col">
        <AppHeader
          navItems={flatNav}
          exchangeRate={storeSettings.exchangeRate}
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          isSocketConnected={connected}
          stores={allStores}
          currentStoreId={storeId}
          onStoreChange={(id) => navigate(`/store/${id}/dashboard`)}
        />
        <main className={isWorkspace ? 'h-[calc(100dvh-4rem)] overflow-hidden p-0' : 'flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background overflow-x-hidden'}>
          {children}
        </main>

        {!isWorkspace && (
          <footer className="flex items-center justify-between p-4 text-xs text-muted-foreground border-t">
            <span>&copy; {new Date().getFullYear()} Pino · Sistema de Distribución</span>
          </footer>
        )}
      </div>
    </div>
    </>
  );
}
