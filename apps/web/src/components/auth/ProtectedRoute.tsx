'use client';

/**
 * ProtectedRoute - Componente para proteger rutas completas
 * 
 * Protege rutas que requieren autenticación. Si el usuario no está
 * autenticado, redirige automáticamente a la página de login.
 * 
 * Uso:
 * - Wrapper para páginas que requieren autenticación
 * - Maneja estados de loading elegantemente
 * - Redirige preservando la URL original
 */

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoaderIcon } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * Componente que protege rutas que requieren autenticación
 */
export function ProtectedRoute({ 
  children, 
  fallback,
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();



  useEffect(() => {
    // Si no está cargando y no está autenticado, redirigir
    if (!isLoading && !isAuthenticated) {
      const redirectUrl = new URL(redirectTo, window.location.origin);
      
      // Preservar la URL actual para redirigir después del login
      const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      redirectUrl.searchParams.set('redirect', currentUrl);
      
      router.push(redirectUrl.toString());
    }
  }, [isLoading, isAuthenticated, router, redirectTo, pathname, searchParams]);

  // Mostrar loading mientras se verifica autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <LoaderIcon className="h-8 w-8 animate-spin text-primary mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-medium">🏊‍♂️ AquaLytics</p>
            <p className="text-xs text-muted-foreground">Verificando autenticación...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar fallback o nada (se está redirigiendo)
  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : null;
  }

  // Si hay usuario, mostrar contenido protegido
  return <>{children}</>;
}

/**
 * HOC (Higher Order Component) para proteger componentes
 * 
 * Uso alternativo más funcional:
 * const MyProtectedComponent = withAuth(MyComponent);
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode;
    redirectTo?: string;
  }
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute 
        fallback={options?.fallback} 
        redirectTo={options?.redirectTo}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

/**
 * Componente de loading personalizable para rutas protegidas
 */
export function AuthLoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <LoaderIcon className="h-12 w-12 animate-spin text-primary mx-auto" />
        <div className="space-y-2">
          <h3 className="text-lg font-medium">🏊‍♂️ AquaLytics</h3>
          <p className="text-sm text-muted-foreground">
            {message || 'Verificando autenticación...'}
          </p>
        </div>
      </div>
    </div>
  );
}
