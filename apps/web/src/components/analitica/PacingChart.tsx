/**
 * Componente PacingChart - Gráfico de líneas para análisis de pacing por segmento.
 * 
 * Muestra la evolución del tiempo por segmento para comparar rendimiento
 * entre promedios de equipo y registros individuales.
 */

'use client';

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  TooltipItem,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card } from '@/components/ui/card';
import { SegmentoPromedio, ComparacionSegmento } from '@/hooks/useAnalitica';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// ==========================================
// Tipos de Props
// ==========================================

interface PacingChartProps {
  /** Datos de promedios de equipo por segmento */
  promediosEquipo?: SegmentoPromedio[];
  /** Datos de comparación entre dos resultados */
  comparacionSegmentos?: ComparacionSegmento[];
  /** Título del gráfico */
  titulo?: string;
  /** Altura del gráfico en píxeles */
  altura?: number;
  /** Si se debe mostrar la leyenda */
  mostrarLeyenda?: boolean;
  /** Tema de colores */
  tema?: 'green' | 'blue' | 'purple';
}

// ==========================================
// Configuración de temas
// ==========================================

const temaColores = {
  green: {
    primario: 'rgb(34, 197, 94)',      // green-500
    secundario: 'rgb(74, 222, 128)',   // green-400  
    terciario: 'rgb(16, 185, 129)',    // emerald-500
    fondo: 'rgba(34, 197, 94, 0.1)',
  },
  blue: {
    primario: 'rgb(59, 130, 246)',     // blue-500
    secundario: 'rgb(96, 165, 250)',   // blue-400
    terciario: 'rgb(14, 165, 233)',    // sky-500
    fondo: 'rgba(59, 130, 246, 0.1)',
  },
  purple: {
    primario: 'rgb(147, 51, 234)',     // purple-500
    secundario: 'rgb(168, 85, 247)',   // purple-400
    terciario: 'rgb(139, 92, 246)',    // violet-500
    fondo: 'rgba(147, 51, 234, 0.1)',
  },
};

// ==========================================
// Utilidades
// ==========================================

/**
 * Convierte centésimas a segundos decimales para el gráfico.
 */
const centesimasASegundos = (centesimas: number): number => {
  return centesimas / 100;
};

/**
 * Formatea tiempo en segundos para mostrar en tooltip.
 */
const formatearSegundos = (segundos: number): string => {
  const minutos = Math.floor(segundos / 60);
  const segs = segundos % 60;
  
  if (minutos > 0) {
    return `${minutos}:${segs.toFixed(2).padStart(5, '0')}`;
  }
  return `${segs.toFixed(2)}s`;
};

// ==========================================
// Componente Principal
// ==========================================

export default function PacingChart({
  promediosEquipo = [],
  comparacionSegmentos = [],
  titulo = 'Análisis de Pacing por Segmento',
  altura = 400,
  mostrarLeyenda = true,
  tema = 'green'
}: PacingChartProps) {
  
  const colores = temaColores[tema];
  
  // Preparar datos del gráfico
  const chartData = useMemo(() => {
    const labels: string[] = [];
    const datasets: any[] = [];
    
    // Caso 1: Mostrar promedios de equipo
    if (promediosEquipo.length > 0) {
      // Crear labels basados en índices de segmentos
      const indices = promediosEquipo.map(s => s.indice).sort((a, b) => a - b);
      labels.push(...indices.map(i => `Seg ${i}`));
      
      // Dataset de promedios de equipo
      const datosPromedio = indices.map(indice => {
        const segmento = promediosEquipo.find(s => s.indice === indice);
        return segmento ? centesimasASegundos(segmento.tiempo_promedio_cs) : 0;
      });
      
      datasets.push({
        label: 'Promedio del Equipo',
        data: datosPromedio,
        borderColor: colores.primario,
        backgroundColor: colores.fondo,
        pointBackgroundColor: colores.primario,
        pointBorderColor: colores.primario,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
        fill: false,
      });
    }
    
    // Caso 2: Mostrar comparación entre resultados
    if (comparacionSegmentos.length > 0) {
      // Crear labels basados en índices de comparación
      const indices = comparacionSegmentos.map(s => s.indice).sort((a, b) => a - b);
      
      if (labels.length === 0) {
        labels.push(...indices.map(i => `Seg ${i}`));
      }
      
      // Dataset del primer resultado
      const datosResultado1 = indices.map(indice => {
        const segmento = comparacionSegmentos.find(s => s.indice === indice);
        return segmento ? centesimasASegundos(segmento.resultado1.tiempo_cs) : 0;
      });
      
      // Dataset del segundo resultado
      const datosResultado2 = indices.map(indice => {
        const segmento = comparacionSegmentos.find(s => s.indice === indice);
        return segmento ? centesimasASegundos(segmento.resultado2.tiempo_cs) : 0;
      });
      
      datasets.push(
        {
          label: 'Resultado 1',
          data: datosResultado1,
          borderColor: colores.secundario,
          backgroundColor: 'rgba(74, 222, 128, 0.1)',
          pointBackgroundColor: colores.secundario,
          pointBorderColor: colores.secundario,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.3,
          fill: false,
        },
        {
          label: 'Resultado 2',
          data: datosResultado2,
          borderColor: colores.terciario,
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          pointBackgroundColor: colores.terciario,
          pointBorderColor: colores.terciario,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.3,
          fill: false,
        }
      );
    }
    
    return { labels, datasets };
  }, [promediosEquipo, comparacionSegmentos, colores]);
  
  // Configuración del gráfico
  const options: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: mostrarLeyenda,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: 'Inter, sans-serif',
          },
        },
      },
      title: {
        display: !!titulo,
        text: titulo,
        font: {
          size: 16,
          family: 'Inter, sans-serif',
          weight: '600',
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: colores.primario,
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: TooltipItem<'line'>) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${formatearSegundos(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Segmentos',
          font: {
            size: 12,
            family: 'Inter, sans-serif',
            weight: '500',
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11,
            family: 'Inter, sans-serif',
          },
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Tiempo (segundos)',
          font: {
            size: 12,
            family: 'Inter, sans-serif',
            weight: '500',
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11,
            family: 'Inter, sans-serif',
          },
          callback: function(value) {
            return formatearSegundos(Number(value));
          },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    elements: {
      point: {
        hoverRadius: 8,
      },
    },
  }), [titulo, mostrarLeyenda, colores]);
  
  // Renderizar mensaje si no hay datos
  if (chartData.datasets.length === 0 || chartData.labels.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-lg font-medium">Sin datos para mostrar</p>
            <p className="text-sm">Selecciona filtros o resultados para ver el análisis de pacing</p>
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="p-6">
      <div style={{ height: altura }}>
        <Line data={chartData} options={options} />
      </div>
      
      {/* Información adicional */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
        {promediosEquipo.length > 0 && (
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colores.primario }}
            />
            <span>{promediosEquipo.length} segmentos analizados</span>
          </div>
        )}
        
        {comparacionSegmentos.length > 0 && (
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colores.secundario }}
            />
            <span>{comparacionSegmentos.length} segmentos comparados</span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <span className="text-xs">💡</span>
          <span>Líneas más bajas indican mejor rendimiento</span>
        </div>
      </div>
    </Card>
  );
}
