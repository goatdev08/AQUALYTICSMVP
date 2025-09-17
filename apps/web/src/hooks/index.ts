/**
 * Exportaciones de hooks centralizadas
 */

export { useAuth, useAuthState } from './useAuth';
export { useCompetencias, useCompetenciaTypeahead } from './useCompetencias';
export { useDebounce } from './useDebounce';
export { 
  useKeyboardNavigation, 
  useGlobalKeyboardShortcuts, 
  useTableKeyboardNavigation 
} from './useKeyboardNavigation';
export { useDropdownNavigation } from './useDropdownNavigation';
export { useDropdownState } from './useDropdownState';
export { useNadadorAnalytics } from './useNadadorAnalytics';
export { useNadadores } from './useNadadores';
export { usePruebas, usePruebasTypeahead } from './usePruebas';
export { 
  useAnalitica, 
  usePromedioEquipo, 
  useComparacion,
  estiloToApi,
  cursoToApi,
  ramaToApi
} from './useAnalitica';
export { 
  useCreateResultado, 
  useResultados, 
  useResultado, 
  useUpdateResultado, 
  useMarcarRevisar,
  requiereRevision,
  calcularPorcentajeDesviacion,
  formatearTiempo,
  parsearTiempo
} from './useResultados';

// Exportar tipos
export type { 
  Competencia, 
  CompetenciaCreate, 
  CompetenciaUpdate, 
  CompetenciaFilters, 
  CompetenciaListResponse, 
  CompetenciaSelector,
  CursoEnum 
} from './useCompetencias';

export type { 
  Nadador, 
  NadadorCreate, 
  NadadorUpdate, 
  NadadorFilters, 
  NadadorListResponse 
} from './useNadadores';

export type {
  AnaliticaFilters,
  SegmentoPromedio,
  PromedioEquipoResponse,
  ComparacionResponse,
  ComparacionSegmento,
  ResultadoComparacion,
  NadadorInfo,
  PruebaInfo
} from './useAnalitica';
