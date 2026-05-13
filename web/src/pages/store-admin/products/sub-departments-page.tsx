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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/lib/swalert';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit, Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import apiClient from '@/services/api-client';
import { logError } from '@/lib/error-logger';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const subDepartmentFormSchema = z.object({
  name: z.string().min(2, {
    message: 'El nombre debe tener al menos 2 caracteres.',
  }),
  departmentId: z.string().min(1, 'Debe seleccionar un departamento padre.'),
});

interface Department {
  id: string;
  name: string;
}

interface SubDepartment {
  id: string;
  name: string;
  departmentId: string;
  departmentName?: string;
}

export default function SubDepartmentsPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const [isSaving, setIsSaving] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const form = useForm<z.infer<typeof subDepartmentFormSchema>>({
    resolver: zodResolver(subDepartmentFormSchema),
    defaultValues: {
      name: '',
      departmentId: '',
    },
  });

  const fetchData = async () => {
    try {
      const [deptsRes, subDeptsRes] = await Promise.all([
        apiClient.get('/departments', { params: { storeId, type: 'main' } }),
        apiClient.get('/departments/sub-departments', { params: { storeId } }).catch(() => ({ data: [] })),
      ]);
      const depts = deptsRes.data;
      setDepartments(depts);
      const departmentMap = new Map(depts.map((d: any) => [d.id, d.name]));
      const enriched = (subDeptsRes.data || []).map((sd: any) => ({
        ...sd,
        departmentId: sd.departmentId || sd.parentId || sd.parent_id || '',
        departmentName: departmentMap.get(sd.departmentId || sd.parentId || sd.parent_id) || 'Desconocido'
      }));
      setSubDepartments(enriched);
    } catch (error) {
      logError(error, { location: 'sub-departments-page-fetch' });
      toast.error('Error', 'No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!storeId) return;
    fetchData();
  }, [storeId]);


  async function onSubmit(values: z.infer<typeof subDepartmentFormSchema>) {
    setIsSaving(true);
    try {
      await apiClient.post('/departments', {
        name: values.name,
        storeId,
        parentId: values.departmentId,
      });
      fetchData();
      toast.success('Sub-departamento Creado', `El sub-departamento "${values.name}" ha sido creado.`);
      form.reset();
    } catch (error) {
      logError(error, {
        location: 'sub-departments-page-submit',
        additionalInfo: { formData: values, storeId },
      });
      toast.error('Error', 'No se pudo crear el sub-departamento.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateSubDepartment() {
    if (!editingId || !editingName) return;

    try {
      await apiClient.patch(`/departments/${editingId}`, { name: editingName });
      fetchData();
      toast.success('Sub-departamento Actualizado', 'El nombre del sub-departamento ha sido actualizado.');
      setEditingId(null);
      setEditingName('');
    } catch (error) {
      logError(error, {
        location: 'sub-departments-page-update',
        additionalInfo: { subDepartmentId: editingId, storeId },
      });
      toast.error('Error', 'No se pudo actualizar el sub-departamento.');
    }
  }

  async function deleteSubDepartment(id: string) {
    try {
      await apiClient.delete(`/departments/${id}`);
      fetchData();
      toast.success('Sub-departamento Eliminado', 'El sub-departamento ha sido eliminado correctamente.');
    } catch (error) {
      logError(error, {
        location: 'sub-departments-page-delete',
        additionalInfo: { subDepartmentId: id, storeId },
      });
      toast.error('Error', 'No se pudo eliminar el sub-departamento.');
    }
  }

  const handleEditClick = (subDept: SubDepartment) => {
    setEditingId(subDept.id);
    setEditingName(subDept.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link to={`/store/${storeId}/products`}>
            <ArrowLeft className="mr-2" />
            Volver a Productos
          </Link>
        </Button>
      </div>
      <div className="flex justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Gestionar Sub-departamentos</CardTitle>
            <CardDescription>
              Agrega, visualiza, edita y elimina los sub-departamentos de tu tienda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departamento Padre</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un departamento..." />
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
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormLabel>Nombre del Sub-departamento</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Cloros" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Agregar Sub-departamento
                </Button>
              </form>
            </Form>

            <Separator className="my-6" />

            <div>
              <h3 className="text-lg font-medium mb-4">Sub-departamentos Existentes</h3>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : subDepartments.length > 0 ? (
                <ul className="space-y-2">
                  {subDepartments.map((subDept) => (
                    <li key={subDept.id} className="flex items-center justify-between p-2 rounded-md border group">
                      {editingId === subDept.id ? (
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="h-8"
                        />
                      ) : (
                        <div>
                          <span className="text-sm font-medium">{subDept.name}</span>
                          <p className="text-xs text-muted-foreground">({subDept.departmentName})</p>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        {editingId === subDept.id ? (
                          <>
                            <Button variant="ghost" size="icon" onClick={handleUpdateSubDepartment} className="h-8 w-8">
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleCancelEdit} className="h-8 w-8">
                              <X className="h-4 w-4 text-gray-600" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(subDept)} className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente el sub-departamento &quot;{subDept.name}&quot;.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteSubDepartment(subDept.id)}>
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground text-center">No hay sub-departamentos agregados todavía.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
