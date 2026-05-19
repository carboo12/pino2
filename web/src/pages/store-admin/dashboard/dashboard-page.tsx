import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Boxes,
  HandCoins,
  Package,
  ShoppingCart,
  Truck,
} from 'lucide-react';

import { useStore } from '@/hooks/use-api';
import { StoreAdminDashboardMetrics } from '@/components/dashboard/store-admin-dashboard-metrics';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { QuickOperationalPulse } from '@/components/dashboard/quick-operational-pulse';
import { useAuth } from '@/contexts/auth-context';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

function formatDate(): string {
  return new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function DashboardPage() {
  const { storeId = '' } = useParams();
  const { user } = useAuth();
  const { data: storeData, isLoading: loading } = useStore(storeId);
  const storeName = (storeData as any)?.name || 'Tienda';

  const quickActions = useMemo(
    () => [
      {
        title: 'Facturar',
        description: 'Entrar directo a caja y registrar una venta.',
        href: `/store/${storeId}/billing`,
        icon: ShoppingCart,
      },
      {
        title: 'Bodega',
        description: 'Mover pedidos, alistar y cargar camiones.',
        href: `/store/${storeId}/warehouse`,
        icon: Boxes,
      },
      {
        title: 'Despacho',
        description: 'Ver pendientes y coordinar salida de pedidos.',
        href: `/store/${storeId}/pending-orders`,
        icon: Truck,
      },
      {
        title: 'Cobranza',
        description: 'Entrar a cuentas por cobrar y seguimiento.',
        href: `/store/${storeId}/finance/receivables`,
        icon: HandCoins,
      },
    ],
    [storeId],
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in slide-up duration-300">
        <div className="h-44 animate-pulse rounded-2xl bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-up duration-300">
      <section className="rounded-2xl bg-gradient-to-br from-primary to-primaryDark p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold tracking-tight">
                {getGreeting()}, {user?.name?.split(' ')[0] || 'Usuario'} 👋
              </h1>
              <p className="text-sm text-white/80">
                {storeName} · {formatDate()}
              </p>
            </div>
            <Badge className="border border-white/20 bg-white/10 text-white text-xs font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse" />
              En línea
            </Badge>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card key={action.title} className="transition-all duration-150 hover:shadow-md hover:-translate-y-0.5">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-primary/10 p-3 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="rounded-full text-xs">
                    Rápido
                  </Badge>
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">
                    {action.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {action.description}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full rounded-xl font-semibold">
                  <Link to={action.href}>
                    Abrir
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">
            Resumen operativo
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Métricas financieras y de despacho para tomar decisiones rápidas.
          </p>
        </CardHeader>
        <CardContent>
          <StoreAdminDashboardMetrics storeId={storeId} />
        </CardContent>
      </Card>
    </div>
  );
}
