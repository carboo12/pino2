import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreatePromotionDto, UpdatePromotionDto } from './promotions.dto';

@Injectable()
export class PromotionsService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreatePromotionDto, userId?: string) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    const now = new Date();
    const status = startDate <= now && endDate >= now ? 'ACTIVE' : 'SCHEDULED';

    return this.db.withTransaction(async (client) => {
      const res = await client.query(
        `INSERT INTO promotions (store_id, name, description, discount_type, discount_value, start_date, end_date, status, max_uses, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          dto.storeId,
          dto.name,
          dto.description || null,
          dto.discountType,
          dto.discountValue,
          startDate,
          endDate,
          status,
          dto.maxUses || null,
          userId || null,
        ],
      );

      const promo = res.rows[0];

      if (dto.productIds && dto.productIds.length > 0) {
        for (const productId of dto.productIds) {
          await client.query(
            `INSERT INTO promotion_products (promotion_id, product_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [promo.id, productId],
          );
        }
      }

      return this.findOne(promo.id, client);
    });
  }

  async findAll(storeId: string, status?: string) {
    let sql = `SELECT p.*,
                (SELECT COUNT(*)::int FROM promotion_products pp WHERE pp.promotion_id = p.id) as product_count
               FROM promotions p
               WHERE p.store_id = $1`;
    const params: any[] = [storeId];

    if (status) {
      sql += ' AND p.status = $2';
      params.push(status);
    }

    sql += ' ORDER BY p.start_date DESC';
    const res = await this.db.query(sql, params);
    return res.rows;
  }

  async findActivePromotions(storeId: string) {
    const res = await this.db.query(
      `SELECT p.*, ARRAY_AGG(pp.product_id) FILTER (WHERE pp.product_id IS NOT NULL) as product_ids
       FROM promotions p
       LEFT JOIN promotion_products pp ON pp.promotion_id = p.id
       WHERE p.store_id = $1
         AND p.status = 'ACTIVE'
         AND NOW() BETWEEN p.start_date AND p.end_date
       GROUP BY p.id`,
      [storeId],
    );
    return res.rows;
  }

  async findOne(id: string, client?: any) {
    const queryClient = client || this.db;
    const res = await queryClient.query(
      `SELECT * FROM promotions WHERE id = $1`,
      [id],
    );

    if (res.rowCount === 0) {
      throw new NotFoundException('Promoción no encontrada');
    }

    const promo = res.rows[0];
    const productsRes = await queryClient.query(
      `SELECT p.id, p.description, p.barcode, p.sale_price
       FROM promotion_products pp
       JOIN products p ON p.id = pp.product_id
       WHERE pp.promotion_id = $1`,
      [id],
    );

    promo.products = productsRes.rows;
    return promo;
  }

  async update(id: string, dto: UpdatePromotionDto) {
    const existing = await this.findOne(id);
    const res = await this.db.query(
      `UPDATE promotions
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           discount_value = COALESCE($4, discount_value),
           end_date = COALESCE($5, end_date),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        dto.name || null,
        dto.description || null,
        dto.status || null,
        dto.discountValue || null,
        dto.endDate ? new Date(dto.endDate) : null,
        id,
      ],
    );

    return this.findOne(res.rows[0].id);
  }
}
