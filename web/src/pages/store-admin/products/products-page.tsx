import { FloatingActionButton } from "@/components/floating-action-button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Package,
  Shapes,
  Library,
  ChevronRight,
  Wrench,
  Download,
  FileText,
  Search,
  Grid,
  List,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api-client";
import { toast } from "@/lib/swalert";
import { logError } from "@/lib/error-logger";
import { calculateStockDisplay } from "@/utils/stock-display";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { DataPagination } from "@/components/ui/data-pagination";
import { extractData, extractTotal } from "@/lib/paginated-fetch";
import { ImportProductsDialog } from "@/components/products/import-products-dialog";
import { useAuth } from "@/contexts/auth-context";
import { normalizeUserRole } from "@/lib/user-role";

interface Department {
  id: string;
  name: string;
}

interface SubDepartment {
  id: string;
  name: string;
  departmentId: string;
}

interface Product {
  id: string;
  barcode?: string;
  description: string;
  salePrice: number;
  currentStock: number;
  stockTotalUnits: number;
  handlesBulk: boolean;
  unitsPerBulk: number;
  stockDisplay: {
    bulkCount: number;
    looseUnitCount: number;
    formatted: string;
  };
  minStock: number;
  usesInventory: boolean;
  department?: string;
  subDepartment?: string;
}

function getStockBadgeVariant(currentStock: number, minStock: number) {
  if (currentStock === 0)
    return "text-white bg-destructive hover:bg-destructive";
  if (currentStock <= minStock)
    return "text-white bg-orange-500 hover:bg-orange-500";
  return "text-white bg-green-600 hover:bg-green-600";
}

