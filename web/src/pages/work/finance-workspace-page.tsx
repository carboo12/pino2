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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Wallet,
  HandCoins,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { formatCurrency } from '@/lib/utils';
import apiClient from '@/services/api-client';

interface ExceptionFinance {
  id: string;
  type: 'overdue' | 'route_diff' | 'pending_payment';
  title: string;
  description: string;
  amount: number;
  severity: 'high' | 'medium';
  actionHref?: string;
}

export default function FinanceWorkspacePage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exceptions, setExceptions] = useState<ExceptionFinance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('excepciones');

  const loadData = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    setError(null);
    const items: ExceptionFinance[] = [];

    try {
      const [receivablesRes] = await Promise.allSettled([
        apiClient.get('/receivables', { params: { storeId, status: 'overdue', limit: 10 } }),
      ]);

      if (receivablesRes.status === 'fulfilled') {
        const data = Array.isArray(receivablesRes.value.data)
          ? receivablesRes.value.data
          : receivablesRes.value.data?.data || [];
        data.forEach((r: any) => {
          items.push({
            id: `rec-${r.id}`,
            type: 'overdue',
            title: 'Cuenta vencida',
            description: `${r.clientName || 'Cliente'} — ${r.daysOverdue || 0} días vencido`,
            amount: r.balance || r.amount || 0,
            severity: (r.daysOverdue || 0) > 30 ? 'high' : 'medium',
            actionHref: `/store/${storeId}/finance/receivables`,
          });
        });
      }

      setExceptions(items);
    } catch {
      setError('No se pudieron cargar los datos financieros');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <WorkspaceShell
      topbar={
        <WorkspaceTopBar
          title="Finanzas"
          storeName={user?.storeName}
          actions={
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          }
        />
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
        <TabsList className="w-fit border-b border-[#DDE2E8] bg-transparent p-0">
          <TabsTrigger
            value="excepciones"
            className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-[#0F766E] data-[state=active]:text-[#0F766E]"
          >
            <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
            Excepciones
          </TabsTrigger>
          <TabsTrigger
            value="cartera"
            className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-[#0F766E] data-[state=active]:text-[#0F766E]"
          >
            <HandCoins className="mr-1.5 h-3.5 w-3.5" />
            Cartera
          </TabsTrigger>
          <TabsTrigger
            value="pagos"
            className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-[#0F766E] data-[state=active]:text-[#0F766E]"
          >
            <DollarSign className="mr-1.5 h-3.5 w-3.5" />
            Pagos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="excepciones" className="mt-0 flex-1 p-4">
          {loading ? (
            <LoadingRows rows={5} />
          ) : error ? (
            <ErrorState message={error} onRetry={loadData} />
          ) : exceptions.length === 0 ? (
            <EmptyState
              title="Sin excepciones"
              description="No hay cuentas vencidas ni diferencias pendientes"
              icon={CheckCircle2}
            />
          ) : (
            <div className="space-y-2">
              {exceptions.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-[#DDE2E8] bg-white p-4"
                >
                  <div className="flex items-start gap-3">
                    {item.severity === 'high' ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 text-[#DC2626]" />
                    ) : (
                      <Clock className="mt-0.5 h-4 w-4 text-[#D97706]" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-[#17202A]">{item.title}</p>
                      <p className="text-xs text-[#5B6673]">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[#DC2626]">
                      {formatCurrency(item.amount)}
                    </span>
                    {item.actionHref && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(item.actionHref!)}
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cartera" className="mt-0 flex-1 p-6">
          <EmptyState
            title="Cuentas por cobrar"
            description="Cartera de clientes, aging y arqueos — próximamente"
            icon={HandCoins}
            action={
              <Button variant="outline" size="sm" onClick={() => navigate(`/store/${storeId}/finance/receivables`)}>
                Ir a cartera actual
              </Button>
            }
          />
        </TabsContent>

        <TabsContent value="pagos" className="mt-0 flex-1 p-6">
          <EmptyState
            title="Cuentas por pagar"
            description="Proveedores y facturas pendientes — próximamente"
            icon={DollarSign}
            action={
              <Button variant="outline" size="sm" onClick={() => navigate(`/store/${storeId}/finance/payables`)}>
                Ir a pagos actuales
              </Button>
            }
          />
        </TabsContent>
      </Tabs>
    </WorkspaceShell>
  );
}
