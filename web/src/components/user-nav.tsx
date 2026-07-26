import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Moon, Sun, Store, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from 'next-themes';

const avatarColors = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
];

function getAvatarColor(name?: string | null): string {
  if (!name) return avatarColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getInitials(name?: string | null) {
  if (!name) return '?';
  const names = name.split(' ').filter(Boolean);
  if (names.length > 1) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function getHumanRoleLabel(role?: string | null): string {
  if (!role) return 'Usuario';
  const norm = role.toLowerCase();
  switch (norm) {
    case 'auxiliar':
      return 'Auxiliar de Bodega / Cajero';
    case 'admin':
      return 'Administrador de Sucursal';
    case 'gestor':
      return 'Gestor / Vendedor de Campo';
    case 'rutero':
      return 'Rutero / Repartidor';
    case 'inventory':
      return 'Encargado de Inventario';
    case 'super-admin':
      return 'Super Administrador (SaaS)';
    case 'chain-admin':
      return 'Administrador de Cadena';
    default:
      return role.replace(/-/g, ' ');
  }
}

export function UserNav() {
  const { logout, user } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarFallback className={getAvatarColor(user?.name)}>
              <span className="text-white text-xs font-semibold">{getInitials(user?.name)}</span>
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className={getAvatarColor(user?.name)}>
                <span className="text-white text-sm font-semibold">{getInitials(user?.name)}</span>
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-extrabold leading-none text-foreground">{user?.name || 'Usuario'}</p>
              <p className="text-xs leading-none text-muted-foreground">{user?.email || ''}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-2 space-y-1.5">
          <div className="rounded-xl bg-muted/60 p-2.5 space-y-1 border border-[#DDE2E8]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{getHumanRoleLabel(user?.role)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Store className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{user?.storeName || 'Los Pinos - Central'}</span>
            </div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-xl">
          {theme === 'dark' ? (
            <Sun className="mr-2 h-4 w-4" />
          ) : (
            <Moon className="mr-2 h-4 w-4" />
          )}
          <span className="font-medium text-xs">{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-rose-600 focus:text-rose-600 font-bold rounded-xl">
          <LogOut className="mr-2 h-4 w-4" />
          <span className="text-xs">Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
