/**
 * Componente RadarChart - Gráfico de radar para análisis de fortalezas y debilidades.
 * 
 * Muestra métricas clave del nadador en un gráfico de radar,
 * comparando con promedios de equipo o entre diferentes períodos.
 */

'use client';

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions,
  TooltipItem,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { Card } from '@/components/ui/card';

// Registrar componentes de Chart.js
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

// ==========================================
// Tipos de Props
// ==========================================

export interface MetricaRadar {
  /** Nombre de la métrica */
  nombre: string;
  /** Valor actual del nadador (0-100) */
  valor: number;
  /** Valor de referencia/promedio (0-100) */
  referencia?: number;
  /** Unidad de medida para mostrar en tooltip */
  unidad?: string;
  /** Descripción de la métrica */
  descripcion?: string;
}

interface RadarChartProps {
  /** Métricas del nadador para mostrar en el radar */
  metricas: MetricaRadar[];
  /** Título del gráfico */
  titulo?: string;
  /** Nombre del nadador o dataset principal */
  nombreNadador?: string;
  /** Nombre del dataset de referencia */
  nombreReferencia?: string;
  /** Altura del gráfico en píxeles */
  altura?: number;
  /** Si se debe mostrar la leyenda */
  mostrarLeyenda?: boolean;
  /** Tema de colores */
  tema?: 'green' | 'blue' | 'purple';
  /** Si se debe mostrar el área rellena */
  mostrarArea?: boolean;
}

// ==========================================
// Configuración de temas
// ==========================================

const temaColores = {
  green: {
    primario: 'rgba(34, 197, 94, 0.8)',      // green-500
    primarioFondo: 'rgba(34, 197, 94, 0.2)',
    secundario: 'rgba(16, 185, 129, 0.8)',   // emerald-500
    secundarioFondo: 'rgba(16, 185, 129, 0.1)',
    borde: 'rgb(34, 197, 94)',
    bordeSecundario: 'rgb(16, 185, 129)',
  },
  blue: {
    primario: 'rgba(59, 130, 246, 0.8)',     // blue-500
    primarioFondo: 'rgba(59, 130, 246, 0.2)',
    secundario: 'rgba(14, 165, 233, 0.8)',   // sky-500
    secundarioFondo: 'rgba(14, 165, 233, 0.1)',
    borde: 'rgb(59, 130, 246)',
    bordeSecundario: 'rgb(14, 165, 233)',
  },
  purple: {
    primario: 'rgba(147, 51, 234, 0.8)',     // purple-500
    primarioFondo: 'rgba(147, 51, 234, 0.2)',
    secundario: 'rgba(139, 92, 246, 0.8)',   // violet-500
    secundarioFondo: 'rgba(139, 92, 246, 0.1)',
    borde: 'rgb(147, 51, 234)',
    bordeSecundario: 'rgb(139, 92, 246)',
  },
};

// ==========================================
// Métricas predeterminadas para nadadores
// ==========================================

export const metricasDefault: MetricaRadar[] = [
  {
    nombre: 'Velocidad',
    valor: 0,
    unidad: 'm/s',
    descripcion: 'Velocidad promedio en el agua',
  },
  {
    nombre: 'Eficiencia',
    valor: 0,
    unidad: 'm/brazada',
    descripcion: 'Distancia por brazada',
  },
  {
    nombre: 'Consistencia',
    valor: 0,
    unidad: '%',
    descripcion: 'Consistencia entre segmentos',
  },
  {
    nombre: 'Resistencia',
    valor: 0,
    unidad: '%',
    descripcion: 'Mantenimiento del ritmo',
  },
  {
    nombre: 'Técnica',
    valor: 0,
    unidad: 'puntos',
    descripcion: 'Calidad técnica general',
  },
  {
    nombre: 'Explosividad',
    valor: 0,
    unidad: '%',
    descripcion: 'Capacidad de aceleración',
  },
];

// ==========================================
// Utilidades
// ==========================================

/**
 * Normaliza un valor a escala 0-100 para el radar.
 */
export const normalizarValor = (
  valor: number, 
  min: number, 
  max: number
): number => {
  if (max === min) return 50; // Valor medio si no hay rango
  return Math.max(0, Math.min(100, ((valor - min) / (max - min)) * 100));
};

/**
 * Calcula métricas básicas a partir de datos de segmentos.
 */
