import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { normalizeUserRole, type NormalizedUserRole } from '@/lib/user-role';

const roleWorkspace: Record<string, string> = {
  cashier: 'cash',
  inventory: 'warehouse',
  dispatcher: 'warehouse',
  vendor: 'sales',
  'sales-manager': 'sales',
  rutero: 'sales',
  'store-admin': 'admin',
};

export default function WorkHomePage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = normalizeUserRole(user?.role);

  useEffect(() => {
    const target = roleWorkspace[role];
    if (target && storeId) {
      navigate(`/store/${storeId}/work/${target}`, { replace: true });
    }
  }, [role, storeId, navigate]);

  return null;
}
