/**
 * Exportaciones de componentes de competencias
 * 
 * Proporciona acceso centralizado a todos los componentes 
 * relacionados con la gestión de competencias.
 */

// Componentes principales
export { CompetenciaForm } from './CompetenciaForm';
export { DateRangePicker } from './DateRangePicker';
export { ProximasCompetencias } from './ProximasCompetencias';
export { CompetenciaSelector } from './CompetenciaSelector';
export { CompetenciaDetail } from './CompetenciaDetail';

// Tipos principales
export type { 
  DateRangeValue,
  DateRangePickerProps 
} from './DateRangePicker';

export type {
  CompetenciaOption,
  CompetenciaSelectorProps
} from './CompetenciaSelector';

export type {
  CompetenciaDetailProps
} from './CompetenciaDetail';
