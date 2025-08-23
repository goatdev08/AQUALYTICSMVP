/**
 * Hook useCompetencias - Gestión completa de competencias
 * 
 * Proporciona interfaz optimizada con TanStack Query para:
 * - Lista con filtros por curso, fechas y estado
 * - CRUD operations con RBAC (solo entrenadores)
 * - Próximas competencias para dashboard
 * - Cache inteligente y optimistic updates
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useAuthContext } from '@/contexts/auth-context';

// ============================================================================
// TIPOS DE DATOS
// ============================================================================

export type CursoEnum = 'SC' | 'LC';

export interface Competencia {
  id: number;
  equipo_id: number;
  nombre: string;
  curso: CursoEnum;
  rango_fechas: {
    lower: string;
    upper: string;
    bounds: string;
  };
  sede?: string;
  created_at: string;
  updated_at: string;
  // Campos calculados
  duracion_dias?: number;
  es_proxima: boolean;
  es_activa: boolean;
  estado: 'Próxima' | 'Activa' | 'Finalizada';
}

export interface CompetenciaCreate {
  nombre: string;
  curso: CursoEnum;
  fecha_inicio: string; // ISO date string (YYYY-MM-DD)
  fecha_fin: string;    // ISO date string (YYYY-MM-DD)
  sede?: string;
}

export interface CompetenciaUpdate {
  nombre?: string;
  curso?: CursoEnum;
  fecha_inicio?: string; // ISO date string (YYYY-MM-DD)
  fecha_fin?: string;    // ISO date string (YYYY-MM-DD)
  sede?: string;
}

export interface CompetenciaFilters {
  search?: string;
  curso?: CursoEnum;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado?: 'Próxima' | 'Activa' | 'Finalizada';
  page?: number;
  size?: number;
}

export interface CompetenciaListResponse {
  competencias: Competencia[];  // Backend envía "competencias", no "items"
  total: number;
  page: number;
  limit: number;               // Backend envía "limit", no "size"
  has_more: boolean;           // Backend envía "has_more", no "has_next"
}

export interface CompetenciaSelector {
  id: number;
  nombre: string;
  curso: CursoEnum;
  fecha_inicio: string;
  fecha_fin: string;
}

// ============================================================================
// CONFIGURACIÓN DE QUERY KEYS
// ============================================================================

const competenciaKeys = {
  all: ['competencias'] as const,
  lists: () => [...competenciaKeys.all, 'list'] as const,
  list: (filters: CompetenciaFilters) => [...competenciaKeys.lists(), filters] as const,
  details: () => [...competenciaKeys.all, 'detail'] as const,
  detail: (id: number) => [...competenciaKeys.details(), id] as const,
  proximas: () => [...competenciaKeys.all, 'proximas'] as const,
  typeahead: (query: string) => [...competenciaKeys.all, 'typeahead', query] as const,
};

// ============================================================================
// API CLIENT FUNCTIONS
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Obtener token de Supabase session usando el método correcto
  const { createBrowserClient } = await import('@supabase/ssr');
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    
    console.error('🚨 Backend Error Response:', {
      status: response.status,
      statusText: response.statusText,
      errorData: errorData,
      url: response.url
    });
    
    // Mostrar detalles específicos de validación si existen
    if (errorData && Array.isArray(errorData.detail)) {
      console.error('🔍 Detalles de validación Pydantic:', errorData.detail.map((err: any, index: number) => ({
        error: index + 1,
        type: err.type,
        location: err.loc,
        message: err.msg,
        input: err.input
      })));
    }
    
    // Extraer mensaje de error más detallado
    let errorMessage = `HTTP ${response.status}`;
    
    if (errorData) {
      if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        // Error de validación Pydantic con array de errores
        const firstError = errorData.detail[0];
        errorMessage = firstError?.msg || firstError?.message || errorMessage;
      } else if (errorData.detail?.message) {
        errorMessage = errorData.detail.message;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    }
    
    const error = new Error(errorMessage);
    (error as any).response = { 
      status: response.status, 
      data: errorData,
      statusText: response.statusText 
    };
    
    throw error;
  }

  return response.json();
}

// Función para listar competencias con filtros
async function fetchCompetencias(filters: CompetenciaFilters = {}): Promise<CompetenciaListResponse> {
  const params = new URLSearchParams();
  
  if (filters.search) params.append('search', filters.search);
  if (filters.curso) params.append('curso', filters.curso);
  if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
  if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);
  if (filters.estado) params.append('estado', filters.estado);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.size) params.append('size', filters.size.toString());

  const url = `${API_BASE_URL}/api/v1/competencias/?${params.toString()}`;
  return fetchWithAuth(url);
}

// Función para obtener próximas competencias
async function fetchProximasCompetencias(limit: number = 5): Promise<Competencia[]> {
  const url = `${API_BASE_URL}/api/v1/competencias/proximas?limit=${limit}`;
  return fetchWithAuth(url);
}

// Función para obtener competencia por ID
async function fetchCompetenciaById(id: number): Promise<Competencia> {
  const url = `${API_BASE_URL}/api/v1/competencias/${id}`;
  return fetchWithAuth(url);
}

// Función para crear competencia
async function createCompetencia(competencia: CompetenciaCreate): Promise<Competencia> {
  console.log('📤 Datos que se envían al backend:', JSON.stringify(competencia, null, 2));
  
  const url = `${API_BASE_URL}/api/v1/competencias/`;
  const response = await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(competencia),
  });
  
  console.log('📥 Respuesta exitosa del backend:', response);
  return response;
}

// Función para actualizar competencia
async function updateCompetencia(id: number, updates: CompetenciaUpdate): Promise<Competencia> {
  const url = `${API_BASE_URL}/api/v1/competencias/${id}`;
  return fetchWithAuth(url, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// Función para eliminar competencia
async function deleteCompetencia(id: number): Promise<void> {
  const url = `${API_BASE_URL}/api/v1/competencias/${id}`;
  await fetchWithAuth(url, {
    method: 'DELETE',
  });
}

// ============================================================================
// HOOKS PRINCIPALES
// ============================================================================

/**
 * Hook principal para gestión de competencias
 */
