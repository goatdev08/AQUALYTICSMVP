/**
 * Configuración común para Chart.js
 * 
 * Proporciona configuraciones estandarizadas y temas consistentes
 * para todos los gráficos de análisis en la aplicación.
 */

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  TooltipItem,
} from 'chart.js';

// Registrar todos los componentes de Chart.js globalmente
ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ==========================================
// Configuración de Temas
// ==========================================

export interface ChartTheme {
  primary: string;
  secondary: string;
  tertiary: string;
  background: string;
  backgroundSecondary: string;
  alert: string;
  warning: string;
  success: string;
  neutral: string;
}

export const chartThemes: Record<string, ChartTheme> = {
  green: {
    primary: 'rgb(34, 197, 94)',      // green-500
    secondary: 'rgb(74, 222, 128)',   // green-400  
    tertiary: 'rgb(16, 185, 129)',    // emerald-500
    background: 'rgba(34, 197, 94, 0.1)',
    backgroundSecondary: 'rgba(74, 222, 128, 0.3)',
    alert: 'rgb(239, 68, 68)',        // red-500
    warning: 'rgb(245, 158, 11)',     // amber-500
    success: 'rgb(34, 197, 94)',      // green-500
    neutral: 'rgb(107, 114, 128)',    // gray-500
  },
  blue: {
    primary: 'rgb(59, 130, 246)',     // blue-500
    secondary: 'rgb(96, 165, 250)',   // blue-400
    tertiary: 'rgb(14, 165, 233)',    // sky-500
    background: 'rgba(59, 130, 246, 0.1)',
    backgroundSecondary: 'rgba(96, 165, 250, 0.3)',
    alert: 'rgb(239, 68, 68)',        // red-500
    warning: 'rgb(245, 158, 11)',     // amber-500
    success: 'rgb(34, 197, 94)',      // green-500
    neutral: 'rgb(107, 114, 128)',    // gray-500
  },
  purple: {
    primary: 'rgb(147, 51, 234)',     // purple-500
    secondary: 'rgb(168, 85, 247)',   // purple-400
    tertiary: 'rgb(139, 92, 246)',    // violet-500
    background: 'rgba(147, 51, 234, 0.1)',
    backgroundSecondary: 'rgba(168, 85, 247, 0.3)',
    alert: 'rgb(239, 68, 68)',        // red-500
    warning: 'rgb(245, 158, 11)',     // amber-500
    success: 'rgb(34, 197, 94)',      // green-500
    neutral: 'rgb(107, 114, 128)',    // gray-500
  },
};

// ==========================================
// Configuraciones Base
// ==========================================

export const baseChartOptions: Partial<ChartOptions<any>> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
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
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
    },
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
      },
      ticks: {
        font: {
          size: 11,
          family: 'Inter, sans-serif',
        },
      },
      title: {
        font: {
          size: 12,
          family: 'Inter, sans-serif',
          weight: 500,
        },
      },
    },
    y: {
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
      },
      ticks: {
        font: {
          size: 11,
          family: 'Inter, sans-serif',
        },
      },
      title: {
        font: {
          size: 12,
          family: 'Inter, sans-serif',
          weight: 500,
        },
      },
    },
  },
  interaction: {
    mode: 'nearest' as const,
    intersect: false,
  },
  elements: {
    point: {
      hoverRadius: 8,
    },
  },
};

// ==========================================
// Configuraciones Específicas por Tipo
// ==========================================

export const lineChartDefaults: Partial<ChartOptions<'line'>> = {
  ...baseChartOptions,
  plugins: {
    ...baseChartOptions.plugins,
    tooltip: {
      ...baseChartOptions.plugins?.tooltip,
      mode: 'index' as const,
      intersect: false,
    },
  },
  interaction: {
    mode: 'nearest' as const,
    axis: 'x' as const,
    intersect: false,
  },
  elements: {
    ...baseChartOptions.elements,
    line: {
      tension: 0.3,
    },
  },
};

export const barChartDefaults: Partial<ChartOptions<'bar'>> = {
  ...baseChartOptions,
  plugins: {
    ...baseChartOptions.plugins,
    tooltip: {
      ...baseChartOptions.plugins?.tooltip,
      mode: 'index' as const,
      intersect: false,
    },
  },
};

export const pieChartDefaults: Partial<ChartOptions<'pie'>> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    ...baseChartOptions.plugins,
    tooltip: {
      ...baseChartOptions.plugins?.tooltip,
      mode: 'index' as const,
      intersect: false,
    },
    legend: {
      display: true,
      position: 'right' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12,
          family: 'Inter, sans-serif',
        },
      },
    },
  },
  interaction: {
    intersect: false,
  },
};

export const radarChartDefaults: Partial<ChartOptions<'radar'>> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    ...baseChartOptions.plugins,
    tooltip: {
      ...baseChartOptions.plugins?.tooltip,
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
};

// ==========================================
// Utilidades de Configuración
// ==========================================

/**
 * Crea opciones de gráfico con tema aplicado.
 */
