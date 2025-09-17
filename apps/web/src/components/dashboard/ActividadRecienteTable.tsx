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
import { useDashboardActividadReciente } from '@/hooks/useDashboard';
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
  
  // Usar el hook dedicado para actividad reciente según PRDv2
  const { data: actividadResponse, isLoading, error, refetch } = useDashboardActividadReciente(maxItems);

  // Extraer datos y metadatos de la respuesta
  const actividadLimitada = actividadResponse?.data || [];
  const totalActividad = actividadResponse?.total || 0;
  const hayMas = actividadResponse?.hay_mas || false;

  // Función para formatear fecha
  const formatFecha = (fechaStr: string) => {
    try {
      const fecha = parseISO(fechaStr);
      return format(fecha, 'dd MMM', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  // Función para obtener el tipo de actividad (ahora viene del endpoint)
  const getTipoActividad = (actividad: any) => actividad.tipo_actividad || 'Resultado registrado';

  // Función para obtener el badge de estado basado en validación
  const getEstadoBadge = (actividad: any) => {
    if (actividad.estado_validacion === 'valido') {
      // Lógica adicional para determinar si es un buen tiempo
      if (actividad.tiempo_cs < 3000) { // < 30 segundos
        return <Badge className="bg-primary/20 text-primary border border-primary/30">Excelente</Badge>;
      } else if (actividad.tiempo_cs < 6000) { // < 1 minuto
        return <Badge className="bg-accent/20 text-accent-foreground border border-accent/30">Válido</Badge>;
      } else {
        return <Badge className="bg-primary/10 text-primary border border-primary/20">Válido</Badge>;
      }
    } else {
      return <Badge variant="outline">Pendiente</Badge>;
    }
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
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
            <Activity className="h-5 w-5 text-primary" />
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
        <p className="text-sm text-muted-foreground">
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
                          <Trophy className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">
                            Resultado
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {actividad.nadador}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {actividad.rama === 'F' ? 'Femenil' : 'Masculino'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {actividad.prueba}
                        </div>
                        <div className="text-xs text-muted-foreground">
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
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatFecha(actividad.fecha)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getEstadoBadge(actividad)}
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

            {/* Botón "Ver todos (N)" con conteo real según PRDv2 */}
            {showViewAll && hayMas && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  onClick={onViewAllClick}
                  className="w-full"
                >
                  Ver toda la actividad ({totalActividad} registros)
                </Button>
              </div>
            )}

            {/* Información adicional */}
            {actividadLimitada.length > 0 && (
              <div className="mt-4 text-xs text-muted-foreground text-center">
                Mostrando {actividadLimitada.length} de {totalActividad} registros recientes
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
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
