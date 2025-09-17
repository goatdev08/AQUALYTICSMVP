'use client';

/**
 * Componente AtletasDestacadosList - Lista de atletas destacados
 * 
 * Muestra atletas con mejores mejoras recientes y métricas de rendimiento.
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
  Users, 
  TrendingUp, 
  Award,
  ChevronRight,
  Star,
  Timer
} from 'lucide-react';
import { useDashboardAtletasDestacados } from '@/hooks/useDashboard';

interface AtletasDestacadosListProps {
  /** Número de días hacia atrás para buscar mejoras */
  dias?: number;
  /** Número máximo de atletas a mostrar */
  maxItems?: number;
  /** Mostrar botón "Ver todos" */
  showViewAll?: boolean;
  /** Callback al hacer clic en un atleta */
  onAtletaClick?: (atletaId: number) => void;
  /** Callback al hacer clic en "Ver todos" */
  onViewAllClick?: () => void;
  /** Clase CSS adicional */
  className?: string;
}

export function AtletasDestacadosList({
  dias = 30,
  maxItems = 5,
  showViewAll = true,
  onAtletaClick,
  onViewAllClick,
  className = ''
}: AtletasDestacadosListProps) {
  // Obtener datos del hook con metadatos según PRDv2
  const { data: atletasResponse, isLoading, error, refetch } = useDashboardAtletasDestacados(dias, maxItems);

  // Extraer datos y metadatos de la respuesta
  const atletasLimitados = atletasResponse?.data || [];
  const totalAtletas = atletasResponse?.total || 0;
  const hayMas = atletasResponse?.hay_mas || false;

  // Función para obtener el badge según el número de registros
  const getRendimientoBadge = (registros: number) => {
    if (registros >= 10) {
      return <Badge className="bg-primary/20 text-primary border border-primary/30">Muy activo</Badge>;
    } else if (registros >= 5) {
      return <Badge className="bg-accent/20 text-accent-foreground border border-accent/30">Activo</Badge>;
    } else if (registros >= 3) {
      return <Badge className="bg-secondary/20 text-secondary-foreground border border-secondary/30">Moderado</Badge>;
    } else {
      return <Badge variant="outline">Nuevo</Badge>;
    }
  };

  // Función para obtener icono de posición
  const getPosicionIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Award className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Award className="h-5 w-5 text-muted-foreground" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <Star className="h-5 w-5 text-primary" />;
    }
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Atletas Destacados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Error al cargar los atletas: {error.message}
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
            <Users className="h-5 w-5 text-primary" />
            Atletas Destacados
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
        <p className="text-sm text-muted-foreground">
          Atletas con mayor actividad en los últimos {dias} días
        </p>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : atletasLimitados.length > 0 ? (
          <>
            <div className="space-y-3">
              {atletasLimitados.map((atleta, index) => (
                <div
                  key={atleta.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    onAtletaClick 
                      ? 'hover:bg-green-50 cursor-pointer' 
                      : ''
                  } ${index === 0 ? 'border-green-200 bg-green-25' : ''}`}
                  onClick={() => onAtletaClick?.(atleta.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Icono de posición */}
                      <div className="flex-shrink-0">
                        {getPosicionIcon(index)}
                      </div>

                      {/* Información del atleta */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {atleta.nombre}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {atleta.rama === 'F' ? 'Femenil' : 'Masculino'}
                          </Badge>
                          {index === 0 && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              #1
                            </Badge>
                          )}
                        </div>

                        {/* Métricas */}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            <span>{atleta.registros_recientes} registros</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Timer className="h-4 w-4" />
                            <span>Mejor: {atleta.mejor_tiempo}</span>
                          </div>
                        </div>

                        {/* Badge de rendimiento */}
                        <div className="mt-2">
                          {getRendimientoBadge(atleta.registros_recientes)}
                        </div>
                      </div>
                    </div>

                    {/* Estadística destacada */}
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="text-lg font-bold text-primary">
                        {atleta.registros_recientes}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        registros
                      </div>
                    </div>

                    {/* Flecha si es clickeable */}
                    {onAtletaClick && (
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                    )}
                  </div>

                  {/* Información adicional para el primer lugar */}
                  {index === 0 && (
                    <div className="mt-3 pt-3 border-t border-primary/20">
                      <div className="text-xs text-primary font-medium">
                        🏆 Atleta más activo del período
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {atleta.metrica}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Estadísticas generales */}
            {atletasLimitados.length > 0 && (
              <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {totalAtletas}
                    </div>
                    <div className="text-sm text-primary">
                      Atletas activos
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-700">
                      {atletasLimitados.reduce((sum, atleta) => sum + atleta.registros_recientes, 0)}
                    </div>
                    <div className="text-sm text-primary">
                      Total registros (mostrados)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botón "Ver todos (N)" con conteo real según PRDv2 */}
            {showViewAll && hayMas && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  onClick={onViewAllClick}
                  className="w-full"
                >
                  Ver todos los atletas ({totalAtletas})
                </Button>
              </div>
            )}

            {/* Información adicional */}
            {atletasLimitados.length > 0 && (
              <div className="mt-4 text-xs text-gray-500 text-center">
                Mostrando {atletasLimitados.length} de {totalAtletas} atletas destacados 
                en los últimos {dias} días
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay atletas destacados</p>
            <p className="text-sm mt-1">
              No se encontraron atletas con registros recientes en los últimos {dias} días
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                // Aquí podrías redirigir a la sección de nadadores
                console.log('Ver todos los nadadores');
              }}
            >
              <Users className="h-4 w-4 mr-2" />
              Ver Nadadores
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AtletasDestacadosList;
