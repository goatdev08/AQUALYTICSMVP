/**
 * Hook useNadadores - Gestión completa de nadadores
 * 
 * Proporciona interfaz optimizada con TanStack Query para:
 * - Lista con filtros y búsqueda trigram
 * - CRUD operations con RBAC
 * - Búsqueda typeahead para autocompletar
 * - Cache inteligente y optimistic updates
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useAuthContext } from '@/contexts/auth-context';

// ============================================================================
// TIPOS DE DATOS
// ============================================================================

export interface Nadador {
  id: number;
  equipo_id: number;
  nombre_completo: string;
  fecha_nacimiento: string;
  rama: 'F' | 'M';
  peso?: number;
  edad_actual: number;
  categoria_actual: string;
}

export interface NadadorCreate {
  nombre_completo: string;
  fecha_nacimiento: string;
  rama: 'F' | 'M';
  peso?: number;
}

export interface NadadorUpdate {
  nombre_completo?: string;
  fecha_nacimiento?: string;
  rama?: 'F' | 'M';
  peso?: number;
}

export interface NadadorFilters {
  search?: string;
  rama?: 'F' | 'M';
  categoria?: '11-12' | '13-14' | '15-16' | '17+';
  limit?: number;
  offset?: number;
}

export interface NadadorListResponse {
  items: Nadador[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// ============================================================================
// CONFIGURACIÓN DE QUERY KEYS
// ============================================================================

const nadadorKeys = {
  all: ['nadadores'] as const,
  lists: () => [...nadadorKeys.all, 'list'] as const,
  list: (filters: NadadorFilters) => [...nadadorKeys.lists(), filters] as const,
  details: () => [...nadadorKeys.all, 'detail'] as const,
  detail: (id: number) => [...nadadorKeys.details(), id] as const,
  typeahead: (query: string) => [...nadadorKeys.all, 'typeahead', query] as const,
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
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// API functions
const nadadorApi = {
  // Lista con filtros
  list: async (filters: NadadorFilters = {}): Promise<NadadorListResponse> => {
    const params = new URLSearchParams();
    
    if (filters.search) params.set('search', filters.search);
    if (filters.rama) params.set('rama', filters.rama);
    if (filters.categoria) params.set('categoria', filters.categoria);
    if (filters.limit) params.set('limit', filters.limit.toString());
    if (filters.offset) params.set('offset', filters.offset.toString());
    
    return fetchWithAuth(`${API_BASE_URL}/api/v1/nadadores?${params}`);
  },

  // Detalle individual
  get: async (id: number): Promise<Nadador> => {
    return fetchWithAuth(`${API_BASE_URL}/api/v1/nadadores/${id}`);
  },

  // Crear nadador
  create: async (data: NadadorCreate): Promise<Nadador> => {
    return fetchWithAuth(`${API_BASE_URL}/api/v1/nadadores`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Actualizar nadador
  update: async ({ id, data }: { id: number; data: NadadorUpdate }): Promise<Nadador> => {
    return fetchWithAuth(`${API_BASE_URL}/api/v1/nadadores/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Eliminar nadador
  delete: async (id: number): Promise<void> => {
    return fetchWithAuth(`${API_BASE_URL}/api/v1/nadadores/${id}`, {
      method: 'DELETE',
    });
  },

  // Búsqueda typeahead
  typeahead: async (query: string, limit = 10): Promise<Nadador[]> => {
    if (query.length < 2) return [];
    
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });
    
    return fetchWithAuth(`${API_BASE_URL}/api/v1/nadadores/search/typeahead?${params}`);
  },
};

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useNadadores(filters: NadadorFilters = {}) {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  
  const canCreate = user?.rol === 'entrenador';
  const canEdit = user?.rol === 'entrenador';
  const canDelete = user?.rol === 'entrenador';

  // ========================================
  // QUERIES
  // ========================================
  
  // Lista de nadadores
  const nadadoresQuery = useQuery({
    queryKey: nadadorKeys.list(filters),
    queryFn: () => nadadorApi.list(filters),
    enabled: !!user,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });

  // ========================================
  // MUTATIONS
  // ========================================

  // Crear nadador
  const createMutation = useMutation({
    mutationFn: nadadorApi.create,
    onSuccess: (newNadador) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: nadadorKeys.lists() });
      
      // Optimistic update para listas
      queryClient.setQueriesData<NadadorListResponse>(
        { queryKey: nadadorKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: [newNadador, ...old.items],
            total: old.total + 1,
          };
        }
      );
    },
    onError: (error) => {
      console.error('Error al crear nadador:', error);
    },
  });

  // Actualizar nadador
  const updateMutation = useMutation({
    mutationFn: nadadorApi.update,
    onSuccess: (updatedNadador) => {
      // Actualizar cache del detalle
      queryClient.setQueryData(
        nadadorKeys.detail(updatedNadador.id),
        updatedNadador
      );
      
      // Actualizar en listas
      queryClient.setQueriesData<NadadorListResponse>(
        { queryKey: nadadorKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map(nadador =>
              nadador.id === updatedNadador.id ? updatedNadador : nadador
            ),
          };
        }
      );
    },
    onError: (error) => {
      console.error('Error al actualizar nadador:', error);
    },
  });

  // Eliminar nadador
  const deleteMutation = useMutation({
    mutationFn: nadadorApi.delete,
    onSuccess: (_, id) => {
      // Remover del cache
      queryClient.removeQueries({ queryKey: nadadorKeys.detail(id) });
      
      // Remover de listas
      queryClient.setQueriesData<NadadorListResponse>(
        { queryKey: nadadorKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.filter(nadador => nadador.id !== id),
            total: old.total - 1,
          };
        }
      );
    },
    onError: (error) => {
      console.error('Error al eliminar nadador:', error);
    },
  });

  // ========================================
  // BÚSQUEDA TYPEAHEAD
  // ========================================

  const useTypeahead = useCallback((query: string, limit?: number) => {
    return useQuery({
      queryKey: nadadorKeys.typeahead(query),
      queryFn: () => nadadorApi.typeahead(query, limit),
      enabled: !!user && query.length >= 2,
      staleTime: 60 * 1000, // 1 minuto
      gcTime: 10 * 60 * 1000, // 10 minutos
    });
  }, [user]);

  // ========================================
  // DETALLE INDIVIDUAL
  // ========================================

  const useNadador = useCallback((id: number) => {
    return useQuery({
      queryKey: nadadorKeys.detail(id),
      queryFn: () => nadadorApi.get(id),
      enabled: !!user && !!id,
      staleTime: 2 * 60 * 1000, // 2 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
    });
  }, [user]);

  // ========================================
  // UTILIDADES COMPUTADAS
  // ========================================

  const summary = useMemo(() => {
    const data = nadadoresQuery.data;
    if (!data) return null;

    const ramas = data.items.reduce((acc, nadador) => {
      acc[nadador.rama] = (acc[nadador.rama] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categorias = data.items.reduce((acc, nadador) => {
      acc[nadador.categoria_actual] = (acc[nadador.categoria_actual] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: data.total,
      femeninos: ramas['F'] || 0,
      masculinos: ramas['M'] || 0,
      por_categoria: categorias,
    };
  }, [nadadoresQuery.data]);

  // ========================================
  // RETORNO DEL HOOK
  // ========================================

  return {
    // Datos principales
    nadadores: nadadoresQuery.data?.items || [],
    total: nadadoresQuery.data?.total || 0,
    hasMore: nadadoresQuery.data?.has_more || false,
    
    // Estados de carga
    isLoading: nadadoresQuery.isLoading,
    isError: nadadoresQuery.isError,
    error: nadadoresQuery.error?.message || null,
    
    // Resumen calculado
    summary,
    
    // Capacidades según rol
    permissions: {
      canCreate,
      canEdit,
      canDelete,
    },
    
    // Mutations
    mutations: {
      create: createMutation,
      update: updateMutation,
      delete: deleteMutation,
    },
    
    // Hooks especializados
    useNadador,
    useTypeahead,
    
    // Utilidades
    refetch: nadadoresQuery.refetch,
    invalidate: () => queryClient.invalidateQueries({ queryKey: nadadorKeys.all }),
  };
}

// ============================================================================
// HOOK SIMPLIFICADO PARA TYPEAHEAD
// ============================================================================

export function useNadadorTypeahead(query: string, limit = 10) {
  const { user } = useAuthContext();
  
  return useQuery({
    queryKey: nadadorKeys.typeahead(query),
    queryFn: () => nadadorApi.typeahead(query, limit),
    enabled: !!user && query.length >= 1,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================================================
// HOOK PARA DETALLE INDIVIDUAL
// ============================================================================

export function useNadador(id: number) {
  const { user } = useAuthContext();
  
  return useQuery({
    queryKey: nadadorKeys.detail(id),
    queryFn: () => nadadorApi.get(id),
    enabled: !!user && !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
