/**
 * Componentes de Análisis y Comparaciones
 */

export { default as PacingChart } from './PacingChart';
export { default as RadarChart } from './RadarChart';
export { 
  default as ConsistenciaChart,
  calcularEstadisticasConsistencia,
  procesarSegmentosParaConsistencia
} from './ConsistenciaChart';
export { default as ComparisonView } from './ComparisonView';
export { default as ComparisonTable } from './ComparisonTable';

export type { MetricaRadar } from './RadarChart';
export type { DatosConsistencia } from './ConsistenciaChart';
