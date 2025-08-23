"use client";

/**
 * Componente para mostrar evolución temporal del nadador
 * Gráfico de líneas con Chart.js y filtros por fecha
 */

import React, { useState, useMemo } from 'react';
import { Button, Alert, AlertDescription, Input } from '@/components/ui';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { type EvolucionTiempo } from '@/hooks/useNadadorAnalytics';
import { TrendingDown, Calendar, Filter, TrendingUp } from 'lucide-react';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface EvolucionTemporalProps {
  evolucion: EvolucionTiempo[];
  isLoading?: boolean;
}

export default function EvolucionTemporal({ evolucion, isLoading }: EvolucionTemporalProps) {
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [pruebaSeleccionada, setPruebaSeleccionada] = useState<string>('');

  // Obtener pruebas únicas para inicializar con la primera disponible
  const pruebas = useMemo(() => {
    const unique = [...new Set(evolucion.map(e => e.prueba))];
    return unique.sort();
  }, [evolucion]);

  // Auto-seleccionar primera prueba disponible si no hay una seleccionada
  React.useEffect(() => {
    if (pruebas.length > 0 && !pruebaSeleccionada) {
      setPruebaSeleccionada(pruebas[0]);
    }
  }, [pruebas, pruebaSeleccionada]);

  // Filtrar datos por fecha y prueba (PRUEBA OBLIGATORIA)
  const datosFiltrados = useMemo(() => {
    // Si no hay prueba seleccionada, no mostrar datos
    if (!pruebaSeleccionada) return [];

    let filtered = evolucion.filter(d => d.prueba === pruebaSeleccionada);

    if (fechaInicio) {
      filtered = filtered.filter(d => new Date(d.fecha) >= new Date(fechaInicio));
    }
    if (fechaFin) {
      filtered = filtered.filter(d => new Date(d.fecha) <= new Date(fechaFin));
    }

    return filtered.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }, [evolucion, fechaInicio, fechaFin, pruebaSeleccionada]);

  // Configuración del gráfico
  const chartData = useMemo(() => {
    const labels = datosFiltrados.map(d => 
      new Date(d.fecha).toLocaleDateString('es-ES', { 
        month: 'short', 
        day: 'numeric',
        year: '2-digit'
      })
    );

    const tiempos = datosFiltrados.map(d => d.tiempo);

    return {
      labels,
      datasets: [
        {
          label: 'Tiempo (segundos)',
          data: tiempos,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 3,
          pointBackgroundColor: 'rgb(34, 197, 94)',
          pointBorderColor: 'white',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          tension: 0.1,
        },
      ],
    };
  }, [datosFiltrados]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Evolución Temporal - ${pruebaSeleccionada}`,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const tiempo = context.parsed.y;
            const index = context.dataIndex;
            const competencia = datosFiltrados[index]?.competencia;
            const mins = Math.floor(tiempo / 60);
            const secs = (tiempo % 60).toFixed(2);
            const tiempoFormateado = mins > 0 ? `${mins}:${secs.padStart(5, '0')}` : `${secs}s`;
            return [`Tiempo: ${tiempoFormateado}`, `Evento: ${competencia}`];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value: any) {
            const mins = Math.floor(value / 60);
            const secs = (value % 60).toFixed(0);
            return mins > 0 ? `${mins}:${secs.padStart(2, '0')}` : `${secs}s`;
          }
        },
        title: {
          display: true,
          text: 'Tiempo'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Fecha'
        }
      }
    },
  };

  const formatTiempo = (segundos: number): string => {
    const mins = Math.floor(segundos / 60);
    const secs = (segundos % 60).toFixed(2);
    return mins > 0 ? `${mins}:${secs.padStart(5, '0')}` : `${secs}`;
  };

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    if (datosFiltrados.length === 0) return null;
    
    const tiempos = datosFiltrados.map(d => d.tiempo);
    const mejorTiempo = Math.min(...tiempos);
    const peorTiempo = Math.max(...tiempos);
    const promedio = tiempos.reduce((sum, t) => sum + t, 0) / tiempos.length;
    
    // Calcular tendencia (mejora/empeora)
    const firstHalf = tiempos.slice(0, Math.floor(tiempos.length / 2));
    const secondHalf = tiempos.slice(Math.floor(tiempos.length / 2));
    const promedioInicial = firstHalf.reduce((sum, t) => sum + t, 0) / firstHalf.length;
    const promedioFinal = secondHalf.reduce((sum, t) => sum + t, 0) / secondHalf.length;
    const mejora = promedioInicial - promedioFinal; // Positivo = mejora
    
    return {
      mejorTiempo,
      peorTiempo,
      promedio,
      mejora,
      totalRegistros: datosFiltrados.length
    };
  }, [datosFiltrados]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">📈 Evolución Temporal</h3>
        <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }

  if (evolucion.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No hay datos de evolución</h3>
        <p className="text-gray-600">Los datos de progreso aparecerán aquí con más participaciones.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">📈 Evolución Temporal</h3>
        <p className="text-sm text-gray-600">
          Progreso en el tiempo - {datosFiltrados.length} registros
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="fecha-inicio" className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="inline h-4 w-4 mr-1" />
              Fecha inicio
            </label>
            <Input
              id="fecha-inicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div>
            <label htmlFor="fecha-fin" className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="inline h-4 w-4 mr-1" />
              Fecha fin
            </label>
            <Input
              id="fecha-fin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="prueba-select" className="block text-sm font-medium text-gray-700 mb-1">
              <Filter className="inline h-4 w-4 mr-1" />
              Prueba
            </label>
            <select
              id="prueba-select"
              value={pruebaSeleccionada}
              onChange={(e) => setPruebaSeleccionada(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              required
            >
              {pruebas.length === 0 && (
                <option value="">Sin pruebas disponibles</option>
              )}
              {pruebas.map(prueba => (
                <option key={prueba} value={prueba}>{prueba}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setFechaInicio('');
                setFechaFin('');
                // No resetear prueba - es obligatoria
              }}
              className="w-full"
            >
              Limpiar fechas
            </Button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-900">Mejor marca</p>
            <p className="text-2xl font-bold text-green-900">{formatTiempo(estadisticas.mejorTiempo)}</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900">Promedio</p>
            <p className="text-2xl font-bold text-blue-900">{formatTiempo(estadisticas.promedio)}</p>
          </div>
          
          <div className={`border rounded-lg p-4 ${
            estadisticas.mejora > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <p className={`text-sm font-medium ${
              estadisticas.mejora > 0 ? 'text-green-900' : 'text-red-900'
            }`}>
              Tendencia
            </p>
            <p className={`text-2xl font-bold ${
              estadisticas.mejora > 0 ? 'text-green-900' : 'text-red-900'
            }`}>
              {estadisticas.mejora > 0 ? '-' : '+'}
              {Math.abs(estadisticas.mejora).toFixed(2)}s
            </p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm font-medium text-purple-900">Registros</p>
            <p className="text-2xl font-bold text-purple-900">{estadisticas.totalRegistros}</p>
          </div>
        </div>
      )}

      {/* Gráfico */}
      <div className="bg-white border rounded-lg p-4">
        <div style={{ height: '400px' }}>
          {!pruebaSeleccionada ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Selecciona una prueba para ver evolución</h3>
                <p className="text-gray-600">Elige una prueba específica para visualizar el progreso temporal.</p>
              </div>
            </div>
          ) : datosFiltrados.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Alert>
                <AlertDescription>
                  No hay datos para {pruebaSeleccionada} en el período seleccionado. 
                  Prueba ajustar las fechas o seleccionar una prueba diferente.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <Line data={chartData} options={chartOptions} />
          )}
        </div>
      </div>
    </div>
  );
}
