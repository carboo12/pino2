import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  BadgeDollarSign,
  CalendarClock,
  FilePlus2,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  ReceiptText,
  Trash2,
  Plus,
  CheckCircle2,
  RotateCcw,
  HandCoins,
  ChevronsUpDown,
  Check,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { useAuth } from "@/contexts/auth-context";
import apiClient from "@/services/api-client";
import { alert, toast } from "@/lib/swalert";
import { usePagination } from "@/hooks/use-pagination";
import { cn, formatCurrency } from "@/lib/utils";
import financeService, {
  type AccountPayable,
  type ProductOption,
  type SupplierInvoice,
  type SupplierOption,
} from "@/services/finance-service";

interface ProductSearchSelectProps {
  value: string;
  onSelect: (productId: string) => void;
  products: ProductOption[];
}

function ProductSearchSelect({
  value,
  onSelect,
  products,
}: ProductSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedProduct = products.find((p) => p.id === value);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const query = search.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.description.toLowerCase().includes(query) ||
        (p.barcode && p.barcode.toLowerCase().includes(query)) ||
        (p.brand && p.brand.toLowerCase().includes(query)),
    );
  }, [products, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal text-left h-10 px-3 bg-background"
        >
          <span className="truncate flex items-center gap-2">
            {value === "manual" || !selectedProduct ? (
              <span className="text-muted-foreground">Manual / no existe aún</span>
            ) : (
              <>
                <span className="font-medium text-foreground truncate">
                  {selectedProduct.description}
                </span>
                {selectedProduct.handlesBulk ||
                (selectedProduct.unitsPerBulk && selectedProduct.unitsPerBulk > 1) ? (
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-1.5 py-0 border border-amber-300 shrink-0"
                  >
                    📦 Bulto ({selectedProduct.unitsPerBulk || 1} u)
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-slate-100 text-slate-700 text-[10px] font-normal px-1.5 py-0 shrink-0"
                  >
                    🏷️ Unidad
                  </Badge>
                )}
              </>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] sm:w-[420px] p-0" align="start">
        <div className="p-2 border-b flex items-center gap-2 bg-muted/20">
          <Search className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Buscar producto, código o marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-xs text-muted-foreground hover:text-foreground mr-1"
            >
              Limpiar
            </button>
          )}
        </div>
        <div className="max-h-[280px] overflow-y-auto p-1 space-y-0.5">
          <button
            type="button"
            className={cn(
              "w-full flex items-center justify-between text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors",
              value === "manual" && "bg-accent/70 font-medium",
            )}
            onClick={() => {
              onSelect("manual");
              setOpen(false);
              setSearch("");
            }}
          >
            <span className="text-muted-foreground font-medium">
              Manual / no existe aún
            </span>
            {value === "manual" && <Check className="h-4 w-4 text-primary" />}
          </button>
          <div className="my-1 border-t" />
          {filteredProducts.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No se encontraron productos coincidentes
            </div>
          ) : (
            filteredProducts.map((p) => {
              const isSelected = p.id === value;
              const handlesBulk =
                p.handlesBulk || (p.unitsPerBulk && p.unitsPerBulk > 1);
              const upb = p.unitsPerBulk || 1;

              return (
                <button
                  key={p.id}
                  type="button"
                  className={cn(
                    "w-full flex items-center justify-between text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors gap-2",
                    isSelected && "bg-accent/70 font-medium",
                  )}
                  onClick={() => {
                    onSelect(p.id);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium text-foreground">
                      {p.description}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      {p.barcode && <span>Cód: {p.barcode}</span>}
                      <span>Costo: ${p.costPrice ?? 0}</span>
                      <span>Stock: {p.currentStock ?? 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {handlesBulk ? (
                      <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-800 text-[11px] font-semibold px-1.5 py-0.5 border border-amber-300"
                      >
                        📦 Bulto ({upb} u)
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-slate-100 text-slate-700 text-[11px] font-normal px-1.5 py-0.5"
                      >
                        🏷️ Unidad
                      </Badge>
                    )}
                    {isSelected && <Check className="h-4 w-4 text-primary ml-1" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const dateFormatter = new Intl.DateTimeFormat("es-NI", {
  dateStyle: "medium",
});

function formatDate(value?: string) {
  if (!value) return "Sin fecha";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Fecha inválida";
  return dateFormatter.format(parsed);
}

function isOverdue(account: AccountPayable) {
  if (!account.dueDate || account.status === "PAID") return false;
  const dueDate = new Date(account.dueDate);
  if (Number.isNaN(dueDate.getTime())) return false;
  return dueDate.getTime() < new Date().setHours(0, 0, 0, 0);
}

function getStatusVariant(
  status?: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "PAID":
    case "PAGADA":
    case "RECIBIDA":
      return "default";
    case "PARTIAL":
    case "PENDIENTE":
      return "secondary";
    case "ANULADA":
      return "destructive";
    default:
      return "outline";
  }
}

type DraftInvoiceItem = {
  localId: string;
  selectedProductId: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

function createDraftItem(): DraftInvoiceItem {
  return {
    localId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    selectedProductId: "manual",
    description: "",
    quantity: 1,
    unitPrice: 0,
  };
}

export default function SupplierInvoicesPage() {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const supplierFilter = searchParams.get("supplierId") || "all";

  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [payables, setPayables] = useState<AccountPayable[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<AccountPayable | null>(
    null,
  );
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [creditInvoice, setCreditInvoice] = useState<SupplierInvoice | null>(
    null,
  );
  const [creditPayable, setCreditPayable] = useState<AccountPayable | null>(
    null,
  );
  const [creditQuantities, setCreditQuantities] = useState<
    Record<string, number>
  >({});
  const [creditForm, setCreditForm] = useState({
    creditNoteNumber: "",
    issueDate: new Date().toISOString().slice(0, 10),
    reason: "",
  });
  const [processingCredit, setProcessingCredit] = useState(false);
  const [processingInvoice, setProcessingInvoice] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [invoiceDraft, setInvoiceDraft] = useState({
    supplierId: supplierFilter === "all" ? "" : supplierFilter,
    invoiceNumber: "",
    paymentType: "CONTADO",
    dueDate: "",
    status: "RECIBIDA",
    items: [createDraftItem()],
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "TRANSFER",
    notes: "",
  });
  const [dialogView, setDialogView] = useState<"invoice" | "supplier">(
    "invoice",
  );
  const [quickSupplierForm, setQuickSupplierForm] = useState({
    name: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
  });
  const [savingSupplier, setSavingSupplier] = useState(false);

  const submitQuickSupplier = async () => {
    if (!quickSupplierForm.name) {
      toast.error("Nombre requerido", "El proveedor debe tener nombre.");
      return;
    }
    setSavingSupplier(true);
    try {
      const resp = await apiClient.post("/suppliers", {
        ...quickSupplierForm,
        storeId,
      });
      toast.success(
        "Proveedor creado",
        "Ya puedes seleccionarlo en la factura.",
      );
      await loadReferenceData();
      if (resp.data?.id) {
        setInvoiceDraft((prev) => ({ ...prev, supplierId: resp.data.id }));
      }
      setDialogView("invoice");
      setQuickSupplierForm({
        name: "",
        contactName: "",
        phone: "",
        email: "",
        address: "",
      });
    } catch (e: any) {
      toast.error(
        "Error",
        e.response?.data?.message || "Error al crear proveedor",
      );
    } finally {
      setSavingSupplier(false);
    }
  };

  const loadReferenceData = async () => {
    if (!storeId) return;
    const [suppliersData, productsData] = await Promise.all([
      financeService.listSuppliers(storeId),
      financeService.listProducts(storeId, 200),
    ]);
    setSuppliers(suppliersData);
    setProducts(productsData);
  };

  const loadOperationalData = async (silent = false) => {
    if (!storeId) return;
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [invoicesData, payablesData] = await Promise.all([
        financeService.listInvoices(
          storeId,
          supplierFilter === "all" ? undefined : supplierFilter,
        ),
        financeService.listPayables(storeId, {
          supplierId: supplierFilter === "all" ? undefined : supplierFilter,
          pending: true,
        }),
      ]);
      setInvoices(invoicesData);
      setPayables(payablesData);
    } catch (error) {
      console.error(error);
      toast.error(
        "Error",
        "No se pudieron cargar las facturas ni las cuentas por pagar.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReferenceData().catch((error) => {
      console.error(error);
      toast.error("Error", "No se pudieron cargar proveedores ni productos.");
    });
  }, [storeId]);

  useEffect(() => {
    setInvoiceDraft((prev) => ({
      ...prev,
      supplierId: supplierFilter === "all" ? prev.supplierId : supplierFilter,
    }));
    loadOperationalData();
  }, [storeId, supplierFilter]);

  const invoicesTotal = useMemo(
    () =>
      invoices.reduce((acc, invoice) => acc + Number(invoice.total || 0), 0),
    [invoices],
  );

  const creditInvoicesTotal = useMemo(
    () =>
      invoices
        .filter((invoice) =>
          ["CREDITO", "CRÉDITO", "CREDIT"].includes(
            (invoice.paymentType || "").toUpperCase(),
          ),
        )
        .reduce((acc, invoice) => acc + Number(invoice.total || 0), 0),
    [invoices],
  );

  const pendingPayablesTotal = useMemo(
    () =>
      payables.reduce(
        (acc, account) => acc + Number(account.remainingAmount || 0),
        0,
      ),
    [payables],
  );

  const overdueCount = useMemo(
    () => payables.filter((account) => isOverdue(account)).length,
    [payables],
  );

  const invoiceTotal = useMemo(
    () =>
      invoiceDraft.items.reduce(
        (acc, item) =>
          acc + Number(item.quantity || 0) * Number(item.unitPrice || 0),
        0,
      ),
    [invoiceDraft.items],
  );

  const {
    paginatedItems: paginatedInvoices,
    page: pageInv,
    pageSize: pageSizeInv,
    totalPages: totalPagesInv,
    totalItems: totalItemsInv,
    setPage: setPageInv,
    setPageSize: setPageSizeInv,
  } = usePagination(invoices);
  const {
    paginatedItems: paginatedPayables,
    page: pagePay,
    pageSize: pageSizePay,
    totalPages: totalPagesPay,
    totalItems: totalItemsPay,
    setPage: setPagePay,
    setPageSize: setPageSizePay,
  } = usePagination(payables);

  const updateDraftItem = (
    localId: string,
    patch: Partial<DraftInvoiceItem>,
  ) => {
    setInvoiceDraft((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.localId === localId ? { ...item, ...patch } : item,
      ),
    }));
  };

  const handleProductSelection = (localId: string, selectedValue: string) => {
    if (selectedValue === "manual") {
      updateDraftItem(localId, {
        selectedProductId: "manual",
        description: "",
        unitPrice: 0,
      });
      return;
    }
    const selectedProduct = products.find(
      (product) => product.id === selectedValue,
    );
    updateDraftItem(localId, {
      selectedProductId: selectedValue,
      description: selectedProduct?.description || "",
      unitPrice: Number(selectedProduct?.costPrice || 0),
    });
  };

  const addDraftItem = () => {
    setInvoiceDraft((prev) => ({
      ...prev,
      items: [...prev.items, createDraftItem()],
    }));
  };

  const removeDraftItem = (localId: string) => {
    setInvoiceDraft((prev) => ({
      ...prev,
      items:
        prev.items.length === 1
          ? prev.items
          : prev.items.filter((item) => item.localId !== localId),
    }));
  };

  const resetInvoiceDraft = () => {
    setDialogView("invoice");
    setInvoiceDraft({
      supplierId: supplierFilter === "all" ? "" : supplierFilter,
      invoiceNumber: "",
      paymentType: "CONTADO",
      dueDate: "",
      status: "RECIBIDA",
      items: [createDraftItem()],
    });
  };

  const submitInvoice = async () => {
    if (!storeId) return;

    const validItems = invoiceDraft.items
      .map((item) => ({
        productId:
          item.selectedProductId === "manual"
            ? undefined
            : item.selectedProductId,
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      }))
      .filter(
        (item) => item.description && item.quantity > 0 && item.unitPrice >= 0,
      );

    if (!invoiceDraft.supplierId) {
      toast.error("Proveedor requerido", "Debes seleccionar un proveedor.");
      return;
    }

    if (!invoiceDraft.invoiceNumber.trim()) {
      toast.error("Factura requerida", "Debes indicar el número de factura.");
      return;
    }

    if (validItems.length === 0) {
      toast.error(
        "Detalle requerido",
        "Agrega al menos una línea válida a la factura.",
      );
      return;
    }

    if (invoiceDraft.paymentType === "CREDITO" && !invoiceDraft.dueDate) {
      toast.error(
        "Fecha requerida",
        "Las compras a crédito deben tener fecha de vencimiento.",
      );
      return;
    }

    setProcessingInvoice(true);
    try {
      await financeService.createInvoice({
        storeId,
        supplierId: invoiceDraft.supplierId,
        invoiceNumber: invoiceDraft.invoiceNumber.trim(),
        paymentType: invoiceDraft.paymentType,
        dueDate:
          invoiceDraft.paymentType === "CREDITO"
            ? invoiceDraft.dueDate
            : undefined,
        total: validItems.reduce(
          (acc, item) => acc + item.quantity * item.unitPrice,
          0,
        ),
        status: invoiceDraft.status,
        cashierName: user?.name || "Sistema",
        items: validItems,
      });
      toast.success(
        "Factura registrada",
        "La compra quedó guardada con su impacto financiero.",
      );
      setCreateDialogOpen(false);
      resetInvoiceDraft();
      await loadOperationalData(true);
    } catch (error: any) {
      console.error(error);
      toast.error(
        "Error al registrar factura",
        error?.response?.data?.message || "No se pudo guardar la factura.",
      );
    } finally {
      setProcessingInvoice(false);
    }
  };

  const handleStatusChange = async (invoiceId: string, status: string) => {
    try {
      await financeService.updateInvoiceStatus(invoiceId, status);
      toast.success("Estado actualizado", `La factura cambió a ${status}.`);
      await loadOperationalData(true);
    } catch (error: any) {
      console.error(error);
      toast.error(
        "Error",
        error?.response?.data?.message ||
          "No se pudo actualizar el estado de la factura.",
      );
    }
  };

  const cancelInvoice = async (invoice: SupplierInvoice) => {
    const result = await alert.confirm(
      "Anular factura",
      `Se revertirá el inventario y la cuenta por pagar de la factura ${invoice.invoiceNumber}. El historial se conservará.`,
    );

    if (!result.isConfirmed) return;

    try {
      await financeService.deleteInvoice(invoice.id);
      toast.success(
        "Factura anulada",
        `La factura ${invoice.invoiceNumber} quedó anulada sin borrar su historial.`,
      );
      await loadOperationalData(true);
    } catch (error: any) {
      console.error(error);
      toast.error(
        "Error",
        error?.response?.data?.message || "No se pudo anular la factura.",
      );
    }
  };

  const openPayableDialog = async (account: AccountPayable) => {
    setSelectedPayable(account);
    setPaymentForm({
      amount: String(account.remainingAmount || 0),
      paymentMethod: "TRANSFER",
      notes: "",
    });
    setPaymentDialogOpen(true);

    try {
      const detail = await financeService.getPayable(account.id);
      setSelectedPayable(detail);
    } catch (error) {
      console.error(error);
    }
  };

  const resetPaymentDialog = () => {
    setPaymentDialogOpen(false);
    setSelectedPayable(null);
    setPaymentForm({ amount: "", paymentMethod: "TRANSFER", notes: "" });
  };

  const openCreditDialog = async (invoice: SupplierInvoice) => {
    const payable = payables.find((item) => item.invoiceId === invoice.id);
    if (!payable) {
      toast.error(
        "Cuenta no disponible",
        "La factura no tiene una cuenta por pagar pendiente.",
      );
      return;
    }
    try {
      const detail = await financeService.getInvoice(invoice.id);
      setCreditInvoice(detail);
      setCreditPayable(payable);
      setCreditQuantities({});
      setCreditForm({
        creditNoteNumber: "",
        issueDate: new Date().toISOString().slice(0, 10),
        reason: "",
      });
      setCreditDialogOpen(true);
    } catch (error: any) {
      toast.error(
        "Error",
        error?.response?.data?.message || "No se pudo cargar la factura.",
      );
    }
  };

  const resetCreditDialog = () => {
    setCreditDialogOpen(false);
    setCreditInvoice(null);
    setCreditPayable(null);
    setCreditQuantities({});
  };

  const submitCreditNote = async () => {
    if (!storeId || !creditInvoice || !creditPayable) return;
    if (!creditForm.creditNoteNumber.trim()) {
      toast.error(
        "Número requerido",
        "Indica el número de la nota de crédito.",
      );
      return;
    }
    const items = (creditInvoice.items || [])
      .filter((item) => item.id && Number(creditQuantities[item.id] || 0) > 0)
      .map((item) => ({
        invoiceItemId: item.id!,
        quantity: Number(creditQuantities[item.id!] || 0),
      }));
    if (items.length === 0) {
      toast.error(
        "Productos requeridos",
        "Indica al menos una cantidad para devolver.",
      );
      return;
    }

    setProcessingCredit(true);
    try {
      await financeService.createSupplierCreditNote({
        storeId,
        supplierId: creditInvoice.supplierId,
        invoiceId: creditInvoice.id,
        accountPayableId: creditPayable.id,
        creditNoteNumber: creditForm.creditNoteNumber.trim(),
        issueDate: creditForm.issueDate,
        reason: creditForm.reason || undefined,
        items,
      });
      toast.success(
        "Nota aplicada",
        "Se redujeron el inventario y el saldo por pagar.",
      );
      resetCreditDialog();
      await loadOperationalData(true);
    } catch (error: any) {
      toast.error(
        "No se pudo aplicar",
        error?.response?.data?.message || "Revisa las cantidades y el saldo.",
      );
    } finally {
      setProcessingCredit(false);
    }
  };

  const submitPayablePayment = async () => {
    if (!selectedPayable) return;

    const amount = Number(paymentForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Monto inválido", "El pago debe ser mayor a cero.");
      return;
    }
    if (amount > Number(selectedPayable.remainingAmount || 0)) {
      toast.error(
        "Monto inválido",
        "El pago no puede superar el saldo pendiente.",
      );
      return;
    }

    setProcessingPayment(true);
    try {
      await financeService.registerPayablePayment(selectedPayable.id, {
        amount,
        paymentMethod: paymentForm.paymentMethod,
        notes: paymentForm.notes || undefined,
        paidBy: user?.id,
      });
      toast.success(
        "Pago registrado",
        `Se abonaron ${formatCurrency(amount)} a ${selectedPayable.supplierName}.`,
      );
      resetPaymentDialog();
      await loadOperationalData(true);
    } catch (error: any) {
      console.error(error);
      toast.error(
        "Error",
        error?.response?.data?.message || "No se pudo registrar el pago.",
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
            Facturas de proveedor y CxP
          </h1>
          <p className="text-muted-foreground">
            Registra compras, controla crédito con proveedores y vigila
            vencimientos sin salir del módulo web.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={supplierFilter}
            onValueChange={(value) =>
              setSearchParams(value === "all" ? {} : { supplierId: value })
            }
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filtrar proveedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los proveedores</SelectItem>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => loadOperationalData(true)}
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
            onClick={() => navigate(`/store/${storeId}/cxc`)}
            className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold"
          >
            <HandCoins className="mr-2 h-4 w-4 text-emerald-600" />
            Cuentas por Cobrar (CxC)
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <FilePlus2 className="mr-2 h-4 w-4" />
            Crear factura
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-cyan-500">
          <CardHeader className="pb-2">
            <CardDescription>Total facturado</CardDescription>
            <CardTitle>{formatCurrency(invoicesTotal)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {invoices.length} facturas en el filtro actual.
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-violet-500">
          <CardHeader className="pb-2">
            <CardDescription>Compras a crédito</CardDescription>
            <CardTitle>{formatCurrency(creditInvoicesTotal)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Exposición financiera de compras no de contado.
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardDescription>Saldo pendiente</CardDescription>
            <CardTitle>{formatCurrency(pendingPayablesTotal)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Cuentas por pagar abiertas en proveedor.
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-rose-500">
          <CardHeader className="pb-2">
            <CardDescription>Vencidas</CardDescription>
            <CardTitle>{overdueCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Requieren seguimiento inmediato por fecha vencida.
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="invoices">Facturas</TabsTrigger>
          <TabsTrigger value="payables">Cuentas por pagar</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ReceiptText className="h-5 w-5 text-cyan-600" />
                Facturas recientes
              </CardTitle>
              <CardDescription>
                Historial de compras de proveedor con control de estado
                documental.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : invoices.length === 0 ? (
                <Alert>
                  <FileSpreadsheet className="h-4 w-4" />
                  <AlertTitle>Sin facturas</AlertTitle>
                  <AlertDescription>
                    No hay facturas registradas para el filtro actual.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Factura</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Pago</TableHead>
                        <TableHead>Creada</TableHead>
                        <TableHead>Vence</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            <div className="font-medium">
                              {invoice.invoiceNumber}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {invoice.cashierName || "Sin usuario"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {invoice.supplierName || "Proveedor no disponible"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {invoice.paymentType}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                          <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                          <TableCell>
                            <Select
                              value={invoice.status}
                              onValueChange={(value) =>
                                handleStatusChange(invoice.id, value)
                              }
                            >
                              <SelectTrigger className="w-[150px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="RECIBIDA">
                                  RECIBIDA
                                </SelectItem>
                                <SelectItem value="PENDIENTE">
                                  PENDIENTE
                                </SelectItem>
                                {invoice.status === "PAGADA" && (
                                  <SelectItem value="PAGADA">PAGADA</SelectItem>
                                )}
                                {invoice.status === "ANULADA" && (
                                  <SelectItem value="ANULADA">
                                    ANULADA
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(invoice.total)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {payables.some(
                                (item) => item.invoiceId === invoice.id,
                              ) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openCreditDialog(invoice)}
                                >
                                  <RotateCcw className="mr-1.5 h-4 w-4" />
                                  Aplicar NC
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Anular factura"
                                disabled={
                                  invoice.status === "ANULADA" ||
                                  invoice.status === "PAGADA"
                                }
                                onClick={() => cancelInvoice(invoice)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
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

        <TabsContent value="payables">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BadgeDollarSign className="h-5 w-5 text-amber-600" />
                Cuentas por pagar abiertas
              </CardTitle>
              <CardDescription>
                Saldos por proveedor con pago parcial o total desde la misma
                interfaz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : payables.length === 0 ? (
                <Alert>
                  <CalendarClock className="h-4 w-4" />
                  <AlertTitle>Sin saldo pendiente</AlertTitle>
                  <AlertDescription>
                    No hay cuentas por pagar abiertas en el filtro actual.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Detalle</TableHead>
                        <TableHead>Vence</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                        <TableHead className="text-right">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPayables.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell>
                            <div className="font-medium">
                              {account.supplierName || "Proveedor sin nombre"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(account.totalAmount)}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[260px] text-sm text-muted-foreground">
                            {account.description || "Sin descripción"}
                          </TableCell>
                          <TableCell>
                            <div>{formatDate(account.dueDate)}</div>
                            {isOverdue(account) ? (
                              <div className="text-xs font-medium text-destructive">
                                Vencida
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                isOverdue(account)
                                  ? "destructive"
                                  : getStatusVariant(account.status)
                              }
                            >
                              {account.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(account.remainingAmount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => openPayableDialog(account)}
                            >
                              Registrar pago
                            </Button>
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
        open={createDialogOpen}
        onOpenChange={(open) =>
          !open
            ? (setCreateDialogOpen(false), resetInvoiceDraft())
            : setCreateDialogOpen(true)
        }
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {dialogView === "supplier"
                ? "Crear Proveedor Rápido"
                : "Nueva factura de proveedor"}
            </DialogTitle>
            <DialogDescription>
              {dialogView === "supplier"
                ? "Agrega a tu proveedor sin perder el progreso de la factura actual."
                : "Registra la compra, el detalle de productos y el compromiso financiero en una sola acción."}
            </DialogDescription>
          </DialogHeader>

          {dialogView === "supplier" && (
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Nombre del Proveedor</Label>
                  <Input
                    value={quickSupplierForm.name}
                    onChange={(e) =>
                      setQuickSupplierForm((p) => ({
                        ...p,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Ej. Distribuidora del Norte"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Contacto</Label>
                  <Input
                    value={quickSupplierForm.contactName}
                    onChange={(e) =>
                      setQuickSupplierForm((p) => ({
                        ...p,
                        contactName: e.target.value,
                      }))
                    }
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Teléfono</Label>
                  <Input
                    value={quickSupplierForm.phone}
                    onChange={(e) =>
                      setQuickSupplierForm((p) => ({
                        ...p,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="+505 0000 0000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Correo</Label>
                  <Input
                    value={quickSupplierForm.email}
                    onChange={(e) =>
                      setQuickSupplierForm((p) => ({
                        ...p,
                        email: e.target.value,
                      }))
                    }
                    placeholder="ventas@proveedor.com"
                    type="email"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setDialogView("invoice")}
                >
                  Cancelar
                </Button>
                <Button onClick={submitQuickSupplier} disabled={savingSupplier}>
                  {savingSupplier ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}{" "}
                  Guardar y Seleccionar
                </Button>
              </div>
            </div>
          )}

          <div className={dialogView === "invoice" ? "block" : "hidden"}>
            <div className="grid gap-4 py-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Proveedor</Label>
                <div className="flex gap-2">
                  <Select
                    value={invoiceDraft.supplierId}
                    onValueChange={(value) =>
                      setInvoiceDraft((prev) => ({
                        ...prev,
                        supplierId: value,
                      }))
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecciona proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setDialogView("supplier")}
                    title="Crear proveedor rápido"
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invoiceNumber">Número de factura</Label>
                <Input
                  id="invoiceNumber"
                  value={invoiceDraft.invoiceNumber}
                  onChange={(event) =>
                    setInvoiceDraft((prev) => ({
                      ...prev,
                      invoiceNumber: event.target.value,
                    }))
                  }
                  placeholder="Ej. F-2026-0012"
                />
              </div>
              <div className="grid gap-2">
                <Label>Tipo de pago</Label>
                <Select
                  value={invoiceDraft.paymentType}
                  onValueChange={(value) =>
                    setInvoiceDraft((prev) => ({
                      ...prev,
                      paymentType: value,
                      dueDate: value === "CREDITO" ? prev.dueDate : "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONTADO">Contado</SelectItem>
                    <SelectItem value="CREDITO">Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Vencimiento</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={invoiceDraft.dueDate}
                  disabled={invoiceDraft.paymentType !== "CREDITO"}
                  onChange={(event) =>
                    setInvoiceDraft((prev) => ({
                      ...prev,
                      dueDate: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Detalle de compra</h3>
                  <Button variant="outline" onClick={addDraftItem}>
                    Agregar línea
                  </Button>
                </div>

                <div className="space-y-3">
                  {invoiceDraft.items.map((item, index) => {
                    const selectedProd = products.find(
                      (p) => p.id === item.selectedProductId,
                    );
                    return (
                      <Card key={item.localId} className="bg-muted/30">
                        <CardContent className="grid gap-3 p-4 md:grid-cols-[1.8fr_2fr_110px_140px_auto]">
                          <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                              <Label>Producto</Label>
                              {selectedProd &&
                                (selectedProd.handlesBulk ||
                                (selectedProd.unitsPerBulk &&
                                  selectedProd.unitsPerBulk > 1) ? (
                                  <Badge
                                    variant="secondary"
                                    className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-1.5 py-0 border border-amber-300"
                                  >
                                    📦 Bulto ({selectedProd.unitsPerBulk || 1} uds)
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="bg-slate-100 text-slate-700 text-[10px] font-normal px-1.5 py-0"
                                  >
                                    🏷️ Unidad
                                  </Badge>
                                ))}
                            </div>
                            <ProductSearchSelect
                              value={item.selectedProductId}
                              onSelect={(val) =>
                                handleProductSelection(item.localId, val)
                              }
                              products={products}
                            />
                          </div>
                      <div className="grid gap-2">
                        <Label>Descripción</Label>
                        <Input
                          value={item.description}
                          onChange={(event) =>
                            updateDraftItem(item.localId, {
                              description: event.target.value,
                            })
                          }
                          placeholder={`Línea ${index + 1}`}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Cantidad</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={item.quantity}
                          onChange={(event) =>
                            updateDraftItem(item.localId, {
                              quantity: Number(event.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Costo unitario</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(event) =>
                            updateDraftItem(item.localId, {
                              unitPrice: Number(event.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={invoiceDraft.items.length === 1}
                          onClick={() => removeDraftItem(item.localId)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="rounded-lg border bg-muted/40 p-4">
              <div className="text-sm text-muted-foreground">
                Total calculado
              </div>
              <div className="text-3xl font-bold">
                {formatCurrency(invoiceTotal)}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  setCreateDialogOpen(false);
                  resetInvoiceDraft();
                }}
              >
                Cancelar
              </Button>
              <Button onClick={submitInvoice} disabled={processingInvoice}>
                {processingInvoice ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FilePlus2 className="mr-2 h-4 w-4" />
                )}
                Guardar factura
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={creditDialogOpen}
        onOpenChange={(open) => !open && resetCreditDialog()}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Aplicar nota de crédito de proveedor</DialogTitle>
            <DialogDescription>
              Devuelve productos de la factura {creditInvoice?.invoiceNumber} y
              reduce su saldo pendiente. Esta operación conserva trazabilidad.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="creditNoteNumber">Número de nota</Label>
                <Input
                  id="creditNoteNumber"
                  value={creditForm.creditNoteNumber}
                  onChange={(event) =>
                    setCreditForm((prev) => ({
                      ...prev,
                      creditNoteNumber: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="creditIssueDate">Fecha</Label>
                <Input
                  id="creditIssueDate"
                  type="date"
                  value={creditForm.issueDate}
                  onChange={(event) =>
                    setCreditForm((prev) => ({
                      ...prev,
                      issueDate: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Comprado</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
                    <TableHead className="w-[150px] text-right">
                      A devolver
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(creditInvoice?.items || []).map((item) => (
                    <TableRow key={item.id || item.productId}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          max={item.quantity}
                          step={1}
                          className="text-right"
                          value={item.id ? creditQuantities[item.id] || "" : ""}
                          disabled={!item.id}
                          onChange={(event) => {
                            if (!item.id) return;
                            setCreditQuantities((prev) => ({
                              ...prev,
                              [item.id!]: Number(event.target.value),
                            }));
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="creditReason">Motivo</Label>
              <Textarea
                id="creditReason"
                value={creditForm.reason}
                onChange={(event) =>
                  setCreditForm((prev) => ({
                    ...prev,
                    reason: event.target.value,
                  }))
                }
                placeholder="Producto dañado, vencido, diferencia de factura..."
              />
            </div>

            <Alert>
              <RotateCcw className="h-4 w-4" />
              <AlertTitle>Saldo máximo aplicable</AlertTitle>
              <AlertDescription>
                {formatCurrency(Number(creditPayable?.remainingAmount || 0))}
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={resetCreditDialog}>
              Cancelar
            </Button>
            <Button onClick={submitCreditNote} disabled={processingCredit}>
              {processingCredit && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Aplicar nota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={paymentDialogOpen}
        onOpenChange={(open) => !open && resetPaymentDialog()}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Registrar pago a proveedor</DialogTitle>
            <DialogDescription>
              {selectedPayable
                ? `${selectedPayable.supplierName} tiene ${formatCurrency(selectedPayable.remainingAmount)} pendientes.`
                : "Selecciona una cuenta por pagar."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="payAmount">Monto</Label>
              <Input
                id="payAmount"
                type="number"
                min="0"
                step="0.01"
                value={paymentForm.amount}
                onChange={(event) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    amount: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Método</Label>
              <Select
                value={paymentForm.paymentMethod}
                onValueChange={(value) =>
                  setPaymentForm((prev) => ({ ...prev, paymentMethod: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRANSFER">Transferencia</SelectItem>
                  <SelectItem value="CASH">Efectivo</SelectItem>
                  <SelectItem value="CARD">Tarjeta</SelectItem>
                  <SelectItem value="CHECK">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="payNotes">Notas</Label>
              <Textarea
                id="payNotes"
                value={paymentForm.notes}
                onChange={(event) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    notes: event.target.value,
                  }))
                }
                placeholder="Referencia bancaria, comprobante o comentario."
              />
            </div>

            {selectedPayable?.payments?.length ? (
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="mb-2 text-sm font-semibold">
                  Pagos recientes
                </div>
                <div className="space-y-2 text-sm">
                  {selectedPayable.payments.slice(0, 3).map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between gap-4"
                    >
                      <div>
                        <div>
                          {payment.paidByName ||
                            payment.paidBy ||
                            "Usuario no identificado"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(payment.paidAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatCurrency(payment.amount)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {payment.paymentMethod}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={resetPaymentDialog}>
              Cancelar
            </Button>
            <Button onClick={submitPayablePayment} disabled={processingPayment}>
              {processingPayment ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BadgeDollarSign className="mr-2 h-4 w-4" />
              )}
              Confirmar pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
