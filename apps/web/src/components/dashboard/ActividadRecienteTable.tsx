'use client';

/**
 * Componente ActividadRecienteTable - Tabla de actividad reciente
 * 
 * Muestra la actividad reciente del equipo con botón "Ver detalles".
 * Usa el modal de resultados existente para mostrar detalles.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  RefreshCw, 
  Activity, 
  Eye,
  Calendar,
  User,
  Trophy
} from 'lucide-react';
import { ResultadoDetailModal } from '@/components/resultados';
import { useDashboardTop5 } from '@/hooks/useDashboard';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface ActividadRecienteTableProps {
  /** Número máximo de registros a mostrar */
  maxItems?: number;
  /** Mostrar botón "Ver todos" */
  showViewAll?: boolean;
  /** Callback al hacer clic en "Ver todos" */
  onViewAllClick?: () => void;
  /** Clase CSS adicional */
  className?: string;
}

export function ActividadRecienteTable({
  maxItems = 10,
  showViewAll = true,
  onViewAllClick,
  className = ''
}: ActividadRecienteTableProps) {
  const [selectedResultadoId, setSelectedResultadoId] = useState<number | null>(null);
  
  // Usamos el hook de top5 sin filtros para obtener actividad reciente
  // En una implementación completa, esto sería un endpoint específico
  const { data: actividadData, isLoading, error, refetch } = useDashboardTop5();

  // Procesar datos para mostrar como actividad reciente
  const actividadLimitada = actividadData?.slice(0, maxItems) || [];

  // Función para formatear fecha
  const formatFecha = (fechaStr: string) => {
    try {
      const fecha = parseISO(fechaStr);
      return format(fecha, 'dd MMM', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  // Función para obtener el tipo de actividad
  const getTipoActividad = () => 'Resultado registrado';

  // Función para obtener el badge de estado
  const getEstadoBadge = (tiempo_cs: number) => {
    // Lógica simple para determinar si es un buen tiempo (esto sería más sofisticado en producción)
    if (tiempo_cs < 3000) { // < 30 segundos
      return <Badge className="bg-green-100 text-green-800">Excelente</Badge>;
    } else if (tiempo_cs < 6000) { // < 1 minuto
      return <Badge className="bg-blue-100 text-blue-800">Bueno</Badge>;
    } else {
      return <Badge variant="outline">Registro</Badge>;
    }
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Error al cargar la actividad: {error.message}
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
            <Activity className="h-5 w-5 text-green-600" />
            Actividad Reciente
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
        <p className="text-sm text-gray-600">
          Últimos registros y actividad del equipo
        </p>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4 p-3">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          </div>
        ) : actividadLimitada.length > 0 ? (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Tipo</TableHead>
                    <TableHead>Nadador</TableHead>
                    <TableHead>Prueba</TableHead>
                    <TableHead>Tiempo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="w-[100px]">Estado</TableHead>
                    <TableHead className="w-[120px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actividadLimitada.map((actividad) => (
                    <TableRow key={actividad.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">
                            Resultado
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {actividad.nadador}
                            </div>
                            <div className="text-sm text-gray-500">
                              {actividad.rama === 'F' ? 'Femenil' : 'Masculino'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {actividad.prueba}
                        </div>
                        <div className="text-xs text-gray-500">
                          {actividad.competencia}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono font-semibold">
                          {actividad.tiempo}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {formatFecha(actividad.fecha)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getEstadoBadge(actividad.tiempo_cs)}
                      </TableCell>
                      <TableCell>
                        <ResultadoDetailModal
                          resultadoId={actividad.id}
                          triggerText="Ver detalles"
                          triggerVariant="outline"
                          triggerSize="sm"
                          triggerIcon={<Eye className="h-4 w-4" />}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Botón "Ver todos" */}
            {showViewAll && actividadData && actividadData.length > maxItems && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  onClick={onViewAllClick}
                  className="w-full"
                >
                  Ver toda la actividad ({actividadData.length} registros)
                </Button>
              </div>
            )}

            {/* Información adicional */}
            {actividadData && actividadData.length > 0 && (
              <div className="mt-4 text-xs text-gray-500 text-center">
                Mostrando {actividadLimitada.length} de {actividadData.length} registros recientes
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay actividad reciente</p>
            <p className="text-sm mt-1">
              Los registros y actividad del equipo aparecerán aquí
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                // Aquí podrías redirigir a registrar resultado
                console.log('Ir a registrar resultado');
              }}
            >
              <Trophy className="h-4 w-4 mr-2" />
              Registrar Resultado
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ActividadRecienteTable;
