# Chart.js - Mejores Prácticas para AquaLytics

Este documento describe las mejores prácticas para usar Chart.js en los componentes de análisis de AquaLytics.

## Configuración Base

### Importación Centralizada

```typescript
import { 
  createChartOptions, 
  createThemedDataset, 
  formatTimeForTooltip,
  createTimeTooltipCallback,
  chartThemes 
} from '@/lib/chart-config';
```

### Registro de Componentes

Los componentes de Chart.js están pre-registrados globalmente en `chart-config.ts`. No es necesario registrarlos en cada componente.

## Temas y Consistencia Visual

### Usar Temas Predefinidos

```typescript
// ✅ Correcto - Usar temas predefinidos
const options = createChartOptions('line', 'green', {
  plugins: {
    title: {
      display: true,
      text: 'Mi Gráfico'
    }
  }
});

// ❌ Incorrecto - Colores hardcodeados
const options = {
  borderColor: '#22c55e', // No hacer esto
};
```

### Temas Disponibles

- `green`: Tema principal (por defecto)
- `blue`: Tema secundario  
- `purple`: Tema alternativo

## Datasets con Tema

### Crear Datasets Consistentes

```typescript
// ✅ Correcto - Usar utilidad de tema
const dataset = createThemedDataset(
  data, 
  'Tiempo por Segmento',
  'green',
  'line'
);

// ✅ Múltiples datasets con diferentes temas
const datasets = [
  createThemedDataset(data1, 'Resultado 1', 'green', 'line'),
  createThemedDataset(data2, 'Resultado 2', 'blue', 'line'),
];
```

## Tooltips para Tiempos

### Formateo de Tiempo

```typescript
// ✅ Correcto - Usar callback predefinido
const options = createChartOptions('line', 'green', {
  plugins: {
    tooltip: {
      callbacks: {
        label: createTimeTooltipCallback('tiempo_cs')
      }
    }
  }
});

// ✅ Formateo manual cuando sea necesario
const formatearTiempo = (centesimas: number) => {
  return formatTimeForTooltip(centesimas);
};
```

## Responsividad y Performance

### Configuración de Tamaño

```typescript
// ✅ Correcto - Usar altura fija con responsividad
<div style={{ height: altura }}>
  <Line data={chartData} options={options} />
</div>

// ❌ Incorrecto - Sin contenedor de altura
<Line data={chartData} options={options} />
```

### Optimización de Datos

```typescript
// ✅ Correcto - Usar useMemo para datos complejos
const chartData = useMemo(() => {
  return {
    labels: segmentos.map(s => `Seg ${s.indice}`),
    datasets: [
      createThemedDataset(
        segmentos.map(s => s.tiempo_cs / 100),
        'Tiempos',
        'green',
        'line'
      )
    ]
  };
}, [segmentos]);

// ❌ Incorrecto - Recalcular en cada render
const chartData = {
  labels: segmentos.map(s => `Seg ${s.indice}`), // Se ejecuta en cada render
  datasets: [...]
};
```

## Interactividad

### Eventos de Click

```typescript
// ✅ Correcto - Manejar eventos de manera controlada
const options = createChartOptions('line', 'green', {
  onClick: (event, elements) => {
    if (elements.length > 0) {
      const dataIndex = elements[0].index;
      onSegmentoClick?.(segmentos[dataIndex]);
    }
  }
});
```

### Hover States

```typescript
// ✅ Correcto - Configurar hover consistente
const options = createChartOptions('line', 'green', {
  elements: {
    point: {
      hoverRadius: 8,
      hoverBackgroundColor: chartThemes.green.primary,
    }
  }
});
```

## Tipos de Gráficos Específicos

### Line Charts (Pacing)

```typescript
// ✅ Configuración optimizada para análisis de pacing
const options = createChartOptions('line', 'green', {
  scales: {
    x: {
      title: {
        display: true,
        text: 'Segmentos'
      }
    },
    y: {
      title: {
        display: true,
        text: 'Tiempo (segundos)'
      },
      ticks: {
        callback: (value) => formatTimeForTooltip(Number(value) * 100)
      }
    }
  }
});
```

