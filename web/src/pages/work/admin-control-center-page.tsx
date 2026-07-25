import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  WorkspaceShell,
  WorkspaceTopBar,
  EmptyState,
  ErrorState,
  LoadingRows,
  StatusChip,
} from '@/components/workspace';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShieldCheck,
  WalletCards,
  Package,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Clock,
  Users,
  XCircle,
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/lib/swalert';
import apiClient from '@/services/api-client';

interface ExceptionItem {
  id: string;
  type: 'authorization' | 'open_cash' | 'critical_stock' | 'stuck_order' | 'sync_error' | 'no_sales_today' | 'blocked_user';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  actionLabel: string;
  actionHref?: string;
  onAction?: () => void;
}

export default function AdminControlCenterPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExceptions = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    setError(null);
    const items: ExceptionItem[] = [];

    try {
      const [authRes, cashRes, stockRes, ordersRes] = await Promise.allSettled([
        apiClient.get('/authorizations', { params: { storeId, status: 'pending', limit: 5 } }),
        apiClient.get('/cash-shifts', { params: { storeId, status: 'open', limit: 5 } }),
        apiClient.get('/products', { params: { storeId, stockCritical: true, limit: 5 } }),
        apiClient.get('/orders', { params: { storeId, status: 'RECIBIDO', createdAt: '>30m', limit: 5 } }),
      ]);

      if (authRes.status === 'fulfilled') {
        const auths = Array.isArray(authRes.value.data) ? authRes.value.data : authRes.value.data?.data || [];
        auths.forEach((a: any) => {
          items.push({
            id: `auth-${a.id}`,
            type: 'authorization',
            title: 'Autorización pendiente',
            description: `Precio especial por ${a.requestedBy || 'usuario'} — ${formatCurrency(a.amount || 0)}`,
            severity: 'high',
            actionLabel: 'Revisar',
            actionHref: `/store/${storeId}/authorizations`,
          });
        });
      }

      if (cashRes.status === 'fulfilled') {
        const cajas = Array.isArray(cashRes.value.data) ? cashRes.value.data : cashRes.value.data?.data || [];
        cajas.forEach((c: any) => {
          items.push({
            id: `cash-${c.id}`,
            type: 'open_cash',
            title: 'Caja abierta',
            description: `Caja abierta por ${c.openedByName || c.opened_by_name || c.cashierName || 'usuario'} — ${new Date(c.openingTimestamp).toLocaleString()}`,
            severity: 'medium',
            actionLabel: 'Ver caja',
            actionHref: `/store/${storeId}/cash-register`,
          });
        });
      }

      if (stockRes.status === 'fulfilled') {
        const stock = Array.isArray(stockRes.value.data) ? stockRes.value.data : stockRes.value.data?.data || [];
        stock.slice(0, 5).forEach((p: any) => {
          items.push({
            id: `stock-${p.id}`,
            type: 'critical_stock',
            title: 'Stock crítico',
            description: `${p.description || p.name} — ${p.stock || 0} unidades`,
            severity: 'high',
            actionLabel: 'Ajustar',
            actionHref: `/store/${storeId}/inventory/adjustments`,
          });
        });
      }

      if (ordersRes.status === 'fulfilled') {
        const stuck = Array.isArray(ordersRes.value.data) ? ordersRes.value.data : ordersRes.value.data?.data || [];
        stuck.slice(0, 5).forEach((o: any) => {
          items.push({
            id: `order-${o.id}`,
            type: 'stuck_order',
            title: 'Pedido sin avanzar',
            description: `Pedido #${o.id?.slice(0, 8)} — ${o.clientName || ''} — ${formatCurrency(o.total || 0)}`,
            severity: 'medium',
            actionLabel: 'Ir a bodega',
            actionHref: `/store/${storeId}/work/warehouse`,
          });
        });
      }

      setExceptions(items);
    } catch {
      setError('No se pudieron cargar las excepciones');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadExceptions();
  }, [loadExceptions]);

  const severityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertCircle className="h-4 w-4 text-[#DC2626]" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-[#D97706]" />;
      default: return <Clock className="h-4 w-4 text-[#2563EB]" />;
    }
  };

  if (error) {
    return (
      <WorkspaceShell topbar={<WorkspaceTopBar title="Centro de Control" />}>
        <ErrorState message={error} onRetry={loadExceptions} />
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell
      topbar={
        <WorkspaceTopBar
          title="Centro de Control"
          storeName={user?.storeName}
          actions={
            <Button variant="outline" size="sm" onClick={loadExceptions} disabled={loading}>
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          }
        />
      }
    >
      {loading && exceptions.length === 0 ? (
        <LoadingRows rows={6} />
      ) : exceptions.length === 0 ? (
        <EmptyState
          title="Todo en orden"
          description="No hay excepciones que requieran atención"
          icon={CheckCircle2}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#D97706]" />
            <p className="text-sm font-medium text-[#17202A]">
              {exceptions.length} {exceptions.length === 1 ? 'excepción requiere' : 'excepciones requieren'} atención
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {exceptions.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-[#DDE2E8] bg-white p-4 transition-all hover:shadow-sm"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {severityIcon(item.severity)}
                    <h3 className="text-sm font-medium text-[#17202A]">{item.title}</h3>
                  </div>
                  <StatusChip
                    variant={
                      item.severity === 'high' ? 'error' :
                      item.severity === 'medium' ? 'warning' : 'info'
                    }
                    label={
                      item.severity === 'high' ? 'Urgente' :
                      item.severity === 'medium' ? 'Pendiente' : 'Info'
                    }
                  />
                </div>
                <p className="mb-3 text-xs text-[#5B6673]">{item.description}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    if (item.actionHref) {
                      navigate(item.actionHref);
                    } else if (item.onAction) {
                      item.onAction();
                    }
                  }}
                >
                  <ArrowRight className="mr-1.5 h-3 w-3" />
                  {item.actionLabel}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}
