

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/lib/swalert';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import apiClient from '@/services/api-client';
import { useAuth } from '@/contexts/auth-context';
import { logError } from '@/lib/error-logger';
import { useQuery } from '@tanstack/react-query';
import { useApiMutation } from '@/hooks/use-api';

const productFormSchema = z.object({
  barcode: z.string().optional(),
  brand: z.string().optional(),
  description: z.string().min(3, { message: 'La descripción es requerida.' }),
  packagingType: z.enum(['UNIT', 'BULTO'], {
    errorMap: () => ({ message: 'Debes seleccionar un tipo de venta.' }),
  }),
  unitsPerBulk: z.coerce.number().optional(),
  costPrice: z.coerce.number().min(0, { message: 'El precio no puede ser negativo.' }),
  price1: z.coerce.number().min(0, { message: 'El precio no puede ser negativo.' }),
  price2: z.coerce.number().min(0, { message: 'El precio no puede ser negativo.' }),
  price3: z.coerce.number().optional(),
  price4: z.coerce.number().optional(),
  price5: z.coerce.number().optional(),
  bulkPrice1: z.coerce.number().optional(),
  bulkPrice2: z.coerce.number().optional(),
  bulkPrice3: z.coerce.number().optional(),
  bulkPrice4: z.coerce.number().optional(),
  bulkPrice5: z.coerce.number().optional(),
  department: z.string({ required_error: 'Debes seleccionar un departamento.' }),
  subDepartment: z.string().optional(),
  supplierId: z.string().optional(),
  supplierName: z.string().optional(),
  usesInventory: z.boolean().default(true),
  currentStock: z.coerce.number().optional(),
  minStock: z.coerce.number().optional(),
}).refine(data => {
  if (data.packagingType === 'BULTO') {
    return data.unitsPerBulk !== undefined && data.unitsPerBulk > 0;
  }
  return true;
}, {
  message: 'Debes especificar las unidades por bulto.',
  path: ['unitsPerBulk'],
});

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


