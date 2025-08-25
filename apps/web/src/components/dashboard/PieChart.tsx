'use client';

/**
 * Componente PieChart - Gráfico circular de distribución de estilos
 * 
 * Muestra la distribución de resultados por estilo de natación.
 * Usa Chart.js para visualización y tema verde consistente.
 */

import { useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, PieChart as PieChartIcon } from 'lucide-react';
import { useDashboardDistribucionEstilos } from '@/hooks/useDashboard';
import { pieChartDefaults } from '@/lib/chart-config';

interface PieChartProps {
  /** Altura del gráfico */
  height?: number;
  /** Mostrar leyenda */
  showLegend?: boolean;
  /** Mostrar valores en porcentajes */
  showPercentages?: boolean;
  /** Clase CSS adicional */
  className?: string;
}

export function PieChart({
  height = 300,
  showLegend = true,
  showPercentages = true,
  className = ''
}: PieChartProps) {
  // Obtener datos del hook
  const { data: distribucionData, isLoading, error, refetch } = useDashboardDistribucionEstilos();

  // Configurar datos del gráfico
  const chartData = useMemo(() => {
    if (!distribucionData || distribucionData.length === 0) {
      return {
        labels: ['Sin datos'],
        datasets: [{
          label: 'Distribución',
          data: [1],
          backgroundColor: ['rgba(156, 163, 175, 0.5)'],
          borderColor: ['rgba(156, 163, 175, 1)'],
          borderWidth: 1
        }]
      };
    }

    // Colores del tema verde para cada estilo
    const styleColors = {
      'Libre': 'rgba(34, 197, 94, 0.8)',      // green-500
      'Dorso': 'rgba(22, 163, 74, 0.8)',      // green-600
      'Pecho': 'rgba(21, 128, 61, 0.8)',      // green-700
      'Mariposa': 'rgba(20, 83, 45, 0.8)',    // green-800
      'Combinado': 'rgba(22, 101, 52, 0.8)'   // green-900
    };

    const styleBorderColors = {
      'Libre': 'rgba(34, 197, 94, 1)',
      'Dorso': 'rgba(22, 163, 74, 1)',
      'Pecho': 'rgba(21, 128, 61, 1)',
      'Mariposa': 'rgba(20, 83, 45, 1)',
      'Combinado': 'rgba(22, 101, 52, 1)'
    };

    // Calcular total para porcentajes
    const total = distribucionData.reduce((sum, item) => sum + item.value, 0);

    return {
      labels: distribucionData.map(item => {
        if (showPercentages && total > 0) {
          const percentage = ((item.value / total) * 100).toFixed(1);
          return `${item.label} (${percentage}%)`;
        }
        return item.label;
      }),
      datasets: [{
        label: 'Resultados',
        data: distribucionData.map(item => item.value),
        backgroundColor: distribucionData.map(item => 
          styleColors[item.label as keyof typeof styleColors] || 'rgba(156, 163, 175, 0.8)'
        ),
        borderColor: distribucionData.map(item => 
          styleBorderColors[item.label as keyof typeof styleBorderColors] || 'rgba(156, 163, 175, 1)'
        ),
        borderWidth: 2,
        hoverOffset: 10
      }]
    };
  }, [distribucionData, showPercentages]);

  // Opciones del gráfico
  const chartOptions = useMemo(() => ({
    ...pieChartDefaults,
    plugins: {
      ...pieChartDefaults.plugins,
      legend: {
        ...pieChartDefaults.plugins?.legend,
        display: showLegend,
        position: 'right' as const,
      },
      tooltip: {
        ...pieChartDefaults.plugins?.tooltip,
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            
            return [
              `${label.split(' (')[0]}: ${value} resultados`,
              `Porcentaje: ${percentage}%`
            ];
          }
        }
      }
    }
  }), [showLegend]);

  // Calcular estadísticas adicionales
  const stats = useMemo(() => {
    if (!distribucionData || distribucionData.length === 0) {
      return null;
    }

    const total = distribucionData.reduce((sum, item) => sum + item.value, 0);
    const maxStyle = distribucionData.reduce((max, item) => 
      item.value > max.value ? item : max
    );

    return {
      total,
      estiloMasPopular: maxStyle.label,
      cantidadMax: maxStyle.value,
      porcentajeMax: total > 0 ? ((maxStyle.value / total) * 100).toFixed(1) : '0'
    };
  }, [distribucionData]);

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-green-600" />
            Distribución por Estilo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Error al cargar los datos: {error.message}
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
            <PieChartIcon className="h-5 w-5 text-green-600" />
            Distribución por Estilo
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
            <div className="flex items-center justify-center">
              <Skeleton className="h-64 w-64 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ) : (
          <>
            <div style={{ height: `${height}px`, position: 'relative' }}>
              <Pie data={chartData} options={chartOptions} />
            </div>
            
            {/* Estadísticas adicionales */}
            {stats && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-green-50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-700">{stats.total}</p>
                  <p className="text-sm text-green-600">Total Resultados</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-green-700">{stats.estiloMasPopular}</p>
                  <p className="text-sm text-green-600">Estilo Más Popular</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-700">{stats.porcentajeMax}%</p>
                  <p className="text-sm text-green-600">Del Total</p>
                </div>
              </div>
            )}
            
            {/* Lista detallada */}
            {distribucionData && distribucionData.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-3">Desglose por Estilo</h4>
                <div className="space-y-2">
                  {distribucionData
                    .sort((a, b) => b.value - a.value)
                    .map((item, index) => {
                      const total = distribucionData.reduce((sum, i) => sum + i.value, 0);
                      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
                      
                      return (
                        <div key={item.label} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{
                                backgroundColor: chartData.datasets[0].backgroundColor[
                                  distribucionData.findIndex(d => d.label === item.label)
                                ] as string
                              }}
                            />
                            <span className="font-medium">{item.label}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold">{item.value}</span>
                            <span className="text-gray-500 ml-2">({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            
            {distribucionData && distribucionData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <PieChartIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hay datos de distribución</p>
                <p className="text-sm mt-1">
                  Registra algunos resultados para ver la distribución por estilos
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default PieChart;
