'use client';

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FloatingActionButton } from '@/components/floating-action-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Users, Edit, Eye, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/swalert';
import apiClient from '@/services/api-client';
import { withAppBase } from '@/lib/runtime-config';

interface User {
  uid: string;
  name: string;
  email: string;
  role: string;
  storeId?: string;
  storeName?: string;
}

export default function MasterUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const [usersRes, storesRes] = await Promise.all([
          apiClient.get('/users'),
          apiClient.get('/stores'),
        ]);
        
        const storesMap = new Map<string, string>();
        (storesRes.data || []).forEach((s: any) => storesMap.set(s.id, s.name));

        const usersData: User[] = (usersRes.data || []).map((u: any) => ({
          uid: u.id || u.uid,
          name: u.name,
          email: u.email,
          role: u.role,
          storeId: u.storeId || (u.storeIds && u.storeIds[0]),
          storeName: u.storeId ? storesMap.get(u.storeId) : (u.storeIds?.[0] ? storesMap.get(u.storeIds[0]) : undefined),
        }));
        setUsers(usersData);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('No se pudieron cargar los usuarios. Inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getRoleVariant = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'master-admin': return 'default';
      case 'store administrator': 
      case 'admin': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleClass = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'master-admin': return 'bg-primary text-primary-foreground';
      case 'store administrator':
      case 'admin': return 'bg-secondary text-secondary-foreground';
      default: return 'border-primary text-primary';
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <Users className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (users.length === 0) {
      return (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertTitle>No hay usuarios</AlertTitle>
          <AlertDescription>Aún no hay usuarios registrados. ¡Agrega el primero!</AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="rounded-md border">
        <Accordion type="single" collapsible className="w-full">
          {users.map((user) => (
            <AccordionItem value={user.uid} key={user.uid}>
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-left">{user.name}</span>
                  <Badge variant={getRoleVariant(user.role)} className={getRoleClass(user.role)}>
                    {user.role}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 bg-muted/50">
                <div className="grid gap-4 md:grid-cols-2 mt-2">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-tight">Información de Usuario</h4>
                    <div className="space-y-1">
                      <p className="text-sm"><strong>Correo:</strong> {user.email}</p>
                      <p className="text-sm"><strong>Rol:</strong> {user.role}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-tight">Tienda Asignada</h4>
                    <p className="text-sm">{user.storeName || 'N/A (Acceso Global)'}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/master-admin/users/edit/${user.uid}`}>
                      <Edit className="mr-2 h-4 w-4" /> Editar
                    </Link>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      try {
                        const res = await apiClient.post(`/auth/impersonate/${user.uid}`);
                        localStorage.setItem('access_token', res.data.accessToken);
                        localStorage.setItem('impersonated', 'true');
                        toast.success(`Sesión como ${user.name}`, 'Redirigiendo...');
                        setTimeout(() => window.location.href = withAppBase('/'), 1000);
                      } catch {
                        toast.error('Error', 'No se pudo iniciar sesión como este usuario');
                      }
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" /> Ver como
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">Crea, edita y gestiona los usuarios del sistema.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Todos los Usuarios</CardTitle>
          <CardDescription>Una lista de todos los usuarios registrados en el sistema.</CardDescription>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
      <FloatingActionButton href="/master-admin/users/add" />
    </div>
  );
}
