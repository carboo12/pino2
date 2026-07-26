import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  WorkspaceShell,
  WorkspaceTopBar,
  EmptyState,
  ErrorState,
  LoadingRows,
} from '@/components/workspace';
import {
  CircleDollarSign,
  HandCoins,
  Info,
  Loader2,
  Search,
  UserRound,
  Wallet,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  ReceiptText,
} from 'lucide-react';

import apiClient from '@/services/api-client';
import { useAuth } from '@/contexts/auth-context';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/lib/swalert';
import { exportToExcel } from '@/lib/export-excel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface Account {
  id: string;
  clientName: string;
  pendingAmount: number;
  description?: string;
  orderId?: string;
}

type PaymentMethod = 'Efectivo' | 'Transferencia' | 'Cheque';

export default function VendorCollectionsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // React Query with 60s cache
  const { data: accounts = [], isLoading: loading, isError, refetch } = useQuery({
    queryKey: ['accounts-receivable-collections', storeId],
    queryFn: async () => {
      const res = await apiClient.get('/accounts-receivable', {
        params: { storeId, pending: true },
      });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!storeId,
    staleTime: 60_000,
  });

  const visibleAccounts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const sorted = [...accounts].sort((a, b) => b.pendingAmount - a.pendingAmount);

    if (!normalizedSearch) {
      return sorted;
    }

    return sorted.filter((account) =>
      [account.clientName, account.description, account.orderId]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [accounts, search]);

  const totalPending = useMemo(
    () => accounts.reduce((sum, account) => sum + (account.pendingAmount || 0), 0),
    [accounts],
  );

  const largestPending = useMemo(
    () => accounts.reduce((max, account) => Math.max(max, account.pendingAmount || 0), 0),
    [accounts],
  );

  const handleCollect = (account: Account) => {
    setSelectedAccount(account);
    setPaymentAmount(account.pendingAmount.toFixed(2));
    setPaymentMethod('Efectivo');
    setIsDialogOpen(true);
  };

  const processPayment = async () => {
    if (!selectedAccount || !user || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (Number.isNaN(amount) || amount <= 0 || amount > selectedAccount.pendingAmount) {
      toast.error('Monto Inválido', 'Verifica el monto abonado antes de procesar el pago.');
      return;
    }

    setIsProcessing(true);
    try {
      await apiClient.post(`/accounts-receivable/${selectedAccount.id}/payments`, {
        amount,
        paymentMethod,
        vendorId: user.id,
        vendorName: user.name,
      });

      toast.success(
        'Cobro Registrado',
        `Se ha registrado el abono de ${formatCurrency(amount)} a favor de ${selectedAccount.clientName}.`,
      );
      setIsDialogOpen(false);
      setSelectedAccount(null);
      setPaymentAmount('');
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable-collections', storeId] });
    } catch {
      toast.error('Error al Procesar Cobro', 'No se pudo registrar el pago. Inténtalo nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportExcel = () => {
    const headers = ['ID Cuenta', 'Cliente', 'Referencia / Pedido', 'Saldo Pendiente (C$)'];
    const rows = visibleAccounts.map((a) => [
      a.id,
      a.clientName,
      a.description || a.orderId || 'Cobro de Crédito',
      a.pendingAmount || 0,
    ]);
    exportToExcel('Cartera_Cobranza_Campo', headers, rows);
    toast.success('Excel Generado', 'La cartera de clientes pendientes ha sido exportada.');
  };

  return (
    <WorkspaceShell
      topbar={
        <WorkspaceTopBar
          title="Gestión & Cobranza en Ruta"
          storeName={user?.storeName}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="rounded-xl font-bold text-xs"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Actualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                className="h-9 font-bold rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300 text-xs"
              >
                <FileSpreadsheet className="mr-1.5 h-4 w-4 text-emerald-700" /> Exportar a Excel
              </Button>
            </div>
          }
        />
      }
    >
      <div className="p-4 space-y-4 max-w-6xl mx-auto">
        {/* CARDS METRICAS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="rounded-2xl border bg-card shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground">Clientes con Deuda</p>
                <p className="text-2xl font-extrabold text-foreground font-mono mt-0.5">
                  {accounts.length}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <UserRound className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-card shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground">Total Cartera Pendiente</p>
                <p className="text-2xl font-extrabold text-emerald-600 font-mono mt-0.5">
                  {formatCurrency(totalPending)}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700">
                <Wallet className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-card shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground">Mayor Saldo Individual</p>
                <p className="text-2xl font-extrabold text-amber-600 font-mono mt-0.5">
                  {formatCurrency(largestPending)}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-700">
                <CircleDollarSign className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* BUSCADOR */}
        <div className="bg-card p-3 rounded-2xl border border-[#DDE2E8] flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente, número de factura o pedido..."
              className="pl-9 text-xs h-10 rounded-xl"
            />
          </div>
        </div>

        {/* LISTADO DE CUENTAS PENDIENTES */}
        {loading ? (
          <LoadingRows rows={5} />
        ) : isError ? (
          <ErrorState message="Error al obtener las cuentas por cobrar" onRetry={() => refetch()} />
        ) : visibleAccounts.length === 0 ? (
          <EmptyState
            title={search ? 'Sin coincidencias' : '¡Cartera al día!'}
            description={
              search
                ? 'No se encontraron clientes que coincidan con el filtro.'
                : 'No hay saldos ni créditos pendientes por cobrar en esta tienda.'
            }
            icon={CheckCircle2}
          />
        ) : (
          <div className="space-y-3">
            {visibleAccounts.map((account) => (
              <Card
                key={account.id}
                className="overflow-hidden rounded-2xl border-[#DDE2E8] bg-card shadow-xs hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-bold text-[10px]">
                        Deuda Pendiente
                      </Badge>
                      {account.orderId && (
                        <Badge variant="outline" className="font-mono text-[10px] rounded-lg">
                          Pedido #{account.orderId.slice(0, 8)}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-base font-extrabold text-foreground">
                      {account.clientName}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {account.description || 'Cobro registrado en cartera de crédito.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Saldo Pendiente
                      </p>
                      <p className="text-xl font-extrabold text-foreground font-mono">
                        {formatCurrency(account.pendingAmount || 0)}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleCollect(account)}
                      className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-4"
                    >
                      <HandCoins className="mr-1.5 h-4 w-4" /> Registrar Cobro
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* MODAL REGISTRAR COBRO */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold tracking-tight flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-emerald-600" /> Registrar Abono / Cobro
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ingresa el monto recibido para <strong>{selectedAccount?.clientName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Saldo Total Pendiente
              </p>
              <p className="text-2xl font-extrabold text-emerald-700 font-mono mt-0.5">
                {formatCurrency(selectedAccount?.pendingAmount || 0)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentAmount" className="text-xs font-bold">Monto del Abono (C$)</Label>
              <Input
                id="paymentAmount"
                type="number"
                value={paymentAmount}
                onChange={(event) => setPaymentAmount(event.target.value)}
                className="h-11 text-lg font-extrabold font-mono rounded-xl"
              />
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentAmount(selectedAccount?.pendingAmount.toFixed(2) || '')}
                  className="rounded-xl text-xs font-bold flex-1"
                >
                  Saldo Completo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentAmount(((selectedAccount?.pendingAmount || 0) / 2).toFixed(2))}
                  className="rounded-xl text-xs font-bold flex-1"
                >
                  50% Mitad
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-xs font-bold">Método de Pago</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['Efectivo', 'Transferencia', 'Cheque'] as PaymentMethod[]).map((method) => (
                  <Button
                    key={method}
                    type="button"
                    variant={paymentMethod === method ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-xl font-bold text-xs"
                    onClick={() => setPaymentMethod(method)}
                  >
                    {method}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold">
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={processPayment}
              disabled={isProcessing}
              className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <HandCoins className="mr-2 h-4 w-4" />
              )}
              Confirmar Cobro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorkspaceShell>
  );
}
