import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  Mail,
  User as UserIcon,
  ShieldAlert,
  EditIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/lib/swalert';
import apiClient from '@/services/api-client';

const userFormSchema = z.object({
  name: z.string().min(3, 'El nombre es requerido.'),
  email: z.string().email('Correo electrónico no válido.'),
  role: z.string().min(1, 'Debes seleccionar un rol.'),
  permissions: z.array(z.string()).optional(),
});

const AVAILABLE_PERMISSIONS = [
  { id: 'hacer_arqueo', label: 'Hacer arqueo de dinero' },
  { id: 'asignar_rutas', label: 'Asignar rutas a ruteros' },
  { id: 'autorizar_precios', label: 'Autorizar precios especiales' },
  { id: 'ver_reportes', label: 'Ver reportes financieros' },
  { id: 'liquidar_rutas', label: 'Liquidar rutas' },
  { id: 'reasignar_clientes', label: 'Reasignar clientes' },
  { id: 'ver_inventario', label: 'Ver inventario completo' },
  { id: 'gestionar_usuarios', label: 'Gestionar usuarios' },
];

const CANONICAL_ROLES = [
  { value: 'admin', label: '1. JEFE / ENCARGADO DE BODEGA' },
  { value: 'auxiliar', label: '2. AUXILIAR DE RECEPCIÓN Y DESPACHO' },
  { value: 'inventory', label: '3. ANALISTA / AUDITOR DE INVENTARIO' },
  { value: 'gestor', label: '4. GESTOR DE VENTAS (Móvil)' },
  { value: 'rutero', label: '5. RUTERO / REPARTIDOR (Móvil)' },
  { value: 'super-admin', label: '6. ADMINISTRADOR GENERAL' },
] as const;

const MASTER_ROLE_OPTIONS = CANONICAL_ROLES;

