import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  CalendarDays,
  CreditCard,
  Download,
  HandCoins,
  Loader2,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/lib/swalert";
import financeService, {
  type AccountReceivable,
  type CollectionRecord,
  type CollectionSummary,
} from "@/services/finance-service";
import { useRealTimeEvents } from "@/hooks/use-real-time-events";
import { exportToExcel } from "@/lib/export-excel";
import { usePagination } from "@/hooks/use-pagination";

const dateOnlyFormatter = new Intl.DateTimeFormat("es-NI", {
  dateStyle: "medium",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-NI", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateInput(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function formatDate(value?: string, withTime = false) {
  if (!value) return "Sin fecha";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Fecha inválida";
  return withTime
    ? dateTimeFormatter.format(parsed)
    : dateOnlyFormatter.format(parsed);
}

function getStatusVariant(
  status?: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "PAID":
      return "default";
    case "PARTIAL":
      return "secondary";
    case "PENDING":
      return "outline";
    default:
      return "outline";
  }
}

export default function ReceivablesPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { lastEvent } = useRealTimeEvents(storeId);

  const [accounts, setAccounts] = useState<AccountReceivable[]>([]);
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [summary, setSummary] = useState<CollectionSummary>({
    totalCount: 0,
    totalAmount: 0,
    cashTotal: 0,
    otherTotal: 0,
  });
  const [selectedDate, setSelectedDate] = useState<string>(formatDateInput());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAccount, setSelectedAccount] =
    useState<AccountReceivable | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  const loadData = async (silent = false) => {
    if (!storeId) return;
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [accountsData, collectionsData, summaryData] = await Promise.all([
        financeService.listReceivables(storeId, true),
        financeService.listCollections(storeId, { date: selectedDate }),
        financeService.getCollectionsSummary(storeId, { date: selectedDate }),
      ]);
      setAccounts(accountsData);
      setCollections(collectionsData);
      setSummary(summaryData);
    } catch (error) {
      console.error(error);
      toast.error(
        "Error",
        "No se pudo cargar la cartera ni el historial de cobros.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [storeId, selectedDate]);

  useEffect(() => {
    if (lastEvent && lastEvent.type !== "PING") {
      loadData();
    }
  }, [lastEvent]);

  const pendingTotal = useMemo(
    () =>
      accounts.reduce(
        (acc, account) =>
          acc + Number(account.pendingAmount || account.remainingAmount || 0),
        0,
      ),
    [accounts],
  );

  const partialCount = useMemo(
    () => accounts.filter((account) => account.status === "PARTIAL").length,
    [accounts],
  );

  const groupedAccounts = useMemo(() => {
    const groups: Record<string, AccountReceivable[]> = {};
    const prioritized = [...accounts].sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      return (a.dueDate || "9999-12-31").localeCompare(
        b.dueDate || "9999-12-31",
      );
    });
    for (const account of prioritized) {
      const clientKey = account.clientId || `sin-cliente-${account.id}`;
      if (!groups[clientKey]) {
        groups[clientKey] = [];
      }
      groups[clientKey].push(account);
    }
    return groups;
  }, [accounts]);

  const groupedEntries = useMemo(
    () => Object.entries(groupedAccounts),
    [groupedAccounts],
  );
  const {
    paginatedItems: paginatedGroupedAccounts,
    page: pageAcc,
    pageSize: pageSizeAcc,
    totalPages: totalPagesAcc,
    totalItems: totalItemsAcc,
    setPage: setPageAcc,
    setPageSize: setPageSizeAcc,
  } = usePagination(groupedEntries);
  const {
    paginatedItems: paginatedCollections,
    page: pageCol,
    pageSize: pageSizeCol,
    totalPages: totalPagesCol,
    totalItems: totalItemsCol,
    setPage: setPageCol,
    setPageSize: setPageSizeCol,
  } = usePagination(collections);

  const openPaymentDialog = (account: AccountReceivable) => {
    setSelectedAccount(account);
    setPaymentAmount("");
    setPaymentMethod("CASH");
    setPaymentNotes("");
  };

  const resetPaymentDialog = () => {
    setSelectedAccount(null);
    setPaymentAmount("");
    setPaymentMethod("CASH");
    setPaymentNotes("");
  };

  const submitPayment = async () => {
    if (!selectedAccount) return;

    const amount = Number(paymentAmount);
    const remaining = Number(
      selectedAccount.pendingAmount || selectedAccount.remainingAmount || 0,
    );

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Monto inválido", "El pago debe ser mayor a cero.");
      return;
    }

    if (amount > remaining) {
      toast.error(
        "Monto inválido",
        "El pago no puede superar el saldo pendiente.",
      );
      return;
    }

    setProcessingPayment(true);
    try {
      await financeService.registerReceivablePayment(selectedAccount.id, {
        amount,
        paymentMethod,
        notes: paymentNotes || undefined,
      });
      toast.success(
        "Cobro registrado",
        `Se abonaron ${formatCurrency(amount)} a ${selectedAccount.clientName}.`,
      );
      resetPaymentDialog();
      await loadData(true);
    } catch (error: any) {
      console.error(error);
      toast.error(
        "Error al registrar pago",
        error?.response?.data?.message || "No se pudo registrar el cobro.",
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Cobranza y cartera
          </h1>
          <p className="text-muted-foreground">
            Controla saldos pendientes, cobros del día y el ritmo real de
            recuperación.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="w-[180px]"
          />
          <Button
            variant="outline"
            onClick={() => loadData(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Actualizar
          </Button>
          <Button
            variant="outline"
            disabled={accounts.length === 0}
            onClick={() => {
              const rows = accounts.map((a) => ({
                Cliente: a.clientName || "Sin nombre",
                Factura: a.invoiceNumber || a.orderId || "N/A",
                Descripción: a.description || "",
                Emitida: formatDate(a.issuedAt || a.createdAt),
                Vence: formatDate(a.dueDate),
                "Días vencida": a.daysOverdue,
                Estado: a.status,
                "Saldo Pendiente": Number(
                  a.pendingAmount || a.remainingAmount || 0,
                ).toFixed(2),
              }));
              exportToExcel(rows, `Cartera_${selectedDate}`, "Cartera");
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardDescription>Saldo pendiente</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(pendingTotal)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {accounts.length} cuentas activas por cobrar en tienda.
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-sky-500">
          <CardHeader className="pb-2">
            <CardDescription>Cobrado en fecha</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(summary.totalAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {summary.totalCount} cobros registrados para{" "}
            {formatDate(selectedDate)}.
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardDescription>Efectivo</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(summary.cashTotal)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Recuperación inmediata en caja o ruta.
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-violet-500">
          <CardHeader className="pb-2">
            <CardDescription>Gestión parcial</CardDescription>
            <CardTitle className="text-2xl">{partialCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Clientes con saldo parcialmente abonado.
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="accounts">Cartera</TabsTrigger>
          <TabsTrigger value="collections">Cobros</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-amber-500" />
                Cuentas por cobrar
              </CardTitle>
              <CardDescription>
                Lista operativa para registrar abonos y seguir saldos pendientes
                por cliente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : accounts.length === 0 ? (
                <Alert>
                  <HandCoins className="h-4 w-4" />
                  <AlertTitle>Sin cartera pendiente</AlertTitle>
                  <AlertDescription>
                    No hay cuentas activas con saldo por cobrar.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Factura / referencia</TableHead>
                        <TableHead>Detalle</TableHead>
                        <TableHead>Emitida</TableHead>
                        <TableHead>Vence</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                        <TableHead className="text-right">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedGroupedAccounts.map(
                        ([clientId, clientAccounts]) => {
                          const clientTotal = clientAccounts.reduce(
                            (sum, acc) =>
                              sum +
                              Number(
                                acc.pendingAmount || acc.remainingAmount || 0,
                              ),
                            0,
                          );
                          const clientName =
                            clientAccounts[0]?.clientName ||
                            "Cliente sin nombre";
                          return (
                            <React.Fragment key={clientId}>
                              <TableRow className="bg-muted/30 hover:bg-muted/30 font-medium">
                                <TableCell
                                  colSpan={5}
                                  className="py-3 text-[15px] font-semibold text-primary"
                                >
                                  {clientName}
                                  <Badge
                                    variant="secondary"
                                    className="ml-3 font-normal"
                                  >
                                    {clientAccounts.length} cuenta(s)
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-bold text-[15px] py-3 text-primary">
                                  {formatCurrency(clientTotal)}
                                </TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                              {clientAccounts.map((account) => (
                                <TableRow key={account.id}>
                                  <TableCell className="pl-6 border-l-2 border-l-transparent group-hover:border-l-primary/30">
                                    <div className="font-medium text-sm">
                                      {account.invoiceNumber ||
                                        (account.orderId
                                          ? `Pedido #${account.orderId.substring(0, 8)}...`
                                          : "Sin referencia")}
                                    </div>
                                  </TableCell>
                                  <TableCell className="max-w-[280px] text-sm text-muted-foreground">
                                    {account.description || "Sin descripción"}
                                  </TableCell>
                                  <TableCell>
                                    {formatDate(
                                      account.issuedAt || account.createdAt,
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div>{formatDate(account.dueDate)}</div>
                                    <div
                                      className={
                                        account.isOverdue
                                          ? "text-xs font-medium text-destructive"
                                          : "text-xs text-muted-foreground"
                                      }
                                    >
                                      {account.isOverdue
                                        ? `${account.daysOverdue} día(s) vencida`
                                        : "Vigente"}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={getStatusVariant(account.status)}
                                    >
                                      {account.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right font-semibold">
                                    {formatCurrency(
                                      Number(
                                        account.pendingAmount ||
                                          account.remainingAmount ||
                                          0,
                                      ),
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      size="sm"
                                      onClick={() => openPaymentDialog(account)}
                                    >
                                      <HandCoins className="mr-2 h-4 w-4" />
                                      Abonar
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </React.Fragment>
                          );
                        },
                      )}
                    </TableBody>
                  </Table>{" "}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collections">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-sky-500" />
                Cobros del día
              </CardTitle>
              <CardDescription>
                Historial operativo de cobros registrados para{" "}
                {formatDate(selectedDate)}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardDescription>Total cobrado</CardDescription>
                    <CardTitle>{formatCurrency(summary.totalAmount)}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardDescription>Cobros en efectivo</CardDescription>
                    <CardTitle>{formatCurrency(summary.cashTotal)}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardDescription>Otros métodos</CardDescription>
                    <CardTitle>{formatCurrency(summary.otherTotal)}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : collections.length === 0 ? (
                <Alert>
                  <CreditCard className="h-4 w-4" />
                  <AlertTitle>Sin movimientos</AlertTitle>
                  <AlertDescription>
                    No se registraron cobros para la fecha seleccionada.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Rutero</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Notas</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCollections.map((collection) => (
                        <TableRow key={collection.id}>
                          <TableCell>
                            {collection.clientName || "Cliente no identificado"}
                          </TableCell>
                          <TableCell>
                            {collection.ruteroName ||
                              collection.ruteroId ||
                              "Sin rutero"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {collection.paymentMethod}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDate(collection.createdAt, true)}
                          </TableCell>
                          <TableCell className="max-w-[260px] text-sm text-muted-foreground">
                            {collection.notes || "Sin notas"}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(collection.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>{" "}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={Boolean(selectedAccount)}
        onOpenChange={(open) => !open && resetPaymentDialog()}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar abono</DialogTitle>
            <DialogDescription>
              {selectedAccount
                ? `Saldo actual de ${selectedAccount.clientName}: ${formatCurrency(Number(selectedAccount.pendingAmount || selectedAccount.remainingAmount || 0))}.`
                : "Selecciona una cuenta para registrar el cobro."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="paymentAmount">Monto</Label>
              <Input
                id="paymentAmount"
                type="number"
                min="0"
                step="0.01"
                value={paymentAmount}
                onChange={(event) => setPaymentAmount(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() =>
                  setPaymentAmount(
                    String(
                      selectedAccount?.pendingAmount ||
                        selectedAccount?.remainingAmount ||
                        0,
                    ),
                  )
                }
              >
                Usar saldo completo
              </Button>
            </div>
            <div className="grid gap-2">
              <Label>Método de pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Efectivo</SelectItem>
                  <SelectItem value="TRANSFER">Transferencia</SelectItem>
                  <SelectItem value="CARD">Tarjeta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paymentNotes">Notas</Label>
              <Textarea
                id="paymentNotes"
                placeholder="Observación del cobro, referencia o comentario operativo."
                value={paymentNotes}
                onChange={(event) => setPaymentNotes(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={resetPaymentDialog}>
              Cancelar
            </Button>
            <Button onClick={submitPayment} disabled={processingPayment}>
              {processingPayment ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <HandCoins className="mr-2 h-4 w-4" />
              )}
              Confirmar cobro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
