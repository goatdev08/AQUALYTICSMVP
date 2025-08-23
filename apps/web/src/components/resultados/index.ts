/**
 * Exportaciones del módulo de resultados
 * 
 * Centraliza todas las exportaciones de componentes, hooks y utilidades
 * relacionados con el registro y gestión de resultados.
 */

// Componentes principales del stepper
export { StepperContainer, RegistrarResultadosPage, StepperErrorBoundary } from './StepperContainer';
export { StepperNavigation, StepperHeader } from './StepperNavigation';

// Context y hook principal
export { StepperProvider, useStepper } from '@/contexts/stepper-context';

// Tipos principales (re-export)
export type {
  StepperState,
  StepperAction,
  PasoStepper,
  SegmentoData,
  DatosGlobales,
  ResumenPrevisualizacion,
  PasoCompetenciaData,
  PasoNadadorData,
  PasoPruebaData,
  PasoSegmentosData,
  ValidacionPaso,
  CrearResultadoPayload,
  ResultadoResponse,
  FaseCompetencia,
  EstadoValidacion,
  EstiloSegmento,
} from '@/types/resultados';

// Componentes de pasos (se exportarán cuando se implementen)
// export { PasoCompetencia } from './pasos/PasoCompetencia';
// export { PasoNadador } from './pasos/PasoNadador';
// export { PasoPrueba } from './pasos/PasoPrueba';
// export { PasoSegmentos } from './pasos/PasoSegmentos';

// Hooks específicos (se exportarán cuando se implementen)
// export { useResultados } from './hooks/useResultados';
// export { useCalculosSegmentos } from './hooks/useCalculosSegmentos';

// Utilidades (se exportarán cuando se implementen)
// export { calcularResumenPrevisualizacion } from './utils/calculos';
// export { validarSegmentos } from './utils/validaciones';
// export { generarSegmentosIniciales } from './utils/helpers';
