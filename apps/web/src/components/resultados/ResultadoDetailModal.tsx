'use client';

/**
 * Modal de pantalla completa para mostrar detalles de resultado
 * 
 * Implementa la subtarea 17.4 del PRD:
 * - Modal con trigger "Ver detalles" 
 * - Usa componentes shadcn (Button, Alert, Progress)
 * - Tema "green" consistente
 * - Diseño flexible y responsivo
 */

import * as React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Alert,
  Progress
} from '@/components/ui';
import { useResultado } from '@/hooks/useResultados';
import { Eye, Clock, Users, Trophy, AlertTriangle, CheckCircle } from 'lucide-react';
import { SegmentosTable } from './SegmentosTable';
import { ResumenGlobal } from './ResumenGlobal';
import { formatTime, formatDate } from '@/lib/time-utils';

interface ResultadoDetailModalProps {
  resultadoId: number;
  triggerText?: string;
  triggerVariant?: 'default' | 'secondary' | 'outline' | 'ghost';
  className?: string;
}

export function ResultadoDetailModal({ 
  resultadoId, 
  triggerText = "Ver detalles",
  triggerVariant = "outline",
  className 
}: ResultadoDetailModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const { data: resultado, isLoading, error } = useResultado(
    resultadoId, 
    isOpen // Solo cargar cuando el modal esté abierto
  );

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'valido':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Válido
          </Badge>
        );
      case 'revisar':
        return (
          <Badge variant="destructive" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Revisar
          </Badge>
        );
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  const getFaseBadge = (fase: string) => {
    const colorMap = {
      'Preliminar': 'bg-blue-100 text-blue-800',
      'Semifinal': 'bg-orange-100 text-orange-800', 
      'Final': 'bg-purple-100 text-purple-800'
    };
    
    return (
      <Badge 
        variant="secondary" 
        className={colorMap[fase as keyof typeof colorMap] || 'bg-gray-100 text-gray-800'}
      >
        {fase}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant={triggerVariant} 
          size="sm" 
          className={className}
        >
          <Eye className="w-4 h-4 mr-1" />
          {triggerText}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 gap-0">
        <div className="flex flex-col h-full">
          {/* Header del Modal */}
          <DialogHeader className="p-6 pb-4 border-b bg-green-50">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-green-900">
                Detalle de Resultado
              </DialogTitle>
              {isLoading && <Progress className="w-32" />}
            </div>
          </DialogHeader>

          {/* Contenido Principal */}
          <div className="flex-1 overflow-auto">
            {isLoading && (
              <div className="flex items-center justify-center h-40">
                <div className="text-center">
                  <Progress className="w-48 mb-2" />
                  <p className="text-sm text-gray-600">Cargando detalles...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-6">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <div>
                    <h4 className="font-medium">Error al cargar resultado</h4>
                    <p className="text-sm mt-1">{error.message}</p>
                  </div>
                </Alert>
              </div>
            )}

            {resultado && (
              <div className="p-6 space-y-6">
                {/* Información Básica del Resultado */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-green-600" />
                      Información del Resultado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Nadador</p>
                        <p className="text-lg font-semibold">ID: {resultado.resultado.nadador_id}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Competencia</p>
                        <p className="text-lg font-semibold">ID: {resultado.resultado.competencia_id}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Tiempo Global</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatTime(resultado.resultado.tiempo_global_cs)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Fecha</p>
                        <p className="text-lg">
                          {formatDate(resultado.resultado.fecha_registro)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      {getEstadoBadge(resultado.resultado.estado_validacion)}
                      {getFaseBadge(resultado.resultado.fase)}
                      <Badge variant="outline" className="bg-green-50">
                        {resultado.resultado.categoria_label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Resumen Global */}
                <ResumenGlobal resumen={resultado.resumen_global} />

                {/* Tabla de Segmentos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      Segmentos por Índice
                      <Badge variant="secondary">
                        {resultado.segmentos.length} segmentos
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <SegmentosTable segmentos={resultado.segmentos} />
                  </CardContent>
                </Card>

                {/* Información Adicional */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Detalles Técnicos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-500">ID Resultado:</span>
                        <span className="ml-2">{resultado.resultado.id}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Prueba ID:</span>
                        <span className="ml-2">{resultado.resultado.prueba_id}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Capturado por:</span>
                        <span className="ml-2">Usuario {resultado.resultado.capturado_por}</span>
                      </div>
                      {resultado.resultado.tiempo_15m_cs && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Tiempo 15m:</span>
                          <span className="ml-2 font-mono">
                            {formatTime(resultado.resultado.tiempo_15m_cs)}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Validación</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Desviación Parciales:</span>
                        <span className={`ml-2 font-mono ${
                          Math.abs(resultado.resultado.desviacion_parciales_cs) > 40 
                            ? 'text-red-600 font-bold' 
                            : 'text-green-600'
                        }`}>
                          {resultado.resultado.desviacion_parciales_cs > 0 ? '+' : ''}
                          {resultado.resultado.desviacion_parciales_cs}cs
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Requiere Revisión:</span>
                        <span className="ml-2">
                          {resultado.resumen_global.requiere_revision ? (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Sí
                            </Badge>
                          ) : (
                            <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              No
                            </Badge>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Creado:</span>
                        <span className="ml-2 text-xs text-gray-400">
                          {new Date(resultado.resultado.created_at).toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ResultadoDetailModal;