export default function ProductsPage() {
  const params = useParams();
  const { user } = useAuth();
  const storeId = (params.storeId as string) || user?.storeIds?.[0] || '9321856d-19ba-42b8-ba47-cf35c0d133dd';
  const navigate = useNavigate();
  const role = normalizeUserRole(user?.role);
  const canManageCatalog = ["admin", "super-admin", "inventory"].includes(
    role,
  );

  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [selectedSubDepartment, setSelectedSubDepartment] =
    useState<SubDepartment | null>(null);
  const [reorganizationMode, setReorganizationMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewAll, setViewAll] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [selectedDepartment, selectedSubDepartment, reorganizationMode, searchTerm, viewAll]);

  const {
    data: pageData,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: [
      "products-page",
      storeId,
      page,
      pageSize,
      searchTerm,
      selectedDepartment?.id,
      selectedSubDepartment?.id,
    ],
    queryFn: async () => {
      const prodParams: Record<string, any> = { storeId, page, pageSize };
      if (searchTerm.trim()) {
        prodParams.search = searchTerm.trim();
      }
      if (selectedDepartment?.id) {
        prodParams.departmentId = selectedDepartment.id;
      }
      if (
        selectedSubDepartment?.id &&
        selectedSubDepartment.id !== "none"
      ) {
        prodParams.subDepartmentId = selectedSubDepartment.id;
      }

      const [prodsRes, deptsRes, subDeptsRes] = await Promise.all([
        apiClient.get("/products", { params: prodParams }),
        apiClient.get("/departments", { params: { storeId, type: "main" } }).catch(() => ({ data: [] })),
        apiClient
          .get("/departments/sub-departments", { params: { storeId } })
          .catch(() => ({ data: [] })),
      ]);
      return {
        products: extractData<Product>(prodsRes.data),
        total: extractTotal(prodsRes.data),
        departments: (deptsRes.data || []).map((d: any) => ({
          ...d,
          name: d.name || d.nombre,
        })) as Department[],
        subDepartments: (subDeptsRes.data || []).map((subDept: any) => ({
          id: subDept.id,
          name: subDept.name || subDept.nombre,
          departmentId:
            subDept.departmentId || subDept.parentId || subDept.parent_id || "",
        })) as SubDepartment[],
      };
    },
    enabled: !!storeId,
  });

  const products = pageData?.products || [];
  const total = pageData?.total || 0;
  const departments = pageData?.departments || [];
  const subDepartments = pageData?.subDepartments || [];

  const unorganizedProducts = useMemo(() => {
    return products.filter((p) => !p.department || p.department === "");
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products;
  }, [products]);

  const filteredSubDepartments = useMemo(() => {
    if (!selectedDepartment) return [];
    return subDepartments.filter(
      (sd) => sd.departmentId === selectedDepartment.id,
    );
  }, [subDepartments, selectedDepartment]);

  const handleEdit = () => {
    if (selectedProduct) {
      navigate(`/store/${storeId}/products/edit/${selectedProduct.id}`);
    }
  };

  const resetSelection = () => {
    setSelectedDepartment(null);
    setSelectedSubDepartment(null);
    setReorganizationMode(false);
  };

  const productCountsBySubDept = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((product) => {
      if (product.department && product.subDepartment) {
        const key = `${product.department}-${product.subDepartment}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    });
    return counts;
  }, [products]);

  const productCountsByDept = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((product) => {
      if (product.department && !product.subDepartment) {
        counts.set(
          product.department,
          (counts.get(product.department) || 0) + 1,
        );
      }
    });
    return counts;
  }, [products]);

  const activeProducts = useMemo(
    () => reorganizationMode ? unorganizedProducts : filteredProducts,
    [reorganizationMode, unorganizedProducts, filteredProducts],
  );

  const handleExport = () => {
    const dataToExport = products.map((p: any) => ({
      "Código de Barras": p.barcode || "",
      Descripción: p.description,
      "Precio de Costo": p.costPrice || 0,
      "Precio de Venta": p.salePrice || 0,
      "Precio Mayorista": p.wholesalePrice || 0,
      "Precio 1": p.price1 || 0,
      "Precio 2": p.price2 || 0,
      "Precio 3": p.price3 || 0,
      "Precio 4": p.price4 || 0,
      "Precio 5": p.price5 || 0,
      Departamento: p.department || "",
      Subdepartamento: p.subDepartment || "",
      Proveedor: p.supplierName || "",
      "Usa Inventario": p.usesInventory ? "SI" : "NO",
      "Stock Actual": p.currentStock || 0,
      "Stock Mínimo": p.minStock || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");
    XLSX.writeFile(workbook, "productos.xlsx");
  };

  const renderBreadcrumb = () => (
    <div className="flex items-center text-sm text-muted-foreground mb-4">
      <button onClick={resetSelection} className="hover:underline">
        Inicio
      </button>
      {reorganizationMode && (
        <>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span className="font-semibold text-foreground">Reorganizar</span>
        </>
      )}
      {selectedDepartment && !reorganizationMode && (
        <>
          <ChevronRight className="h-4 w-4 mx-1" />
          <button
            onClick={() => setSelectedSubDepartment(null)}
            className="hover:underline"
          >
            {selectedDepartment.name}
          </button>
        </>
      )}
      {selectedSubDepartment && !reorganizationMode && (
        <>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span className="font-semibold text-foreground">
            {selectedSubDepartment.name}
          </span>
        </>
      )}
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <Package className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{String(error)}</AlertDescription>
        </Alert>
      );
    }

    const productListContent = (productsToList: Product[], paginatedList: Product[]) => {
      if (productsToList.length === 0) {
        return (
          <Alert>
            <Package className="h-4 w-4" />
            <AlertTitle>No hay productos</AlertTitle>
            <AlertDescription>
              No se encontraron productos en esta categoría.
            </AlertDescription>
          </Alert>
        );
      }
      return (
        <div className="space-y-3">
          <AlertDialog>
            {paginatedList.map((product) => (
              <AlertDialogTrigger
                asChild
                key={product.id}
                onClick={() => setSelectedProduct(product)}
              >
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 items-center gap-4">
                    <div className="col-span-2">
                      <p className="font-semibold">{product.description}</p>
                      {reorganizationMode && (
                        <p className="text-xs text-destructive">
                          Departamento: {product.department || "Ninguno"}
                        </p>
                      )}
                    </div>
                    <div className="text-right sm:text-left">
                      <p className="text-xs text-muted-foreground">Precio</p>
                      <p className="font-medium">
                        C$ {product.salePrice.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right sm:text-left">
                      <p className="text-xs text-muted-foreground">
                        Existencia
                      </p>
                      {product.usesInventory ? (
                        <div className="flex flex-col items-end sm:items-start">
                          <Badge
                            variant="default"
                            className={cn(
                              "text-base",
                              getStockBadgeVariant(
                                product.currentStock,
                                product.minStock,
                              ),
                            )}
                          >
                            {product.currentStock}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1 font-medium">
                            {(product.stockDisplay?.formatted || calculateStockDisplay(product.currentStock, product.handlesBulk, product.unitsPerBulk || 1).formatted)}
                          </p>
                        </div>
                      ) : (
                        <Badge variant="secondary">N/A</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </AlertDialogTrigger>
            ))}
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-lg font-bold">
                  {selectedProduct?.description}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  Precio de Venta: <strong className="text-foreground">C$ {Number(selectedProduct?.salePrice || 0).toFixed(2)}</strong> | 
                  Existencia: <strong className="text-foreground">{selectedProduct?.currentStock || 0} unidades</strong>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex flex-col gap-2 my-2">
                {canManageCatalog && (
                  <Button
                    onClick={handleEdit}
                    className="w-full justify-start font-semibold"
                  >
                    <Wrench className="mr-2 h-4 w-4" />
                    Editar Producto & Factor X
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedProduct) {
                      navigate(`/store/${storeId}/inventory/movements?productId=${selectedProduct.id}`);
                    }
                  }}
                  className="w-full justify-start font-medium"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Ver Kárdex & Movimientos
                </Button>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel className="w-full sm:w-auto">Cerrar</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    };

    // View List directly if searching, viewAll enabled, or no departments
    if (viewAll || searchTerm.trim() || departments.length === 0) {
      return (
        <>
          {productListContent(products, products)}
          <DataPagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
          />
        </>
      );
    }

    // View Reorganization
    if (reorganizationMode) {
      return <>{productListContent(activeProducts, activeProducts)}<DataPagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} /></>;
    }

    // View Products for a department (no sub-department) or a sub-department
    if (
      selectedSubDepartment ||
      (selectedDepartment && filteredSubDepartments.length === 0)
    ) {
      return <>{productListContent(activeProducts, activeProducts)}<DataPagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} /></>;
    }

    // View Sub-Departments for a department
    if (selectedDepartment) {
      const productsInDeptOnly =
        productCountsByDept.get(selectedDepartment.name) || 0;
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredSubDepartments.map((subDept) => {
            const count =
              productCountsBySubDept.get(
                `${selectedDepartment.name}-${subDept.name}`,
              ) || 0;
            return (
              <Card
                key={subDept.id}
                className="hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setSelectedSubDepartment(subDept)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Library className="h-5 w-5 text-muted-foreground" />
                    <p className="font-semibold">{subDept.name}</p>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            );
          })}
          {productsInDeptOnly > 0 && (
            <Card
              className="hover:bg-muted/50 transition-colors cursor-pointer border-dashed"
              onClick={() =>
                setSelectedSubDepartment({
                  id: "none",
                  name: "Sin Sub-departamento",
                  departmentId: selectedDepartment.id,
                })
              }
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <p className="font-semibold">Sin Sub-departamento</p>
                  <Badge variant="secondary">{productsInDeptOnly}</Badge>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <Card
            key={dept.id}
            className="hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => setSelectedDepartment(dept)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shapes className="h-5 w-5 text-muted-foreground" />
                <p className="font-semibold">{dept.name}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catálogo de Productos ({total})</h1>
          <p className="text-sm text-muted-foreground">Consulta de precios, existencias y Factor X en inventario.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManageCatalog && (
            <>
              <Button variant="outline" asChild>
                <Link to={`/store/${storeId}/products/departments`}>
                  <Shapes className="mr-2 h-4 w-4" />
                  Depart.
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/store/${storeId}/products/sub-departments`}>
                  <Library className="mr-2 h-4 w-4" />
                  Sub-Depart.
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setReorganizationMode(true);
                  setSelectedDepartment(null);
                  setSelectedSubDepartment(null);
                }}
                className="relative"
              >
                <Wrench className="mr-2 h-4 w-4" />
                Reorganizar
                {unorganizedProducts.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 px-2"
                  >
                    {unorganizedProducts.length}
                  </Badge>
                )}
              </Button>
              <ImportProductsDialog storeId={storeId} departments={departments} />
            </>
          )}
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={products.length === 0}
            className="border-green-600/30 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950 font-semibold"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* SEARCH AND VIEW TOGGLE */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o código de barras..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value && !viewAll) setViewAll(true);
            }}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewAll || !!searchTerm ? "default" : "outline"}
            size="sm"
            onClick={() => setViewAll(true)}
            className="font-bold"
          >
            <List className="mr-2 h-4 w-4" /> Ver Todos ({total})
          </Button>
          {departments.length > 0 && (
            <Button
              variant={!viewAll && !searchTerm && !selectedDepartment ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setViewAll(false);
                setSearchTerm('');
                setSelectedDepartment(null);
                setSelectedSubDepartment(null);
              }}
              className="font-bold"
            >
              <Grid className="mr-2 h-4 w-4" /> Por Departamentos
            </Button>
          )}
        </div>
      </div>

      {renderBreadcrumb()}
      {renderContent()}

      {canManageCatalog && (
        <FloatingActionButton href={`/store/${storeId}/products/add`} />
      )}
    </div>
  );
}
