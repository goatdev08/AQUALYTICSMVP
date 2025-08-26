"use client";

/**
 * Componente ResultadosResumen
 * 
 * Muestra un resumen global de los resultados del nadador con:
 * - Estadísticas generales
 * - Mejores marcas recientes  
 * - Registros recientes con opción de ver detalles
 * - Vista detallada de métricas automáticas y manuales
 */

import React, { useState } from 'react';
import { Nadador } from '@/types/nadadores';
import { NadadorAnalytics } from '@/hooks/useNadadorAnalytics';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Button,
  Badge,
  Alert,
  AlertDescription,
  EmptyState,
  InfoCard
} from '@/components/ui';
import { 
  TrendingUp, 
  Trophy, 
  Calendar, 
  Clock, 
  Eye,
  BarChart3,
  Activity,
  Target,
  Waves,
  Timer
} from 'lucide-react';
import { ResultadoDetailModal } from '@/components/resultados';

interface ResultadosResumenProps {
  nadador: Nadador;
  analyticsData: NadadorAnalytics | null;
  isLoading: boolean;
}

interface MetricaDetalle {
  label: string;
  valor: string;
  tipo: 'automatica' | 'manual';
  descripcion?: string;
}

export default function ResultadosResumen({ nadador, analyticsData, isLoading }: ResultadosResumenProps) {
  const [vistaDetallada, setVistaDetallada] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <EmptyState
        icon={Activity}
        title="Sin datos de resultados"
        description="Este nadador aún no tiene resultados registrados en el sistema."
        actions={[
          {
            label: "Registrar Resultado",
            href: "/resultados/registrar",
            variant: "default"
          }
        ]}
      />
    );
  }

  const { estadisticas_generales, mejores_marcas, registros_recientes } = analyticsData;

  // Generar métricas detalladas basadas en los datos disponibles
  const generarMetricasDetalladas = (): MetricaDetalle[] => {
    const metricas: MetricaDetalle[] = [];

    // Métricas automáticas
    if (estadisticas_generales) {
      metricas.push({
        label: "Total de Competencias",
        valor: estadisticas_generales.total_competencias.toString(),
        tipo: "automatica",
        descripcion: "Número total de competencias en las que ha participado"
      });

      metricas.push({
        label: "Total de Pruebas",
        valor: estadisticas_generales.total_pruebas.toString(),
        tipo: "automatica",
        descripcion: "Número total de pruebas nadadas"
      });

      metricas.push({
        label: "Lugar Promedio",
        valor: `${estadisticas_generales.mejor_lugar_promedio}°`,
        tipo: "automatica",
        descripcion: "Posición promedio en todas las competencias"
      });

      metricas.push({
        label: "Eventos Recientes",
        valor: estadisticas_generales.eventos_ultimo_mes.toString(),
        tipo: "automatica",
        descripcion: "Número de eventos en los últimos 30 días"
      });
    }

    // Métricas manuales (basadas en mejores marcas)
    if (mejores_marcas && mejores_marcas.length > 0) {
      const estilosUnicos = [...new Set(mejores_marcas.map(m => m.estilo))];
      metricas.push({
        label: "Especialidades",
        valor: estilosUnicos.join(", "),
        tipo: "manual",
        descripcion: "Estilos de natación en los que tiene registros"
      });

      const mejorMarca = mejores_marcas[0];
      metricas.push({
        label: "Mejor Marca Personal",
        valor: `${mejorMarca.tiempo_formateado} (${mejorMarca.estilo} ${mejorMarca.distancia}m)`,
        tipo: "manual",
        descripcion: "Su mejor tiempo registrado"
      });
    }

    return metricas;
  };

  const metricasDetalladas = generarMetricasDetalladas();

  return (
    <div className="space-y-6">
      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Competencias</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {estadisticas_generales?.total_competencias || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Trophy className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Pruebas Totales</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {estadisticas_generales?.total_pruebas || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center">
                <Waves className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Lugar Promedio</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                  {estadisticas_generales?.mejor_lugar_promedio || 0}°
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Eventos Recientes</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {estadisticas_generales?.eventos_ultimo_mes || 0}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400">Últimos 30 días</p>
              </div>
              <div className="h-12 w-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mejores Marcas Recientes */}
      {mejores_marcas && mejores_marcas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-600" />
              Mejores Marcas Personales
            </CardTitle>
            <CardDescription>
              Top {Math.min(mejores_marcas.length, 5)} mejores tiempos registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mejores_marcas.slice(0, 5).map((marca, index) => (
                <div
                  key={`${nadador.id}-mm-${(marca.estilo ?? 'est')}-${String(marca.distancia ?? 'dist')}-${marca.curso ?? 'curso'}-${index}`}
                  className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {(marca.estilo ?? '—')} {marca.distancia ?? '—'}m
                    </Badge>
                    <Badge
                      variant={marca.curso === 'SC' ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {marca.curso ?? '—'}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-green-800">{marca.tiempo_formateado ?? '—'}</p>
                  <p className="text-sm text-gray-600">{marca.competencia ?? '—'}</p>
                  <p className="text-xs text-gray-500">
                    {marca.fecha ? new Date(marca.fecha).toLocaleDateString('es-ES') : '—'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registros Recientes */}
      {registros_recientes && registros_recientes.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Registros Recientes
                </CardTitle>
                <CardDescription>
                  Últimos {registros_recientes.length} resultados registrados
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => setVistaDetallada(!vistaDetallada)}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                {vistaDetallada ? 'Vista Simple' : 'Ver Detalles'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {registros_recientes.slice(0, 5).map((registro) => (
                <div key={`${nadador.id}-registro-${registro.resultado_id}`} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Timer className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {registro.estilo} {registro.distancia}m - {registro.tiempo_formateado}
                      </p>
                      <p className="text-sm text-gray-600">
                        {registro.competencia} • {new Date(registro.fecha).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={registro.lugar <= 3 ? 'default' : 'secondary'}>
                      {registro.lugar}° lugar
                    </Badge>
                    <ResultadoDetailModal
                      resultadoId={registro.resultado_id}
                      triggerText=""
                      triggerVariant="ghost"
                      className="p-2"
                      triggerIcon={<Eye className="h-4 w-4" />}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vista Detallada de Métricas */}
      {vistaDetallada && metricasDetalladas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Métricas Detalladas
            </CardTitle>
            <CardDescription>
              Análisis completo de métricas automáticas y manuales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Métricas Automáticas */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-600" />
                  Métricas Automáticas
                </h4>
                <div className="space-y-3">
                  {metricasDetalladas
                    .filter(m => m.tipo === 'automatica')
                    .map((metrica, index) => (
                      <InfoCard
                        key={`${nadador.id}-auto-${metrica.label.replace(/\s+/g, '-').toLowerCase()}-${index}`}
                        variant="info"
                        title={metrica.label}
                        description={metrica.descripcion}
                        items={[
                          {
                            label: "Valor",
                            value: metrica.valor,
                            asBadge: true,
                            badgeVariant: "secondary"
                          }
                        ]}
                      />
                    ))}
                </div>
              </div>

              {/* Métricas Manuales */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Métricas Manuales
                </h4>
                <div className="space-y-3">
                  {metricasDetalladas
                    .filter(m => m.tipo === 'manual')
                    .map((metrica, index) => (
                      <InfoCard
                        key={`${nadador.id}-manual-${metrica.label.replace(/\s+/g, '-').toLowerCase()}-${index}`}
                        variant="success"
                        title={metrica.label}
                        description={metrica.descripcion}
                        items={[
                          {
                            label: "Valor",
                            value: metrica.valor,
                            asBadge: true,
                            badgeVariant: "default"
                          }
                        ]}
                      />
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado sin registros recientes */}
      {(!registros_recientes || registros_recientes.length === 0) && (
        <EmptyState
          icon={Clock}
          title="Sin registros recientes"
          description="Este nadador no tiene registros recientes para mostrar."
          actions={[
            {
              label: "Registrar Nuevo Resultado",
              href: "/resultados/registrar",
              variant: "default"
            }
          ]}
        />
      )}
    </div>
  );
}