export const calcularMetricasBasicas = (
  segmentos: any[],
  tiempoGlobal: number,
  distanciaTotal: number
): Partial<Record<string, number>> => {
  if (!segmentos.length) return {};
  
  // Velocidad promedio
  const velocidadPromedio = distanciaTotal / (tiempoGlobal / 100); // m/s
  
  // Eficiencia (distancia por brazada)
  const totalBrazadas = segmentos.reduce((sum, s) => sum + (s.brazadas || 0), 0);
  const distanciaSinFlecha = segmentos.reduce((sum, s) => sum + (s.dist_sin_flecha_m || 0), 0);
  const eficiencia = totalBrazadas > 0 ? distanciaSinFlecha / totalBrazadas : 0;
  
  // Consistencia (coeficiente de variación invertido)
  const tiemposSegmentos = segmentos.map(s => s.tiempo_cs);
  const promedioTiempo = tiemposSegmentos.reduce((a, b) => a + b, 0) / tiemposSegmentos.length;
  const varianza = tiemposSegmentos.reduce((sum, t) => sum + Math.pow(t - promedioTiempo, 2), 0) / tiemposSegmentos.length;
  const desviacion = Math.sqrt(varianza);
  const coeficienteVariacion = promedioTiempo > 0 ? (desviacion / promedioTiempo) * 100 : 0;
  const consistencia = Math.max(0, 100 - coeficienteVariacion * 10); // Invertir para que mayor sea mejor
  
  // Resistencia (comparar primera mitad vs segunda mitad)
  const mitad = Math.floor(tiemposSegmentos.length / 2);
  const primeraMitad = tiemposSegmentos.slice(0, mitad);
  const segundaMitad = tiemposSegmentos.slice(mitad);
  const promedioPrimera = primeraMitad.reduce((a, b) => a + b, 0) / primeraMitad.length;
  const promedioSegunda = segundaMitad.reduce((a, b) => a + b, 0) / segundaMitad.length;
  const deterioro = promedioPrimera > 0 ? ((promedioSegunda - promedioPrimera) / promedioPrimera) * 100 : 0;
  const resistencia = Math.max(0, 100 - deterioro * 2); // Menos deterioro = mejor resistencia
  
  return {
    velocidad: velocidadPromedio,
    eficiencia: eficiencia,
    consistencia: consistencia,
    resistencia: resistencia,
  };
};

// ==========================================
// Componente Principal
// ==========================================

export default function RadarChart({
  metricas = [],
  titulo = 'Análisis de Fortalezas y Debilidades',
  nombreNadador = 'Nadador',
  nombreReferencia = 'Promedio Equipo',
  altura = 400,
  mostrarLeyenda = true,
  tema = 'green',
  mostrarArea = true,
}: RadarChartProps) {
  
  const colores = temaColores[tema];
  
  // Preparar datos del gráfico
  const chartData = useMemo(() => {
    if (!metricas.length) return { labels: [], datasets: [] };
    
    const labels = metricas.map(m => m.nombre);
    const datasets: any[] = [];
    
    // Dataset principal (nadador)
    const datosNadador = metricas.map(m => m.valor);
    datasets.push({
      label: nombreNadador,
      data: datosNadador,
      borderColor: colores.borde,
      backgroundColor: mostrarArea ? colores.primarioFondo : 'transparent',
      pointBackgroundColor: colores.borde,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2,
      fill: mostrarArea,
    });
    
    // Dataset de referencia (si existe)
    const tieneReferencia = metricas.some(m => m.referencia !== undefined);
    if (tieneReferencia) {
      const datosReferencia = metricas.map(m => m.referencia || 0);
      datasets.push({
        label: nombreReferencia,
        data: datosReferencia,
        borderColor: colores.bordeSecundario,
        backgroundColor: mostrarArea ? colores.secundarioFondo : 'transparent',
        pointBackgroundColor: colores.bordeSecundario,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        borderDash: [5, 5], // Línea punteada para referencia
        fill: mostrarArea ? 1 : false, // Fill hasta el dataset anterior
      });
    }
    
    return { labels, datasets };
  }, [metricas, nombreNadador, nombreReferencia, colores, mostrarArea]);
  
  // Configuración del gráfico
  const options: ChartOptions<'radar'> = useMemo(() => ({
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
          weight: 600,
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: colores.borde,
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: TooltipItem<'radar'>) {
            const metrica = metricas[context.dataIndex];
            const valor = context.parsed.r;
            const unidad = metrica?.unidad || '';
            const descripcion = metrica?.descripcion || '';
            
            let label = `${context.dataset.label}: ${valor.toFixed(1)}`;
            if (unidad) label += ` ${unidad}`;
            if (descripcion) label += ` (${descripcion})`;
            
            return label;
          },
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        min: 0,
        ticks: {
          stepSize: 20,
          font: {
            size: 10,
            family: 'Inter, sans-serif',
          },
          color: 'rgba(0, 0, 0, 0.6)',
          backdropColor: 'transparent',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        pointLabels: {
          font: {
            size: 12,
            family: 'Inter, sans-serif',
            weight: 500,
          },
          color: 'rgba(0, 0, 0, 0.8)',
        },
      },
    },
    interaction: {
      intersect: false,
    },
    elements: {
      point: {
        hoverRadius: 8,
      },
    },
  }), [titulo, mostrarLeyenda, colores, metricas]);
  
  // Renderizar mensaje si no hay datos
  if (!metricas.length || chartData.datasets.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📡</div>
            <p className="text-lg font-medium">Sin datos para mostrar</p>
            <p className="text-sm">Proporciona métricas para ver el análisis de radar</p>
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="p-6">
      <div style={{ height: altura }}>
        <Radar data={chartData} options={options} />
      </div>
      
      {/* Información de métricas */}
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Métricas analizadas:</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-600">
          {metricas.map((metrica, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: colores.borde }}
              />
              <span className="truncate">
                {metrica.nombre}: {metrica.valor.toFixed(1)}
                {metrica.unidad && ` ${metrica.unidad}`}
              </span>
            </div>
          ))}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
          <span>💡</span>
          <span>Los valores están normalizados en escala 0-100. Mayores valores indican mejor rendimiento.</span>
        </div>
      </div>
    </Card>
  );
}
