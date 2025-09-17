"use client";

/**
 * Página principal de competencias
 * 
 * Lista de competencias con filtros por curso, fechas y estado
 * Botón para crear nueva competencia (solo entrenadores)
 * Diseño responsivo con cards y paginación
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  PlusIcon, 
  CalendarIcon, 
  MapPinIcon, 
  FilterIcon,
  LoaderIcon,
  EditIcon,
  EyeIcon,
} from 'lucide-react';
import { ProtectedRoute, EntrenadorOnly } from '@/components/auth';
import { AppLayout } from '@/components/layout';
import { useCompetencias, type CompetenciaFilters, type CursoEnum } from '@/hooks/useCompetencias';
import { CompetenciaSelector } from '@/components/competencias';
import { Button, Alert, AlertDescription } from '@/components/ui';
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
      return { bg: 'bg-accent/20', text: 'text-accent-foreground' };
    case 'Activa':
      return { bg: 'bg-primary/20', text: 'text-primary' };
    case 'Finalizada':
      return { bg: 'bg-muted/50', text: 'text-muted-foreground' };
    default:
      return { bg: 'bg-muted/50', text: 'text-muted-foreground' };
  }
}

/**
 * Obtiene color de badge para curso
 */
function getCursoColor(curso: string): { bg: string; text: string } {
  switch (curso) {
    case 'SC':
      return { bg: 'bg-secondary/20', text: 'text-secondary-foreground' };
    case 'LC':
      return { bg: 'bg-accent/30', text: 'text-accent-foreground' };
    default:
      return { bg: 'bg-muted/50', text: 'text-muted-foreground' };
  }
}

// ============================================================================
// COMPONENTES
// ============================================================================

function CompetenciaCard({ competencia }: { competencia: any }) {
  const estadoColors = getEstadoColor(competencia.estado);
  const cursoColors = getCursoColor(competencia.curso);

  return (
    <div className="bg-card rounded-lg border border-border hover:border-primary/50 hover:shadow-md transition-all duration-200">
      <div className="p-6">
        {/* Header con nombre y badges */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 mr-4">
            <h3 className="text-lg font-semibold text-foreground truncate">
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
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
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
          <div className="flex items-center text-sm text-muted-foreground mb-4">
            <MapPinIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="truncate">{competencia.sede}</span>
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
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
        <div key={i} className="bg-card rounded-lg border border-border animate-pulse">
          <div className="p-6 space-y-4">
            <div className="flex justify-between">
              <div className="h-6 bg-muted rounded w-2/3"></div>
              <div className="space-y-2">
                <div className="h-5 bg-muted/50 rounded w-16"></div>
                <div className="h-5 bg-muted/50 rounded w-20"></div>
              </div>
            </div>
            <div className="h-4 bg-muted/50 rounded w-1/2"></div>
            <div className="h-4 bg-muted/50 rounded w-3/4"></div>
            <div className="flex gap-2 pt-4 border-t border-border">
              <div className="h-8 bg-muted rounded w-16"></div>
              <div className="h-8 bg-muted rounded w-16"></div>
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

  // ========================================
  // QUERY DATA
  // ========================================

  const { 
    data: competenciasData, 
    isLoading, 
    error
  } = useCompetenciasList(filters);

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

  // ========================================
  // RENDER
  // ========================================
  
  return (
    <ProtectedRoute>
      <AppLayout 
        title="Competencias" 
        description="Gestiona las competencias de tu equipo"
      >
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Action buttons */}
          <div className="flex justify-end mb-6">
            <EntrenadorOnly fallback={null}>
              <div>
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
              <FilterIcon className="h-5 w-5 text-muted-foreground mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Filtros</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Búsqueda */}
              <CompetenciaSelector
                value={null}
                onValueChange={(competencia) => {
                  if (competencia) {
                    // Navegar a la competencia seleccionada
                    window.location.href = `/competencias/${competencia.id}`;
                  }
                }}
                placeholder="Buscar competencias instantáneo..."
                className="w-full"
                showFilters={false}
                initialFilters={{ curso: filters.curso as CursoEnum | undefined }}
              />

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
                <p className="text-sm text-muted-foreground">
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
                  <p className="text-muted-foreground mb-6">
                    {filters.search || filters.curso || filters.estado
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
      </AppLayout>
    </ProtectedRoute>
  );
}
