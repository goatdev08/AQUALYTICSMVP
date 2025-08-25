/**
 * Hook para gestión de resultados de natación.
 * 
 * Proporciona operaciones CRUD y funciones de búsqueda para resultados
 * con integración TanStack Query para cache y optimización.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createBrowserClient } from '@supabase/ssr';
import { useAuth } from './useAuth';
import type { 
  CrearResultadoPayload,
  ResultadoResponse,
  ResultadoCompletoResponse,
  ResultadoListResponse,
  ResultadoSearchFilters
} from '@/types/resultados';

// =====================
// Configuración de API
// =====================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Obtener sesión activa de Supabase (similar a usePruebas.ts)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  } else {
    throw new Error('No hay token de autenticación activo');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// =====================
// API Functions
// =====================

const resultadoApi = {
  /**
   * Crear resultado completo con segmentos
   */
  create: async (data: CrearResultadoPayload): Promise<ResultadoCompletoResponse> => {
    return fetchWithAuth(`${API_BASE_URL}/api/v1/resultados`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Listar resultados con filtros y paginación
   */
  list: async (
    filters?: ResultadoSearchFilters,
    page = 1,
    size = 20
  ): Promise<ResultadoListResponse> => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    // Agregar filtros si están presentes
    if (filters?.nadador_id) queryParams.append('nadador_id', filters.nadador_id.toString());
    if (filters?.competencia_id) queryParams.append('competencia_id', filters.competencia_id.toString());
    if (filters?.prueba_id) queryParams.append('prueba_id', filters.prueba_id.toString());
    if (filters?.rama) queryParams.append('rama', filters.rama);
    if (filters?.fecha_inicio) queryParams.append('fecha_inicio', filters.fecha_inicio);
    if (filters?.fecha_fin) queryParams.append('fecha_fin', filters.fecha_fin);
    if (filters?.estado_validacion) queryParams.append('estado_validacion', filters.estado_validacion);
    if (filters?.fase) queryParams.append('fase', filters.fase);

    return fetchWithAuth(`${API_BASE_URL}/api/v1/resultados?${queryParams}`);
  },

  /**
   * Obtener resultado específico por ID
   */
  getById: async (id: number): Promise<ResultadoCompletoResponse> => {
    return fetchWithAuth(`${API_BASE_URL}/api/v1/resultados/${id}`);
  },

  /**
   * Actualizar resultado
   */
  update: async (id: number, data: Partial<CrearResultadoPayload>): Promise<ResultadoResponse> => {
    return fetchWithAuth(`${API_BASE_URL}/api/v1/resultados/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Alternar estado de revisión (valido ↔ revisar)
   */
  marcarRevisar: async (id: number): Promise<{ success: boolean; nuevo_estado: string; message: string }> => {
    return fetchWithAuth(`${API_BASE_URL}/api/v1/resultados/${id}/revisar`, {
      method: 'PATCH',
    });
  },
};

// =====================
// Query Keys
// =====================

export const resultadoKeys = {
  all: ['resultados'] as const,
  lists: () => [...resultadoKeys.all, 'list'] as const,
  list: (filters?: ResultadoSearchFilters) => [...resultadoKeys.lists(), filters] as const,
  details: () => [...resultadoKeys.all, 'detail'] as const,
  detail: (id: number) => [...resultadoKeys.details(), id] as const,
} as const;

// =====================
// Custom Hooks
// =====================

/**
 * Hook para crear un resultado completo
 */
export function useCreateResultado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resultadoApi.create,
    onSuccess: (data) => {
      // Invalidar listas de resultados para refrescar
      queryClient.invalidateQueries({ queryKey: resultadoKeys.lists() });
      
      // Actualizar cache del resultado específico
      queryClient.setQueryData(
        resultadoKeys.detail(data.id),
        data
      );
    },
    onError: (error) => {
      console.error('Error creando resultado:', error);
    },
  });
}

/**
 * Hook para listar resultados con filtros
 */
export function useResultados(
  filters?: ResultadoSearchFilters,
  page = 1,
  size = 20,
  enabled = true
) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: resultadoKeys.list(filters),
    queryFn: () => resultadoApi.list(filters, page, size),
    enabled: isAuthenticated && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,   // 10 minutos
  });
}

/**
 * Hook para obtener un resultado específico
 */
export function useResultado(id: number, enabled = true) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: resultadoKeys.detail(id),
    queryFn: () => resultadoApi.getById(id),
    enabled: isAuthenticated && enabled && id > 0,
    staleTime: 2 * 60 * 1000,  // 2 minutos
    gcTime: 5 * 60 * 1000,     // 5 minutos
  });
}

/**
 * Hook para actualizar un resultado
 */
export function useUpdateResultado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CrearResultadoPayload> }) =>
      resultadoApi.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: resultadoKeys.lists() });
      
      // Actualizar cache específico
      queryClient.invalidateQueries({ queryKey: resultadoKeys.detail(variables.id) });
    },
  });
}

/**
 * Hook para marcar resultado como "revisar"
 */
export function useMarcarRevisar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resultadoApi.marcarRevisar,
    onSuccess: (_, id) => {
      // Invalidar listas y detalle
      queryClient.invalidateQueries({ queryKey: resultadoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: resultadoKeys.detail(id) });
    },
  });
}

// =====================
// Utilidades
// =====================

/**
 * Verifica si un resultado necesita revisión
 */
export function requiereRevision(resultado: ResultadoResponse | ResultadoCompletoResponse): boolean {
  // Si es ResultadoCompletoResponse, acceder a la propiedad anidada
  if ('resultado' in resultado) {
    return resultado.resultado.estado_validacion === 'revisar';
  }
  // Si es ResultadoResponse directo
  return resultado.estado_validacion === 'revisar';
}

/**
 * Calcula el porcentaje de desviación respecto al tiempo global
 */
export function calcularPorcentajeDesviacion(
  desviacion_cs: number,
  tiempo_global_cs: number
): number {
  if (tiempo_global_cs === 0) return 0;
  return Math.abs(desviacion_cs / tiempo_global_cs) * 100;
}

/**
 * Formatea tiempo en centésimas a mm:ss.cc
 */
export function formatearTiempo(tiempoCs: number): string {
  const minutes = Math.floor(tiempoCs / 6000);
  const seconds = Math.floor((tiempoCs % 6000) / 100);
  const centesimals = tiempoCs % 100;
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centesimals.toString().padStart(2, '0')}`;
}

/**
 * Parsea tiempo mm:ss.cc a centésimas
 */
export function parsearTiempo(timeStr: string): number {
  const regex = /^(\d{1,2}):(\d{2})\.(\d{2})$/;
  const match = timeStr.match(regex);
  if (!match) return 0;
  
  const [, mm, ss, cc] = match;
  return parseInt(mm) * 6000 + parseInt(ss) * 100 + parseInt(cc);
}
