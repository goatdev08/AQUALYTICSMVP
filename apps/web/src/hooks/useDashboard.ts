'use client';

/**
 * Hook para datos del Dashboard
 * 
 * Maneja la obtención de datos de los endpoints del dashboard
 * según especificaciones del PRD.
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Tipos de datos del dashboard
export interface DashboardResumen {
  total_nadadores: number;
  total_competencias: number;
  total_registros: number;
  pbs_recientes: number;
}

export interface Top5Result {
  id: number;
  nadador: string;
  rama: string;
  prueba: string;
  tiempo: string;
  tiempo_cs: number;
  competencia: string;
  fecha: string;
}

export interface DistribucionEstilo {
  label: string;
  value: number;
}

export interface ProximaCompetencia {
  id: number;
  nombre: string;
  curso: string;
  sede: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  dias_restantes: number;
}

export interface AtletaDestacado {
  id: number;
  nombre: string;
  rama: string;
  registros_recientes: number;
  mejor_tiempo: string;
  tiempo_promedio: number;
  metrica: string;
}

export interface ActividadReciente {
  id: number;
  nadador: string;
  rama: string;
  prueba: string;
  tiempo: string;
  tiempo_cs: number;
  competencia: string;
  fecha: string;
  estado_validacion: string;
  tipo_actividad: string;
}

// Types para respuestas con metadatos según PRDv2
export interface DashboardDataResponse<T> {
  data: T[];
  total: number;
  mostradas: number;
  hay_mas: boolean;
}

export type ProximasCompetenciasResponse = DashboardDataResponse<ProximaCompetencia>;
export type AtletasDestacadosResponse = DashboardDataResponse<AtletaDestacado>;
export type ActividadRecienteResponse = DashboardDataResponse<ActividadReciente>;

// Función auxiliar para fetch autenticado
async function fetchWithAuth(url: string, token: string) {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Hook para obtener KPIs del dashboard
 */
export function useDashboardResumen() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'resumen'],
    queryFn: () => fetchWithAuth(`${API_BASE}/api/v1/dashboard/resumen`, token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
}

/**
 * Hook para obtener Top 5 resultados
 */
export function useDashboardTop5(filters?: {
  estilo?: string;
  distancia?: number;
  curso?: string;
  rama?: string;
}) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'top5', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.estilo) params.append('estilo', filters.estilo);
      if (filters?.distancia) params.append('distancia', filters.distancia.toString());
      if (filters?.curso) params.append('curso', filters.curso);
      if (filters?.rama) params.append('rama', filters.rama);
      
      const url = `${API_BASE}/api/v1/dashboard/top5${params.toString() ? `?${params.toString()}` : ''}`;
      return fetchWithAuth(url, token!);
    },
    enabled: !!token,
    staleTime: 2 * 60 * 1000, // 2 minutos
    retry: 2,
  });
}

/**
 * Hook para obtener distribución de estilos
 */
export function useDashboardDistribucionEstilos() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'distribucion-estilos'],
    queryFn: () => fetchWithAuth(`${API_BASE}/api/v1/dashboard/distribucion-estilos`, token!),
    enabled: !!token,
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
  });
}

/**
 * Hook para obtener próximas competencias con metadatos
 */
export function useDashboardProximasCompetencias(dias: number = 30, limite: number = 5) {
  const { token } = useAuth();

  return useQuery<ProximasCompetenciasResponse>({
    queryKey: ['dashboard', 'proximas-competencias', dias, limite],
    queryFn: () => fetchWithAuth(`${API_BASE}/api/v1/dashboard/proximas-competencias?dias=${dias}&limite=${limite}`, token!),
    enabled: !!token,
    staleTime: 15 * 60 * 1000, // 15 minutos
    retry: 2,
  });
}

/**
 * Hook para obtener atletas destacados con metadatos
 */
export function useDashboardAtletasDestacados(dias: number = 30, limite: number = 5) {
  const { token } = useAuth();

  return useQuery<AtletasDestacadosResponse>({
    queryKey: ['dashboard', 'atletas-destacados', dias, limite],
    queryFn: () => fetchWithAuth(`${API_BASE}/api/v1/dashboard/atletas-destacados?dias=${dias}&limite=${limite}`, token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
}

/**
 * Hook para obtener actividad reciente del equipo con metadatos
 */
export function useDashboardActividadReciente(limite: number = 20) {
  const { token } = useAuth();

  return useQuery<ActividadRecienteResponse>({
    queryKey: ['dashboard', 'actividad-reciente', limite],
    queryFn: () => fetchWithAuth(`${API_BASE}/api/v1/dashboard/actividad-reciente?limite=${limite}`, token!),
    enabled: !!token,
    staleTime: 2 * 60 * 1000, // 2 minutos (datos más dinámicos)
    retry: 2,
  });
}
