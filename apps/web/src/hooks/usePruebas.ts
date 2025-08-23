/**
 * Hook usePruebas - Manejo del catálogo de pruebas de natación
 * 
 * Integra TanStack Query para proporcionar acceso optimizado al catálogo 
 * de pruebas de natación desde el endpoint /api/v1/catalogos/pruebas.
 * 
 * Características:
 * - Query con cache inteligente para el catálogo completo
 * - Filtros opcionales por estilo, distancia y curso
 * - Estados de loading y error manejados
 * - Utilidades para búsqueda y filtrado local
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

/**
 * Tipos para el catálogo de pruebas
 */
export type EstiloNatacion = 'Libre' | 'Dorso' | 'Pecho' | 'Mariposa' | 'Combinado';
export type TipoCurso = 'SC' | 'LC';

export interface PruebaResponse {
  id: number;
  nombre: string; // "100m Libre SC"
  estilo: EstiloNatacion;
  distancia: number;
  curso: TipoCurso;
}

export interface CatalogoPruebasResponse {
  pruebas: PruebaResponse[];
  total: number;
  estilos_disponibles: EstiloNatacion[];
  cursos_disponibles: TipoCurso[];
}

/**
 * Filtros opcionales para el catálogo
 */
export interface PruebaFilters {
  estilo?: EstiloNatacion;
  distancia?: number;
  curso?: TipoCurso;
}

/**
 * Interfaz del hook usePruebas
 */
export interface UsePruebasReturn {
  // Datos del catálogo
  pruebas: PruebaResponse[];
  total: number;
  estilosDisponibles: EstiloNatacion[];
  cursosDisponibles: TipoCurso[];
  
  // Estados de la query
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  isStale: boolean;
  
  // Métodos
  refetch: () => Promise<any>;
  
  // Query completa (para casos avanzados)
  query: UseQueryResult<CatalogoPruebasResponse, Error>;
  
  // Utilidades
  findById: (id: number) => PruebaResponse | undefined;
  filterByEstilo: (estilo: EstiloNatacion) => PruebaResponse[];
  filterByCurso: (curso: TipoCurso) => PruebaResponse[];
  getDistancias: (estilo?: EstiloNatacion) => number[];
}

/**
 * Hook para obtener el catálogo de pruebas de natación
 */
export function usePruebas(filters?: PruebaFilters): UsePruebasReturn {
  const { isAuthenticated, session } = useAuth();

  // Construir query params para filtros
  const queryParams = new URLSearchParams();
  if (filters?.estilo) queryParams.append('estilo', filters.estilo);
  if (filters?.distancia) queryParams.append('distancia', filters.distancia.toString());
  if (filters?.curso) queryParams.append('curso', filters.curso);
  
  const queryString = queryParams.toString();
  const apiUrl = queryString 
    ? `http://localhost:8000/api/v1/catalogos/pruebas?${queryString}`
    : 'http://localhost:8000/api/v1/catalogos/pruebas';

  // Query principal
  const query = useQuery<CatalogoPruebasResponse, Error>({
    queryKey: ['catalogos', 'pruebas', filters, session?.access_token],
    queryFn: async (): Promise<CatalogoPruebasResponse> => {
      // Headers con token de autenticación si está disponible
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Incluir token de Authorization si el usuario está autenticado
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('No autorizado para acceder al catálogo de pruebas');
        }
        if (response.status === 404) {
          throw new Error('Catálogo de pruebas no encontrado');
        }
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data || !Array.isArray(data.pruebas)) {
        throw new Error('Formato de respuesta inválido del catálogo de pruebas');
      }

      return data as CatalogoPruebasResponse;
    },
    enabled: isAuthenticated, // Solo ejecutar si está autenticado
    staleTime: 15 * 60 * 1000, // 15 minutos (catálogo es relativamente estático)
    gcTime: 30 * 60 * 1000, // 30 minutos en cache
    retry: (failureCount, error) => {
      // No reintentar errores 401
      if (error.message.includes('401')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Utilidades locales
  const findById = (id: number): PruebaResponse | undefined => {
    return query.data?.pruebas.find(prueba => prueba.id === id);
  };

  const filterByEstilo = (estilo: EstiloNatacion): PruebaResponse[] => {
    return query.data?.pruebas.filter(prueba => prueba.estilo === estilo) || [];
  };

  const filterByCurso = (curso: TipoCurso): PruebaResponse[] => {
    return query.data?.pruebas.filter(prueba => prueba.curso === curso) || [];
  };

  const getDistancias = (estilo?: EstiloNatacion): number[] => {
    if (!query.data?.pruebas) return [];
    
    const pruebas = estilo 
      ? filterByEstilo(estilo)
      : query.data.pruebas;
    
    const distancias = [...new Set(pruebas.map(prueba => prueba.distancia))];
    return distancias.sort((a, b) => a - b);
  };

  return {
    // Datos
    pruebas: query.data?.pruebas || [],
    total: query.data?.total || 0,
    estilosDisponibles: query.data?.estilos_disponibles || [],
    cursosDisponibles: query.data?.cursos_disponibles || [],
    
    // Estados
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error?.message || null,
    isStale: query.isStale,
    
    // Métodos
    refetch: query.refetch,
    
    // Query completa
    query,
    
    // Utilidades
    findById,
    filterByEstilo,
    filterByCurso,
    getDistancias,
  };
}

/**
 * Hook simplificado para obtener solo la lista de pruebas
 * Útil para dropdowns simples
 */
export function usePruebasList(filters?: PruebaFilters) {
  const { pruebas, isLoading, isError } = usePruebas(filters);
  
  return {
    pruebas,
    isLoading,
    isError,
  };
}

/**
 * Hook para obtener una prueba específica por ID
 */
export function usePrueba(id: number) {
  const { findById, isLoading, isError, query } = usePruebas();
  
  return {
    prueba: findById(id),
    isLoading,
    isError,
    refetch: query.refetch,
  };
}

/**
 * Hook para obtener distancias disponibles por estilo
 * Útil para filtros en cadena (seleccionar estilo → mostrar distancias)
 */
export function useDistanciasPorEstilo(estilo?: EstiloNatacion) {
  const { getDistancias, isLoading, isError } = usePruebas();
  
  return {
    distancias: getDistancias(estilo),
    isLoading,
    isError,
  };
}
