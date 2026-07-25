import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarDays, HandCoins, Loader2, RefreshCw, Wallet, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth-context';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/lib/swalert';
import financeService, { type AccountPayable } from '@/services/finance-service';
import { useRealTimeEvents } from '@/hooks/use-real-time-events';

const dateOnlyFormatter = new Intl.DateTimeFormat('es-NI', { dateStyle: 'medium' });

function formatDate(value?: string) {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Fecha inválida';
  return dateOnlyFormatter.format(parsed);
}

function getStatusVariant(status?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'PAID': return 'default';
    case 'PARTIAL': return 'secondary';
    case 'PENDING': return 'outline';
    default: return 'outline';
  }
}

export default function PayablesPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { user } = useAuth();
  const { lastEvent } = useRealTimeEvents(storeId);

  const [accounts, setAccounts] = useState<AccountPayable[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Payment Dialog State
  const [selectedAccount, setSelectedAccount] = useState<AccountPayable | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  const loadData = async (silent = false) => {
    if (!storeId) return;
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await financeService.listPayables(storeId, { pending: true });
      setAccounts(data);
    } catch (error) {
      console.error(error);
      toast.error('Error', 'No se pudieron cargar las cuentas por pagar.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, [storeId]);
  useEffect(() => { if (lastEvent && lastEvent.type !== 'PING') loadData(); }, [lastEvent]);

  const pendingTotal = useMemo(() => accounts.reduce((acc, a) => acc + Number(a.remainingAmount || 0), 0), [accounts]);
  const partialCount = useMemo(() => accounts.filter(a => a.status === 'PARTIAL').length, [accounts]);

  const openPaymentDialog = (account: AccountPayable) => {
    setSelectedAccount(account);
    setPaymentAmount(String(account.remainingAmount || 0));
    setPaymentMethod('CASH');
    setPaymentNotes('');
  };

  const resetPaymentDialog = () => {
    setSelectedAccount(null);
    setPaymentAmount('');
    setPaymentMethod('CASH');
    setPaymentNotes('');
  };

  const submitPayment = async () => {
    if (!selectedAccount) return;
    const amount = Number(paymentAmount);
    const remaining = Number(selectedAccount.remainingAmount || 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Monto inválido', 'El pago debe ser mayor a cero.');
      return;
    }
    if (amount > remaining) {
      toast.error('Monto inválido', 'El pago no puede superar el saldo pendiente.');
      return;
    }

    setProcessingPayment(true);
    try {
      await financeService.registerPayablePayment(selectedAccount.id, {
        amount,
        paymentMethod,
        notes: paymentNotes || undefined,
        paidBy: user?.name,
      });
      toast.success('Pago registrado', `Se abonaron ${formatCurrency(amount)} a ${selectedAccount.supplierName}.`);
      resetPaymentDialog();
      await loadData(true);
    } catch (error: any) {
      console.error(error);
      toast.error('Error al registrar pago', error?.response?.data?.message || 'No se pudo procesar el abono.');
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cuentas por Pagar</h1>
          <p className="text-muted-foreground">Control de saldos pendientes, deudas a proveedores y abonos registrados.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => loadData(true)} disabled={refreshing}>
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-rose-500">
          <CardHeader className="pb-2">
            <CardDescription>Deuda Total</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(pendingTotal)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {accounts.length} facturas pendientes de pago.
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardDescription>En Gestión Parcial</CardDescription>
            <CardTitle className="text-2xl">{partialCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Cuentas con abonos previos pero aún no canceladas.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-rose-500" />
            Cartera de Proveedores
          </CardTitle>
          <CardDescription>Facturas pendientes e historial de deuda activa.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : accounts.length === 0 ? (
            <Alert>
              <Wallet className="h-4 w-4" />
              <AlertTitle>Libre de deuda</AlertTitle>
              <AlertDescription>No hay cuentas por pagar activas en tienda en este momento.</AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Factura / Detalle</TableHead>
                    <TableHead>Emisión</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total Acordado</TableHead>
                    <TableHead className="text-right text-rose-600 font-bold">Saldo Pendiente</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((acc) => (
                    <TableRow key={acc.id}>
                      <TableCell className="font-medium">{acc.supplierName || 'Desconocido'}</TableCell>
                      <TableCell className="max-w-[200px] text-sm text-muted-foreground">
                        {acc.invoiceId ? <Badge variant="outline" className="mb-1">{acc.invoiceId}</Badge> : null}
                        <div className="line-clamp-2">{acc.description || 'Sin descripción'}</div>
                      </TableCell>
                      <TableCell>{formatDate(acc.createdAt)}</TableCell>
                      <TableCell className={acc.dueDate && new Date(acc.dueDate) < new Date() ? 'text-rose-600 font-medium' : ''}>
                        {formatDate(acc.dueDate)}
                      </TableCell>
                      <TableCell><Badge variant={getStatusVariant(acc.status)}>{acc.status}</Badge></TableCell>
                      <TableCell className="text-right">{formatCurrency(acc.totalAmount)}</TableCell>
                      <TableCell className="text-right font-bold text-rose-600">{formatCurrency(acc.remainingAmount)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openPaymentDialog(acc)}>
                          Abonar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedAccount)} onOpenChange={(open) => !open && resetPaymentDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pago a Proveedor</DialogTitle>
            <DialogDescription>
              {selectedAccount ? `Saldo pendiente de ${selectedAccount.supplierName}: ${formatCurrency(selectedAccount.remainingAmount)}.` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="payAmount">Monto a cancelar</Label>
              <Input
                id="payAmount"
                type="number"
                min="0"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Origen del dinero</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Caja / Efectivo</SelectItem>
                  <SelectItem value="TRANSFER">Transferencia / Banco</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="payNotes">Referencia / Comentarios</Label>
              <Textarea
                id="payNotes"
                placeholder="Número de cheque o transferencia, recibo, etc."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={resetPaymentDialog}>Cancelar</Button>
            <Button onClick={submitPayment} disabled={processingPayment}>
              {processingPayment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
              Registrar Egreso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
