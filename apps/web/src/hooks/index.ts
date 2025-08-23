/**
 * Exportaciones de hooks centralizadas
 */

export { useAuth, useAuthState } from './useAuth';
export { default as useCompetencias, useCompetencias } from './useCompetencias';
export { useDebounce } from './useDebounce';
export { default as useNadadorAnalytics } from './useNadadorAnalytics';
export { default as useNadadores, useNadadores } from './useNadadores';
export { default as usePruebas, usePruebas } from './usePruebas';

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
