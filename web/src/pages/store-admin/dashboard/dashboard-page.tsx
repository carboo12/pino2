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

  const storeType = (storeData as any)?.storeType || (storeData as any)?.store_type || 'SUPERMERCADO';

  const quickActions = useMemo(() => {
    const typeUpper = (storeType || '').toUpperCase();
    
    if (typeUpper.includes('DISTRIB')) {
      return [
        {
          title: 'Comandas Mostrador',
          description: 'Toma de comandas preliminares en sala de ventas.',
          href: `/store/${storeId}/pending-orders`,
          icon: ShoppingCart,
        },
        {
          title: 'Cobro en Caja',
          description: 'Cobrar comanda y emitir factura oficial (C$/USD).',
          href: `/store/${storeId}/work/sales`,
          icon: HandCoins,
        },
        {
          title: 'Despacho Portón',
          description: 'Verificar factura pagada y entregar carga física.',
          href: `/store/${storeId}/dispatcher`,
          icon: Truck,
        },
        {
          title: 'Solicitar a Bodega',
          description: 'Reabastecer inventario desde la Bodega Central.',
          href: `/store/${storeId}/inventory/adjustments`,
          icon: Boxes,
        },
      ];
    }

    if (typeUpper.includes('BODEGA') || typeUpper.includes('CENTRAL')) {
      return [
        {
          title: 'Preventas Campo',
          description: 'Monitorear pedidos levantados por gestores móviles.',
          href: `/store/${storeId}/pending-orders`,
          icon: ShoppingCart,
        },
        {
          title: 'Cargas de Camión',
          description: 'Armado de hojas de reparto y asignación a ruteros.',
          href: `/store/${storeId}/routes`,
          icon: Truck,
        },
        {
          title: 'Recepción Compras',
          description: 'Recibir compras masivas a proveedores de bodega.',
          href: `/store/${storeId}/suppliers`,
          icon: Boxes,
        },
        {
          title: 'Liquidación Rutas',
          description: 'Rendir cuentas y liquidar dinero/retornos de choferes.',
          href: `/store/${storeId}/daily-closing`,
          icon: HandCoins,
        },
      ];
    }

    // Default: SUPERMERCADO
    return [
      {
        title: 'POS Minorista',
        description: 'Registrar ventas rápidas en caja escaneando código.',
        href: `/store/${storeId}/work/sales`,
        icon: ShoppingCart,
      },
      {
        title: 'Control de Caja',
        description: 'Apertura, retiros, arqueos táctiles y cierre.',
        href: `/store/${storeId}/cash-register`,
        icon: HandCoins,
      },
      {
        title: 'Sugerido Góndola',
        description: 'Solicitud de insumos faltantes para percheros.',
        href: `/store/${storeId}/gondola-restock`,
        icon: Boxes,
      },
      {
        title: 'Proveedores Directos',
        description: 'Recepción de facturas locales y gestión de CxP.',
        href: `/store/${storeId}/supplier-invoices`,
        icon: Truck,
      },
    ];
  }, [storeId, storeType]);

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
