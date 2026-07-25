import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { SalesRepository } from './repositories/sales.repository';
import { SaleRowMapper } from './mappers/sale-row.mapper';
import { ProcessSaleUseCase } from './use-cases/process-sale.use-case';
import { PromotionsModule } from '../promotions/promotions.module';

@Module({
  imports: [PromotionsModule],
  controllers: [SalesController],
  providers: [SalesService, SalesRepository, SaleRowMapper, ProcessSaleUseCase],
  exports: [SalesService],
})
export class SalesModule {}
