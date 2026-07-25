import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock } from 'lucide-react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/runtime-config';
import { normalizeUserRole } from '@/lib/user-role';
import { useAuth } from '@/contexts/auth-context';

interface AdminAuthDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    requiredRole?: 'admin' | 'owner';
}

export function AdminAuthDialog({
    isOpen,
    onClose,
    onConfirm,
    title = "Autorización Requerida",
    description = "Esta acción requiere permisos de administrador. Por favor ingrese su clave.",
    requiredRole,
}: AdminAuthDialogProps) {
    const { user } = useAuth();
    const isCurrentUserPrivileged = ['store-admin', 'master-admin', 'owner'].includes(normalizeUserRole(user?.role));
    const [adminEmail, setAdminEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const params = useParams();
    const storeId = params.storeId as string;

    const handleConfirm = async () => {
        setIsLoading(true);
        setError('');

        try {
            if (!storeId) {
                setError('Error: No se identificó la tienda.');
                return;
            }

            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                email: adminEmail.trim(),
                password,
            });

            const authorizedRole = normalizeUserRole(response.data?.user?.role);
            const authorized =
                requiredRole === 'owner'
                    ? authorizedRole === 'owner' || authorizedRole === 'master-admin'
                    : ['store-admin', 'master-admin', 'owner'].includes(authorizedRole);

            if (!authorized) {
                setError('Las credenciales no corresponden a un usuario autorizado.');
                return;
            }

            onConfirm();
            onClose();
            setPassword('');
            if (isCurrentUserPrivileged) {
                setAdminEmail(user?.email || '');
            }

        } catch (err: any) {
            console.error("Auth error:", err);
            setError(err.response?.data?.message || 'Credenciales inválidas.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleConfirm();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto bg-red-100 p-3 rounded-full mb-2">
                        <Lock className="h-6 w-6 text-red-600" />
                    </div>
                    <DialogTitle className="text-center">{title}</DialogTitle>
                    <DialogDescription className="text-center">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="admin-email">Correo del administrador</Label>
                        <Input
                            id="admin-email"
                            type="email"
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            placeholder="admin@multitienda.com"
                            autoFocus
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="admin-password">Contraseña del administrador</Label>
                        <Input
                            id="admin-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ingrese contraseña..."
                        />
                        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
                        <p className="text-xs text-muted-foreground">
                            Se valida contra el login real del sistema sin reemplazar la sesión actual.
                        </p>
                    </div>
                </div>

                <DialogFooter className="sm:justify-between flex-row gap-2">
                    <Button
                        type="button"
                        variant="secondary"
                        className="flex-1"
                        onClick={onClose}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-lg"
                        onClick={handleConfirm}
                        disabled={isLoading || !password || !adminEmail.trim()}
                    >
                        {isLoading ? 'Verificando...' : 'Autorizar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
