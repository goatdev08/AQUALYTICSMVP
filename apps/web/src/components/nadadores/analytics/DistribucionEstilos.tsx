"use client";

/**
 * Componente para mostrar distribución de estilos del nadador
 * Gráfico de barras con Chart.js
 */

import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { type DistribucionEstilo } from '@/hooks/useNadadorAnalytics';
import { BarChart3, Award, Activity } from 'lucide-react';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DistribucionEstilosProps {
  distribucion: DistribucionEstilo[];
  isLoading?: boolean;
}

export default function DistribucionEstilos({ distribucion, isLoading }: DistribucionEstilosProps) {
  
  // Configuración del gráfico de barras
  const chartData = useMemo(() => {
    const colores = [
      'rgba(34, 197, 94, 0.8)',   // Verde
      'rgba(59, 130, 246, 0.8)',  // Azul
      'rgba(168, 85, 247, 0.8)',  // Púrpura
      'rgba(249, 115, 22, 0.8)',  // Naranja
      'rgba(236, 72, 153, 0.8)',  // Rosa
    ];

    const coloresBorde = [
      'rgba(34, 197, 94, 1)',
      'rgba(59, 130, 246, 1)',
      'rgba(168, 85, 247, 1)',
      'rgba(249, 115, 22, 1)',
      'rgba(236, 72, 153, 1)',
    ];

    return {
      labels: distribucion.map(d => d.estilo),
      datasets: [
        {
          label: 'Pruebas Nadadas',
          data: distribucion.map(d => d.pruebas_nadadas),
          backgroundColor: colores.slice(0, distribucion.length),
          borderColor: coloresBorde.slice(0, distribucion.length),
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    };
  }, [distribucion]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Distribución por Estilo de Natación',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const index = context.dataIndex;
            const estilo = distribucion[index];
            if (!estilo) return '';
            
            const formatTiempo = (segundos: number): string => {
              const mins = Math.floor(segundos / 60);
              const secs = (segundos % 60).toFixed(2);
              return mins > 0 ? `${mins}:${secs.padStart(5, '0')}` : `${secs}s`;
            };

            return [
              `Pruebas: ${estilo.pruebas_nadadas}`,
              `Mejor tiempo: ${formatTiempo(estilo.mejor_tiempo)} (${estilo.prueba_mejor_tiempo})`,
              `Promedio: ${formatTiempo(estilo.promedio)} (${estilo.prueba_promedio})`,
              `Porcentaje: ${estilo.porcentaje}%`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
        title: {
          display: true,
          text: 'Número de Pruebas'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Estilo de Natación'
        }
      }
    },
  };

  const formatTiempo = (segundos: number): string => {
    const mins = Math.floor(segundos / 60);
    const secs = (segundos % 60).toFixed(2);
    return mins > 0 ? `${mins}:${secs.padStart(5, '0')}` : `${secs}`;
  };

  // Estadísticas destacadas
  const estadisticas = useMemo(() => {
    if (distribucion.length === 0) return null;

    const estiloFavorito = distribucion.reduce((prev, current) => 
      prev.pruebas_nadadas > current.pruebas_nadadas ? prev : current
    );

    const mejorEstilo = distribucion.reduce((prev, current) => 
      prev.mejor_tiempo < current.mejor_tiempo ? prev : current
    );

    const totalPruebas = distribucion.reduce((sum, d) => sum + d.pruebas_nadadas, 0);

    return {
      estiloFavorito,
      mejorEstilo,
      totalPruebas,
    };
  }, [distribucion]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">🎯 Distribución de Estilos</h3>
        <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (distribucion.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No hay datos de distribución</h3>
        <p className="text-gray-600">La distribución por estilos aparecerá aquí con más datos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">🎯 Distribución de Estilos</h3>
        <p className="text-sm text-gray-600">
          Análisis de especialidades y preferencias por estilo
        </p>
      </div>

      {/* Estadísticas destacadas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <Award className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-900">Estilo Favorito</span>
            </div>
            <p className="text-2xl font-bold text-green-900 mt-1">
              {estadisticas.estiloFavorito.estilo}
            </p>
            <p className="text-xs text-green-700">
              {estadisticas.estiloFavorito.pruebas_nadadas} pruebas ({estadisticas.estiloFavorito.porcentaje}%)
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">Mejor Estilo</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 mt-1">
              {estadisticas.mejorEstilo.estilo}
            </p>
            <p className="text-xs text-blue-700">
              {formatTiempo(estadisticas.mejorEstilo.mejor_tiempo)} mejor marca
            </p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center">
              <Activity className="h-5 w-5 text-purple-600 mr-2" />
              <span className="text-sm font-medium text-purple-900">Total Pruebas</span>
            </div>
            <p className="text-2xl font-bold text-purple-900 mt-1">
              {estadisticas.totalPruebas}
            </p>
            <p className="text-xs text-purple-700">
              Eventos completados
            </p>
          </div>
        </div>
      )}

      {/* Gráfico de barras */}
      <div className="bg-white border rounded-lg p-4">
        <div style={{ height: '400px' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Tabla detallada */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h4 className="text-lg font-medium text-gray-900">Detalles por Estilo</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estilo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pruebas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mejor Tiempo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Promedio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Especialidad
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {distribucion.map((estilo, index) => (
                <tr key={estilo.estilo} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {estilo.estilo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {estilo.pruebas_nadadas}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${estilo.porcentaje}%` }}
                        ></div>
                      </div>
                      <span className="font-medium">{estilo.porcentaje}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <span className="font-mono font-semibold">{formatTiempo(estilo.mejor_tiempo)}</span>
                      <div className="text-xs text-gray-600 mt-1">
                        📝 {estilo.prueba_mejor_tiempo}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <span className="font-mono">{formatTiempo(estilo.promedio)}</span>
                      <div className="text-xs text-gray-500 mt-1">
                        📊 {estilo.prueba_promedio}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {index === 0 ? '🥇 Principal' :
                       index === 1 ? '🥈 Secundario' :
                       index === 2 ? '🥉 Tercero' :
                       '📊 Ocasional'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
