export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    storeIds?: string[];
    storeName?: string;
    chainId?: string | null;
}

export interface Product {
    id: string;
    storeId: string;
    description: string;
    barcode?: string;
    salePrice: number;
    price1?: number;
    price2?: number;
    price3?: number;
    price4?: number;
    price5?: number;
    bulkPrice1?: number;
    bulkPrice2?: number;
    bulkPrice3?: number;
    bulkPrice4?: number;
    bulkPrice5?: number;
    costPrice: number;
    currentStock: number;
    stockTotalUnits: number;
    handlesBulk: boolean;
    unitsPerBulk: number;
    stockDisplay: {
        bulkCount: number;
        looseUnitCount: number;
        formatted: string;
    };
    minStock?: number;
    usesInventory: boolean;
    departmentId?: string;
    subDepartmentId?: string;
    priceLabel?: string;
}

export interface Store {
    id: string;
    name: string;
    address: string;
    phone: string;
    chainId?: string | null;
    settings?: Record<string, any>;
}

export interface Client {
    id: string;
    storeId: string;
    name: string;
    phone?: string;
    address: string;
    email?: string;
    code?: string;
    creditLimit?: number;
}

export interface CashShift {
    id: string;
    storeId: string;
    status: 'open' | 'closed';
    initialAmount: number;
    cashierName: string;
    cashierId: string;
    openingTimestamp: string;
    user?: User;
    store?: Store;
}

export interface OrderItem {
    id: string;
    productId: string;
    productName: string;
    barcode?: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    presentation?: 'BULK' | 'UNIT';
    priceLevel?: number;
    unitsPerBulk?: number;
    handlesBulk?: boolean;
    quantityBulks?: number;
    quantityUnits?: number;
}

export interface Order {
    id: string;
    storeId: string;
    clientId?: string;
    clientName?: string;
    vendorId?: string;
    salesManagerName?: string;
    paymentType: 'CONTADO' | 'CREDITO';
    priceLevel: number;
    status: 'RECIBIDO' | 'EN_PREPARACION' | 'ALISTADO' | 'CARGADO_CAMION' | 'EN_ENTREGA' | 'ENTREGADO' | 'DEVUELTO' | 'RECHAZADO' | 'PENDING' | 'CANCELADO';
    items: OrderItem[];
    total: number;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ReturnItem {
    id: string;
    productId: string;
    productName: string;
    barcode?: string;
    quantityBulks: number;
    quantityUnits: number;
    unitPrice: number;
    subtotal: number;
}

export interface Return {
    id: string;
    orderId: string;
    storeId: string;
    ruteroId: string;
    notes?: string;
    total: number;
    items?: ReturnItem[];
    createdAt: string;
}

export interface Collection {
    id: string;
    storeId: string;
    accountId?: string;
    ruteroId: string;
    clientId?: string;
    clientName?: string;
    ruteroName?: string;
    amount: number;
    paymentMethod: string;
    notes?: string;
    createdAt: string;
}

export interface AccountPayable {
    id: string;
    storeId: string;
    supplierId: string;
    supplierName: string;
    invoiceId?: string;
    totalAmount: number;
    remainingAmount: number;
    status: 'PENDING' | 'PARTIAL' | 'PAID';
    description?: string;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
    payments?: any[];
}
