import { Module } from '@nestjs/common';
import { ProductBarcodesController, ProductBarcodesListController } from './product-barcodes.controller';
import { ProductBarcodesService } from './product-barcodes.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ProductBarcodesController, ProductBarcodesListController],
  providers: [ProductBarcodesService],
  exports: [ProductBarcodesService],
})
export class ProductBarcodesModule {}
