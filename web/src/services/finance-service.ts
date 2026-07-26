import apiClient from "@/services/api-client";

export interface AccountReceivable {
  id: string;
  storeId: string;
  clientId: string;
  clientName: string;
  saleId?: string;
  orderId?: string;
  invoiceNumber?: string;
  totalAmount: number;
  creditNoteAmount: number;
  remainingAmount: number;
  pendingAmount: number;
  description?: string;
  status: "PENDING" | "PARTIAL" | "PAID" | "CANCELLED";
  issuedAt?: string;
  dueDate?: string;
  creditDays: number;
  daysOverdue: number;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionRecord {
  id: string;
  storeId: string;
  accountId?: string;
  ruteroId: string;
  ruteroName?: string;
  clientId?: string;
  clientName?: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
}

export interface CollectionSummary {
  totalCount: number;
  totalAmount: number;
  cashTotal: number;
  otherTotal: number;
}

export interface PayablePayment {
  id: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
  paidBy?: string;
  paidByName?: string;
  paidAt: string;
}

export interface AccountPayable {
  id: string;
  storeId: string;
  supplierId: string;
  supplierName: string;
  invoiceId?: string;
  totalAmount: number;
  remainingAmount: number;
  description?: string;
  status: "PENDING" | "PARTIAL" | "PAID" | "CANCELLED";
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  payments?: PayablePayment[];
}

export interface SupplierInvoice {
  id: string;
  storeId: string;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  paymentType: string;
  dueDate?: string;
  total: number;
  status: string;
  cashierName: string;
  createdAt: string;
  updatedAt: string;
  items?: SupplierInvoiceItem[];
}

export interface SupplierInvoiceItem {
  id?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
}

export interface SupplierCreditNote {
  id: string;
  storeId: string;
  supplierId: string;
  supplierName: string;
  invoiceId: string;
  invoiceNumber: string;
  accountPayableId: string;
  creditNoteNumber: string;
  issueDate: string;
  totalAmount: number;
  appliedAmount: number;
  status: "DRAFT" | "POSTED" | "APPLIED" | "CANCELLED";
  reason?: string;
  createdAt: string;
  items?: Array<{
    id: string;
    invoiceItemId: string;
    productId: string;
    description: string;
    quantity: number;
    unitCost: number;
    subtotal: number;
  }>;
}

export interface SupplierOption {
  id: string;
  name: string;
}

export interface ProductOption {
  id: string;
  description: string;
  costPrice: number;
  currentStock: number;
  barcode?: string;
}

function cleanParams(
  params: Record<string, string | number | boolean | undefined>,
) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== "" && value !== false,
    ),
  );
}

export const financeService = {
  async listReceivables(storeId: string, pending = true) {
    const response = await apiClient.get("/accounts-receivable", {
      params: cleanParams({ storeId, pending }),
    });
    return (response.data || []) as AccountReceivable[];
  },

  async registerReceivablePayment(
    accountId: string,
    payload: {
      amount: number;
      paymentMethod?: string;
      notes?: string;
      vendorId?: string;
      vendorName?: string;
    },
  ) {
    const response = await apiClient.post(
      `/accounts-receivable/${accountId}/payments`,
      payload,
    );
    return response.data;
  },

  async listCollections(
    storeId: string,
    filters?: { ruteroId?: string; clientId?: string; date?: string },
  ) {
    const response = await apiClient.get("/collections", {
      params: cleanParams({ storeId, ...filters }),
    });
    return (response.data || []) as CollectionRecord[];
  },

  async getCollectionsSummary(
    storeId: string,
    filters?: { ruteroId?: string; date?: string },
  ) {
    const response = await apiClient.get("/collections/summary", {
      params: cleanParams({ storeId, ...filters }),
    });
    return (response.data || {
      totalCount: 0,
      totalAmount: 0,
      cashTotal: 0,
      otherTotal: 0,
    }) as CollectionSummary;
  },

  async listPayables(
    storeId: string,
    filters?: { supplierId?: string; pending?: boolean },
  ) {
    const response = await apiClient.get("/accounts-payable", {
      params: cleanParams({ storeId, ...filters }),
    });
    return (response.data || []) as AccountPayable[];
  },

  async getPayable(id: string) {
    const response = await apiClient.get(`/accounts-payable/${id}`);
    return response.data as AccountPayable;
  },

  async registerPayablePayment(
    accountId: string,
    payload: {
      amount: number;
      paymentMethod?: string;
      notes?: string;
      paidBy?: string;
    },
  ) {
    const response = await apiClient.post(
      `/accounts-payable/${accountId}/payment`,
      payload,
    );
    return response.data as AccountPayable;
  },

  async listInvoices(storeId: string, supplierId?: string) {
    const response = await apiClient.get("/invoices", {
      params: cleanParams({ storeId, supplierId }),
    });
    return (response.data || []) as SupplierInvoice[];
  },

  async getInvoice(id: string) {
    const response = await apiClient.get(`/invoices/${id}`);
    return response.data as SupplierInvoice;
  },

  async createInvoice(payload: {
    storeId: string;
    supplierId: string;
    invoiceNumber: string;
    paymentType: string;
    dueDate?: string;
    total: number;
    status: string;
    cashierName: string;
    items: SupplierInvoiceItem[];
  }) {
    const response = await apiClient.post("/invoices", payload);
    return response.data as SupplierInvoice;
  },

  async updateInvoiceStatus(id: string, status: string) {
    const response = await apiClient.patch(`/invoices/${id}`, { status });
    return response.data as SupplierInvoice;
  },

  async deleteInvoice(id: string) {
    const response = await apiClient.delete(`/invoices/${id}`);
    return response.data as { success: boolean; status: "ANULADA" };
  },

  async listSupplierCreditNotes(
    storeId: string,
    filters?: { supplierId?: string; invoiceId?: string },
  ) {
    const response = await apiClient.get("/supplier-credit-notes", {
      params: cleanParams({ storeId, ...filters }),
    });
    return (response.data || []) as SupplierCreditNote[];
  },

  async createSupplierCreditNote(payload: {
    storeId: string;
    supplierId: string;
    invoiceId: string;
    accountPayableId: string;
    creditNoteNumber: string;
    issueDate: string;
    reason?: string;
    items: Array<{ invoiceItemId: string; quantity: number }>;
  }) {
    const response = await apiClient.post("/supplier-credit-notes", payload);
    return response.data as SupplierCreditNote;
  },

  async listSuppliers(storeId: string) {
    const response = await apiClient.get("/suppliers", {
      params: cleanParams({ storeId }),
    });
    return (response.data || []) as SupplierOption[];
  },

  async listProducts(storeId: string, limit = 200) {
    const response = await apiClient.get("/products", {
      params: cleanParams({ storeId, limit }),
    });
    return (response.data || []) as ProductOption[];
  },
};

export default financeService;