export function createChartOptions(
  type: 'line' | 'bar' | 'pie' | 'radar',
  theme: keyof typeof chartThemes = 'green',
  customOptions: any = {}
): any {
  const themeColors = chartThemes[theme];
  
  let baseOptions: any;
  
  switch (type) {
    case 'line':
      baseOptions = lineChartDefaults;
      break;
    case 'bar':
      baseOptions = barChartDefaults;
      break;
    case 'pie':
      baseOptions = pieChartDefaults;
      break;
    case 'radar':
      baseOptions = radarChartDefaults;
      break;
    default:
      baseOptions = baseChartOptions;
  }
  
  // Aplicar colores del tema a tooltip
  const themedOptions = {
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      tooltip: {
        ...baseOptions.plugins?.tooltip,
        borderColor: themeColors.primary,
      },
    },
  };
  
  // Merge con opciones personalizadas
  return mergeChartOptions(themedOptions, customOptions);
}

/**
 * Crea dataset con tema aplicado.
 */
export function createThemedDataset(
  data: any[],
  label: string,
  theme: keyof typeof chartThemes = 'green',
  type: 'line' | 'bar' | 'pie' | 'radar' = 'line'
) {
  const themeColors = chartThemes[theme];
  
  const baseDataset = {
    label,
    data,
    borderColor: themeColors.primary,
    backgroundColor: type === 'radar' ? themeColors.background : themeColors.backgroundSecondary,
    pointBackgroundColor: themeColors.primary,
    pointBorderColor: '#ffffff',
    pointBorderWidth: 2,
    pointRadius: type === 'radar' ? 4 : 6,
    pointHoverRadius: type === 'radar' ? 6 : 8,
  };
  
  if (type === 'line') {
    return {
      ...baseDataset,
      tension: 0.3,
      fill: false,
    };
  }
  
  if (type === 'bar') {
    return {
      ...baseDataset,
      borderWidth: 1,
    };
  }
  
  if (type === 'pie') {
    return {
      ...baseDataset,
      borderWidth: 2,
    };
  }
  
  if (type === 'radar') {
    return {
      ...baseDataset,
      borderWidth: 2,
      fill: true,
    };
  }
  
  return baseDataset;
}

/**
 * Formatea tiempo en centésimas para tooltips.
 */
export function formatTimeForTooltip(centesimas: number): string {
  const minutos = Math.floor(centesimas / 6000);
  const segundos = Math.floor((centesimas % 6000) / 100);
  const centesimasRestantes = centesimas % 100;
  
  if (minutos > 0) {
    return `${minutos}:${segundos.toString().padStart(2, '0')}.${centesimasRestantes.toString().padStart(2, '0')}`;
  }
  return `${segundos}.${centesimasRestantes.toString().padStart(2, '0')}s`;
}

/**
 * Callback personalizado para tooltips de tiempo.
 */
export function createTimeTooltipCallback(
  dataKey: string = 'tiempo_cs'
): (context: TooltipItem<any>) => string {
  return function(context: TooltipItem<any>) {
    const label = context.dataset.label || '';
    const rawData = context.raw;
    
    // Si el dato tiene la propiedad tiempo_cs, usarla
    if (typeof rawData === 'object' && rawData && dataKey in rawData) {
      const tiempo = rawData[dataKey as keyof typeof rawData] as number;
      return `${label}: ${formatTimeForTooltip(tiempo)}`;
    }
    
    // Si es un número simple (ya convertido a segundos)
    if (typeof rawData === 'number') {
      const centesimas = Math.round(rawData * 100);
      return `${label}: ${formatTimeForTooltip(centesimas)}`;
    }
    
    return `${label}: ${context.parsed.y}`;
  };
}

/**
 * Merge profundo de opciones de Chart.js.
 */
function mergeChartOptions(base: any, custom: any): any {
  const result = { ...base };
  
  for (const key in custom) {
    if (custom.hasOwnProperty(key)) {
      const customValue = custom[key];
      const baseValue = result[key];
      
      if (
        customValue && 
        typeof customValue === 'object' && 
        !Array.isArray(customValue) &&
        baseValue && 
        typeof baseValue === 'object' && 
        !Array.isArray(baseValue)
      ) {
        result[key] = mergeChartOptions(baseValue, customValue);
      } else {
        result[key] = customValue;
      }
    }
  }
  
  return result;
}

// ==========================================
// Configuración Global de Chart.js
// ==========================================

// Configurar defaults globales
ChartJS.defaults.font.family = 'Inter, sans-serif';
ChartJS.defaults.color = 'rgba(0, 0, 0, 0.8)';
ChartJS.defaults.borderColor = 'rgba(0, 0, 0, 0.1)';
ChartJS.defaults.backgroundColor = 'rgba(0, 0, 0, 0.05)';

// Configurar plugins globales
ChartJS.defaults.plugins.tooltip.backgroundColor = 'rgba(0, 0, 0, 0.8)';
ChartJS.defaults.plugins.tooltip.titleColor = '#ffffff';
ChartJS.defaults.plugins.tooltip.bodyColor = '#ffffff';
ChartJS.defaults.plugins.tooltip.cornerRadius = 8;
ChartJS.defaults.plugins.tooltip.displayColors = true;

ChartJS.defaults.plugins.legend.labels.usePointStyle = true;
ChartJS.defaults.plugins.legend.labels.padding = 20;

export default ChartJS;