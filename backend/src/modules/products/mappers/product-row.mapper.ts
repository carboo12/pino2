import { calculateStockDisplay } from '../../../common/utils/stock-display.util';
import { Product } from '../products.dto';

export interface ProductRow {
  id: string;
  store_id: string;
  department_id: string;
  department_name?: string;
  barcode: string;
  description: string;
  brand: string;
  sale_price: string | number;
  cost_price: string | number;
  wholesale_price: string | number;
  price1: string | number;
  price2: string | number;
  price3: string | number;
  price4: string | number;
  price5: string | number;
  bulk_price_1: string | number;
  bulk_price_2: string | number;
  bulk_price_3: string | number;
  bulk_price_4: string | number;
  bulk_price_5: string | number;
  current_stock: string | number;
  units_per_bulk: string | number;
  min_stock: string | number;
  uses_inventory: boolean;
  handles_bulk: boolean;
  supplier_id: string;
  sub_department: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    storeId: row.store_id,
    departmentId: row.department_id,
    department: row.department_name || '',
    departmentName: row.department_name || '',
    barcode: row.barcode,
    description: row.description,
    brand: row.brand || '',
    salePrice: parseFloat(String(row.sale_price || 0)),
    costPrice: parseFloat(String(row.cost_price || 0)),
    wholesalePrice: parseFloat(String(row.wholesale_price || 0)),
    price1: parseFloat(String(row.price1 || row.sale_price || 0)),
    price2: parseFloat(String(row.price2 || row.sale_price || 0)),
    price3: parseFloat(String(row.price3 || row.sale_price || 0)),
    price4: parseFloat(String(row.price4 || row.sale_price || 0)),
    price5: parseFloat(String(row.price5 || row.sale_price || 0)),
    bulkPrice1: parseFloat(String(row.bulk_price_1 || 0)),
    bulkPrice2: parseFloat(String(row.bulk_price_2 || 0)),
    bulkPrice3: parseFloat(String(row.bulk_price_3 || 0)),
    bulkPrice4: parseFloat(String(row.bulk_price_4 || 0)),
    bulkPrice5: parseFloat(String(row.bulk_price_5 || 0)),
    currentStock: parseInt(String(row.current_stock || 0), 10),
    stockTotalUnits: parseInt(String(row.current_stock || 0), 10),
    unitsPerBulk: parseInt(String(row.units_per_bulk || 1), 10),
    stockDisplay: calculateStockDisplay(
      parseInt(String(row.current_stock || 0), 10),
      row.handles_bulk === true,
      parseInt(String(row.units_per_bulk || 1), 10),
    ),
    minStock: parseInt(String(row.min_stock || 0), 10),
    usesInventory: row.uses_inventory !== false,
    handlesBulk: row.handles_bulk,
    supplierId: row.supplier_id || null,
    subDepartment: row.sub_department || '',
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
