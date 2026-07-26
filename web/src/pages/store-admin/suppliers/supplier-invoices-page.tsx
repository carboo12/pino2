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
  PackagePlus,
  Sparkles,
  Box,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  selectedSupplierId?: string;
  onOpenQuickProductModal?: () => void;
}

function ProductSearchSelect({
  value,
  onSelect,
  products,
  selectedSupplierId,
  onOpenQuickProductModal,
}: ProductSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedProduct = products.find((p) => p.id === value);

  const { supplierProducts, otherProducts } = useMemo(() => {
    let filtered = products;
    if (search.trim()) {
      const query = search.toLowerCase().trim();
      filtered = products.filter(
        (p) =>
          p.description.toLowerCase().includes(query) ||
          (p.barcode && p.barcode.toLowerCase().includes(query)) ||
          (p.brand && p.brand.toLowerCase().includes(query)),
      );
    }

    if (!selectedSupplierId) {
      return { supplierProducts: [], otherProducts: filtered };
    }

    const supplierProds = filtered.filter(
      (p) => p.supplierId === selectedSupplierId,
    );
    const others = filtered.filter(
      (p) => p.supplierId !== selectedSupplierId,
    );

    return { supplierProducts: supplierProds, otherProducts: others };
  }, [products, search, selectedSupplierId]);

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
      <PopoverContent className="w-[340px] sm:w-[440px] p-0" align="start">
        <div className="p-2 border-b flex items-center justify-between gap-2 bg-muted/20">
          <div className="flex items-center gap-2 flex-1">
            <Search className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Buscar producto, SKU, código de barra..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          {onOpenQuickProductModal && (
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-7 text-xs px-2 shrink-0 bg-primary"
              onClick={() => {
                setOpen(false);
                onOpenQuickProductModal();
              }}
            >
              <PackagePlus className="h-3.5 w-3.5 mr-1" />
              + Nuevo
            </Button>
          )}
        </div>

        <div className="max-h-[280px] overflow-y-auto p-1 space-y-1">
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

          {supplierProducts.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-primary uppercase tracking-wider bg-primary/5 rounded mb-1">
                ⭐ Productos de este Proveedor ({supplierProducts.length})
              </div>
              {supplierProducts.map((p) =>
                renderProductOptionItem(p, value, () => {
                  onSelect(p.id);
                  setOpen(false);
                  setSearch("");
                }),
              )}
            </div>
          )}

          {otherProducts.length > 0 && (
            <div>
              {supplierProducts.length > 0 && (
                <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-2 mb-1">
                  📦 Otros Productos ({otherProducts.length})
                </div>
              )}
              {otherProducts.map((p) =>
                renderProductOptionItem(p, value, () => {
                  onSelect(p.id);
                  setOpen(false);
                  setSearch("");
                }),
              )}
            </div>
          )}

          {supplierProducts.length === 0 && otherProducts.length === 0 && (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No se encontraron productos coincidentes
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function renderProductOptionItem(
  p: ProductOption,
  selectedValue: string,
  onSelect: () => void,
) {
  const isSelected = p.id === selectedValue;
  const handlesBulk = p.handlesBulk || (p.unitsPerBulk && p.unitsPerBulk > 1);
  const upb = p.unitsPerBulk || 1;

  return (
    <button
      key={p.id}
      type="button"
      className={cn(
        "w-full flex items-center justify-between text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors gap-2 my-0.5",
        isSelected && "bg-accent/70 font-medium",
      )}
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0">
        <div className="truncate font-medium text-foreground">{p.description}</div>
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
}

function QuickProductModal({
  open,
  onOpenChange,
  storeId,
  defaultSupplierId,
  suppliers,
  onProductCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId?: string;
  defaultSupplierId?: string;
  suppliers: SupplierOption[];
  onProductCreated: (newProduct: ProductOption) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    description: "",
    code: "",
    barcode: "",
    bulkBarcode: "",
    brand: "",
    supplierId: defaultSupplierId || "",
    handlesBulk: false,
    unitsPerBulk: 12,
    costPrice: "",
    salePrice: "",
    bulkPrice1: "",
  });

  useEffect(() => {
    if (defaultSupplierId) {
      setForm((prev) => ({ ...prev, supplierId: defaultSupplierId }));
    }
  }, [defaultSupplierId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) {
      toast.error("Descripción requerida", "Ingresa el nombre o descripción del producto.");
      return;
    }
    if (!storeId) {
      toast.error("Error", "Tienda no especificada.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        storeId,
        description: form.description.trim(),
        barcode: form.barcode.trim() || undefined,
        brand: form.brand.trim() || undefined,
        supplierId: form.supplierId || undefined,
        costPrice: Number(form.costPrice) || 0,
        price1: Number(form.salePrice) || 0,
        bulkPrice1: form.bulkPrice1 ? Number(form.bulkPrice1) : undefined,
        handlesBulk: form.handlesBulk,
        unitsPerBulk: form.handlesBulk ? Math.max(2, Number(form.unitsPerBulk) || 12) : 1,
      };

      const resp = await apiClient.post("/products", payload);
      toast.success("Producto Creado", "El producto ha sido registrado exitosamente.");

      const createdObj = resp.data?.product || resp.data;
      const newProd: ProductOption = {
        id: createdObj.id,
        description: createdObj.description || form.description,
        costPrice: Number(form.costPrice) || 0,
        currentStock: 0,
        barcode: form.barcode || undefined,
        handlesBulk: form.handlesBulk,
        unitsPerBulk: form.handlesBulk ? Math.max(2, Number(form.unitsPerBulk) || 12) : 1,
        supplierId: form.supplierId || undefined,
        brand: form.brand || undefined,
      };

      onProductCreated(newProd);
      onOpenChange(false);
      setForm({
        description: "",
        code: "",
        barcode: "",
        bulkBarcode: "",
        brand: "",
        supplierId: defaultSupplierId || "",
        handlesBulk: false,
        unitsPerBulk: 12,
        costPrice: "",
        salePrice: "",
        bulkPrice1: "",
      });
    } catch (err: any) {
      toast.error(
        "Error al crear producto",
        err.response?.data?.message || "No se pudo registrar el producto.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-primary" />
            Crear Nuevo Producto Completo
          </DialogTitle>
          <DialogDescription>
            Registra una nueva mercancía con reglas de Bulto/Unidad, códigos y precios. Se agregará a la factura automáticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2 grid gap-1.5">
              <Label htmlFor="prodDesc">Nombre / Descripción *</Label>
              <Input
                id="prodDesc"
                placeholder="Ej. ACEITE EL REAL 1 LTS"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="prodBrand">Marca</Label>
              <Input
                id="prodBrand"
                placeholder="Ej. El Real"
                value={form.brand}
                onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Proveedor Principal</Label>
              <Select
                value={form.supplierId}
                onValueChange={(val) => setForm((p) => ({ ...p, supplierId: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border p-3 bg-muted/20 space-y-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Codificación y Barras
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="unitBarcode">Código de Barra Unitario</Label>
                <Input
                  id="unitBarcode"
                  placeholder="Ej. 741234567890"
                  value={form.barcode}
                  onChange={(e) => setForm((p) => ({ ...p, barcode: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="bulkBarcode">Código de Barra de Bulto</Label>
                <Input
                  id="bulkBarcode"
                  placeholder="Ej. 1741234567897"
                  value={form.bulkBarcode}
                  onChange={(e) => setForm((p) => ({ ...p, bulkBarcode: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-3 bg-amber-500/5 space-y-3 border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold">¿Maneja control por Bultos / Cajas?</Label>
                <p className="text-xs text-muted-foreground">
                  Activa esta opción si el producto se compra o vende por caja/fardo.
                </p>
              </div>
              <Switch
                checked={form.handlesBulk}
                onCheckedChange={(chk) => setForm((p) => ({ ...p, handlesBulk: chk }))}
              />
            </div>

            {form.handlesBulk && (
              <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-amber-200/60">
                <div className="grid gap-1.5">
                  <Label htmlFor="upbInput">Unidades por Bulto (Factor X) *</Label>
                  <Input
                    id="upbInput"
                    type="number"
                    min="2"
                    value={form.unitsPerBulk}
                    onChange={(e) => setForm((p) => ({ ...p, unitsPerBulk: Number(e.target.value) || 2 }))}
                    placeholder="12"
                  />
                  <span className="text-[11px] text-amber-700 font-medium">1 Bulto = {form.unitsPerBulk} Unidades Base</span>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="bulkPrice1">Precio Venta por Bulto (Opcional)</Label>
                  <Input
                    id="bulkPrice1"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ej. 450.00"
                    value={form.bulkPrice1}
                    onChange={(e) => setForm((p) => ({ ...p, bulkPrice1: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="costPrice">Costo de Compra Unitario *</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ej. 25.50"
                value={form.costPrice}
                onChange={(e) => setForm((p) => ({ ...p, costPrice: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="salePrice">Precio de Venta Unitario</Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ej. 32.00"
                value={form.salePrice}
                onChange={(e) => setForm((p) => ({ ...p, salePrice: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Guardar y Seleccionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
  bulks: number;
  units: number;
  unitsPerBulk: number;
  handlesBulk: boolean;
  unitPrice: number;
};

function createDraftItem(): DraftInvoiceItem {
  return {
    localId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    selectedProductId: "manual",
    description: "",
    bulks: 0,
    units: 1,
    unitsPerBulk: 1,
    handlesBulk: false,
    unitPrice: 0,
  };
}

function getItemTotalUnits(item: DraftInvoiceItem): number {
  if (item.handlesBulk && item.unitsPerBulk > 1) {
    return (Number(item.bulks) || 0) * item.unitsPerBulk + (Number(item.units) || 0);
  }
  return Number(item.units) || 0;
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
          acc + getItemTotalUnits(item) * Number(item.unitPrice || 0),
        0,
      ),
    [invoiceDraft.items],
  );

  const [quickProductModalOpen, setQuickProductModalOpen] = useState(false);
  const [targetLineForNewProduct, setTargetLineForNewProduct] = useState<string | null>(null);

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
        bulks: 0,
        units: 1,
        unitsPerBulk: 1,
        handlesBulk: false,
        unitPrice: 0,
      });
      return;
    }
    const selectedProduct = products.find(
      (product) => product.id === selectedValue,
    );
    const handlesBulk =
      selectedProduct?.handlesBulk === true ||
      (Number(selectedProduct?.unitsPerBulk) > 1);
    const unitsPerBulk = Number(selectedProduct?.unitsPerBulk || 1);

    updateDraftItem(localId, {
      selectedProductId: selectedValue,
      description: selectedProduct?.description || "",
      bulks: handlesBulk ? 1 : 0,
      units: handlesBulk ? 0 : 1,
      unitsPerBulk: unitsPerBulk,
      handlesBulk: handlesBulk,
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

  const handleProductCreated = (newProduct: ProductOption) => {
    setProducts((prev) => [newProduct, ...prev]);
    if (targetLineForNewProduct) {
      handleProductSelection(targetLineForNewProduct, newProduct.id);
      setTargetLineForNewProduct(null);
    } else if (invoiceDraft.items.length > 0) {
      const lastLineId = invoiceDraft.items[invoiceDraft.items.length - 1].localId;
      handleProductSelection(lastLineId, newProduct.id);
    }
  };

  const submitInvoice = async () => {
    if (!storeId) return;

    const validItems = invoiceDraft.items
      .map((item) => {
        const totalUnits = getItemTotalUnits(item);
        return {
          productId:
            item.selectedProductId === "manual"
              ? undefined
              : item.selectedProductId,
          description: item.description.trim(),
          quantity: totalUnits,
          inputBulks: item.handlesBulk ? item.bulks : undefined,
          inputUnits: item.handlesBulk ? item.units : totalUnits,
          unitsPerBulk: item.handlesBulk ? item.unitsPerBulk : 1,
          unitPrice: Number(item.unitPrice),
        };
      })
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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-primary border-primary/30 hover:bg-primary/5"
                      onClick={() => {
                        setTargetLineForNewProduct(null);
                        setQuickProductModalOpen(true);
                      }}
                    >
                      <PackagePlus className="h-4 w-4 mr-1" />
                      + Nuevo Producto
                    </Button>
                    <Button variant="outline" size="sm" onClick={addDraftItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar línea
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {invoiceDraft.items.map((item, index) => {
                    const selectedProd = products.find(
                      (p) => p.id === item.selectedProductId,
                    );
                    const totalUnits = getItemTotalUnits(item);
                    const lineSubtotal = totalUnits * (item.unitPrice || 0);

                    return (
                      <Card key={item.localId} className="bg-muted/30">
                        <CardContent className="grid gap-3 p-4 md:grid-cols-[1.8fr_2fr_180px_130px_auto]">
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
                              selectedSupplierId={invoiceDraft.supplierId}
                              onOpenQuickProductModal={() => {
                                setTargetLineForNewProduct(item.localId);
                                setQuickProductModalOpen(true);
                              }}
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

                          {/* Cantidad Dinámica: Bultos vs Unidades */}
                          {item.handlesBulk && item.unitsPerBulk > 1 ? (
                            <div className="grid gap-1.5">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs">Bultos & Unidades</Label>
                                <span className="text-[10px] text-amber-800 font-semibold bg-amber-100 px-1 rounded border border-amber-200">
                                  1 Bulto = {item.unitsPerBulk} u
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-1.5">
                                <div>
                                  <span className="text-[10px] text-muted-foreground block mb-0.5 font-medium">Bultos</span>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={item.bulks}
                                    onChange={(event) =>
                                      updateDraftItem(item.localId, {
                                        bulks: Math.max(0, parseInt(event.target.value) || 0),
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <span className="text-[10px] text-muted-foreground block mb-0.5 font-medium font-medium">Sueltas</span>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={item.units}
                                    onChange={(event) =>
                                      updateDraftItem(item.localId, {
                                        units: Math.max(0, parseInt(event.target.value) || 0),
                                      })
                                    }
                                  />
                                </div>
                              </div>
                              <span className="text-[11px] text-muted-foreground font-semibold">
                                Total: {totalUnits} u. base
                              </span>
                            </div>
                          ) : (
                            <div className="grid gap-2">
                              <Label>Cantidad (Uds)</Label>
                              <Input
                                type="number"
                                min="1"
                                step="1"
                                value={item.units}
                                onChange={(event) =>
                                  updateDraftItem(item.localId, {
                                    units: Math.max(1, parseInt(event.target.value) || 1),
                                  })
                                }
                              />
                            </div>
                          )}

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
                            <span className="text-[11px] text-muted-foreground font-semibold">
                              Subtotal: {formatCurrency(lineSubtotal)}
                            </span>
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

      <QuickProductModal
        open={quickProductModalOpen}
        onOpenChange={setQuickProductModalOpen}
        storeId={storeId}
        defaultSupplierId={invoiceDraft.supplierId}
        suppliers={suppliers}
        onProductCreated={handleProductCreated}
      />
    </div>
  );
}
