import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/swalert";
import apiClient from "@/services/api-client";
import { AlternativeBarcodes } from "./alternative-barcodes";
import { useQuery } from "@tanstack/react-query";
import { useApiMutation } from "@/hooks/use-api";

interface Department {
  id: string;
  name: string;
}

interface SubDepartment {
  id: string;
  name: string;
  departmentId: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface ProductResponse {
  id: string;
  barcode?: string;
  brand?: string;
  description: string;
  costPrice: number;
  price1: number;
  price2: number;
  price3: number;
  price4: number;
  price5: number;
  bulkPrice1?: number;
  bulkPrice2?: number;
  bulkPrice3?: number;
  bulkPrice4?: number;
  bulkPrice5?: number;
  departmentId?: string;
  supplierId?: string;
  subDepartment?: string;
  usesInventory: boolean;
  handlesBulk?: boolean;
  currentStock: number;
  minStock: number;
  unitsPerBulk?: number;
  stockBulks?: number;
  stockUnits?: number;
  stockDisplay?: {
    bulkCount: number;
    looseUnitCount: number;
    formatted: string;
  };
}

interface ProductFormState {
  barcode: string;
  brand: string;
  description: string;
  costPrice: string;
  price1: string;
  price2: string;
  price3: string;
  price4: string;
  price5: string;
  bulkPrice1: string;
  bulkPrice2: string;
  bulkPrice3: string;
  bulkPrice4: string;
  bulkPrice5: string;
  departmentId: string;
  supplierId: string;
  subDepartment: string;
  usesInventory: boolean;
  handlesBulk: boolean;
  currentStock: string;
  minStock: string;
  unitsPerBulk: string;
  stockBulks: string;
  stockUnits: string;
}

const emptyForm: ProductFormState = {
  barcode: "",
  brand: "",
  description: "",
  costPrice: "0",
  price1: "0",
  price2: "0",
  price3: "0",
  price4: "0",
  price5: "0",
  bulkPrice1: "0",
  bulkPrice2: "0",
  bulkPrice3: "0",
  bulkPrice4: "0",
  bulkPrice5: "0",
  departmentId: "",
  supplierId: "",
  subDepartment: "",
  usesInventory: true,
  handlesBulk: false,
  currentStock: "0",
  minStock: "0",
  unitsPerBulk: "1",
  stockBulks: "0",
  stockUnits: "0",
};

function toFormData(product: ProductResponse): ProductFormState {
  return {
    barcode: product.barcode || "",
    brand: product.brand || "",
    description: product.description || "",
    costPrice: String(product.costPrice ?? 0),
    price1: String(product.price1 ?? 0),
    price2: String(product.price2 ?? 0),
    price3: String(product.price3 ?? 0),
    price4: String(product.price4 ?? 0),
    price5: String(product.price5 ?? 0),
    bulkPrice1: String(product.bulkPrice1 ?? 0),
    bulkPrice2: String(product.bulkPrice2 ?? 0),
    bulkPrice3: String(product.bulkPrice3 ?? 0),
    bulkPrice4: String(product.bulkPrice4 ?? 0),
    bulkPrice5: String(product.bulkPrice5 ?? 0),
    departmentId: product.departmentId || "",
    supplierId: product.supplierId || "",
    subDepartment: product.subDepartment || "",
    usesInventory: product.usesInventory !== false,
    handlesBulk: Boolean(product.handlesBulk),
    currentStock: String(product.currentStock ?? 0),
    minStock: String(product.minStock ?? 0),
    unitsPerBulk: String(product.unitsPerBulk ?? 1),
    stockBulks: String(product.stockBulks ?? 0),
    stockUnits: String(product.stockUnits ?? 0),
  };
}

export default function EditProductPage() {
  const { storeId, productId } = useParams<{
    storeId: string;
    productId: string;
  }>();
  const navigate = useNavigate();

  const { data: productData, isLoading: loadingProduct } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const res = await apiClient.get(`/products/${productId}`);
      return res.data as ProductResponse;
    },
    enabled: !!productId,
  });

  const { data: departments = [], isLoading: loadingDepts } = useQuery({
    queryKey: ["departments", storeId],
    queryFn: async () => {
      const res = await apiClient.get("/departments", {
        params: { storeId, type: "main" },
      });
      return (res.data || []).map((department: any) => ({
        id: department.id,
        name: department.name || department.nombre,
      }));
    },
    enabled: !!storeId,
  });

  const { data: subDepartments = [], isLoading: loadingSubDepts } = useQuery({
    queryKey: ["sub-departments", storeId],
    queryFn: async () => {
      const res = await apiClient.get("/departments/sub-departments", {
        params: { storeId },
      });
      return (res.data || []).map((subDepartment: any) => ({
        id: subDepartment.id,
        name: subDepartment.name || subDepartment.nombre,
        departmentId:
          subDepartment.departmentId ||
          subDepartment.parentId ||
          subDepartment.parent_id ||
          "",
      }));
    },
    enabled: !!storeId,
  });

  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ["suppliers", storeId],
    queryFn: async () => {
      const res = await apiClient.get("/suppliers", { params: { storeId } });
      return (res.data || []).map((supplier: any) => ({
        id: supplier.id,
        name: supplier.name || supplier.nombre,
      }));
    },
    enabled: !!storeId,
  });

  const [formData, setFormData] = useState<ProductFormState>(emptyForm);

  useEffect(() => {
    if (productData) {
      setFormData(toFormData(productData));
    }
  }, [productData]);

  const updateProductMutation = useApiMutation(
    (data: any) => apiClient.patch(`/products/${productId}`, data),
    [
      ["products", storeId],
      ["product", productId],
    ],
  );

  const loading =
    loadingProduct || loadingDepts || loadingSubDepts || loadingSuppliers;

  const updateField = (
    field: keyof ProductFormState,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (!formData.departmentId) {
      if (formData.subDepartment) {
        updateField("subDepartment", "");
      }
      return;
    }

    const belongsToDepartment = subDepartments.some(
      (subDepartment) =>
        subDepartment.departmentId === formData.departmentId &&
        subDepartment.name === formData.subDepartment,
    );

    if (formData.subDepartment && !belongsToDepartment) {
      updateField("subDepartment", "");
    }
  }, [formData.departmentId, formData.subDepartment, subDepartments]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!productId || !storeId) return;

    if (!formData.description.trim()) {
      toast.error("Error", "La descripción es obligatoria.");
      return;
    }

    try {
      await updateProductMutation.mutateAsync({
        barcode: formData.barcode || null,
        brand: formData.brand || null,
        description: formData.description.trim(),
        costPrice: Number(formData.costPrice || 0),
        salePrice: Number(formData.price1 || 0),
        price1: Number(formData.price1 || 0),
        price2: Number(formData.price2 || 0),
        price3: Number(formData.price3 || 0),
        price4: Number(formData.price4 || 0),
        price5: Number(formData.price5 || 0),
        bulkPrice1: Number(formData.bulkPrice1 || 0),
        bulkPrice2: Number(formData.bulkPrice2 || 0),
        bulkPrice3: Number(formData.bulkPrice3 || 0),
        bulkPrice4: Number(formData.bulkPrice4 || 0),
        bulkPrice5: Number(formData.bulkPrice5 || 0),
        departmentId: formData.departmentId || null,
        supplierId: formData.supplierId || null,
        subDepartment: formData.subDepartment || null,
        usesInventory: formData.usesInventory,
        handlesBulk: formData.handlesBulk,
        currentStock: Number(formData.currentStock || 0),
        minStock: Number(formData.minStock || 0),
        unitsPerBulk: formData.handlesBulk ? Math.max(2, Number(formData.unitsPerBulk || 2)) : 1,
        stockBulks: Number(formData.stockBulks || 0),
        stockUnits: Number(formData.stockUnits || 0),
      });

      toast.success(
        "Producto actualizado",
        `Se guardaron los cambios de "${formData.description}".`,
      );
      navigate(`/store/${storeId}/products`);
    } catch (error: any) {
      console.error(error);
      toast.error(
        "Error",
        error?.response?.data?.message || "No se pudo actualizar el producto.",
      );
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <Button variant="ghost" asChild>
          <Link to={`/store/${storeId}/products`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a productos
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editar producto</CardTitle>
          <CardDescription>
            Ajusta precios, clasificación e inventario base del producto
            seleccionado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Código de barras (Principal)</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(event) =>
                    updateField("barcode", event.target.value)
                  }
                />
                <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                  Puede editar el código principal aquí o agregar códigos
                  alternativos abajo.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(event) => updateField("brand", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Select
                  value={formData.departmentId || "none"}
                  onValueChange={(value) =>
                    updateField("departmentId", value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin departamento</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Proveedor</Label>
                <Select
                  value={formData.supplierId || "none"}
                  onValueChange={(value) =>
                    updateField("supplierId", value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin proveedor</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sub-departamento</Label>
                <Select
                  value={formData.subDepartment || "none"}
                  onValueChange={(value) =>
                    updateField("subDepartment", value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un sub-departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin sub-departamento</SelectItem>
                    {subDepartments
                      .filter(
                        (subDepartment) =>
                          subDepartment.departmentId === formData.departmentId,
                      )
                      .map((subDepartment) => (
                        <SelectItem
                          key={subDepartment.id}
                          value={subDepartment.name}
                        >
                          {subDepartment.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Costo</Label>
                <Input
                  id="costPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(event) =>
                    updateField("costPrice", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price1">Precio 1</Label>
                <Input
                  id="price1"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price1}
                  onChange={(event) =>
                    updateField("price1", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price2">Precio 2</Label>
                <Input
                  id="price2"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price2}
                  onChange={(event) =>
                    updateField("price2", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price3">Precio 3</Label>
                <Input
                  id="price3"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price3}
                  onChange={(event) =>
                    updateField("price3", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price4">Precio 4</Label>
                <Input
                  id="price4"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price4}
                  onChange={(event) =>
                    updateField("price4", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price5">Precio 5</Label>
                <Input
                  id="price5"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price5}
                  onChange={(event) =>
                    updateField("price5", event.target.value)
                  }
                />
              </div>
            </div>

            {Number(formData.unitsPerBulk || 1) > 1 && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-3">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Precios por Bulto
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulkPrice1">Precio Bulto 1 (Detalle)</Label>
                  <Input
                    id="bulkPrice1"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.bulkPrice1}
                    onChange={(event) =>
                      updateField("bulkPrice1", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulkPrice2">
                    Precio Bulto 2 (Semi-Mayoreo)
                  </Label>
                  <Input
                    id="bulkPrice2"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.bulkPrice2}
                    onChange={(event) =>
                      updateField("bulkPrice2", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulkPrice3">Precio Bulto 3 (Mayoreo)</Label>
                  <Input
                    id="bulkPrice3"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.bulkPrice3}
                    onChange={(event) =>
                      updateField("bulkPrice3", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulkPrice4">Precio Bulto 4 (Especial)</Label>
                  <Input
                    id="bulkPrice4"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.bulkPrice4}
                    onChange={(event) =>
                      updateField("bulkPrice4", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulkPrice5">Precio Bulto 5 (Mínimo)</Label>
                  <Input
                    id="bulkPrice5"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.bulkPrice5}
                    onChange={(event) =>
                      updateField("bulkPrice5", event.target.value)
                    }
                  />
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="currentStock">Existencia total</Label>
                <Input
                  id="currentStock"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.currentStock}
                  onChange={(event) =>
                    updateField("currentStock", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Existencia mínima</Label>
                <Input
                  id="minStock"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.minStock}
                  onChange={(event) =>
                    updateField("minStock", event.target.value)
                  }
                />
              </div>
              <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
                <Checkbox
                  id="handlesBulk"
                  checked={formData.handlesBulk}
                  onCheckedChange={(checked) => {
                    const isChecked = Boolean(checked);
                    setFormData((prev) => ({
                      ...prev,
                      handlesBulk: isChecked,
                      unitsPerBulk: isChecked ? (Number(prev.unitsPerBulk) > 1 ? prev.unitsPerBulk : "10") : "1",
                    }));
                  }}
                />
                <Label htmlFor="handlesBulk" className="cursor-pointer font-medium">
                  ¿Maneja control por bultos?
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitsPerBulk">Unidades por bulto (X)</Label>
                <Input
                  id="unitsPerBulk"
                  type="number"
                  min="2"
                  step="1"
                  disabled={!formData.handlesBulk}
                  value={formData.unitsPerBulk}
                  onChange={(event) =>
                    updateField("unitsPerBulk", event.target.value)
                  }
                />
              </div>

              <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
                <Checkbox
                  id="usesInventory"
                  checked={formData.usesInventory}
                  onCheckedChange={(checked) =>
                    updateField("usesInventory", Boolean(checked))
                  }
                />
                <Label htmlFor="usesInventory" className="cursor-pointer">
                  Usa inventario
                </Label>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="stockBulks">Bultos (calculado)</Label>
                <Input
                  id="stockBulks"
                  type="number"
                  value={
                    productData?.stockDisplay?.bulkCount ??
                    Math.floor(
                      Number(formData.currentStock || 0) /
                        Math.max(Number(formData.unitsPerBulk || 1), 1),
                    )
                  }
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stockUnits">Unidades sueltas (calculado)</Label>
                <Input
                  id="stockUnits"
                  type="number"
                  value={
                    productData?.stockDisplay?.looseUnitCount ??
                    Number(formData.currentStock || 0) %
                      Math.max(Number(formData.unitsPerBulk || 1), 1)
                  }
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateProductMutation.isPending}>
                {updateProductMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {productId && storeId && (
        <AlternativeBarcodes productId={productId} storeId={storeId} />
      )}
    </div>
  );
}
