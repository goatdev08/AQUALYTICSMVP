'use client';

/**
 * RoleGuard - Sistema de protección por roles
 * 
 * Componentes para proteger contenido específico basado en el rol del usuario.
 * Implementa el sistema RBAC definido en el PRD:
 * - Entrenador: permisos de lectura/escritura (RW)
 * - Atleta: permisos solo de lectura (R)
 * 
 * Incluye componentes especializados y utilidades para casos comunes.
 */

import { ReactNode } from 'react';
import { useAuthState } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldIcon } from 'lucide-react';

/**
 * Props base para componentes de protección por rol
 */
interface RoleGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  showError?: boolean;
  errorMessage?: string;
}

/**
 * Props para RoleGuard principal con roles específicos
 */
interface RoleGuardWithRolesProps extends RoleGuardProps {
  allowedRoles: Array<'entrenador' | 'atleta'>;
  requireAuth?: boolean;
}

/**
 * Componente principal de protección por rol
 */
export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallback,
  showError = false,
  errorMessage = 'No tienes permisos para ver este contenido',
  requireAuth = true 
}: RoleGuardWithRolesProps) {
  const { user, isAuthenticated, isLoading } = useAuthState();

  // Si está cargando, no mostrar nada
  if (isLoading) {
    return null;
  }

  // Si requiere auth y no está autenticado
  if (requireAuth && !isAuthenticated) {
    if (showError) {
      return (
        <Alert variant="destructive">
          <ShieldIcon className="h-4 w-4" />
          <AlertDescription>
            Debes iniciar sesión para ver este contenido
          </AlertDescription>
        </Alert>
      );
    }
    return fallback ? <>{fallback}</> : null;
  }

  // Si está autenticado, verificar rol
  if (user && allowedRoles.includes(user.rol)) {
    return <>{children}</>;
  }

  // No tiene permisos
  if (showError) {
    return (
      <Alert variant="destructive">
        <ShieldIcon className="h-4 w-4" />
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    );
  }

  return fallback ? <>{fallback}</> : null;
}

/**
 * Componente para contenido exclusivo de entrenadores
 */
export function EntrenadorOnly({ 
  children, 
  fallback,
  showError = false,
  errorMessage = 'Solo los entrenadores pueden ver este contenido' 
}: RoleGuardProps & { errorMessage?: string }) {
  return (
    <RoleGuard 
      allowedRoles={['entrenador']}
      fallback={fallback}
      showError={showError}
      errorMessage={errorMessage}
    >
      {children}
    </RoleGuard>
  );
}

/**
 * Componente para contenido exclusivo de atletas
 */
export function AtletaOnly({ 
  children, 
  fallback,
  showError = false,
  errorMessage = 'Solo los atletas pueden ver este contenido' 
}: RoleGuardProps & { errorMessage?: string }) {
  return (
    <RoleGuard 
      allowedRoles={['atleta']}
      fallback={fallback}
      showError={showError}
      errorMessage={errorMessage}
    >
      {children}
    </RoleGuard>
  );
}

/**
 * Componente para acciones que pueden crear/editar (solo entrenadores)
 */
export function CanCreate({ 
  children, 
  fallback,
  showError = false 
}: RoleGuardProps) {
  return (
    <EntrenadorOnly 
      fallback={fallback}
      showError={showError}
      errorMessage="Solo los entrenadores pueden crear contenido"
    >
      {children}
    </EntrenadorOnly>
  );
}

/**
 * Componente para acciones que pueden editar (solo entrenadores)
 */
export function CanEdit({ 
  children, 
  fallback,
  showError = false 
}: RoleGuardProps) {
  return (
    <EntrenadorOnly 
      fallback={fallback}
      showError={showError}
      errorMessage="Solo los entrenadores pueden editar contenido"
    >
      {children}
    </EntrenadorOnly>
  );
}

/**
 * Componente para acciones que pueden eliminar (solo entrenadores)
 */
export function CanDelete({ 
  children, 
  fallback,
  showError = false 
}: RoleGuardProps) {
  return (
    <EntrenadorOnly 
      fallback={fallback}
      showError={showError}
      errorMessage="Solo los entrenadores pueden eliminar contenido"
    >
      {children}
    </EntrenadorOnly>
  );
}

/**
 * Componente para mostrar contenido según permisos de lectura/escritura
 */
export function PermissionBased({ 
  children, 
  permission,
  fallback,
  showError = false 
}: RoleGuardProps & { permission: 'read' | 'write' }) {
  if (permission === 'read') {
    // Tanto entrenadores como atletas pueden leer
    return (
      <RoleGuard 
        allowedRoles={['entrenador', 'atleta']}
        fallback={fallback}
        showError={showError}
        errorMessage="Necesitas permisos de lectura para ver este contenido"
      >
        {children}
      </RoleGuard>
    );
  }

  if (permission === 'write') {
    // Solo entrenadores pueden escribir/modificar
    return (
      <EntrenadorOnly 
        fallback={fallback}
        showError={showError}
        errorMessage="Solo los entrenadores pueden modificar este contenido"
      >
        {children}
      </EntrenadorOnly>
    );
  }

  return fallback ? <>{fallback}</> : null;
}

/**
 * Hook para verificar permisos programáticamente
 */
export function usePermissions() {
  const { user, isAuthenticated } = useAuthState();

  return {
    canRead: isAuthenticated, // Ambos roles pueden leer
    canWrite: user?.rol === 'entrenador', // Solo entrenadores pueden escribir
    canCreate: user?.rol === 'entrenador',
    canEdit: user?.rol === 'entrenador',
    canDelete: user?.rol === 'entrenador',
    isEntrenador: user?.rol === 'entrenador',
    isAtleta: user?.rol === 'atleta',
    hasRole: (role: 'entrenador' | 'atleta') => user?.rol === role,
  };
}
