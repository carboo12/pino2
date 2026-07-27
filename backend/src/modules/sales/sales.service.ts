import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { EventsGateway } from '../../common/gateways/events.gateway';
import { splitIntoBulkUnits } from '../../common/utils/stock-display.util';
import { PromotionsService } from '../promotions/promotions.service';
import { SalesRepository } from './repositories/sales.repository';
import { SaleRowMapper } from './mappers/sale-row.mapper';
import { ProcessSaleUseCase } from './use-cases/process-sale.use-case';

@Injectable()
export class SalesService {
  private _salesRepo: SalesRepository;
  private _processSaleUseCase: ProcessSaleUseCase;

  constructor(
    private readonly db: DatabaseService,
    private readonly eventsGateway: EventsGateway,
    private readonly promotionsService: PromotionsService,
  ) {}

  private get salesRepo(): SalesRepository {
    if (!this._salesRepo) {
      this._salesRepo = new SalesRepository(this.db, new SaleRowMapper());
    }
    return this._salesRepo;
  }

  private get processSaleUseCase(): ProcessSaleUseCase {
    if (!this._processSaleUseCase) {
      this._processSaleUseCase = new ProcessSaleUseCase(
        this.db,
        this.salesRepo,
        this.eventsGateway,
        this.promotionsService,
      );
    }
    return this._processSaleUseCase;
  }

  async processSale(
    dto: {
      storeId: string;
      cashShiftId?: string;
      shiftId?: string;
      ticketNumber?: string;
      clientId?: string;
      clientName?: string;
      items: Array<{
        id?: string;
        productId?: string;
        quantity?: number;
        bulkCount?: number;
        looseUnitCount?: number;
      }>;
      paymentMethod: string;
      paymentCurrency?: string;
      amountReceived?: number;
      change?: number;
      externalId?: string;
    },
    userId: string,
    transactionalClient?: PoolClient,
    context?: { operationId?: string; skipInboxClaim?: boolean },
  ) {
    const result = await this.processSaleUseCase.execute(
      dto,
      userId,
      transactionalClient,
      context,
    );

    if (result && !result.isDuplicate) {
      this.eventsGateway.emitSyncUpdate({
        type: 'SALE_COMPLETED',
        storeId: dto.storeId,
        payload: {
          saleId: result.saleId,
          ticketNumber: result.ticketNumber,
          storeId: dto.storeId,
        },
      });
    }

    return result;
  }

  async findAll(
    storeId?: string,
    shiftId?: string,
    startDate?: string,
    endDate?: string,
    storeIds?: string,
    limit?: number,
    vendorId?: string,
    page?: number,
    pageSize?: number,
    clientId?: string,
  ) {
    if (page !== undefined) {
      const safePage = Math.max(1, Number.isFinite(page) ? page : 1);
      const requestedSize = pageSize ?? limit ?? 50;
      const safePageSize = Math.max(
        1,
        Math.min(500, Number.isFinite(requestedSize) ? requestedSize : 50),
      );
      return this.salesRepo.findPaginatedSales(
        storeId,
        shiftId,
        startDate,
        endDate,
        storeIds,
        safePage,
        safePageSize,
        vendorId,
        clientId,
      );
    }
    return this.salesRepo.findAllSales(
      storeId,
      shiftId,
      startDate,
      endDate,
      storeIds,
      limit,
      vendorId,
      clientId,
    );
  }

  async findOne(id: string, storeId?: string) {
    const sale = await this.salesRepo.findSaleById(id, storeId);
    if (!sale) throw new NotFoundException('Venta no encontrada');

    const items = await this.salesRepo.findSaleItemsWithProducts(sale.id);
    sale.items = items;

    return sale;
  }

  async processReturn(
    saleId: string,
    dto: { items: { productId: string; quantity: number }[]; reason?: string },
  ) {
    return this.db.withTransaction(async (client) => {
      const sale = await this.salesRepo.findSaleByIdForReturn(client, saleId);
      if (!sale) throw new NotFoundException('Venta no encontrada');

      let totalRefund = 0;

      for (const item of dto.items) {
        const si = await this.salesRepo.findSaleItemPrice(
          client,
          saleId,
          item.productId,
        );
        const resolvedProductId = si?.productId || item.productId;
        const unitPrice = si ? si.unitPrice : 0;
        totalRefund += unitPrice * item.quantity;

        const prod = await this.salesRepo.findProductForReturnUpdate(
          client,
          resolvedProductId,
        );
        if (!prod) {
          throw new NotFoundException('Producto no encontrado');
        }

        const currentStock = prod.currentStock;
        const unitsPerBulk = prod.unitsPerBulk > 0 ? prod.unitsPerBulk : 1;
        const handlesBulk = prod.handlesBulk;
        const newBalance = currentStock + item.quantity;
        const stockSplit = splitIntoBulkUnits(newBalance, unitsPerBulk);
        const returnedSplit = splitIntoBulkUnits(item.quantity, unitsPerBulk);

        await this.salesRepo.restoreProductStock(
          client,
          resolvedProductId,
          newBalance,
        );

        await this.salesRepo.insertMovement(client, {
          storeId: sale.storeId,
          productId: resolvedProductId,
          userId: sale.cashierId,
          type: 'IN',
          quantity: item.quantity,
          quantityBulks: returnedSplit.bulks,
          quantityUnits: returnedSplit.units,
          balance: newBalance,
          balanceBulks: stockSplit.bulks,
          balanceUnits: stockSplit.units,
          reference: `Devolución Venta: ${sale.ticketNumber}. ${dto.reason || ''}`,
          handlesBulkSnapshot: handlesBulk,
          unitsPerBulkSnapshot: unitsPerBulk,
        });
      }

      return {
        success: true,
        saleId,
        totalRefund,
        message: 'Devolución procesada correctamente',
      };
    });
  }