export default function AddProductPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', storeId],
    queryFn: async () => {
      const res = await apiClient.get('/departments', { params: { storeId, type: 'main' } });
      return res.data.map((d: any) => ({ ...d, name: d.name || d.nombre }));
    },
    enabled: !!storeId,
  });

  const { data: subDepartments = [] } = useQuery({
    queryKey: ['sub-departments', storeId],
    queryFn: async () => {
      const res = await apiClient.get('/departments/sub-departments', { params: { storeId } });
      return (res.data || []).map((sd: any) => ({
        id: sd.id,
        name: sd.name || sd.nombre,
        departmentId: sd.departmentId || sd.parentId || sd.parent_id || '',
      }));
    },
    enabled: !!storeId,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers', storeId],
    queryFn: async () => {
      const res = await apiClient.get('/suppliers', { params: { storeId } });
      return res.data.map((s: any) => ({ ...s, name: s.name || s.nombre }));
    },
    enabled: !!storeId,
  });

  const createProductMutation = useApiMutation(
    (productData: any) => apiClient.post('/products', productData),
    [['products', storeId]]
  );

  const form = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      barcode: '',
      brand: '',
      description: '',
      packagingType: 'UNIT',
      department: '',
      subDepartment: '',
      supplierId: '',
      unitsPerBulk: 1,
      usesInventory: true,
      currentStock: 0,
      minStock: 0,
      costPrice: 0,
      price1: 0,
      price2: 0,
      price3: 0,
      price4: 0,
      price5: 0,
      bulkPrice1: 0,
      bulkPrice2: 0,
      bulkPrice3: 0,
      bulkPrice4: 0,
      bulkPrice5: 0,
    },
  });

  const usesInventory = form.watch('usesInventory');
  const packagingType = form.watch('packagingType');
  const selectedDepartment = form.watch('department');

  useEffect(() => {
    form.setValue('subDepartment', '');
  }, [selectedDepartment, form]);

  useEffect(() => {
    form.setValue('subDepartment', '');
  }, [selectedDepartment, form]);

  async function onSubmit(values: z.infer<typeof productFormSchema>) {
    setIsSaving(true);
    if (!storeId || !user) {
      toast.error('Error', 'No se pudo identificar la tienda o el usuario.');
      setIsSaving(false);
      return;
    }
    try {
      const selectedDept = departments.find(d => d.id === values.department);
      const selectedSub = subDepartments.find(s => s.id === values.subDepartment);
      const selectedSup = suppliers.find(s => s.id === values.supplierId);

      const productData = {
        ...values,
        packagingType: values.packagingType,
        unitsPerBulk: values.unitsPerBulk || 1,
        salePrice: values.price1,
        departmentId: values.department,
        department: selectedDept?.name || '',
        subDepartmentId: values.subDepartment === 'none' ? '' : values.subDepartment,
        subDepartment: selectedSub?.name || '',
        supplierId: values.supplierId === 'none' ? '' : (selectedSup?.id || ''),
        supplierName: selectedSup?.name || '',
        storeId,
      };

      if (productData.subDepartmentId === 'none') productData.subDepartmentId = '';
      if (productData.supplierId === 'none') productData.supplierId = '';

      await createProductMutation.mutateAsync(productData);

      toast.success('Producto Guardado', `El producto "${values.description}" ha sido agregado al inventario.`);
      navigate(`/store/${storeId}/products`);
    } catch (error) {
      await logError(error, {
        location: 'add-product-page-submit',
        additionalInfo: { formData: values, storeId },
      })
      toast.error('Error', 'No se pudo guardar el producto. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link to={`/store/${storeId}/products`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Productos
          </Link>
        </Button>
      </div>
      <div className="flex justify-center">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle>Nuevo Producto</CardTitle>
            <CardDescription>
              Completa los detalles para agregar un nuevo producto a tu
              inventario.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código de Barras</FormLabel>
                        <FormControl>
                          <Input placeholder="Escanear o ingresar código" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. Coca-Cola 600ml" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. Nike, Coca-Cola, etc." {...field} />
                        </FormControl>
                        <FormDescription>Ingresa la marca del producto si deseas rastrearlo por marca.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="packagingType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Se vende</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="UNIT" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Por Unidad/Pza
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="BULTO" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Por Bulto
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {packagingType === 'BULTO' && (
                  <FormField
                    control={form.control}
                    name="unitsPerBulk"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidades por Bulto</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Ej. 12" {...field} />
                        </FormControl>
                        <FormDescription>
                          ¿Cuántas unidades individuales contiene el bulto?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="costPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio Costo</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio 1 (Principal)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio 2 (Oferta)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="price3"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio 3 (Mayoreo)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price4"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio 4 (Especial)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">Req. Autorización</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price5"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio 5 (Mínimo)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">Req. Autorización</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {packagingType === 'BULTO' && (
                  <>
                    <Separator />
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Precios por Bulto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="bulkPrice1" render={({ field }) => (
                        <FormItem><FormLabel>Precio Bulto 1 (Detalle)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="bulkPrice2" render={({ field }) => (
                        <FormItem><FormLabel>Precio Bulto 2 (Semi-Mayoreo)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField control={form.control} name="bulkPrice3" render={({ field }) => (
                        <FormItem><FormLabel>Precio Bulto 3 (Mayoreo)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="bulkPrice4" render={({ field }) => (
                        <FormItem><FormLabel>Precio Bulto 4 (Especial)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormDescription className="text-xs">Req. Autorización</FormDescription><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="bulkPrice5" render={({ field }) => (
                        <FormItem><FormLabel>Precio Bulto 5 (Mínimo)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormDescription className="text-xs">Req. Autorización</FormDescription><FormMessage /></FormItem>
                      )} />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departamento</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="- Selecciona un Departamento -" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subDepartment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sub-departamento</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!selectedDepartment}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="- Selecciona un Sub-departamento -" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Ninguno</SelectItem>
                            {subDepartments
                              .filter(sd => sd.departmentId === selectedDepartment)
                              .map((subDept) => (
                                <SelectItem key={subDept.id} value={subDept.id}>
                                  {subDept.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proveedor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="- Selecciona un Proveedor -" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Ninguno</SelectItem>
                          {suppliers.map((sup) => (
                            <SelectItem key={sup.id} value={sup.id}>
                              {sup.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="usesInventory"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Gestión de Inventario
                        </FormLabel>
                        <FormDescription>
                          Activa esta opción para controlar el stock de este producto.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {usesInventory && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="currentStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cantidad Actual (en unidades)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="minStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mínimo en Stock (en unidades)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            Para generar alertas de inventario bajo.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}


                <Button
                  type="submit"
                  className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg z-50 bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <Save className="h-6 w-6" />
                  )}
                  <span className="sr-only">Guardar Producto</span>
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

