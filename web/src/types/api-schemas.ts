import { z } from 'zod/v4';

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    role: z.string(),
    storeIds: z.array(z.string().uuid()).optional(),
    storeName: z.string().optional(),
  }),
});

export const HealthResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded']),
  version: z.string().optional(),
  uptime: z.number(),
  timestamp: z.string(),
  db: z.enum(['ok', 'error']),
  responseTimeMs: z.number(),
});

export const ProductSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().uuid().optional(),
  description: z.string(),
  barcode: z.string().optional(),
  salePrice: z.number(),
  costPrice: z.number().optional(),
  currentStock: z.number().int(),
  stockTotalUnits: z.number().int(),
  handlesBulk: z.boolean(),
  unitsPerBulk: z.number().int(),
  stockDisplay: z.object({
    bulkCount: z.number().int(),
    looseUnitCount: z.number().int(),
    formatted: z.string(),
  }),
  price1: z.number().optional(),
  price2: z.number().optional(),
  price3: z.number().optional(),
  price4: z.number().optional(),
  price5: z.number().optional(),
  bulkPrice1: z.number().optional(),
  bulkPrice2: z.number().optional(),
  bulkPrice3: z.number().optional(),
  bulkPrice4: z.number().optional(),
  bulkPrice5: z.number().optional(),
  isActive: z.boolean().optional(),
  usesInventory: z.boolean().optional(),
  unitsPerBulk: z.number().int().optional(),
  version: z.number().int().optional(),
});

export const OrderSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().uuid(),
  clientId: z.string().uuid().nullable().optional(),
  clientName: z.string().nullable().optional(),
  vendorId: z.string().uuid().nullable().optional(),
  total: z.number(),
  status: z.string(),
  paymentType: z.string().optional(),
  priceLevel: z.number().int().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int(),
    unitPrice: z.number(),
    subtotal: z.number().optional(),
  })).optional(),
  createdAt: z.string().optional(),
  version: z.number().int().optional(),
});

export const SaleResponseSchema = z.object({
  success: z.boolean(),
  saleId: z.string().uuid(),
  ticketNumber: z.string(),
  total: z.number(),
  subtotal: z.number(),
  tax: z.number(),
  paymentMethod: z.string(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int(),
    unitPrice: z.number(),
  })),
});

export const ClientSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().uuid(),
  name: z.string(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  version: z.number().int().optional(),
});

export const CashShiftSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().uuid(),
  openedBy: z.string().uuid(),
  status: z.string(),
  startingCash: z.number(),
  expectedCash: z.number().optional(),
  actualCash: z.number().optional(),
  difference: z.number().optional(),
  openedAt: z.string(),
});

export const ErrorResponseSchema = z.object({
  message: z.union([z.string(), z.array(z.string())]),
  error: z.string().optional(),
  statusCode: z.number(),
});

export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown, label?: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`API schema error${label ? ` [${label}]` : ''}: ${errors}`);
  }
  return result.data;
}