export function useCompetencias() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  // ========================================
  // QUERY: Lista de competencias
  // ========================================
  
  const useCompetenciasList = useCallback((filters: CompetenciaFilters = {}) => {
    return useQuery({
      queryKey: competenciaKeys.list(filters),
      queryFn: () => fetchCompetencias(filters),
      enabled: !!user,
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 10, // 10 minutos (antes cacheTime)
    });
  }, [user]);

  // ========================================
  // QUERY: Próximas competencias
  // ========================================
  
  const useProximasCompetencias = useCallback((limit?: number) => {
    return useQuery({
      queryKey: competenciaKeys.proximas(),
      queryFn: () => fetchProximasCompetencias(limit),
      enabled: !!user,
      staleTime: 1000 * 60 * 3, // 3 minutos
      gcTime: 1000 * 60 * 15, // 15 minutos
    });
  }, [user]);

  // Hook para obtener una competencia por ID
  const useCompetenciaById = useCallback((id: number) => {
    return useQuery({
      queryKey: competenciaKeys.detail(id),
      queryFn: () => fetchCompetenciaById(id),
      enabled: !!user && !!id && id > 0,
      staleTime: 1000 * 60 * 10, // 10 minutos
      gcTime: 1000 * 60 * 60, // 1 hora
    });
  }, [user]);



  // ========================================
  // MUTATION: Crear competencia
  // ========================================
  
  const useCreateCompetencia = useCallback(() => {
    return useMutation({
      mutationFn: createCompetencia,
      onSuccess: (newCompetencia) => {
        // Invalidar todas las queries relacionadas con competencias
        queryClient.invalidateQueries({ queryKey: competenciaKeys.all });
        
        // Añadir al cache del detalle
        queryClient.setQueryData(
          competenciaKeys.detail(newCompetencia.id),
          newCompetencia
        );
      },
      onError: (error) => {
        console.error('Error al crear competencia:', error);
      },
    });
  }, [queryClient]);

  // ========================================
  // MUTATION: Actualizar competencia
  // ========================================
  
  const useUpdateCompetencia = useCallback(() => {
    return useMutation({
      mutationFn: ({ id, updates }: { id: number; updates: CompetenciaUpdate }) =>
        updateCompetencia(id, updates),
      onSuccess: (updatedCompetencia) => {
        // Actualizar cache del detalle
        queryClient.setQueryData(
          competenciaKeys.detail(updatedCompetencia.id),
          updatedCompetencia
        );
        
        // Invalidar todas las queries relacionadas con competencias
        queryClient.invalidateQueries({ queryKey: competenciaKeys.all });
      },
      onError: (error) => {
        console.error('Error al actualizar competencia:', error);
      },
    });
  }, [queryClient]);

  // ========================================
  // MUTATION: Eliminar competencia
  // ========================================
  
  const useDeleteCompetencia = useCallback(() => {
    return useMutation({
      mutationFn: deleteCompetencia,
      onSuccess: (_, deletedId) => {
        // Remover del cache
        queryClient.removeQueries({ queryKey: competenciaKeys.detail(deletedId) });
        
        // Invalidar listas para refrescar
        queryClient.invalidateQueries({ queryKey: competenciaKeys.lists() });
        queryClient.invalidateQueries({ queryKey: competenciaKeys.proximas() });
      },
      onError: (error) => {
        console.error('Error al eliminar competencia:', error);
      },
    });
  }, [queryClient]);

  // ========================================
  // UTILIDADES
  // ========================================

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: competenciaKeys.all });
  }, [queryClient]);

  return useMemo(() => ({
    // Query hooks
    useCompetenciasList,
    useProximasCompetencias,
    useCompetenciaById,
    
    // Mutation hooks
    useCreateCompetencia,
    useUpdateCompetencia,
    useDeleteCompetencia,
    
    // Utilities
    invalidateAll,
  }), [
    useCompetenciasList,
    useProximasCompetencias,
    useCompetenciaById,
    useCreateCompetencia,
    useUpdateCompetencia,
    useDeleteCompetencia,
    invalidateAll,
  ]);
}

// ============================================================================
// EXPORT POR DEFECTO
// ============================================================================

export default useCompetencias;
