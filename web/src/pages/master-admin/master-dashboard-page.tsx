import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, AlertTriangle, CheckCircle, Store, Users, BadgePercent } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import apiClient from '@/services/api-client';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

interface LicenseStats { active: number; expiringSoon: number; expired: number; }

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

const statCards = [
  {
    title: 'Total Tiendas',
    icon: Store,
    borderClass: 'border-l-4 border-l-blue-500',
    bgClass: 'bg-blue-50 dark:bg-blue-950/30',
    iconClass: 'text-blue-600 dark:text-blue-400',
  },
  {
    title: 'Licencias Activas',
    icon: CheckCircle,
    borderClass: 'border-l-4 border-l-emerald-500',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    title: 'Por Vencer',
    icon: AlertTriangle,
    borderClass: 'border-l-4 border-l-amber-500',
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    iconClass: 'text-amber-600 dark:text-amber-400',
  },
  {
    title: 'Sin Licencia / Vencidas',
    icon: AlertCircle,
    borderClass: 'border-l-4 border-l-red-500',
    bgClass: 'bg-red-50 dark:bg-red-950/30',
    iconClass: 'text-red-600 dark:text-red-400',
  },
  {
    title: 'Total Usuarios',
    icon: Users,
    borderClass: 'border-l-4 border-l-violet-500',
    bgClass: 'bg-violet-50 dark:bg-violet-950/30',
    iconClass: 'text-violet-600 dark:text-violet-400',
  },
];

export default function MasterDashboardPage() {
  const { user } = useAuth();
  const [licenseStats, setLicenseStats] = useState<LicenseStats | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalStores, setTotalStores] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, storesRes] = await Promise.all([apiClient.get('/users'), apiClient.get('/stores')]);
        setTotalUsers((usersRes.data || []).length);
        const stores = storesRes.data || [];
        setTotalStores(stores.length);
        let active = 0, expiringSoon = 0, expired = 0;
        stores.forEach((store: any) => {
          if (!store.license?.expiryDate) { expired++; return; }
          const days = differenceInDays(parseISO(store.license.expiryDate), new Date());
          if (days < 0) expired++; else if (days <= 30) expiringSoon++; else active++;
        });
        setLicenseStats({ active, expiringSoon, expired });
      } catch { } finally { setLoading(false); }
    };
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="space-y-6 animate-in fade-in slide-up duration-300">
      <div className="h-28 rounded-2xl bg-muted animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );

  const values = [totalStores, licenseStats?.active ?? 0, licenseStats?.expiringSoon ?? 0, licenseStats?.expired ?? 0, totalUsers];

  return (
    <div className="space-y-6 animate-in fade-in slide-up duration-300">
      <section className="rounded-2xl bg-gradient-to-br from-primary to-primaryDark p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <BadgePercent className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold">{getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'} 👋</h1>
            <p className="text-sm text-white/80">Panel General · Resumen de todas las tiendas</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className={cn('transition-all duration-150 hover:shadow-md', card.borderClass, card.bgClass)}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-muted-foreground">{card.title}</span>
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', card.bgClass)}>
                    <Icon className={cn('h-5 w-5', card.iconClass)} />
                  </div>
                </div>
                <div className="text-2xl font-extrabold">{values[i]}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
