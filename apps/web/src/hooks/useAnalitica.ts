/**
 * Hook para análisis y comparaciones de rendimiento.
 * 
 * Proporciona funciones para obtener promedios de equipo,
 * comparar resultados entre nadadores y aplicar filtros avanzados.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

// ==========================================
// Tipos y Interfaces
// ==========================================

export interface AnaliticaFilters {
  prueba_id?: number;
  estilo?: 'Libre' | 'Espalda' | 'Pecho' | 'Mariposa' | 'Combinado';
  distancia?: number;
  curso?: 'SC' | 'LC';
  nadador_id?: number;
  rama?: 'F' | 'M';
  fecha_desde?: string; // YYYY-MM-DD
  fecha_hasta?: string; // YYYY-MM-DD
  competencia_id?: number;
}

export interface SegmentoPromedio {
  indice: number;
  tiempo_promedio: string;
  tiempo_promedio_cs: number;
  brazadas_promedio: number;
  flecha_promedio_m: number;
  dist_sin_flecha_promedio_m: number;
  registros_en_promedio: number;
  prueba: {
    estilo: string;
    distancia: number;
    curso: string;
  };
}

export interface MetadatosPromedio {
  filtros_aplicados: Record<string, any>;
  total_segmentos: number;
  total_registros_analizados: number;
  equipo_id: number;
}

export interface PromedioEquipoResponse {
  segmentos_promedio: SegmentoPromedio[];
  metadatos: MetadatosPromedio;
}

export interface SegmentoComparacion {
  tiempo: string;
  tiempo_cs: number;
  brazadas?: number;
  flecha_m?: number;
  dist_sin_flecha_m?: number;
}

export interface DiferenciasSegmento {
  tiempo_cs: number;
  tiempo_formateado: string;
  brazadas: number;
  flecha_m: number;
  mejora: boolean;
}

export interface ComparacionSegmento {
  indice: number;
  resultado1: SegmentoComparacion;
  resultado2: SegmentoComparacion;
  diferencias: DiferenciasSegmento;
}

export interface ResultadoComparacion {
  id: number;
  tiempo_global: string;
  tiempo_global_cs: number;
  fecha_registro: string;
  competencia: string;
}

export interface ComparacionGlobal {
  diferencia_cs: number;
  diferencia_formateada: string;
  diferencia_porcentaje: number;
  mejora: boolean;
  resultado_mas_reciente: number;
}

export interface ResumenComparacion {
  total_segmentos_comparados: number;
  segmentos_mejorados: number;
  segmentos_empeorados: number;
}

export interface NadadorInfo {
  id: number;
  nombre: string;
  rama: string;
}

export interface PruebaInfo {
  id: number;
  estilo: string;
  distancia: number;
  curso: string;
}

export interface ComparacionResponse {
  nadador: NadadorInfo;
  prueba: PruebaInfo;
  resultado1: ResultadoComparacion;
  resultado2: ResultadoComparacion;
  comparacion_global: ComparacionGlobal;
  comparacion_segmentos: ComparacionSegmento[];
  resumen: ResumenComparacion;
}

// ==========================================
// Hook Principal
// ==========================================

export function useAnalitica() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  /**
   * Construye query string a partir de filtros.
   */
  const buildQueryString = (filters: AnaliticaFilters): string => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    
    return params.toString();
  };

  /**
   * Obtiene promedios de equipo por segmento.
   */
  const getPromedioEquipo = async (
    filters: AnaliticaFilters = {}
  ): Promise<PromedioEquipoResponse> => {
    setLoading(true);
    setError(null);

    try {
      const queryString = buildQueryString(filters);
      const url = `${baseUrl}/api/v1/analitica/promedio-equipo${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error obteniendo promedios de equipo';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Compara dos resultados del mismo nadador.
   */
  const compararResultados = async (
    resultado1Id: number,
    resultado2Id: number
  ): Promise<ComparacionResponse> => {
    setLoading(true);
    setError(null);

    try {
      const url = `${baseUrl}/api/v1/analitica/comparar?resultado1_id=${resultado1Id}&resultado2_id=${resultado2Id}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error comparando resultados';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getPromedioEquipo,
    compararResultados,
    setError, // Para limpiar errores manualmente
  };
}

// ==========================================
// Hook especializado para Promedios de Equipo
// ==========================================

export function usePromedioEquipo(filters: AnaliticaFilters = {}) {
  const { getPromedioEquipo, loading, error } = useAnalitica();
  const [data, setData] = useState<PromedioEquipoResponse | null>(null);
  const [lastFilters, setLastFilters] = useState<string>('');

  useEffect(() => {
    const filtersString = JSON.stringify(filters);
    
    // Solo hacer fetch si los filtros cambiaron
    if (filtersString !== lastFilters) {
      setLastFilters(filtersString);
      
      getPromedioEquipo(filters)
        .then(setData)
        .catch((err) => {
          console.error('Error en usePromedioEquipo:', err);
          // No propagar el error, solo loguearlo
          setData(null);
        });
    }
  }, [filters, getPromedioEquipo, lastFilters]);

  const refresh = () => {
    getPromedioEquipo(filters)
      .then(setData)
      .catch((err) => {
        console.error('Error en refresh:', err);
        setData(null);
      });
  };

  return {
    data,
    loading,
    error,
    refresh,
  };
}

// ==========================================
// Hook especializado para Comparaciones
// ==========================================

export function useComparacion() {
  const { compararResultados, loading, error } = useAnalitica();
  const [data, setData] = useState<ComparacionResponse | null>(null);

  const comparar = async (resultado1Id: number, resultado2Id: number) => {
    try {
      const result = await compararResultados(resultado1Id, resultado2Id);
      setData(result);
      return result;
    } catch (err) {
      console.error('Error en comparación:', err);
      throw err;
    }
  };

  const limpiarComparacion = () => {
    setData(null);
  };

  return {
    data,
    loading,
    error,
    comparar,
    limpiarComparacion,
  };
}

// ==========================================
// Utilidades
// ==========================================

/**
 * Convierte enum de estilo a valor de API.
 */
export const estiloToApi = (estilo: string): string => {
  const mapping: Record<string, string> = {
    'libre': 'Libre',
    'espalda': 'Espalda', 
    'pecho': 'Pecho',
    'mariposa': 'Mariposa',
    'combinado': 'Combinado',
  };
  
  return mapping[estilo.toLowerCase()] || estilo;
};

/**
 * Convierte enum de curso a valor de API.
 */
export const cursoToApi = (curso: string): 'SC' | 'LC' => {
  return curso.toUpperCase() as 'SC' | 'LC';
};

/**
 * Convierte enum de rama a valor de API.
 */
export const ramaToApi = (rama: string): 'F' | 'M' => {
  return rama.toUpperCase() as 'F' | 'M';
};

export default useAnalitica;
