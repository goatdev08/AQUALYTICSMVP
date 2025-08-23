/**
 * Exportaciones del sistema de autenticación
 * 
 * Agrupa todos los componentes y utilidades de autenticación
 * para facilitar las importaciones en otros archivos.
 */

// Componentes de protección de rutas
export { 
  ProtectedRoute, 
  withAuth, 
  AuthLoadingSpinner 
} from './ProtectedRoute';

// Componentes de protección por roles
export { 
  RoleGuard,
  EntrenadorOnly,
  AtletaOnly,
  CanCreate,
  CanEdit,
  CanDelete,
  PermissionBased,
  usePermissions
} from './RoleGuard';

// Re-exportar hooks y context para conveniencia
export { useAuth, useAuthState } from '@/hooks/useAuth';
export { useAuthContext, AuthProvider, type AppUser } from '@/contexts/auth-context';
