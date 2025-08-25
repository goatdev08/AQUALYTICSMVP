'use client';

/**
 * Componente ProximasCompetenciasList - Lista de próximas competencias
 * 
 * Muestra las competencias próximas del equipo con información relevante.
 * Tema verde consistente y componentes shadcn/ui.
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Calendar, 
  MapPin, 
  Clock, 
  Trophy,
  ChevronRight 
} from 'lucide-react';
import { useDashboardProximasCompetencias } from '@/hooks/useDashboard';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProximasCompetenciasListProps {
  /** Número de días hacia adelante para buscar */
  dias?: number;
  /** Número máximo de competencias a mostrar */
  maxItems?: number;
  /** Mostrar botón "Ver todas" */
  showViewAll?: boolean;
  /** Callback al hacer clic en una competencia */
  onCompetenciaClick?: (competenciaId: number) => void;
  /** Callback al hacer clic en "Ver todas" */
  onViewAllClick?: () => void;
  /** Clase CSS adicional */
  className?: string;
}

export function ProximasCompetenciasList({
  dias = 30,
  maxItems = 5,
  showViewAll = true,
  onCompetenciaClick,
  onViewAllClick,
  className = ''
}: ProximasCompetenciasListProps) {
  // Obtener datos del hook
  const { data: competenciasData, isLoading, error, refetch } = useDashboardProximasCompetencias(dias);

  // Procesar y limitar datos
  const competenciasLimitadas = useMemo(() => {
    if (!competenciasData) return [];
    return competenciasData.slice(0, maxItems);
  }, [competenciasData, maxItems]);

  // Función para obtener el badge de estado según días restantes
  const getEstadoBadge = (diasRestantes: number) => {
    if (diasRestantes < 0) {
      return <Badge variant="secondary">En curso</Badge>;
    } else if (diasRestantes === 0) {
      return <Badge className="bg-red-100 text-red-800">Hoy</Badge>;
    } else if (diasRestantes === 1) {
      return <Badge className="bg-orange-100 text-orange-800">Mañana</Badge>;
    } else if (diasRestantes <= 7) {
      return <Badge className="bg-yellow-100 text-yellow-800">Esta semana</Badge>;
    } else if (diasRestantes <= 30) {
      return <Badge className="bg-green-100 text-green-800">Este mes</Badge>;
    } else {
      return <Badge variant="outline">Próximamente</Badge>;
    }
  };

  // Función para formatear fecha relativa
  const formatFechaRelativa = (fechaStr: string | null) => {
    if (!fechaStr) return 'Fecha por definir';
    
    try {
      const fecha = parseISO(fechaStr);
      return formatDistanceToNow(fecha, { 
        addSuffix: true, 
        locale: es 
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  // Función para formatear fecha completa
  const formatFechaCompleta = (fechaStr: string | null) => {
    if (!fechaStr) return 'Por definir';
    
    try {
      const fecha = parseISO(fechaStr);
      return format(fecha, 'dd MMM yyyy', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Próximas Competencias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Error al cargar las competencias: {error.message}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Próximas Competencias
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : competenciasLimitadas.length > 0 ? (
          <>
            <div className="space-y-3">
              {competenciasLimitadas.map((competencia) => (
                <div
                  key={competencia.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    onCompetenciaClick 
                      ? 'hover:bg-green-50 cursor-pointer' 
                      : ''
                  }`}
                  onClick={() => onCompetenciaClick?.(competencia.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Nombre y badge de estado */}
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {competencia.nombre}
                        </h4>
                        {getEstadoBadge(competencia.dias_restantes)}
                      </div>

                      {/* Información de fecha */}
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatFechaRelativa(competencia.fecha_inicio)}</span>
                        </div>
                        {competencia.fecha_inicio && (
                          <span className="text-gray-500">
                            {formatFechaCompleta(competencia.fecha_inicio)}
                          </span>
                        )}
                      </div>

                      {/* Información adicional */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Trophy className="h-4 w-4" />
                          <span>Curso {competencia.curso}</span>
                        </div>
                        {competencia.sede && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">{competencia.sede}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Flecha si es clickeable */}
                    {onCompetenciaClick && (
                      <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Botón "Ver todas" */}
            {showViewAll && competenciasData && competenciasData.length > maxItems && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  onClick={onViewAllClick}
                  className="w-full"
                >
                  Ver todas las competencias ({competenciasData.length})
                </Button>
              </div>
            )}

            {/* Información adicional */}
            {competenciasData && competenciasData.length > 0 && (
              <div className="mt-4 text-xs text-gray-500 text-center">
                Mostrando {competenciasLimitadas.length} de {competenciasData.length} competencias 
                en los próximos {dias} días
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay competencias próximas</p>
            <p className="text-sm mt-1">
              No se encontraron competencias en los próximos {dias} días
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                // Aquí podrías abrir un modal para crear competencia
                console.log('Crear nueva competencia');
              }}
            >
              <Trophy className="h-4 w-4 mr-2" />
              Crear Competencia
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ProximasCompetenciasList;
