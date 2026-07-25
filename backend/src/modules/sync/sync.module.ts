import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { SalesModule } from '../sales/sales.module';
import { OrdersModule } from '../orders/orders.module';
import { CollectionsModule } from '../collections/collections.module';
import { ReturnsModule } from '../returns/returns.module';
import { SyncEngineModule } from '../sync-engine/sync-engine.module';

@Module({
  imports: [SalesModule, OrdersModule, CollectionsModule, ReturnsModule, SyncEngineModule],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
