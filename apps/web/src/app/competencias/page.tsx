"use client";

/**
 * Página principal de competencias
 * 
 * Lista de competencias con filtros por curso, fechas y estado
 * Botón para crear nueva competencia (solo entrenadores)
 * Diseño responsivo con cards y paginación
 */

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  PlusIcon, 
  CalendarIcon, 
  MapPinIcon, 
  FilterIcon,
  SearchIcon,
  LoaderIcon,
  EditIcon,
  EyeIcon,
} from 'lucide-react';
import { ProtectedRoute, EntrenadorOnly } from '@/components/auth';
import { useCompetencias, type CompetenciaFilters } from '@/hooks/useCompetencias';
import { Button, Alert, AlertDescription } from '@/components/ui';
import { InputWrapper } from '@/components/ui/input-wrapper';
import { useDebounce } from '@/hooks/useDebounce';
import { mapFigmaVariant } from '@/lib/figma-utils';

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Formatea fecha para mostrar al usuario
 */
function formatFecha(fechaISO: string): string {
  try {
    const fecha = new Date(fechaISO);
    return format(fecha, 'dd MMM yyyy', { locale: es });
  } catch {
    return fechaISO;
  }
}

/**
 * Obtiene color de badge según estado
 */
function getEstadoColor(estado: string): { bg: string; text: string } {
  switch (estado) {
    case 'Próxima':
      return { bg: 'bg-blue-100', text: 'text-blue-800' };
    case 'Activa':
      return { bg: 'bg-green-100', text: 'text-green-800' };
    case 'Finalizada':
      return { bg: 'bg-gray-100', text: 'text-gray-800' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800' };
  }
}

/**
 * Obtiene color de badge para curso
 */
function getCursoColor(curso: string): { bg: string; text: string } {
  switch (curso) {
    case 'SC':
      return { bg: 'bg-purple-100', text: 'text-purple-800' };
    case 'LC':
      return { bg: 'bg-indigo-100', text: 'text-indigo-800' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800' };
  }
}

// ============================================================================
// COMPONENTES
// ============================================================================

function CompetenciaCard({ competencia }: { competencia: any }) {
  const estadoColors = getEstadoColor(competencia.estado);
  const cursoColors = getCursoColor(competencia.curso);

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200">
      <div className="p-6">
        {/* Header con nombre y badges */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 mr-4">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {competencia.nombre}
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoColors.bg} ${estadoColors.text}`}>
              {competencia.estado}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cursoColors.bg} ${cursoColors.text}`}>
              {competencia.curso === 'SC' ? 'Piscina Corta (25m)' : 'Piscina Larga (50m)'}
            </span>
          </div>
        </div>

        {/* Fechas */}
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
          <span>
            {formatFecha(competencia.rango_fechas.lower)} - {formatFecha(competencia.rango_fechas.upper)}
          </span>
          {competencia.duracion_dias && (
            <span className="ml-2 text-xs text-gray-500">
              ({competencia.duracion_dias} día{competencia.duracion_dias !== 1 ? 's' : ''})
            </span>
          )}
        </div>

        {/* Sede */}
        {competencia.sede && (
          <div className="flex items-center text-sm text-gray-600 mb-4">
            <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span className="truncate">{competencia.sede}</span>
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
          <Link href={`/competencias/${competencia.id}`}>
            <Button variant="outline" size="sm" className="flex items-center">
              <EyeIcon className="h-3 w-3 mr-1" />
              Ver
            </Button>
          </Link>
          
          <EntrenadorOnly fallback={null}>
            <Link href={`/competencias/${competencia.id}/editar`}>
              <Button variant="outline" size="sm" className="flex items-center">
                <EditIcon className="h-3 w-3 mr-1" />
                Editar
              </Button>
            </Link>
          </EntrenadorOnly>
        </div>
      </div>
    </div>
  );
}

function CompetenciasLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 animate-pulse">
          <div className="p-6 space-y-4">
            <div className="flex justify-between">
              <div className="h-6 bg-gray-200 rounded w-2/3"></div>
              <div className="space-y-2">
                <div className="h-5 bg-gray-100 rounded w-16"></div>
                <div className="h-5 bg-gray-100 rounded w-20"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
            <div className="flex gap-2 pt-4 border-t border-gray-100">
              <div className="h-8 bg-gray-200 rounded w-16"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function CompetenciasPage() {
  const { useCompetenciasList } = useCompetencias();

  // ========================================
  // ESTADO DE FILTROS
  // ========================================
  
  const [filters, setFilters] = useState<CompetenciaFilters>({
    search: '',
    curso: undefined,
    estado: undefined,
    page: 1,
    size: 12,
  });

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  // ========================================
  // QUERY DATA
  // ========================================
  
  const finalFilters = useMemo(() => ({
    ...filters,
    search: debouncedSearch || undefined,
  }), [filters, debouncedSearch]);

  const { 
    data: competenciasData, 
    isLoading, 
    error,
    refetch 
  } = useCompetenciasList(finalFilters);

  // ========================================
  // HANDLERS
  // ========================================
  
  const handleFiltroChange = (key: keyof CompetenciaFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value,
      page: 1, // Reset page when filter changes
    }));
  };

  const handleLoadMore = () => {
    if (competenciasData?.has_more) {
      setFilters(prev => ({
        ...prev,
        page: (prev.page || 1) + 1
      }));
    }
  };

  // ========================================
  // PROPS FIGMA
  // ========================================
  
  const primaryButtonProps = mapFigmaVariant('Button', 'buttonsolid', {});
  const inputProps = mapFigmaVariant('Input', 'Droplistborder', {});

  // ========================================
  // RENDER
  // ========================================
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Competencias</h1>
              <p className="text-gray-600 mt-1">
                Gestiona las competencias de tu equipo
              </p>
            </div>
            
            <EntrenadorOnly fallback={null}>
              <div className="mt-4 sm:mt-0">
                <Link href="/competencias/nueva">
                  <Button className="flex items-center" {...primaryButtonProps}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Nueva Competencia
                  </Button>
                </Link>
              </div>
            </EntrenadorOnly>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center mb-4">
              <FilterIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Filtros</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Búsqueda */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar competencias..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${inputProps.className}`}
                />
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              {/* Filtro por Curso */}
              <select
                value={filters.curso || ''}
                onChange={(e) => handleFiltroChange('curso', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Todos los cursos</option>
                <option value="SC">Piscina Corta (25m)</option>
                <option value="LC">Piscina Larga (50m)</option>
              </select>

              {/* Filtro por Estado */}
              <select
                value={filters.estado || ''}
                onChange={(e) => handleFiltroChange('estado', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Todos los estados</option>
                <option value="Próxima">Próximas</option>
                <option value="Activa">Activas</option>
                <option value="Finalizada">Finalizadas</option>
              </select>

              {/* Tamaño de página */}
              <select
                value={filters.size || 12}
                onChange={(e) => handleFiltroChange('size', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value={6}>6 por página</option>
                <option value={12}>12 por página</option>
                <option value={24}>24 por página</option>
              </select>
            </div>
          </div>

          {/* Contenido Principal */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>
                Error al cargar competencias: {
                  error instanceof Error ? error.message : 'Error desconocido'
                }
              </AlertDescription>
            </Alert>
          )}

          {isLoading && <CompetenciasLoading />}

          {competenciasData && competenciasData.competencias && (
            <>
              {/* Estadísticas */}
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Mostrando {competenciasData.competencias.length} de {competenciasData.total} competencias
                </p>
              </div>

              {/* Lista de Competencias */}
              {competenciasData.competencias.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {competenciasData.competencias.map((competencia) => (
                    <CompetenciaCard key={competencia.id} competencia={competencia} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay competencias
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {debouncedSearch || filters.curso || filters.estado
                      ? 'No se encontraron competencias con los filtros actuales.'
                      : 'Aún no has creado ninguna competencia.'
                    }
                  </p>
                  
                  <EntrenadorOnly fallback={null}>
                    <Link href="/competencias/nueva">
                      <Button {...primaryButtonProps}>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Crear Primera Competencia
                      </Button>
                    </Link>
                  </EntrenadorOnly>
                </div>
              )}

              {/* Paginación (Load More) */}
              {competenciasData.has_more && (
                <div className="text-center mt-8">
                  <Button
                    onClick={handleLoadMore}
                    variant="outline"
                    disabled={isLoading}
                    className="flex items-center mx-auto"
                  >
                    {isLoading ? (
                      <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Cargar Más
                  </Button>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
}
