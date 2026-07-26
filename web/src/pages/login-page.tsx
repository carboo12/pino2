import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Loader2, TreePine } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Navigate } from 'react-router-dom';
import { toast } from '@/lib/swalert';
import { normalizeUserRole } from '@/lib/user-role';

import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, user } = useAuth();

  if (user) {
    const role = normalizeUserRole(user.role);
    const storeId = user.storeIds?.[0];
    const rolePathMap: Record<string, string> = {
      admin: '/master-admin/dashboard',
      'super-admin': '/master-admin/dashboard',
      inventory: `/store/${storeId}/warehouse`,
      gestor: `/store/${storeId}/vendors/dashboard`,
      rutero: `/store/${storeId}/delivery-route`,
      auxiliar: `/store/${storeId}/warehouse`,
    };
    const redirectPath = rolePathMap[role] || '/master-admin/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al iniciar sesión. Por favor, revisa tus credenciales.';
      setError(errorMessage);
      toast.error('Error de inicio de sesión', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center px-4 overflow-hidden bg-gradient-to-br from-background via-primary/5 to-primaryLight">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-secondary/5 blur-3xl" />
      </div>
      <main className="flex-grow flex items-center justify-center w-full relative z-10">
        <Card className="w-full max-w-sm border-0 shadow-lg animate-in fade-in slide-up">
          <CardHeader className="text-center pt-10">
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primaryDark flex items-center justify-center shadow-md">
                <TreePine className="h-7 w-7 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">Pino</h1>
            <p className="text-base font-medium text-foreground mt-1">{getGreeting()}</p>
            <p className="text-sm text-muted-foreground">Sistema de Distribución</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@ejemplo.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute inset-y-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    </span>
                  </Button>
                </div>
              </div>
              {error && (
                <p className="text-sm font-medium text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Validando...' : 'Iniciar Sesión'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center pb-8 pt-2">
            <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              ¿Olvidaste tu contraseña?
            </Link>
          </CardFooter>
        </Card>
      </main>
      <footer className="text-xs text-muted-foreground pb-4 relative z-10">
        &copy; 2026 Pino &middot; Sistema de Distribución
      </footer>
    </div>
  );
}
