import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryRepository } from './repositories/inventory.repository';
import { InventoryRowMapper } from './mappers/inventory-row.mapper';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, InventoryRepository, InventoryRowMapper],
  exports: [InventoryService],
})
export class InventoryModule {}
