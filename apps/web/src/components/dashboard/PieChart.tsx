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

    // Paleta verde ampliada consistente con el tema (5-7 tonos según PRDv2)
    // Colores hardcodeados que coinciden con las variables CSS del sistema de temas
    const styleColors = {
      'Libre': 'rgba(114, 222, 119, 0.8)',        // chart-1: Verde primario claro
      'Dorso': 'rgba(99, 177, 205, 0.8)',         // chart-2: Azul de contraste  
      'Pecho': 'rgba(72, 187, 120, 0.8)',         // chart-3: Verde medio
      'Mariposa': 'rgba(52, 211, 153, 0.8)',      // chart-4: Verde-azulado claro
      'Combinado': 'rgba(34, 197, 94, 0.8)',      // chart-5: Verde base
      'Relevo': 'rgba(22, 163, 74, 0.7)',         // primary: Verde principal con menos opacidad
      'Mixto': 'rgba(22, 163, 74, 0.5)'           // primary: Verde principal más transparente
    };

    const styleBorderColors = {
      'Libre': 'rgba(114, 222, 119, 1)',          
      'Dorso': 'rgba(99, 177, 205, 1)',           
      'Pecho': 'rgba(72, 187, 120, 1)',           
      'Mariposa': 'rgba(52, 211, 153, 1)',        
      'Combinado': 'rgba(34, 197, 94, 1)',        
      'Relevo': 'rgba(22, 163, 74, 1)',           
      'Mixto': 'rgba(22, 163, 74, 0.8)'           
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

  // Opciones del gráfico con padding mejorado según PRDv2
  const chartOptions = useMemo(() => ({
    ...pieChartDefaults,
    layout: {
      padding: {
        top: 15,
        right: 15,
        bottom: 15,
        left: 15
      }
    },
    plugins: {
      ...pieChartDefaults.plugins,
                    legend: {
        ...pieChartDefaults.plugins?.legend,
        display: showLegend,
        position: 'right' as const,
        labels: {
          color: 'hsl(var(--foreground))',
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12
          }
        },
          labels: {
            ...pieChartDefaults.plugins?.legend?.labels,
            padding: 12,
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            font: {
              size: 10,
              family: 'Inter, sans-serif',
            }
          }
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
            <PieChartIcon className="h-5 w-5 text-primary" />
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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChartIcon className="h-5 w-5 text-primary" />
            Distribución por Estilo
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="overflow-hidden">
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
          <div className="space-y-4">
            {/* Gráfico principal */}
            <div className="flex justify-center items-center">
              <div style={{ 
                height: `${height}px`, 
                width: '100%', 
                maxWidth: `${Math.min(height * 1.2, 400)}px`, 
                position: 'relative' 
              }}>
                <Pie data={chartData} options={chartOptions} />
              </div>
            </div>
            
            {/* Estadísticas adicionales compactas */}
            {stats && (
              <div className="grid grid-cols-3 gap-2 p-3 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/20">
                <div className="text-center">
                  <p className="text-lg font-bold text-primary">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-primary truncate">{stats.estiloMasPopular}</p>
                  <p className="text-xs text-muted-foreground">Más Popular</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-primary">{stats.porcentajeMax}%</p>
                  <p className="text-xs text-muted-foreground">Dominancia</p>
                </div>
              </div>
            )}
            
            {/* Lista detallada compacta */}
            {distribucionData && distribucionData.length > 0 && distribucionData.length <= 5 && (
              <div className="">
                <div className="space-y-1">
                  {distribucionData
                    .sort((a, b) => b.value - a.value)
                    .map((item, index) => {
                      const total = distribucionData.reduce((sum, i) => sum + i.value, 0);
                      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
                      
                      return (
                        <div key={item.label} className="flex items-center justify-between py-1 px-2 bg-gray-50 dark:bg-gray-800/50 rounded text-sm">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: chartData.datasets[0].backgroundColor[
                                  distribucionData.findIndex(d => d.label === item.label)
                                ] as string
                              }}
                            />
                            <span className="font-medium text-gray-700 dark:text-gray-200 truncate">{item.label}</span>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{item.value}</span>
                            <span className="text-gray-500 dark:text-gray-400 ml-1">({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            
            {distribucionData && distribucionData.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <PieChartIcon className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No hay datos de distribución</p>
                <p className="text-xs mt-1 text-gray-400">
                  Registra resultados para ver la distribución
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PieChart;
