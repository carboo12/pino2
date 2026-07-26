import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import React, { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { PosProvider } from "@/contexts/pos-context";
import { RealtimeProvider } from "@/contexts/realtime-context";
import { GlobalAlertProvider } from "@/components/global-alert-provider";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "@/components/error-boundary";
import AppLayout from "@/components/app-layout";
import { APP_BASENAME } from "@/lib/runtime-config";
import { getRedirectPath } from "@/lib/redirect-logic";
import {
  isGlobalAdminRole,
  normalizeUserRole,
  type NormalizedUserRole,
} from "@/lib/user-role";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// LAZY LOADED PAGES
const LoginPage = lazy(() => import("@/pages/login-page"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password-page"));
const PosPage = lazy(() => import("@/pages/pos-page"));
const DashboardPage = lazy(
  () => import("@/pages/store-admin/dashboard/dashboard-page"),
);
const ProductsPage = lazy(
  () => import("@/pages/store-admin/products/products-page"),
);
const AddProductPage = lazy(
  () => import("@/pages/store-admin/products/add-product-page"),
);
const EditProductPage = lazy(
  () => import("@/pages/store-admin/products/edit-product-page"),
);
const ImportProductsPage = lazy(() => import('@/pages/store-admin/products/import-products-page'));
const DepartmentsPage = lazy(
  () => import("@/pages/store-admin/products/departments-page"),
);
const SubDepartmentsPage = lazy(
  () => import("@/pages/store-admin/products/sub-departments-page"),
);
const ReportsPage = lazy(
  () => import("@/pages/store-admin/reports/reports-page"),
);
const UsersPage = lazy(() => import("@/pages/store-admin/users/users-page"));
const AddUserPage = lazy(
  () => import("@/pages/store-admin/users/add-user-page"),
);
const EditUserPage = lazy(
  () => import("@/pages/store-admin/users/edit-user-page"),
);
const InventoryMovementsPage = lazy(
  () => import("@/pages/store-admin/inventory/inventory-movements-page"),
);
const InventoryAdjustmentsPage = lazy(
  () => import("@/pages/store-admin/inventory/inventory-adjustments-page"),
);
const InventoryCountsPage = lazy(
  () => import("@/pages/store-admin/inventory/inventory-counts-page"),
);
const SuppliersPage = lazy(
  () => import("@/pages/store-admin/suppliers/suppliers-page"),
);
const AddSupplierPage = lazy(
  () => import("@/pages/store-admin/suppliers/add-supplier-page"),
);
const EditSupplierPage = lazy(
  () => import("@/pages/store-admin/suppliers/edit-supplier-page"),
);
const SupplierInvoicesPage = lazy(
  () => import("@/pages/store-admin/suppliers/supplier-invoices-page"),
);
const CashRegisterPage = lazy(
  () => import("@/pages/store-admin/cash-register/cash-register-page"),
);
const AuthorizationsPage = lazy(
  () => import("@/pages/store-admin/authorizations/authorizations-page"),
);
const PendingOrdersPage = lazy(
  () => import("@/pages/store-admin/pending-orders/pending-orders-page"),
);
const DispatcherPage = lazy(
  () => import("@/pages/store-admin/dispatcher/dispatcher-page"),
);
const WarehouseDashboardPage = lazy(
  () => import("@/pages/store-admin/warehouse/warehouse-dashboard-page"),
);
const ControlTowerPage = lazy(
  () => import("@/pages/store-admin/control-tower/control-tower-page"),
);
const DeliveryRoutePage = lazy(
  () => import("@/pages/store-admin/delivery-route/delivery-route-page"),
);
const ReceivablesPage = lazy(
  () => import("@/pages/store-admin/finance/receivables-page"),
);
const PayablesPage = lazy(
  () => import("@/pages/store-admin/finance/payables-page"),
);
const VendorsPage = lazy(
  () => import("@/pages/store-admin/vendors/vendors-page"),
);
const VendorDashboardPage = lazy(
  () => import("@/pages/store-admin/vendors/vendor-dashboard-page"),
);
const VendorZonesPage = lazy(
  () => import("@/pages/store-admin/vendors/vendor-zones-page"),
);
const VendorClientsPage = lazy(
  () => import("@/pages/store-admin/vendors/vendor-clients-page"),
);
const VendorCollectionsPage = lazy(
  () => import("@/pages/store-admin/vendors/vendor-collections-page"),
);
const VendorInventoryPage = lazy(
  () => import("@/pages/store-admin/vendors/vendor-inventory-page"),
);
const AddVendorPage = lazy(
  () => import("@/pages/store-admin/vendors/add-vendor-page"),
);
const VendorQuickSalePage = lazy(
  () => import("@/pages/store-admin/vendors/vendor-quick-sale-page"),
);
const VendorSalesPage = lazy(
  () => import("@/pages/store-admin/vendors/vendor-sales-page"),
);
const AssignRoutePage = lazy(
  () => import("@/pages/store-admin/vendors/assign-route-page"),
);
const VendorRoutesPage = lazy(
  () => import("@/pages/store-admin/vendors/vendor-routes-page"),
);
const VendorReturnsPage = lazy(
  () => import("@/pages/store-admin/vendors/vendor-returns-page"),
);
const RuteroDailyClosingPage = lazy(
  () => import("@/pages/store-admin/delivery-route/rutero-daily-closing-page"),
);
const MasterDashboardPage = lazy(
  () => import("@/pages/master-admin/master-dashboard-page"),
);
const MasterStoresPage = lazy(
  () => import("@/pages/master-admin/master-stores-page"),
);
const MasterUsersPage = lazy(
  () => import("@/pages/master-admin/master-users-page"),
);
// const MasterLicensesPage = lazy(() => import('@/pages/master-admin/master-licenses-page'));
const MasterMonitorPage = lazy(
  () => import("@/pages/master-admin/master-monitor-page"),
);
const AddStorePage = lazy(() => import("@/pages/master-admin/add-store-page"));
const EditStorePage = lazy(
  () => import("@/pages/master-admin/edit-store-page"),
);
const MasterConfigPage = lazy(
  () => import("@/pages/master-admin/master-config-page"),
);
const MasterZonesPage = lazy(
  () => import("@/pages/master-admin/master-zones-page"),
);
const MasterSubZonesPage = lazy(
  () => import("@/pages/master-admin/master-sub-zones-page"),
);
const MasterSyncMonitorPage = lazy(
  () => import("@/pages/master-admin/master-sync-monitor-page"),
);
const MasterHelpPage = lazy(
  () => import("@/pages/master-admin/master-help-page"),
);
const NotFoundPage = lazy(() => import("@/pages/not-found-page"));
const AdminDailyClosingsPage = lazy(
  () => import("@/pages/store-admin/reports/admin-daily-closings-page"),
);
const OrdersPipelinePage = lazy(
  () => import("@/pages/store-admin/pending-orders/orders-pipeline-page"),
);
const AgingReportPage = lazy(
  () => import("@/pages/store-admin/finance/aging-report-page"),
);
const MultiStoreComparisonPage = lazy(
  () => import("@/pages/master-admin/multi-store-comparison-page"),
);
const InventoryEntryPage = lazy(
  () => import("@/pages/store-admin/inventory/inventory-entry-page"),
);

// WORKSPACE PAGES
const WorkHomePage = lazy(() => import("@/pages/work/work-home-page"));
const CashWorkspacePage = lazy(
  () => import("@/pages/work/cash-workspace-page"),
);
const WarehouseWorkspacePage = lazy(
  () => import("@/pages/work/warehouse-workspace-page"),
);
const SalesWorkspacePage = lazy(
  () => import("@/pages/work/sales-workspace-page"),
);
const FinanceWorkspacePage = lazy(
  () => import("@/pages/work/finance-workspace-page"),
);
const CatalogWorkspacePage = lazy(
  () => import("@/pages/work/catalog-workspace-page"),
);
const AdminControlCenterPage = lazy(
  () => import("@/pages/work/admin-control-center-page"),
);

const DispatchPage = lazy(
  () => import("@/pages/store-admin/dispatch/dispatch-page"),
);
const DispatchCargasPage = lazy(
  () => import("@/pages/store-admin/dispatch/dispatch-cargas-page"),
);
const PriceAuthPage = lazy(
  () => import("@/pages/store-admin/authorizations/price-auth-page"),
);
const ClientGroupsPage = lazy(
  () => import("@/pages/store-admin/clients/client-groups-page"),
);
const EconomicGroupsPage = lazy(
  () => import("@/pages/store-admin/clients/economic-groups-page"),
);
const ClientReassignPage = lazy(
  () => import("@/pages/store-admin/clients/client-reassign-page"),
);
const ArqueosPage = lazy(
  () => import("@/pages/store-admin/finance/arqueos-page"),
);
const LiquidationRoutePage = lazy(
  () => import("@/pages/store-admin/finance/liquidation-route-page"),
);
const InventoryValuationPage = lazy(
  () => import("@/pages/store-admin/reports/inventory-valuation-page"),
);
const PurchaseOrdersPage = lazy(
  () => import("@/pages/store-admin/purchase-orders/purchase-orders-page"),
);
const RoutesListPage = lazy(() => import('@/pages/store-admin/routes/routes-list-page'));
const RouteFormPage = lazy(() => import('@/pages/store-admin/routes/route-form-page'));
const RouteDetailPage = lazy(() => import('@/pages/store-admin/routes/route-detail-page'));
const CargasPage = lazy(() => import('@/pages/store-admin/routes/cargas-page'));
const SettlementPage = lazy(() => import('@/pages/store-admin/routes/settlement-page'));
const PromotionsPage = lazy(
  () => import("@/pages/store-admin/promotions/promotions-page"),
);
const ExpensesPage = lazy(
  () => import("@/pages/store-admin/finance/expenses-page"),
);
const VehiclesPage = lazy(
  () => import("@/pages/store-admin/vehicles/vehicles-page"),
);
const ContractsPage = lazy(
  () => import("@/pages/store-admin/clients/contracts-page"),
);

const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="text-center">
      <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="font-medium text-muted-foreground text-xs">Cargando...</p>
    </div>
  </div>
);

const MASTER_ROLES: NormalizedUserRole[] = ["admin", "super-admin"];
const STORE_ADMIN_ROLES: NormalizedUserRole[] = ["admin"];
const CASHIER_ROLES: NormalizedUserRole[] = ["admin"];
const INVENTORY_ROLES: NormalizedUserRole[] = ["inventory", "admin"];
const AUXILIAR_ROLES: NormalizedUserRole[] = ["auxiliar", "admin"];
const WAREHOUSE_ROLES: NormalizedUserRole[] = [
  "inventory",
  "auxiliar",
  "admin",
];
const DISPATCH_ROLES: NormalizedUserRole[] = [
  "auxiliar",
  "admin",
];
const DELIVERY_ROLES: NormalizedUserRole[] = [
  "rutero",
  "admin",
  "gestor",
];
const SALES_TEAM_ROLES: NormalizedUserRole[] = [
  "gestor",
  "admin",
];
const SALES_ADMIN_ROLES: NormalizedUserRole[] = [
  "gestor",
  "admin",
];

const ProtectedRoute = ({
  children,
  allowedRoles,
  requireStoreAccess = false,
}: {
  children: React.ReactNode;
  allowedRoles?: NormalizedUserRole[];
  requireStoreAccess?: boolean;
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const params = useParams();

  if (loading) return <LoadingFallback />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const redirectPath = getRedirectPath(user) || "/login";
  const normalizedRole = normalizeUserRole(user?.role);
  const canBypassRoleChecks = isGlobalAdminRole(user?.role);

  if (requireStoreAccess && params.storeId && !canBypassRoleChecks) {
    const assignedStores = user?.storeIds || [];
    if (!assignedStores.includes(params.storeId)) {
      return <Navigate to={redirectPath} replace />;
    }
  }

  if (
    allowedRoles &&
    !canBypassRoleChecks &&
    !allowedRoles.includes(normalizedRole)
  ) {
    return <Navigate to={redirectPath} replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
      >
        <BrowserRouter basename={APP_BASENAME}>
          <AuthProvider>
            <PosProvider>
              <RealtimeProvider>
                <GlobalAlertProvider />
                <Toaster />
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      <Route path="/login" element={<LoginPage />} />
                      <Route
                        path="/forgot-password"
                        element={<ForgotPasswordPage />}
                      />

                      {/* MVP-ROOT */}
                      <Route
                        path="/"
                        element={
                          <ProtectedRoute>
                            <WorkHomePage />
                          </ProtectedRoute>
                        }
                      />

                      {/* RUTAS DE TIENDA */}
                      <Route
                        path="/store/:storeId/dashboard"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <DashboardPage />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/store/:storeId/products"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <ProductsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/products/add"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <AddProductPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/products/import"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <ImportProductsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/products/edit/:productId"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <EditProductPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/products/departments"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <DepartmentsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/products/sub-departments"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <SubDepartmentsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/users"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <UsersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/users/add"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <AddUserPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/users/edit/:userId"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <EditUserPage />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/store/:storeId/inventory/movements"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={INVENTORY_ROLES}
                          >
                            <InventoryMovementsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/inventory/adjustments"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <InventoryAdjustmentsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/inventory/counts"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={INVENTORY_ROLES}
                          >
                            <InventoryCountsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/inventory/entry"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={AUXILIAR_ROLES}
                          >
                            <InventoryEntryPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/reports"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <ReportsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/suppliers"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={INVENTORY_ROLES}
                          >
                            <SuppliersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/suppliers/add"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={INVENTORY_ROLES}
                          >
                            <AddSupplierPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/suppliers/edit/:supplierId"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={INVENTORY_ROLES}
                          >
                            <EditSupplierPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/suppliers/invoice"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={INVENTORY_ROLES}
                          >
                            <SupplierInvoicesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/routes"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={WAREHOUSE_ROLES}
                          >
                            <RoutesListPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/routes/create"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={WAREHOUSE_ROLES}
                          >
                            <RouteFormPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/routes/:routeId"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={WAREHOUSE_ROLES}
                          >
                            <RouteDetailPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/cargas"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={AUXILIAR_ROLES}
                          >
                            <CargasPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/liquidaciones"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={AUXILIAR_ROLES}
                          >
                            <SettlementPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/cash-register"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={CASHIER_ROLES}
                          >
                            <CashRegisterPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/authorizations"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <AuthorizationsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/pending-orders"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={DISPATCH_ROLES}
                          >
                            <PendingOrdersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/dispatcher"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={DISPATCH_ROLES}
                          >
                            <DispatcherPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/warehouse"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={WAREHOUSE_ROLES}
                          >
                            <WarehouseDashboardPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/control-tower"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={DISPATCH_ROLES}
                          >
                            <ControlTowerPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/delivery-route"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={DELIVERY_ROLES}
                          >
                            <DeliveryRoutePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/finance/receivables"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={[...STORE_ADMIN_ROLES, "cajero", "auxiliar", "gestor", "inventory", "rutero"]}
                          >
                            <ReceivablesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/cxc"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={[...STORE_ADMIN_ROLES, "cajero", "auxiliar", "gestor", "inventory", "rutero"]}
                          >
                            <ReceivablesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/finance/aging"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <AgingReportPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/finance/payables"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <PayablesPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* VENDORS MODULE */}
                      <Route
                        path="/store/:storeId/vendors"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={SALES_ADMIN_ROLES}
                          >
                            <VendorsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/vendors/add"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={SALES_ADMIN_ROLES}
                          >
                            <AddVendorPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/vendors/dashboard"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={SALES_ADMIN_ROLES}
                          >
                            <VendorDashboardPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/vendors/zones"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={SALES_TEAM_ROLES}
                          >
                            <VendorZonesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/vendors/clients"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={SALES_TEAM_ROLES}
                          >
                            <VendorClientsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/vendors/collections"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={[...SALES_TEAM_ROLES, "rutero"]}
                          >
                            <VendorCollectionsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/vendors/inventory"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={SALES_ADMIN_ROLES}
                          >
                            <VendorInventoryPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/pos"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={SALES_TEAM_ROLES}
                          >
                            <VendorQuickSalePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/vendors/quick-sale"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={SALES_TEAM_ROLES}
                          >
                            <VendorQuickSalePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/vendors/sales"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={SALES_TEAM_ROLES}
                          >
                            <VendorSalesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/vendors/assign-route"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={SALES_ADMIN_ROLES}
                          >
                            <AssignRoutePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/vendors/routes"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={SALES_ADMIN_ROLES}
                          >
                            <VendorRoutesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/vendors/returns"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={[...SALES_TEAM_ROLES, "rutero", "auxiliar", "inventory"]}
                          >
                            <VendorReturnsPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* PROVEEDORES, RECEPCIÓN DE COMPRAS Y CUENTAS POR PAGAR (CxP) */}
                      <Route
                        path="/store/:storeId/suppliers"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <SuppliersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/suppliers/create"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <AddSupplierPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/suppliers/:supplierId/edit"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <EditSupplierPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/supplier-invoices"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={WAREHOUSE_ROLES}
                          >
                            <SupplierInvoicesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/cxp"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={WAREHOUSE_ROLES}
                          >
                            <SupplierInvoicesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/daily-closing"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={DELIVERY_ROLES}
                          >
                            <RuteroDailyClosingPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/daily-closings"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <AdminDailyClosingsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/orders-pipeline"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <OrdersPipelinePage />
                          </ProtectedRoute>
                        }
                      />

                      {/* WORKSPACE ROUTES */}
                      <Route
                        path="/store/:storeId/work"
                        element={
                          <ProtectedRoute requireStoreAccess>
                            <WorkHomePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/work/cash"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={CASHIER_ROLES}
                          >
                            <CashWorkspacePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/work/warehouse"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={WAREHOUSE_ROLES}
                          >
                            <WarehouseWorkspacePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/work/sales"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={SALES_TEAM_ROLES}
                          >
                            <SalesWorkspacePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/work/finance"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <FinanceWorkspacePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/work/catalog"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={INVENTORY_ROLES}
                          >
                            <CatalogWorkspacePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/work/admin"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <AdminControlCenterPage />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/store/:storeId/dispatch"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <DispatchPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/dispatch/cargas"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <DispatchCargasPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/authorizations/prices"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <PriceAuthPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/clients/groups"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <ClientGroupsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/clients/economic-groups"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <EconomicGroupsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/clients/reassign"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <ClientReassignPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/finance/arqueo"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <ArqueosPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/finance/liquidation-route"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <LiquidationRoutePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/reports/valuation"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <InventoryValuationPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/purchase-orders"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={WAREHOUSE_ROLES}
                          >
                            <PurchaseOrdersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/promotions"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <PromotionsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/finance/expenses"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <ExpensesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/vehicles"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <VehiclesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/clients/contracts"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <ContractsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/store/:storeId/reports/inventory-valuation"
                        element={
                          <ProtectedRoute
                            requireStoreAccess
                            allowedRoles={STORE_ADMIN_ROLES}
                          >
                            <InventoryValuationPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* MASTER ADMIN - MVP */}
                      <Route
                        path="/master-admin/dashboard"
                        element={
                          <ProtectedRoute allowedRoles={MASTER_ROLES}>
                            <MasterDashboardPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/master-admin/stores"
                        element={
                          <ProtectedRoute
                            allowedRoles={MASTER_ROLES}
                          >
                            <MasterStoresPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/master-admin/users"
                        element={
                          <ProtectedRoute allowedRoles={MASTER_ROLES}>
                            <MasterUsersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/master-admin/stores/add"
                        element={
                          <ProtectedRoute
                            allowedRoles={MASTER_ROLES}
                          >
                            <AddStorePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/master-admin/stores/edit/:storeId"
                        element={
                          <ProtectedRoute
                            allowedRoles={MASTER_ROLES}
                          >
                            <EditStorePage />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/master-admin/users/add"
                        element={
                          <ProtectedRoute allowedRoles={MASTER_ROLES}>
                            <AddUserPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/master-admin/users/edit/:userId"
                        element={
                          <ProtectedRoute allowedRoles={MASTER_ROLES}>
                            <EditUserPage />
                          </ProtectedRoute>
                        }
                      />
                      {/* <Route path="/master-admin/licenses" element={<ProtectedRoute allowedRoles={MASTER_ROLES}><MasterLicensesPage /></ProtectedRoute>} /> */}
                      <Route
                        path="/master-admin/monitor"
                        element={
                          <ProtectedRoute allowedRoles={MASTER_ROLES}>
                            <MasterMonitorPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/master-admin/config"
                        element={
                          <ProtectedRoute allowedRoles={MASTER_ROLES}>
                            <MasterConfigPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/master-admin/sync-monitor"
                        element={
                          <ProtectedRoute allowedRoles={MASTER_ROLES}>
                            <MasterSyncMonitorPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/master-admin/comparison"
                        element={
                          <ProtectedRoute allowedRoles={MASTER_ROLES}>
                            <MultiStoreComparisonPage />
                          </ProtectedRoute>
                        }
                      />

                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
              </RealtimeProvider>
            </PosProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
