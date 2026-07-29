import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";

// Modules
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { StoresModule } from "./modules/stores/stores.module";
import { ChainsModule } from "./modules/chains/chains.module";
import { ProductsModule } from "./modules/products/products.module";
import { DepartmentsModule } from "./modules/departments/departments.module";
import { SalesModule } from "./modules/sales/sales.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { CashShiftsModule } from "./modules/cash-shifts/cash-shifts.module";
import { ClientsModule } from "./modules/clients/clients.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { SuppliersModule } from "./modules/suppliers/suppliers.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { DatabaseModule } from "./database/database.module";
import { SyncModule } from "./modules/sync/sync.module";
import { AuthorizationsModule } from "./modules/authorizations/authorizations.module";
import { ZonesModule } from "./modules/zones/zones.module";
import { LicensesModule } from "./modules/licenses/licenses.module";
import { InvoicesModule } from "./modules/invoices/invoices.module";
import { AppConfigModule } from "./modules/config/config.module";
import { StoreZonesModule } from "./modules/store-zones/store-zones.module";
import { VisitLogsModule } from "./modules/visit-logs/visit-logs.module";
import { VendorInventoriesModule } from "./modules/vendor-inventories/vendor-inventories.module";
import { AccountsReceivableModule } from "./modules/accounts-receivable/accounts-receivable.module";
import { PendingDeliveriesModule } from "./modules/pending-deliveries/pending-deliveries.module";
import { RoutesModule } from "./modules/routes/routes.module";
import { PendingOrdersModule } from "./modules/pending-orders/pending-orders.module";
import { ErrorsModule } from "./modules/errors/errors.module";
import { EventsModule } from "./common/events.module";
// Nuevos módulos (requerimiento.txt §6.5, §6.6, §12.3, §14.3)
import { ReturnsModule } from "./modules/returns/returns.module";
import { CollectionsModule } from "./modules/collections/collections.module";
import { AccountsPayableModule } from "./modules/accounts-payable/accounts-payable.module";
import { SupplierCreditNotesModule } from "./modules/supplier-credit-notes/supplier-credit-notes.module";
import { DailyClosingsModule } from "./modules/daily-closings/daily-closings.module";
import { GruposEconomicosModule } from "./modules/grupos-economicos/grupos-economicos.module";
import { GruposClientesModule } from "./modules/grupos-clientes/grupos-clientes.module";
import { ArqueosModule } from "./modules/arqueos/arqueos.module";
import { CargasCamionModule } from "./modules/cargas-camion/cargas-camion.module";
import { LiquidacionesRutaModule } from "./modules/liquidaciones-ruta/liquidaciones-ruta.module";
import { ProductBarcodesModule } from "./modules/product-barcodes/product-barcodes.module";
import { HealthModule } from "./modules/health/health.module";
import { SyncEngineModule } from "./modules/sync-engine/sync-engine.module";
import { PurchaseOrdersModule } from "./modules/purchase-orders/purchase-orders.module";
import { PromotionsModule } from "./modules/promotions/promotions.module";
import { ExpensesModule } from "./modules/expenses/expenses.module";
import { VehiclesModule } from "./modules/vehicles/vehicles.module";
import { ContractsModule } from "./modules/contracts/contracts.module";

import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import * as fs from 'fs';

const possibleWebDistPaths = [
  join(process.cwd(), 'web', 'dist'),
  join(process.cwd(), '..', 'web', 'dist'),
  join(__dirname, '..', '..', 'web', 'dist'),
  join(__dirname, '..', '..', '..', 'web', 'dist'),
];
const webDistPath =
  possibleWebDistPaths.find((p) => fs.existsSync(p)) ||
  join(process.cwd(), 'web', 'dist');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.dev', '.env.production', '.env.local'],
    }),
    ServeStaticModule.forRoot({
      rootPath: webDistPath,
      exclude: ['/api/(.*)'],
    }),
    DatabaseModule,
    EventsModule,
    AuthModule,
    UsersModule,
    StoresModule,
    ChainsModule,
    ProductsModule,
    DepartmentsModule,
    SalesModule,
    InventoryModule,
    CashShiftsModule,
    ClientsModule,
    OrdersModule,
    SuppliersModule,
    NotificationsModule,
    SyncModule,
    AuthorizationsModule,
    ZonesModule,
    LicensesModule,
    InvoicesModule,
    AppConfigModule,
    StoreZonesModule,
    VisitLogsModule,
    VendorInventoriesModule,
    AccountsReceivableModule,
    PendingDeliveriesModule,
    RoutesModule,
    PendingOrdersModule,
    ErrorsModule,
    // Nuevos módulos
    ReturnsModule,
    CollectionsModule,
    AccountsPayableModule,
    SupplierCreditNotesModule,
    DailyClosingsModule,
    GruposEconomicosModule,
    GruposClientesModule,
    ArqueosModule,
    CargasCamionModule,
    LiquidacionesRutaModule,
    ProductBarcodesModule,
    HealthModule,
    SyncEngineModule,
    PurchaseOrdersModule,
    PromotionsModule,
    ExpensesModule,
    VehiclesModule,
    ContractsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
