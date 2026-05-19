import { useState, useEffect } from 'react';
import { TreePine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface PreloaderProps {
  message?: string;
  allowForceRedirect?: boolean;
}

export function Preloader({ message = 'Cargando...', allowForceRedirect = false }: PreloaderProps) {
  const [showForceButton, setShowForceButton] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!allowForceRedirect) return;

    const timer = setTimeout(() => {
      setShowForceButton(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [allowForceRedirect]);

  const handleForceRedirect = () => {
    navigate('/');
  };

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-full items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primaryDark flex items-center justify-center shadow-md">
          <TreePine className="h-8 w-8 text-white" />
        </div>
        <div className="space-y-2">
          <p className="text-xl font-medium">{message}</p>
          <p className="text-sm text-muted-foreground">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse mr-1" />
            Preparando tu espacio de trabajo...
          </p>
        </div>
        <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" style={{ width: '40%' }} />
        </div>

        {showForceButton && (
          <div className="mt-4 flex flex-col items-center gap-3 animate-in fade-in slide-up duration-500">
            <p className="text-sm text-destructive font-medium">
              Estamos tardando más de lo usual.
            </p>
            <Button
              variant="outline"
              onClick={handleForceRedirect}
              className="shadow-lg"
            >
              Forzar navegación al Panel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
