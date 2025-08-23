/**
 * Tipos TypeScript para autenticación y usuarios en AquaLytics
 */

/**
 * Roles disponibles en el sistema.
 */
export type UserRole = 'entrenador' | 'atleta';

/**
 * Usuario del sistema (tabla usuario en BD).
 */
export interface Usuario {
  /** ID interno del usuario (autoincremental) */
  id: number;
  
  /** Email único del usuario */
  email: string;
  
  /** Rol del usuario en el sistema */
  rol: UserRole;
  
  /** ID del equipo al que pertenece */
  equipo_id: number;
  
  /** UUID de Supabase Auth (auth.users.id) */
  auth_user_id: string | null;
  
  /** Fecha de creación */
  created_at: string;
  
  /** Fecha de última actualización */
  updated_at: string;
}

/**
 * Datos básicos del usuario para autenticación.
 */
export interface AuthUser {
  /** ID de Supabase Auth */
  id: string;
  
  /** Email del usuario */
  email: string;
  
  /** Datos del usuario en nuestra BD */
  usuario?: Usuario;
}

/**
 * Estado de autenticación.
 */
export interface AuthState {
  /** Usuario autenticado (null si no está logueado) */
  user: AuthUser | null;
  
  /** Indica si está cargando */
  loading: boolean;
  
  /** Error de autenticación */
  error: string | null;
  
  /** Rol del usuario (shortcut para user?.usuario?.rol) */
  role: UserRole | null;
  
  /** ID del equipo (shortcut para user?.usuario?.equipo_id) */
  equipoId: number | null;
}

/**
 * Datos para registro de usuario.
 */
export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Datos para login de usuario.
 */
export interface LoginData {
  email: string;
  password: string;
}

/**
 * Permisos por rol.
 */
export const PERMISSIONS = {
  entrenador: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canViewAll: true,
  },
  atleta: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canViewAll: true, // En MVP, atletas pueden ver todo del equipo
  },
} as const;

/**
 * Verificar si un rol tiene un permiso específico.
 */
export function hasPermission(
  role: UserRole | null,
  permission: keyof typeof PERMISSIONS.entrenador
): boolean {
  if (!role) return false;
  return PERMISSIONS[role][permission];
}