export default function EditUserPage() {
  const { storeId, userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isMasterMode = location.pathname.startsWith('/master-admin/');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assignedStores, setAssignedStores] = useState<Array<{ id: string; name: string }>>([]);

  const roleOptions = MASTER_ROLE_OPTIONS;
  const backHref = isMasterMode ? '/master-admin/users' : `/store/${storeId}/users`;

  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'cashier',
      permissions: [],
    },
  });

  useEffect(() => {
    async function fetchUser() {
      if (!userId) return;
      try {
        const response = await apiClient.get(`/users/${userId}`);
        const data = response.data;
        form.reset({
          name: data.name || '',
          email: data.email || '',
          role: data.role as any || 'cashier',
          permissions: data.permissions || [],
        });
        setAssignedStores(data.stores || []);
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error('Error', 'No se pudo cargar el usuario.');
        navigate(backHref);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function onSubmit(values: z.infer<typeof userFormSchema>) {
    if (!userId) return;
    setIsSaving(true);
    
    try {
      await apiClient.patch(`/users/${userId}`, {
        name: values.name,
        role: values.role,
      });
      
      toast.success('Usuario Actualizado', 'La información ha sido guardada.');
      navigate(backHref);
    } catch (error) {
      console.error(error);
      toast.error('Error', 'No se pudo actualizar el usuario.');
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-8">
         <Skeleton className="h-12 w-1/3 rounded-2xl" />
         <Skeleton className="h-[500px] w-full rounded-[40px]" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <Link to={backHref} className="flex items-center text-sm font-bold text-slate-400 hover:text-primary transition-colors mb-2 w-fit">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver a Usuarios
        </Link>
        <h1 className="text-4xl font-black tracking-tight text-slate-800 flex items-center gap-3 uppercase italic">
          <EditIcon className="h-10 w-10 text-primary" />
          {isMasterMode ? 'Editar Usuario del Sistema' : 'Editar Colaborador'}
        </h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] underline decoration-primary decoration-4 underline-offset-8">Actualización de Personal</p>
      </div>

      <Card className="border-none shadow-[20px_20px_60px_#ccced1,-20px_-20px_60px_#ffffff] bg-[#f0f2f5] rounded-[40px] overflow-hidden">
        <CardHeader className="bg-primary/5 p-8 border-b border-white">
          <CardTitle className="text-2xl font-black text-slate-800 uppercase">Ajustes de Perfil</CardTitle>
          <CardDescription className="text-slate-500 font-medium">
            Modifica los privilegios o datos del colaborador.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-xs font-black uppercase text-slate-500 tracking-widest ml-2">
                         <UserIcon className="h-4 w-4 text-primary" /> Nombre Completo
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej. Juan Pérez" 
                          className="h-14 rounded-2xl bg-white border-none shadow-[inset_4px_4px_8px_#ebeced,inset_-4px_-4px_8px_#ffffff] font-bold px-6 focus-visible:ring-primary"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="ml-2 font-bold italic" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                       <FormLabel className="flex items-center gap-2 text-xs font-black uppercase text-slate-500 tracking-widest ml-2">
                         <Mail className="h-4 w-4 text-slate-300" /> Correo Electrónico (Solo Lectura)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          disabled
                          className="h-14 rounded-2xl bg-slate-100 border-none text-slate-400 font-bold px-6 cursor-not-allowed"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="ml-2 font-bold italic" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2 max-w-md">
                       <FormLabel className="flex items-center gap-2 text-xs font-black uppercase text-slate-500 tracking-widest ml-2">
                         <ShieldAlert className="h-4 w-4 text-primary" /> Nivel de Privilegios
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-14 rounded-2xl bg-white border-none shadow-[inset_4px_4px_8px_#ebeced,inset_-4px_-4px_8px_#ffffff] font-bold px-6 focus:ring-primary">
                            <SelectValue placeholder="Selecciona un rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-none shadow-xl">
                          {roleOptions.map((role) => (
                            <SelectItem key={role.value} value={role.value} className="font-bold cursor-pointer rounded-xl">
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="ml-2 font-bold italic" />
                    </FormItem>
                  )}
                />

                {isMasterMode && (
                  <div className="md:col-span-2 max-w-md">
                    <p className="flex items-center gap-2 text-xs font-black uppercase text-slate-500 tracking-widest ml-2">
                      <ShieldAlert className="h-4 w-4 text-primary" /> Tiendas Asignadas
                    </p>
                    <div className="mt-3 rounded-2xl bg-slate-100 px-5 py-4 text-sm font-medium text-slate-600">
                      {assignedStores.length > 0
                        ? assignedStores.map((store) => store.name).join(', ')
                        : 'Sin tienda asignada'}
                    </div>
                  </div>
                )}

                {form.watch('role') === 'auxiliar' && (
                  <div className="md:col-span-2 mt-4">
                    <h3 className="mb-4 flex items-center gap-2 text-xs font-black uppercase text-slate-500 tracking-widest ml-2">
                      <ShieldAlert className="h-4 w-4 text-primary" /> Permisos Específicos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded-2xl shadow-[inset_4px_4px_8px_#ebeced,inset_-4px_-4px_8px_#ffffff]">
                       {AVAILABLE_PERMISSIONS.map(permission => (
                         <FormField
                           key={permission.id}
                           control={form.control}
                           name="permissions"
                           render={({ field }) => {
                             const currentPerms = field.value || [];
                             return (
                               <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                 <FormControl>
                                   <input
                                     type="checkbox"
                                     className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                     checked={currentPerms.includes(permission.id)}
                                     onChange={(e) => {
                                       const checked = e.target.checked;
                                       if (checked) {
                                         field.onChange([...currentPerms, permission.id]);
                                       } else {
                                         field.onChange(currentPerms.filter((val) => val !== permission.id));
                                       }
                                     }}
                                   />
                                 </FormControl>
                                 <div className="space-y-1 leading-none">
                                   <FormLabel className="text-sm font-medium cursor-pointer">
                                     {permission.label}
                                   </FormLabel>
                                 </div>
                               </FormItem>
                             );
                           }}
                         />
                       ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-8 flex justify-end">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      Guardando
                    </>
                  ) : (
                    <>
                      <Save className="mr-3 h-5 w-5" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>

            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
