'use client';

/**
 * Componente Resumen Global de Resultados
 * 
 * Muestra métricas calculadas de la vista resultado_agregado
 * Parte de la subtarea 17.5: "Build Segment Table and Global Summary Components"
 */

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Alert,
  Progress
} from '@/components/ui';
import { 
  Clock, 
  Activity, 
  Target, 
  Gauge, 
  Ruler, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Waves
} from 'lucide-react';
import { formatTime } from '@/lib/time-utils';
import type { ResumenGlobal as ResumenGlobalType } from '@/types/resultados';

interface ResumenGlobalProps {
  resumen: ResumenGlobalType;
}

export function ResumenGlobal({ resumen }: ResumenGlobalProps) {
  const formatDecimal = (value: number | string | null | undefined, decimals = 2): string => {
    if (value === null || value === undefined) return '0.00';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue.toFixed(decimals);
  };

  const formatMeters = (value: number | string | null | undefined): string => {
    return `${formatDecimal(value, 2)}m`;
  };

  const formatSpeed = (value: number | string | null | undefined): string => {
    return `${formatDecimal(value, 3)} m/s`;
  };

  // Calcular progreso de eficiencia (velocidad vs distancia por brazada)
  const velocidadNum = typeof resumen.velocidad_promedio_mps === 'string' 
    ? parseFloat(resumen.velocidad_promedio_mps) 
    : resumen.velocidad_promedio_mps;

  const eficienciaScore = resumen.distancia_por_brazada_global_m 
    ? Math.min(100, (parseFloat(resumen.distancia_por_brazada_global_m.toString()) * velocidadNum * 20))
    : 0;

  return (
    <div className="space-y-6">
      {/* Alert de Validación si es Necesario */}
      {resumen.requiere_revision && (
        <Alert variant="destructive" className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <h4 className="font-medium text-yellow-800">
              Resultado Requiere Revisión
            </h4>
            <p className="text-sm text-yellow-700 mt-1">
              La desviación de {Math.abs(resumen.desviacion_cs)}cs excede el límite de ±40cs.
              Por favor, verifica la precisión de los tiempos parciales.
            </p>
          </div>
        </Alert>
      )}

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Tiempo y Desviación */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Tiempos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">Suma Parciales</p>
              <p className="text-lg font-bold font-mono">
                {formatTime(resumen.suma_parciales_cs)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Desviación</p>
              <p className={`text-sm font-mono font-bold ${
                Math.abs(resumen.desviacion_cs) > 40 ? 'text-red-600' : 'text-green-600'
              }`}>
                {resumen.desviacion_cs > 0 ? '+' : ''}{resumen.desviacion_cs}cs
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Brazadas */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Brazadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-2xl font-bold">
                {resumen.brazadas_totales}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Dist. por Brazada</p>
              <p className="text-sm font-mono font-semibold text-green-600">
                {resumen.distancia_por_brazada_global_m 
                  ? formatMeters(resumen.distancia_por_brazada_global_m)
                  : 'N/A'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Velocidad */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              Velocidad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">Promedio</p>
              <p className="text-lg font-bold font-mono text-purple-600">
                {formatSpeed(resumen.velocidad_promedio_mps)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Distancia Total</p>
              <p className="text-sm font-semibold">
                {resumen.distancia_total_m}m
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Flecha */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Flecha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-lg font-bold font-mono text-orange-600">
                {formatMeters(resumen.flecha_total_m)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Dist. sin Flecha</p>
              <p className="text-sm font-mono font-semibold">
                {formatMeters(resumen.distancia_sin_flecha_total_m)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análisis de Eficiencia */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <TrendingUp className="w-5 h-5" />
            Análisis de Eficiencia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Eficiencia General
                </span>
                <Badge variant="outline" className="bg-white">
                  {eficienciaScore.toFixed(0)}%
                </Badge>
              </div>
              <Progress 
                value={eficienciaScore} 
                className="h-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Basado en velocidad × distancia por brazada
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Técnica de Nado</span>
                {resumen.distancia_por_brazada_global_m && parseFloat(resumen.distancia_por_brazada_global_m.toString()) > 2.0 ? (
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                    Eficiente
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Mejorable
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">Uso de Flecha</span>
                <span className="text-xs text-gray-600">
                  {((parseFloat(resumen.flecha_total_m.toString()) / resumen.distancia_total_m) * 100).toFixed(1)}% del total
                </span>
              </div>
            </div>
          </div>

          {/* Indicadores de Estado */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {!resumen.requiere_revision && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Resultado Validado
              </Badge>
            )}
            
            {Math.abs(resumen.desviacion_cs) <= 10 && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                <Target className="w-3 h-3 mr-1" />
                Alta Precisión (±{Math.abs(resumen.desviacion_cs)}cs)
              </Badge>
            )}
            
            {resumen.brazadas_totales > 0 && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                <Activity className="w-3 h-3 mr-1" />
                {resumen.brazadas_totales} Brazadas Totales
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ResumenGlobal;
