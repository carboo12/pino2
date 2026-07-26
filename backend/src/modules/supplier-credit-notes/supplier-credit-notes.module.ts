import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { SupplierCreditNotesController } from "./supplier-credit-notes.controller";
import { SupplierCreditNotesService } from "./supplier-credit-notes.service";

@Module({
  imports: [DatabaseModule],
  controllers: [SupplierCreditNotesController],
  providers: [SupplierCreditNotesService],
  exports: [SupplierCreditNotesService],
})
export class SupplierCreditNotesModule {}
