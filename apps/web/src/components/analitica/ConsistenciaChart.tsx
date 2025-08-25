/**
 * Componente ConsistenciaChart - Gráfico para análisis de consistencia y variabilidad.
 * 
 * Muestra la variabilidad de tiempos por segmento y análisis estadísticos
 * de consistencia para identificar patrones de rendimiento.
 */

'use client';

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  TooltipItem,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SegmentoPromedio, ComparacionSegmento } from '@/hooks/useAnalitica';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// ==========================================
// Tipos de Props
// ==========================================

export interface DatosConsistencia {
  /** Índice del segmento */
  indice: number;
  /** Tiempo del segmento en centésimas */
  tiempo_cs: number;
  /** Desviación respecto al promedio */
  desviacion: number;
  /** Percentil del tiempo (0-100) */
  percentil: number;
}

interface ConsistenciaChartProps {
  /** Datos de segmentos para análisis de consistencia */
  segmentos?: DatosConsistencia[];
  /** Datos de promedios de equipo para comparación */
  promediosEquipo?: SegmentoPromedio[];
  /** Título del gráfico */
  titulo?: string;
  /** Altura del gráfico en píxeles */
  altura?: number;
  /** Tipo de visualización */
  tipo?: 'linea' | 'barras' | 'combinado';
  /** Tema de colores */
  tema?: 'green' | 'blue' | 'purple';
  /** Si se debe mostrar estadísticas */
  mostrarEstadisticas?: boolean;
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
    fondoSecundario: 'rgba(74, 222, 128, 0.3)',
    alerta: 'rgb(239, 68, 68)',        // red-500
    advertencia: 'rgb(245, 158, 11)',  // amber-500
  },
  blue: {
    primario: 'rgb(59, 130, 246)',     // blue-500
    secundario: 'rgb(96, 165, 250)',   // blue-400
    terciario: 'rgb(14, 165, 233)',    // sky-500
    fondo: 'rgba(59, 130, 246, 0.1)',
    fondoSecundario: 'rgba(96, 165, 250, 0.3)',
    alerta: 'rgb(239, 68, 68)',
    advertencia: 'rgb(245, 158, 11)',
  },
  purple: {
    primario: 'rgb(147, 51, 234)',     // purple-500
    secundario: 'rgb(168, 85, 247)',   // purple-400
    terciario: 'rgb(139, 92, 246)',    // violet-500
    fondo: 'rgba(147, 51, 234, 0.1)',
    fondoSecundario: 'rgba(168, 85, 247, 0.3)',
    alerta: 'rgb(239, 68, 68)',
    advertencia: 'rgb(245, 158, 11)',
  },
};

// ==========================================
// Utilidades
// ==========================================

/**
 * Calcula estadísticas de consistencia a partir de segmentos.
 */
export const calcularEstadisticasConsistencia = (
  segmentos: DatosConsistencia[]
): {
  promedio: number;
  desviacionEstandar: number;
  coeficienteVariacion: number;
  rango: number;
  consistencia: 'excelente' | 'buena' | 'regular' | 'pobre';
  segmentosInconsistentes: number;
} => {
  if (!segmentos.length) {
    return {
      promedio: 0,
      desviacionEstandar: 0,
      coeficienteVariacion: 0,
      rango: 0,
      consistencia: 'pobre',
      segmentosInconsistentes: 0,
    };
  }

  const tiempos = segmentos.map(s => s.tiempo_cs);
  const promedio = tiempos.reduce((sum, t) => sum + t, 0) / tiempos.length;
  
  // Desviación estándar
  const varianza = tiempos.reduce((sum, t) => sum + Math.pow(t - promedio, 2), 0) / tiempos.length;
  const desviacionEstandar = Math.sqrt(varianza);
  
  // Coeficiente de variación
  const coeficienteVariacion = promedio > 0 ? (desviacionEstandar / promedio) * 100 : 0;
  
  // Rango
  const minimo = Math.min(...tiempos);
  const maximo = Math.max(...tiempos);
  const rango = maximo - minimo;
  
  // Clasificación de consistencia
  let consistencia: 'excelente' | 'buena' | 'regular' | 'pobre';
  if (coeficienteVariacion < 2) consistencia = 'excelente';
  else if (coeficienteVariacion < 5) consistencia = 'buena';
  else if (coeficienteVariacion < 10) consistencia = 'regular';
  else consistencia = 'pobre';
  
  // Segmentos inconsistentes (fuera de 1.5 desviaciones estándar)
  const umbral = 1.5 * desviacionEstandar;
  const segmentosInconsistentes = segmentos.filter(
    s => Math.abs(s.tiempo_cs - promedio) > umbral
  ).length;

  return {
    promedio,
    desviacionEstandar,
    coeficienteVariacion,
    rango,
    consistencia,
    segmentosInconsistentes,
  };
};

