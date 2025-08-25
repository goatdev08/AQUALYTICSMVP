'use client';

/**
 * Componente Top5Chart - Gráfico de top 5 resultados
 * 
 * Muestra los 5 mejores tiempos con filtros interactivos.
 * Usa Chart.js para visualización y tema verde consistente.
 */

import { useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Filter, TrendingUp } from 'lucide-react';
import { useDashboardTop5 } from '@/hooks/useDashboard';
import { barChartDefaults } from '@/lib/chart-config';

interface Top5Filters {
  estilo?: string;
  distancia?: number;
  curso?: string;
  rama?: string;
}

interface Top5ChartProps {
  /** Filtros iniciales */
  initialFilters?: Top5Filters;
  /** Callback cuando cambian los filtros */
  onFiltersChange?: (filters: Top5Filters) => void;
  /** Altura del gráfico */
  height?: number;
  /** Clase CSS adicional */
  className?: string;
}

export function Top5Chart({
  initialFilters = {},
  onFiltersChange,
  height = 300,
  className = ''
}: Top5ChartProps) {
  const [filters, setFilters] = useState<Top5Filters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);

  // Obtener datos del hook
  const { data: top5Data, isLoading, error, refetch } = useDashboardTop5(filters);

  // Opciones de filtros
  const filterOptions = {
    estilos: ['Libre', 'Dorso', 'Pecho', 'Mariposa', 'Combinado'],
    distancias: [50, 100, 200, 400, 800, 1500],
    cursos: ['SC', 'LC'],
    ramas: ['F', 'M']
  };

  // Configurar datos del gráfico
  const chartData = useMemo(() => {
    if (!top5Data || top5Data.length === 0) {
      return {
        labels: ['Sin datos'],
        datasets: [{
          label: 'Tiempo (seg)',
          data: [0],
          backgroundColor: ['rgba(156, 163, 175, 0.5)'],
          borderColor: ['rgba(156, 163, 175, 1)'],
          borderWidth: 1
        }]
      };
    }

    // Colores del tema verde
    const colors = [
      'rgba(34, 197, 94, 0.8)',   // green-500
      'rgba(22, 163, 74, 0.8)',   // green-600
      'rgba(21, 128, 61, 0.8)',   // green-700
      'rgba(20, 83, 45, 0.8)',    // green-800
      'rgba(22, 101, 52, 0.8)'    // green-900
    ];

    const borderColors = [
      'rgba(34, 197, 94, 1)',
      'rgba(22, 163, 74, 1)',
      'rgba(21, 128, 61, 1)',
      'rgba(20, 83, 45, 1)',
      'rgba(22, 101, 52, 1)'
    ];

    return {
      labels: top5Data.map((result, index) => 
        `${index + 1}. ${result.nadador.split(' ').slice(0, 2).join(' ')}`
      ),
      datasets: [{
        label: 'Tiempo (segundos)',
        data: top5Data.map(result => result.tiempo_cs / 100), // Convertir cs a segundos
        backgroundColor: colors.slice(0, top5Data.length),
        borderColor: borderColors.slice(0, top5Data.length),
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      }]
    };
  }, [top5Data]);

  // Opciones del gráfico
  const chartOptions = useMemo(() => ({
    ...barChartDefaults,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      ...barChartDefaults.plugins,
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            const index = context[0]?.dataIndex;
            return top5Data?.[index]?.nadador || '';
          },
          label: (context: any) => {
            const index = context.dataIndex;
            const result = top5Data?.[index];
            if (!result) return '';
            
            return [
              `Tiempo: ${result.tiempo}`,
              `Prueba: ${result.prueba}`,
              `Competencia: ${result.competencia}`,
              `Fecha: ${new Date(result.fecha).toLocaleDateString()}`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Tiempo (segundos)'
        },
        ticks: {
          callback: function(value: any) {
            const totalSeconds = parseFloat(value);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = (totalSeconds % 60).toFixed(2);
            return minutes > 0 ? `${minutes}:${seconds.padStart(5, '0')}` : `${seconds}s`;
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Ranking'
        }
      }
    }
  }), [top5Data]);

  // Aplicar filtros
  const applyFilters = (newFilters: Top5Filters) => {
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  // Limpiar filtros
  const clearFilters = () => {
    const emptyFilters = {};
    setFilters(emptyFilters);
    onFiltersChange?.(emptyFilters);
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Top 5 Mejores Tiempos
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
            <TrendingUp className="h-5 w-5 text-green-600" />
            Top 5 Mejores Tiempos
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
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
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-green-50 rounded-lg">
            {/* Filtro Estilo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estilo
              </label>
              <select
                value={filters.estilo || ''}
                onChange={(e) => applyFilters({ ...filters, estilo: e.target.value || undefined })}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todos</option>
                {filterOptions.estilos.map(estilo => (
                  <option key={estilo} value={estilo}>{estilo}</option>
                ))}
              </select>
            </div>

            {/* Filtro Distancia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Distancia
              </label>
              <select
                value={filters.distancia || ''}
                onChange={(e) => applyFilters({ ...filters, distancia: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todas</option>
                {filterOptions.distancias.map(distancia => (
                  <option key={distancia} value={distancia}>{distancia}m</option>
                ))}
              </select>
            </div>

            {/* Filtro Curso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Curso
              </label>
              <select
                value={filters.curso || ''}
                onChange={(e) => applyFilters({ ...filters, curso: e.target.value || undefined })}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todos</option>
                {filterOptions.cursos.map(curso => (
                  <option key={curso} value={curso}>{curso}</option>
                ))}
              </select>
            </div>

            {/* Filtro Rama */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rama
              </label>
              <select
                value={filters.rama || ''}
                onChange={(e) => applyFilters({ ...filters, rama: e.target.value || undefined })}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todas</option>
                {filterOptions.ramas.map(rama => (
                  <option key={rama} value={rama}>{rama === 'F' ? 'Femenil' : 'Masculino'}</option>
                ))}
              </select>
            </div>

            {/* Botón limpiar filtros */}
            <div className="col-span-2 md:col-span-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-64 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ) : (
          <>
            <div style={{ height: `${height}px`, position: 'relative' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
            
            {/* Información adicional */}
            {top5Data && top5Data.length > 0 && (
              <div className="mt-4 text-sm text-gray-600">
                <p>
                  Mostrando {top5Data.length} resultado{top5Data.length !== 1 ? 's' : ''} 
                  {Object.keys(filters).length > 0 && ' con filtros aplicados'}
                </p>
              </div>
            )}
            
            {top5Data && top5Data.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No se encontraron resultados</p>
                <p className="text-sm mt-1">
                  {Object.keys(filters).length > 0 
                    ? 'Intenta ajustar los filtros' 
                    : 'Registra algunos resultados para ver el top 5'}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default Top5Chart;
