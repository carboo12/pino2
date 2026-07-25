import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateCommissionRateDto, UpdateCommissionStatusDto } from './commissions.dto';

@Injectable()
export class CommissionsService {
  constructor(private readonly db: DatabaseService) {}

  async createRate(dto: CreateCommissionRateDto) {
    const res = await this.db.query(
      `INSERT INTO commission_rates (store_id, role, product_category, commission_percent, min_sale_amount)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        dto.storeId,
        dto.role,
        dto.productCategory || null,
        dto.commissionPercent,
        dto.minSaleAmount || 0,
      ],
    );
    return res.rows[0];
  }

  async findRates(storeId: string) {
    const res = await this.db.query(
      `SELECT * FROM commission_rates WHERE store_id = $1 AND active = true ORDER BY role, product_category`,
      [storeId],
    );
    return res.rows;
  }

  async findUserCommissions(storeId: string, userId?: string, status?: string) {
    let sql = `SELECT sc.*, u.full_name as user_name, s.ticket_number
               FROM sales_commissions sc
               JOIN users u ON u.id = sc.user_id
               LEFT JOIN sales s ON s.id = sc.sale_id
               WHERE sc.store_id = $1`;
    const params: any[] = [storeId];

    if (userId) {
      sql += ` AND sc.user_id = $${params.length + 1}`;
      params.push(userId);
    }

    if (status) {
      sql += ` AND sc.status = $${params.length + 1}`;
      params.push(status);
    }

    sql += ' ORDER BY sc.created_at DESC';
    const res = await this.db.query(sql, params);
    return res.rows;
  }

  async calculateAndSaveForSale(client: any, saleId: string, storeId: string, userId: string, totalAmount: number, userRole: string = 'vendedor') {
    // Buscar tasa aplicable
    const ratesRes = await client.query(
      `SELECT * FROM commission_rates
       WHERE store_id = $1 AND role = $2 AND active = true AND $3 >= min_sale_amount
       ORDER BY commission_percent DESC LIMIT 1`,
      [storeId, userRole, totalAmount],
    );

    if (ratesRes.rowCount === 0) return null;

    const rate = ratesRes.rows[0];
    const commissionAmount = totalAmount * (Number(rate.commission_percent) / 100);

    const res = await client.query(
      `INSERT INTO sales_commissions (store_id, user_id, sale_id, commission_rate_id, sale_amount, commission_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
       RETURNING *`,
      [storeId, userId, saleId, rate.id, totalAmount, commissionAmount],
    );
    return res.rows[0];
  }

  async updateStatus(id: string, dto: UpdateCommissionStatusDto) {
    const res = await this.db.query(
      `UPDATE sales_commissions
       SET status = $1, paid_at = CASE WHEN $1 = 'PAID' THEN NOW() ELSE paid_at END
       WHERE id = $2
       RETURNING *`,
      [dto.status, id],
    );
    if (res.rowCount === 0) {
      throw new NotFoundException('Registro de comisión no encontrado');
    }
    return res.rows[0];
  }
}
