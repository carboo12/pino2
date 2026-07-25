import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './repositories/orders.repository';
import { OrderRowMapper } from './mappers/order-row.mapper';
import { CreateOrderUseCase } from './use-cases/create-order.use-case';
import { TransitionOrderUseCase } from './use-cases/transition-order.use-case';
import { NotificationsModule } from '../notifications/notifications.module';
import { GruposEconomicosModule } from '../grupos-economicos/grupos-economicos.module';

@Module({
  imports: [NotificationsModule, GruposEconomicosModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrdersRepository,
    OrderRowMapper,
    CreateOrderUseCase,
    TransitionOrderUseCase,
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