/**
 * Convierte datos de segmentos a formato de consistencia.
 */
export const procesarSegmentosParaConsistencia = (
  segmentos: any[]
): DatosConsistencia[] => {
  if (!segmentos.length) return [];

  const tiempos = segmentos.map(s => s.tiempo_cs || 0);
  const promedio = tiempos.reduce((sum, t) => sum + t, 0) / tiempos.length;
  
  // Calcular percentiles
  const tiemposOrdenados = [...tiempos].sort((a, b) => a - b);
  
  return segmentos.map((segmento, index) => {
    const tiempo = segmento.tiempo_cs || 0;
    const desviacion = tiempo - promedio;
    
    // Calcular percentil
    const posicion = tiemposOrdenados.indexOf(tiempo);
    const percentil = (posicion / (tiemposOrdenados.length - 1)) * 100;
    
    return {
      indice: segmento.indice || index + 1,
      tiempo_cs: tiempo,
      desviacion,
      percentil,
    };
  });
};

/**
 * Formatea tiempo en centésimas a formato legible.
 */
const formatearTiempo = (centesimas: number): string => {
  const minutos = Math.floor(centesimas / 6000);
  const segundos = Math.floor((centesimas % 6000) / 100);
  const centesimasRestantes = centesimas % 100;
  
  if (minutos > 0) {
    return `${minutos}:${segundos.toString().padStart(2, '0')}.${centesimasRestantes.toString().padStart(2, '0')}`;
  }
  return `${segundos}.${centesimasRestantes.toString().padStart(2, '0')}s`;
};

// ==========================================
// Componente Principal
// ==========================================