### Radar Charts (Fortalezas/Debilidades)

```typescript
// ✅ Configuración optimizada para análisis de radar
const options = createChartOptions('radar', 'green', {
  scales: {
    r: {
      max: 100,
      min: 0,
      ticks: {
        stepSize: 20
      }
    }
  }
});
```

### Bar Charts (Comparaciones)

```typescript
// ✅ Configuración optimizada para comparaciones
const options = createChartOptions('bar', 'green', {
  indexAxis: 'x' as const, // Barras verticales
  plugins: {
    tooltip: {
      callbacks: {
        label: (context) => {
          const value = context.parsed.y;
          return `${context.dataset.label}: ${value > 0 ? '+' : ''}${value}`;
        }
      }
    }
  }
});
```

## Estados de Error y Carga

### Manejo de Estados

```typescript
// ✅ Correcto - Manejar estados vacíos
if (!data.length) {
  return (
    <Card className="p-6">
      <div className="text-center text-gray-500">
        <div className="text-4xl mb-2">📊</div>
        <p>Sin datos para mostrar</p>
      </div>
    </Card>
  );
}

// Renderizar gráfico solo cuando hay datos
return (
  <Card className="p-6">
    <div style={{ height: altura }}>
      <Line data={chartData} options={options} />
    </div>
  </Card>
);
```

## Accesibilidad

### Labels y Descripciones

```typescript
// ✅ Correcto - Incluir información accesible
const options = createChartOptions('line', 'green', {
  plugins: {
    title: {
      display: true,
      text: 'Análisis de Pacing por Segmento'
    },
    legend: {
      display: true,
      labels: {
        generateLabels: (chart) => {
          // Generar labels descriptivos
        }
      }
    }
  }
});
```

## Testing

### Datos de Prueba

```typescript
// ✅ Correcto - Usar datos de prueba consistentes
const mockSegmentos = [
  { indice: 1, tiempo_cs: 2850 },
  { indice: 2, tiempo_cs: 2920 },
  // ...
];

// Usar en componentes de prueba
<PacingChart segmentos={mockSegmentos} tema="green" />
```

## Migración de Gráficos Existentes

Para migrar gráficos existentes a usar la configuración centralizada:

1. Reemplazar imports individuales de Chart.js
2. Usar `createChartOptions()` en lugar de configuración manual
3. Usar `createThemedDataset()` para datasets
4. Usar callbacks predefinidos para tooltips de tiempo
5. Verificar que los colores sean consistentes con el tema

## Ejemplo Completo

```typescript
import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { 
  createChartOptions, 
  createThemedDataset,
  createTimeTooltipCallback 
} from '@/lib/chart-config';

interface MiGraficoProps {
  segmentos: Array<{ indice: number; tiempo_cs: number }>;
  tema?: 'green' | 'blue' | 'purple';
  altura?: number;
}

export default function MiGrafico({ 
  segmentos, 
  tema = 'green', 
  altura = 400 
}: MiGraficoProps) {
  const chartData = useMemo(() => ({
    labels: segmentos.map(s => `Seg ${s.indice}`),
    datasets: [
      createThemedDataset(
        segmentos.map(s => s.tiempo_cs / 100),
        'Tiempo por Segmento',
        tema,
        'line'
      )
    ]
  }), [segmentos, tema]);

  const options = useMemo(() => 
    createChartOptions('line', tema, {
      plugins: {
        title: {
          display: true,
          text: 'Análisis de Tiempos'
        },
        tooltip: {
          callbacks: {
            label: createTimeTooltipCallback('tiempo_cs')
          }
        }
      },
      scales: {
        y: {
          title: {
            display: true,
            text: 'Tiempo (segundos)'
          }
        }
      }
    }),
    [tema]
  );

  return (
    <div style={{ height: altura }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
```

Este enfoque asegura consistencia visual, performance optimizada y mantenibilidad en todos los gráficos de la aplicación.
