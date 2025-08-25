'use client';

/**
 * AuthContext - Contexto global de autenticación para AquaLytics
 * 
 * Maneja el estado de autenticación usando Supabase Auth y proporciona
 * funciones para login, logout, register y gestión de estado de usuario.
 * 
 * Integra con:
 * - Supabase Auth para autenticación
 * - Tabla 'usuario' para datos específicos de la aplicación
 * - Middleware de Next.js para protección de rutas
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// Interfaz del usuario completo (Supabase Auth + nuestra tabla usuario)
export interface AppUser {
  id: string; // ID de Supabase Auth
  email: string;
  rol: 'entrenador' | 'atleta';
  equipo_id: number;
  nombre_completo?: string;
  created_at: string;
  updated_at: string;
}

// Interfaz del contexto de autenticación
export interface AuthContextType {
  // Estado
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  
  // Acciones
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, rol: 'entrenador' | 'atleta') => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Utilidades
  isAuthenticated: boolean;
  isEntrenador: boolean;
  isAtleta: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook para acceder al contexto de autenticación
 */
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext debe ser usado dentro de un AuthProvider');
  }
  return context;
}

/**
 * Propiedades del AuthProvider
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider del contexto de autenticación
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  /**
   * Obtiene los datos del usuario desde el backend via GET /me
   */
  const fetchUserData = async (session: Session): Promise<AppUser | null> => {
    try {
      // Obtener token JWT de la sesión de Supabase
      const token = session.access_token;
      
      if (!token) {
        console.warn('No hay token de acceso disponible');
        return null;
      }

      // Llamar al endpoint GET /me del backend con JWT en headers
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/v1/me`, {
             method: 'GET',
             headers: {
               'Authorization': `Bearer ${token}`,
               'Content-Type': 'application/json',
             },
           });

      if (!response.ok) {
        // Manejar diferentes tipos de errores
        if (response.status === 401) {
          console.warn('Token JWT inválido o expirado');
          return null;
        }
        
        if (response.status === 404) {
          console.warn('Usuario no encontrado en el sistema');
          return null;
        }
        
        console.error(`Error del backend: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      
      // Verificar que la respuesta tenga el formato esperado
      if (!data || !data.usuario) {
        console.error('Respuesta del backend en formato inesperado:', data);
        return null;
      }

      const userData: AppUser = {
        id: data.usuario.auth_user_id, // Usar auth_user_id como id principal
        email: data.usuario.email,
        rol: data.usuario.rol,
        equipo_id: data.usuario.equipo_id,
        created_at: data.usuario.created_at,
        updated_at: data.usuario.updated_at,
      };
      
      return userData;
    } catch (err) {
      // Filtrar errores de red vs errores de logout
      if (err instanceof Error) {
        if (err.message.includes('fetch') || err.message.includes('NetworkError')) {
          console.error('Error de conexión con el backend:', err.message);
        } else {
          console.error('Error inesperado obteniendo datos del usuario:', err);
        }
      } else {
        console.error('Error inesperado obteniendo datos del usuario:', err);
      }
      return null;
    }
  };

  /**
   * Actualiza el estado del usuario basado en la sesión
   */
  const updateUserState = async (session: Session | null) => {
    if (session?.user && session.access_token) {
      // Hay sesión activa, obtener datos del usuario via backend GET /me
      const userData = await fetchUserData(session);
      if (userData) {
        setUser(userData);
        setSession(session);
        setError(null);
        setLoading(false);
      } else {
        // Usuario autenticado pero sin datos en backend o error de conexión
        setError('Usuario no encontrado en el sistema. Por favor, regístrate nuevamente.');
        setUser(null);
        setSession(session); // Mantener sesión para debugging
        setLoading(false);
      }
    } else {
      // No hay sesión activa
      setUser(null);
      setSession(null);
      setError(null);
      setLoading(false);
    }
  };

  /**
   * Función de inicio de sesión
   */
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      // La sesión se actualizará automáticamente por onAuthStateChange
      return { success: true };
    } catch (err) {
      const errorMessage = 'Error inesperado durante el inicio de sesión';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Función de registro
   */
  const signUp = async (email: string, password: string, rol: 'entrenador' | 'atleta') => {
    try {
      setLoading(true);
      setError(null);

      // Paso 1: Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        const errorMessage = 'Error creando usuario';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      // Paso 2: Crear registro en nuestra tabla usuario
      const { error: dbError } = await supabase
        .from('usuario')
        .insert({
          email: email,
          rol: rol,
          equipo_id: 1, // Por ahora fijo para MVP, luego se puede parametrizar
          auth_user_id: authData.user.id,
        });

      if (dbError) {
        const errorMessage = `Error guardando datos del usuario: ${dbError.message}`;
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = 'Error inesperado durante el registro';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Función de cierre de sesión
   */
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error durante logout:', error);
      }
      
      // Limpiar estado local inmediatamente
      setUser(null);
      setSession(null);
      setError(null);
      
      // Redirigir a login
      router.push('/login');
    } catch (err) {
      console.error('Error durante logout:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresca los datos del usuario actual
   */
  const refreshUser = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    await updateUserState(currentSession);
  };

  /**
   * Maneja los cambios de estado de autenticación
   */
  useEffect(() => {
    let isMounted = true;

    // Obtener sesión inicial
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (isMounted) {
          await updateUserState(initialSession);
        }
      } catch (err) {
        console.error('Error inicializando autenticación:', err);
        if (isMounted) {
          setLoading(false);
          setError('Error inicializando autenticación');
        }
      }
    };

    initializeAuth();

    // Suscribirse a cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        
        if (isMounted) {
          switch (event) {
            case 'SIGNED_IN':
            case 'TOKEN_REFRESHED':
              await updateUserState(session);
              break;
            case 'SIGNED_OUT':
              setUser(null);
              setSession(null);
              setError(null);
              setLoading(false);
              break;
            default:
              // Para otros eventos, actualizar estado si es necesario
              if (session !== null) {
                await updateUserState(session);
              }
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Valores calculados
  const isAuthenticated = !!user && !!session;
  const isEntrenador = user?.rol === 'entrenador';
  const isAtleta = user?.rol === 'atleta';

  const value: AuthContextType = {
    // Estado
    user,
    session,
    loading,
    error,
    
    // Acciones
    signIn,
    signUp,
    signOut,
    refreshUser,
    
    // Utilidades
    isAuthenticated,
    isEntrenador,
    isAtleta,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
