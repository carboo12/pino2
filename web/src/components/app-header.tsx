import * as React from 'react';
import { Menu, Bell, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { UserNav } from './user-nav';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import type { Notification, NavLink } from './app-layout';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

interface AppHeaderProps {
  navItems: NavLink[];
  exchangeRate?: number;
  notifications: Notification[];
  onNotificationClick: (notificationId: string) => void;
  isSocketConnected?: boolean;
  stores?: Array<{ id: string; name: string }>;
  currentStoreId?: string;
  onStoreChange?: (storeId: string) => void;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function shortenIfUuid(segment: string): string {
  if (UUID_PATTERN.test(segment)) {
    return segment.substring(0, 8) + '...';
  }
  return segment;
}

const breadcrumbLabels: Record<string, string> = {
  'work': 'Espacio',
  'cash': 'Caja',
  'warehouse': 'Bodega',
  'sales': 'Ventas',
  'finance': 'Finanzas',
  'catalog': 'Catálogo',
  'admin': 'Admin',
  'dashboard': 'Panel',
  'products': 'Productos',
  'users': 'Usuarios',
  'reports': 'Reportes',
  'settings': 'Configuración',
  'vendors': 'Vendedores',
  'help': 'Ayuda',
  'pending-orders': 'Pedidos',
  'dispatch': 'Despacho',
  'delivery-route': 'Ruta',
};

function Breadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  const crumbs: { label: string; href: string }[] = [];
  for (let i = 0; i < segments.length; i++) {
    const href = '/' + segments.slice(0, i + 1).join('/');
    const raw = decodeURIComponent(segments[i]);
    const label = breadcrumbLabels[segments[i]] || shortenIfUuid(raw);
    crumbs.push({ label, href });
  }

  if (crumbs.length === 0) return null;

  return (
    <nav className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground">
      {crumbs.map((crumb, i) => (
        <React.Fragment key={crumb.href}>
          {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
          {i === crumbs.length - 1 ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link to={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

function MobileSheet({ navItems, isOpen, onOpenChange }: {
  navItems: NavLink[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const location = useLocation();
  const { user } = useAuth();

  const getInitials = (name?: string | null) => {
    if (!name) return '';
    const names = name.split(' ').filter(Boolean);
    if (names.length > 1) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menú</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Menú de Navegación</SheetTitle>
        </SheetHeader>
        <div className="flex items-center gap-3 px-6 py-5 border-b">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primaryDark flex items-center justify-center text-white font-bold text-sm">
            {getInitials(user?.name)}
          </div>
          <div>
            <p className="text-sm font-semibold">{user?.name || 'Usuario'}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace(/-/g, ' ') || ''}</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-all duration-150 hover:text-primary hover:bg-muted/50',
                  isActive && 'bg-primary/10 text-primary font-semibold'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4">
          <Link
            to="/login"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            Cerrar sesión
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AppHeader({
  navItems,
  notifications,
  onNotificationClick,
  stores,
  currentStoreId,
  onStoreChange,
}: AppHeaderProps) {
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="md:hidden flex items-center">
        <MobileSheet navItems={navItems} isOpen={isSheetOpen} onOpenChange={setIsSheetOpen} />
      </div>

      <Breadcrumb />

      {stores && stores.length > 0 && (
        <div className="hidden md:flex items-center gap-1">
          <select
            value={currentStoreId || ''}
            onChange={(e) => {
              if (e.target.value && onStoreChange) {
                onStoreChange(e.target.value);
              }
            }}
            className="max-w-[200px] text-sm border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name.length > 20 ? s.name.substring(0, 20) + '…' : s.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex w-full items-center justify-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
              <span className="sr-only">Notificaciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <DropdownMenuItem key={notif.id} asChild>
                  <Link
                    to={notif.href}
                    className="flex flex-col items-start whitespace-normal"
                    onClick={() => onNotificationClick(notif.id)}
                  >
                    <p className="font-semibold text-sm">{notif.title}</p>
                    <p className="text-xs text-muted-foreground">{notif.description}</p>
                  </Link>
                </DropdownMenuItem>
              ))
            ) : (
              <p className="p-4 text-sm text-muted-foreground">No hay notificaciones nuevas.</p>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <UserNav />
      </div>
    </header>
  );
}
