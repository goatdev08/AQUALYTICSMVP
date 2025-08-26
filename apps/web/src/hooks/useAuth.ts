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

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext, AppUser } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

/**
 * Interfaz completa del hook useAuth
 */
export interface UseAuthReturn {
  // Estado del usuario
  user: AppUser | null;
  session: any; // Session de Supabase
  token: string | null; // Token de acceso para API calls
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
}

/**
 * Hook principal de autenticación
 */
export function useAuth(): UseAuthReturn {
  const authContext = useAuthContext();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Usar directamente los datos del contexto sin duplicar la lógica
  console.log('🔍 useAuth - context state:', {
    user: !!authContext.user,
    loading: authContext.loading,
    error: !!authContext.error
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

  // Estados combinados (no necesarios, se usan directamente del contexto)

  // Derivar utilidades de rol desde los datos del contexto
  const user = authContext.user;
  const isEntrenador = user?.rol === 'entrenador';
  const isAtleta = user?.rol === 'atleta';

  return {
    // Estado del usuario viene directamente del AuthContext
    user: authContext.user,
    session: authContext.session,
    token: authContext.session?.access_token ?? null,
    isAuthenticated: !!authContext.session && !!authContext.user,
    
    // Estados directos del contexto
    isLoading: authContext.loading,
    isError: !!authContext.error,
    error: authContext.error,
    
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
    
    // Utilidades basadas en datos del contexto
    isEntrenador,
    isAtleta,
    refreshUser: async () => { 
      // El contexto maneja la actualización automáticamente
      console.log('🔄 refreshUser - context will handle updates');
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
