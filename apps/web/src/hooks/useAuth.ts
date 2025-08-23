/**
 * Hook useAuth - Interfaz principal para autenticación
 * 
 * Integra AuthContext con TanStack Query para proporcionar una interfaz
 * completa y optimizada para el manejo de autenticación en componentes.
 * 
 * Características:
 * - Mutations optimizadas para login, logout, register
 * - Queries con cache inteligente para datos de usuario
 * - Estados de loading y error combinados
 * - Utilidades convenientes para verificar roles
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthContext, AppUser } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

/**
 * Interfaz completa del hook useAuth
 */
export interface UseAuthReturn {
  // Estado del usuario
  user: AppUser | null;
  session: any; // Session de Supabase
  isAuthenticated: boolean;
  
  // Estados de carga y error
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  
  // Mutations para acciones de auth
  signIn: {
    mutate: (credentials: { email: string; password: string }) => void;
    mutateAsync: (credentials: { email: string; password: string }) => Promise<any>;
    isLoading: boolean;
    isError: boolean;
    error: any;
    reset: () => void;
  };
  
  signUp: {
    mutate: (data: { email: string; password: string; rol: 'entrenador' | 'atleta' }) => void;
    mutateAsync: (data: { email: string; password: string; rol: 'entrenador' | 'atleta' }) => Promise<any>;
    isLoading: boolean;
    isError: boolean;
    error: any;
    reset: () => void;
  };
  
  signOut: {
    mutate: () => void;
    mutateAsync: () => Promise<any>;
    isLoading: boolean;
    isError: boolean;
    error: any;
  };
  
  // Utilidades
  isEntrenador: boolean;
  isAtleta: boolean;
  refreshUser: () => Promise<void>;
  
  // Query del usuario actual (con cache de TanStack Query)
  userQuery: {
    data: AppUser | null;
    isLoading: boolean;
    isError: boolean;
    error: any;
    refetch: () => Promise<any>;
  };
}

/**
 * Hook principal de autenticación
 */
export function useAuth(): UseAuthReturn {
  const authContext = useAuthContext();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Query para datos del usuario actual via GET /me del backend (con cache)
  const userQuery = useQuery<AppUser | null>({
    queryKey: ['auth', 'user', authContext.session?.access_token],
    queryFn: async () => {
      // Solo ejecutar si hay sesión con token
      if (!authContext.session?.access_token) {
        return null;
      }

      const token = authContext.session.access_token;
      
               const response = await fetch('http://localhost:8000/api/v1/me', {
           method: 'GET',
           headers: {
             'Authorization': `Bearer ${token}`,
             'Content-Type': 'application/json',
           },
         });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token JWT inválido o expirado');
        }
        if (response.status === 404) {
          throw new Error('Usuario no encontrado en el sistema');
        }
        throw new Error(`Error del backend: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data || !data.usuario) {
        throw new Error('Respuesta del backend en formato inesperado');
      }

      // Convertir a formato AppUser con tipos explícitos
      const userData: AppUser = {
        id: data.usuario.auth_user_id,
        email: data.usuario.email,
        rol: data.usuario.rol,
        equipo_id: data.usuario.equipo_id,
        created_at: data.usuario.created_at,
        updated_at: data.usuario.updated_at,
      };

      return userData;
    },
    enabled: !!authContext.session?.access_token,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (antes era cacheTime)
    retry: (failureCount, error) => {
      // No reintentar errores 401 (token inválido) o 404 (usuario no encontrado)
      if (error.message.includes('401') || error.message.includes('404')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Mutation para inicio de sesión
  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const result = await authContext.signIn(email, password);
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }
      return result;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas con auth
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      
      // Redirigir al dashboard tras login exitoso
      router.push('/dashboard');
    },
    onError: (error) => {
      console.error('Error en signIn:', error);
    },
  });

  // Mutation para registro
  const signUpMutation = useMutation({
    mutationFn: async ({ 
      email, 
      password, 
      rol 
    }: { 
      email: string; 
      password: string; 
      rol: 'entrenador' | 'atleta' 
    }) => {
      const result = await authContext.signUp(email, password, rol);
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }
      return result;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas con auth
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      
      // Redirigir al dashboard tras registro exitoso
      router.push('/dashboard');
    },
    onError: (error) => {
      console.error('Error en signUp:', error);
    },
  });

  // Mutation para logout
  const signOutMutation = useMutation({
    mutationFn: async () => {
      await authContext.signOut();
    },
    onSuccess: () => {
      // Limpiar completamente el cache de queries de auth
      queryClient.removeQueries({ queryKey: ['auth'] });
      queryClient.clear(); // Limpiar todo el cache para un logout limpio
      
      // El redirect lo maneja authContext.signOut()
    },
    onError: (error) => {
      console.error('Error en signOut:', error);
      // Aún así limpiar el cache
      queryClient.removeQueries({ queryKey: ['auth'] });
    },
  });

  // Estados combinados
  const isLoading = authContext.loading || signInMutation.isPending || signUpMutation.isPending || signOutMutation.isPending;
  const isError = !!authContext.error || signInMutation.isError || signUpMutation.isError || signOutMutation.isError;
  const error = authContext.error || 
                (signInMutation.error as Error)?.message || 
                (signUpMutation.error as Error)?.message || 
                (signOutMutation.error as Error)?.message || 
                null;

  // Derivar utilidades de rol desde los datos de la query
  const user = userQuery.data;
  const isEntrenador = user?.rol === 'entrenador';
  const isAtleta = user?.rol === 'atleta';

  return {
    // Estado del usuario (ahora viene de TanStack Query, no AuthContext)
    user: userQuery.data ?? null,
    session: authContext.session,
    isAuthenticated: !!authContext.session && !!userQuery.data,
    
    // Estados combinados (incluye loading de la query)
    isLoading: isLoading || userQuery.isLoading,
    isError: isError || userQuery.isError,
    error: error || (userQuery.error as Error)?.message || null,
    
    // Mutations
    signIn: {
      mutate: signInMutation.mutate,
      mutateAsync: signInMutation.mutateAsync,
      isLoading: signInMutation.isPending,
      isError: signInMutation.isError,
      error: signInMutation.error,
      reset: signInMutation.reset,
    },
    
    signUp: {
      mutate: signUpMutation.mutate,
      mutateAsync: signUpMutation.mutateAsync,
      isLoading: signUpMutation.isPending,
      isError: signUpMutation.isError,
      error: signUpMutation.error,
      reset: signUpMutation.reset,
    },
    
    signOut: {
      mutate: signOutMutation.mutate,
      mutateAsync: signOutMutation.mutateAsync,
      isLoading: signOutMutation.isPending,
      isError: signOutMutation.isError,
      error: signOutMutation.error,
    },
    
    // Utilidades (ahora basadas en datos de TanStack Query)
    isEntrenador,
    isAtleta,
    refreshUser: async () => { 
      await userQuery.refetch(); 
    },
    
    // Query del usuario
    userQuery: {
      data: userQuery.data ?? null,
      isLoading: userQuery.isLoading,
      isError: userQuery.isError,
      error: userQuery.error,
      refetch: userQuery.refetch,
    },
  };
}

/**
 * Hook simplificado que solo expone el estado básico
 * Útil cuando no necesitas las mutations
 */
export function useAuthState() {
  const auth = useAuth();
  
  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    isEntrenador: auth.isEntrenador,
    isAtleta: auth.isAtleta,
  };
}
