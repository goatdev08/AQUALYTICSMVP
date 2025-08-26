"use client";

/**
 * Hook para analytics y estadísticas de nadadores
 * 
 * Consume datos reales del endpoint /api/v1/analitica/nadador/{id}/resumen
 * proporcionando analytics completos de rendimiento del nadador.
 */

import { useQuery } from '@tanstack/react-query';
import { useAuthContext } from '@/contexts/auth-context';
import { type Nadador } from './useNadadores';

// ============================================================================
// TIPOS DE DATOS
// ============================================================================

export interface MejorMarca {
  prueba: string;
  curso: 'SC' | 'LC'; // Short Course (25m) | Long Course (50m)  
  tiempo: number; // en segundos
  tiempo_formateado: string; // MM:SS.CC
  fecha: string;
  competencia: string;
  lugar: string;
}

export interface EvolucionTiempo {
  fecha: string;
  prueba: string;
  tiempo: number;
  tiempo_formateado: string; // MM:SS.CC
  competencia: string;
}

export interface DistribucionEstilo {
  estilo: string;
  pruebas_nadadas: number;
  mejor_tiempo: number;
  mejor_tiempo_formateado: string; // MM:SS.CC
  prueba_mejor_tiempo: string; // Contexto específico
  promedio: number;
  promedio_formateado: string; // MM:SS.CC
  prueba_promedio: string; // Contexto específico  
  porcentaje: number;
}

export interface RegistroReciente {
  id: number;
  fecha: string;
  competencia: string;
  prueba: string;
  tiempo: number;
  tiempo_formateado: string; // MM:SS.CC
  lugar?: number; // Opcional hasta que tengamos datos reales
  puntaje?: number;
}

export interface RankingNadador {
  nadador_id: number;
  nombre_completo: string;
  posicion_equipo: number;
  mejor_tiempo: number;
  mejor_tiempo_formateado: string; // MM:SS.CC
  promedio_cs: number;
  promedio_formateado: string; // MM:SS.CC
  total_participaciones: number;
}

export interface EstadisticasRanking {
  total_participantes: number;
  mejor_tiempo_equipo: number;
  mejor_tiempo_equipo_formateado: string; // MM:SS.CC
  promedio_equipo: number;
  promedio_equipo_formateado: string; // MM:SS.CC
  nadador_mas_participaciones: string;
}

export interface RankingData {
  prueba_seleccionada: string;
  curso_seleccionado?: string;
  ranking: RankingNadador[];
  posicion_nadador_actual: number;
  estadisticas: EstadisticasRanking;
}

export interface NadadorAnalytics {
  nadador_id: number;
  mejores_marcas: MejorMarca[];
  evolucion_temporal: EvolucionTiempo[];
  distribucion_estilos: DistribucionEstilo[];
  registros_recientes: RegistroReciente[];
  ranking_intra_equipo: RankingData;
  estadisticas_generales: {
    total_competencias: number;
    total_pruebas: number;
    eventos_ultimo_mes: number;
  };
}

// ============================================================================
// CONFIGURACIÓN DE QUERY KEYS
// ============================================================================

const nadadorAnalyticsKeys = {
  all: ['nadadorAnalytics'] as const,
  details: () => [...nadadorAnalyticsKeys.all, 'detail'] as const,
  detail: (id: number) => [...nadadorAnalyticsKeys.details(), id] as const,
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
    throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// API function para obtener analytics del nadador
const nadadorAnalyticsApi = {
  get: async (id: number): Promise<NadadorAnalytics> => {
    return fetchWithAuth(`${API_BASE_URL}/api/v1/analitica/nadador/${id}/resumen`);
  },
};



// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useNadadorAnalytics(nadador?: Nadador) {
  const { user } = useAuthContext();

  return useQuery<NadadorAnalytics | null>({
    queryKey: nadadorAnalyticsKeys.detail(nadador?.id || 0),
    queryFn: async (): Promise<NadadorAnalytics | null> => {
      if (!nadador?.id) return null;
      return nadadorAnalyticsApi.get(nadador.id);
    },
    enabled: !!user && !!nadador?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: (failureCount, error) => {
      // No reintentar en errores de autenticación o autorización
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

// Types ya exportados arriba en sus definiciones