  async getSalesReport(storeId: string, startDate: string, endDate: string, shiftId?: string) {
    const [topProducts, byMethod] = await Promise.all([
      this.salesRepo.getSalesReportTopProducts(storeId, startDate, endDate, shiftId),
      this.salesRepo.getSalesReportByMethod(storeId, startDate, endDate, shiftId),
    ]);
    return { topProducts, byMethod };
  }

  async getDashboardStats(storeId: string) {
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    ).toISOString();

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
    ).toISOString();
    const endOfYesterday = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
      23,
      59,
      59,
      999,
    ).toISOString();

    const startOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1,
    ).toISOString();
    const startOfLastMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1,
    ).toISOString();
    const endOfLastMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      0,
      23,
      59,
      59,
      999,
    ).toISOString();
    const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString();

    const [stats, chartRes] = await Promise.all([
      this.salesRepo.getDashboardAggregates(storeId, {
        startOfToday,
        startOfYesterday,
        endOfYesterday,
        startOfMonth,
        startOfLastMonth,
        endOfLastMonth,
        startOfYear,
      }),
      this.salesRepo.getDashboardChart(storeId, startOfYear),
    ]);

    const monthNames = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
    ];
    const chartMap = new Map(
      chartRes.map((r: any) => [r.month_num, parseFloat(r.total)]),
    );
    const annualChartData = monthNames.map((name, i) => ({
      month: name,
      sales: chartMap.get(i + 1) || 0,
    }));

    const monthlyCount = parseInt(stats.monthly_count, 10) || 0;
    const lastMonthCount = parseInt(stats.last_month_count, 10) || 0;
    const monthlySales = parseFloat(stats.monthly);
    const lastMonthSales = parseFloat(stats.last_month);

    const report = await this.getSalesReport(
      storeId,
      startOfMonth,
      today.toISOString(),
    );

    return {
      dailySales: parseFloat(stats.daily),
      yesterdaySales: parseFloat(stats.yesterday),
      monthlySales,
      lastMonthSales,
      avgInvoice: monthlyCount > 0 ? monthlySales / monthlyCount : 0,
      lastMonthAvgInvoice:
        lastMonthCount > 0 ? lastMonthSales / lastMonthCount : 0,
      annualSales: parseFloat(stats.yearly),
      annualChartData,
      topProducts: report.topProducts,
      salesByMethod: report.byMethod,
    };
  }

  private toInt(value: any): number {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private toUnitsPerBulk(value: any): number {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }

  private toSplit(
    totalUnits: number,
    unitsPerBulk: number,
  ): { bulks: number; units: number } {
    return splitIntoBulkUnits(
      this.toInt(totalUnits),
      this.toUnitsPerBulk(unitsPerBulk),
    );
  }

  async getProductivityReport(
    storeId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const pool = this.db.getPool();

    const dispatchersParams: any[] = [storeId];
    let dDateClause = '';
    if (startDate) {
      dispatchersParams.push(startDate);
      dDateClause += ` AND o.created_at >= $${dispatchersParams.length}::timestamp`;
    }
    if (endDate) {
      dispatchersParams.push(endDate);
      dDateClause += ` AND o.created_at <= $${dispatchersParams.length}::timestamp`;
    }

    const dispatchersQuery = `
      SELECT 
        COALESCE(u.id::text, 'sin-id') as "dispatcherId",
        COALESCE(u.name, o.sales_manager_name, 'Despachador/a Mostrador') as "dispatcherName",
        COALESCE(u.role, 'dispatcher') as "role",
        COUNT(o.id)::int as "totalOrdersCount",
        COALESCE(SUM(o.total), 0)::float as "totalAmountCommanded"
      FROM orders o
      LEFT JOIN users u ON o.vendor_id = u.id
      WHERE o.store_id = $1 ${dDateClause}
      GROUP BY u.id, u.name, o.sales_manager_name, u.role
      ORDER BY "totalOrdersCount" DESC
    `;

    const dispatchersRes = await pool.query(dispatchersQuery, dispatchersParams);

    const cashiersParams: any[] = [storeId];
    let cDateClause = '';
    if (startDate) {
      cashiersParams.push(startDate);
      cDateClause += ` AND s.created_at >= $${cashiersParams.length}::timestamp`;
    }
    if (endDate) {
      cashiersParams.push(endDate);
      cDateClause += ` AND s.created_at <= $${cashiersParams.length}::timestamp`;
    }

    const cashiersQuery = `
      SELECT 
        COALESCE(u.id::text, 'sin-id') as "cashierId",
        COALESCE(u.name, s.cashier_name, 'Cajer@ Mostrador') as "cashierName",
        COALESCE(u.role, 'cashier') as "role",
        COUNT(s.id)::int as "totalTicketsBilled",
        COALESCE(SUM(s.total), 0)::float as "totalAmountBilled"
      FROM sales s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.store_id = $1 ${cDateClause}
      GROUP BY u.id, u.name, s.cashier_name, u.role
      ORDER BY "totalTicketsBilled" DESC
    `;

    const cashiersRes = await pool.query(cashiersQuery, cashiersParams);

    return {
      storeId,
      period: { startDate, endDate },
      dispatchers: dispatchersRes.rows,
      cashiers: cashiersRes.rows,
    };
  }
}