export default function ConsistenciaChart({
  segmentos = [],
  promediosEquipo = [],
  titulo = 'Análisis de Consistencia',
  altura = 400,
  tipo = 'combinado',
  tema = 'green',
  mostrarEstadisticas = true,
}: ConsistenciaChartProps) {
  
  const colores = temaColores[tema];
  
  // Calcular estadísticas
  const estadisticas = useMemo(() => 
    calcularEstadisticasConsistencia(segmentos), 
    [segmentos]
  );
  
  // Preparar datos del gráfico
  const chartData = useMemo(() => {
    if (!segmentos.length) return { labels: [], datasets: [] };
    
    const labels = segmentos.map(s => `Seg ${s.indice}`);
    const datasets: any[] = [];
    
    if (tipo === 'linea' || tipo === 'combinado') {
      // Dataset de línea para tiempos
      datasets.push({
        type: 'line' as const,
        label: 'Tiempo por Segmento',
        data: segmentos.map(s => s.tiempo_cs / 100), // Convertir a segundos
        borderColor: colores.primario,
        backgroundColor: colores.fondo,
        pointBackgroundColor: segmentos.map(s => {
          const absDesviacion = Math.abs(s.desviacion);
          if (absDesviacion > estadisticas.desviacionEstandar * 1.5) return colores.alerta;
          if (absDesviacion > estadisticas.desviacionEstandar) return colores.advertencia;
          return colores.primario;
        }),
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.3,
        fill: false,
        yAxisID: 'y',
      });
    }
    
    if (tipo === 'barras' || tipo === 'combinado') {
      // Dataset de barras para desviaciones
      datasets.push({
        type: 'bar' as const,
        label: 'Desviación del Promedio',
        data: segmentos.map(s => s.desviacion / 100), // Convertir a segundos
        backgroundColor: segmentos.map(s => {
          const absDesviacion = Math.abs(s.desviacion);
          if (absDesviacion > estadisticas.desviacionEstandar * 1.5) return colores.alerta + '80';
          if (absDesviacion > estadisticas.desviacionEstandar) return colores.advertencia + '80';
          if (s.desviacion < 0) return colores.terciario + '80'; // Mejor que promedio
          return colores.fondoSecundario;
        }),
        borderColor: segmentos.map(s => {
          const absDesviacion = Math.abs(s.desviacion);
          if (absDesviacion > estadisticas.desviacionEstandar * 1.5) return colores.alerta;
          if (absDesviacion > estadisticas.desviacionEstandar) return colores.advertencia;
          if (s.desviacion < 0) return colores.terciario;
          return colores.secundario;
        }),
        borderWidth: 1,
        yAxisID: tipo === 'combinado' ? 'y1' : 'y',
      });
    }
    
    return { labels, datasets };
  }, [segmentos, tipo, colores, estadisticas]);
  
  // Configuración del gráfico
  const options: ChartOptions<'line' | 'bar'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
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
          label: function(context: TooltipItem<'line' | 'bar'>) {
            const segmento = segmentos[context.dataIndex];
            const label = context.dataset.label || '';
            
            if (label.includes('Tiempo')) {
              return `${label}: ${formatearTiempo(segmento.tiempo_cs)}`;
            } else if (label.includes('Desviación')) {
              const desv = segmento.desviacion;
              const signo = desv >= 0 ? '+' : '';
              return `${label}: ${signo}${formatearTiempo(Math.abs(desv))}`;
            }
            
            return `${label}: ${context.parsed.y}`;
          },
          afterLabel: function(context: TooltipItem<'line' | 'bar'>) {
            const segmento = segmentos[context.dataIndex];
            return `Percentil: ${segmento.percentil.toFixed(1)}%`;
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
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
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
          callback: function(value) {
            return `${Number(value).toFixed(2)}s`;
          },
        },
      },
      ...(tipo === 'combinado' && {
        y1: {
          type: 'linear' as const,
          display: true,
          position: 'right' as const,
          title: {
            display: true,
            text: 'Desviación (segundos)',
            font: {
              size: 12,
              family: 'Inter, sans-serif',
              weight: '500',
            },
          },
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            callback: function(value) {
              const signo = Number(value) >= 0 ? '+' : '';
              return `${signo}${Number(value).toFixed(2)}s`;
            },
          },
        },
      }),
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  }), [titulo, colores, segmentos, tipo]);
  
  // Renderizar mensaje si no hay datos
  if (!segmentos.length) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📈</div>
            <p className="text-lg font-medium">Sin datos para mostrar</p>
            <p className="text-sm">Proporciona datos de segmentos para ver el análisis de consistencia</p>
          </div>
        </div>
      </Card>
    );
  }
  
  const ChartComponent = tipo === 'barras' ? Bar : Line;
  
  return (
    <Card className="p-6">
      <div style={{ height: altura }}>
        <ChartComponent data={chartData} options={options} />
      </div>
      
      {/* Estadísticas de consistencia */}
      {mostrarEstadisticas && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Análisis de Consistencia</h4>
            <Badge 
              variant={
                estadisticas.consistencia === 'excelente' ? 'default' :
                estadisticas.consistencia === 'buena' ? 'secondary' :
                estadisticas.consistencia === 'regular' ? 'outline' : 'destructive'
              }
            >
              {estadisticas.consistencia.toUpperCase()}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-gray-900">
                {formatearTiempo(estadisticas.promedio)}
              </div>
              <div className="text-gray-500">Tiempo Promedio</div>
            </div>
            
            <div className="text-center">
              <div className="font-medium text-gray-900">
                {estadisticas.coeficienteVariacion.toFixed(2)}%
              </div>
              <div className="text-gray-500">Coef. Variación</div>
            </div>
            
            <div className="text-center">
              <div className="font-medium text-gray-900">
                {formatearTiempo(estadisticas.rango)}
              </div>
              <div className="text-gray-500">Rango</div>
            </div>
            
            <div className="text-center">
              <div className="font-medium text-gray-900">
                {estadisticas.segmentosInconsistentes}
              </div>
              <div className="text-gray-500">Seg. Inconsistentes</div>
            </div>
          </div>
          
          {/* Leyenda de colores */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colores.primario }} />
              <span>Normal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colores.advertencia }} />
              <span>Variación moderada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colores.alerta }} />
              <span>Variación alta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colores.terciario }} />
              <span>Mejor que promedio</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
