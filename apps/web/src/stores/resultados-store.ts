/**
 * Store de Zustand para filtros y estado de ResultadosTable
 * 
 * Maneja el estado persistente de:
 * - Filtros de búsqueda avanzada
 * - Ordenamiento de columnas 
 * - Configuración de paginación
 * - Preferencias de usuario
 * - Persistencia en localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EstadoValidacion } from '@/types/resultados';

// =====================
// Tipos del Store
// =====================

export interface ResultadosFilterState {
  nadador_id?: number;
  competencia_id?: number;
  prueba_id?: number;
  rama?: 'F' | 'M';
  fecha_inicio?: string;
  fecha_fin?: string;
  estado_validacion?: EstadoValidacion;
  fase?: string;
}

export interface ResultadosSortState {
  sort_by: string;
  sort_order: 'asc' | 'desc';
}

export interface ResultadosPaginationState {
  page: number;
  size: number;
}

export interface ResultadosPreferences {
  // Configuración de tabla
  showCompactMode: boolean;
  showTimestamps: boolean;
  autoRefresh: boolean;
  autoRefreshInterval: number; // segundos
  
  // Configuración de filtros
  rememberFilters: boolean;
  showAdvancedFilters: boolean;
  
  // Configuración de paginación
  defaultPageSize: number;
  persistPageSize: boolean;
}

export interface ResultadosUIState {
  // Estado de búsqueda de nadador (typeahead)
  nadadorSearch: string;
  
  // Estado de modals/dialogs
  selectedResultadoId: number | null;
  showFiltersPanel: boolean;
  
  // Estados temporales (no persistidos)
  isRefreshing: boolean;
  lastRefresh?: Date;
  expandedRows: number[];
}

// Estado completo del store
interface ResultadosStoreState {
  // Estados principales
  filters: ResultadosFilterState;
  sorting: ResultadosSortState;
  pagination: ResultadosPaginationState;
  preferences: ResultadosPreferences;
  uiState: ResultadosUIState;
  
  // Acciones para filtros
  setFilter: (key: keyof ResultadosFilterState, value: any) => void;
  setFilters: (filters: Partial<ResultadosFilterState>) => void;
  clearFilters: () => void;
  resetFilters: () => void;
  
  // Acciones para ordenamiento
  setSorting: (sorting: Partial<ResultadosSortState>) => void;
  updateSorting: (field: string) => void;
  
  // Acciones para paginación
  setPagination: (pagination: Partial<ResultadosPaginationState>) => void;
  goToPage: (page: number) => void;
  changePageSize: (size: number) => void;
  resetPagination: () => void;
  
  // Acciones para preferencias
  setPreferences: (preferences: Partial<ResultadosPreferences>) => void;
  resetPreferences: () => void;
  
  // Acciones para UI state
  setUIState: (state: Partial<ResultadosUIState>) => void;
  setNadadorSearch: (search: string) => void;
  setSelectedResultado: (id: number | null) => void;
  toggleFiltersPanel: () => void;
  setRefreshing: (isRefreshing: boolean) => void;
  updateLastRefresh: () => void;
  toggleExpandedRow: (id: number) => void;
}

// =====================
// Valores por defecto
// =====================

const defaultFilters: ResultadosFilterState = {};

const defaultSorting: ResultadosSortState = {
  sort_by: 'fecha_registro',
  sort_order: 'desc'
};

const defaultPagination: ResultadosPaginationState = {
  page: 1,
  size: 20
};

const defaultPreferences: ResultadosPreferences = {
  showCompactMode: false,
  showTimestamps: true,
  autoRefresh: false,
  autoRefreshInterval: 30,
  rememberFilters: true,
  showAdvancedFilters: false,
  defaultPageSize: 20,
  persistPageSize: true,
};

const defaultUIState: ResultadosUIState = {
  nadadorSearch: '',
  selectedResultadoId: null,
  showFiltersPanel: false,
  isRefreshing: false,
  expandedRows: [],
};

// =====================
// Store de Zustand
// =====================

export const useResultadosStore = create<ResultadosStoreState>()(
  persist(
    (set) => ({
      // Estado inicial
      filters: defaultFilters,
      sorting: defaultSorting,
      pagination: defaultPagination,
      preferences: defaultPreferences,
      uiState: defaultUIState,

      // =====================
      // Acciones para filtros
      // =====================
      
      setFilter: (key, value) =>
        set((state) => ({
          filters: { 
            ...state.filters, 
            [key]: value || undefined 
          },
          // Reset paginación cuando se cambian filtros
          pagination: {
            ...state.pagination,
            page: 1
          }
        })),

      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
          pagination: {
            ...state.pagination,
            page: 1
          }
        })),

      clearFilters: () =>
        set((state) => ({
          filters: defaultFilters,
          pagination: {
            ...state.pagination,
            page: 1
          },
          uiState: {
            ...state.uiState,
            nadadorSearch: ''
          }
        })),

      resetFilters: () =>
        set(() => ({
          filters: defaultFilters,
        })),

      // =====================
      // Acciones para ordenamiento
      // =====================
      
      setSorting: (newSorting) =>
        set((state) => ({
          sorting: { ...state.sorting, ...newSorting },
          pagination: {
            ...state.pagination,
            page: 1
          }
        })),

      updateSorting: (field) =>
        set((state) => ({
          sorting: {
            sort_by: field,
            sort_order: state.sorting.sort_by === field && state.sorting.sort_order === 'asc' ? 'desc' : 'asc'
          },
          pagination: {
            ...state.pagination,
            page: 1
          }
        })),

      // =====================
      // Acciones para paginación
      // =====================
      
      setPagination: (newPagination) =>
        set((state) => ({
          pagination: { ...state.pagination, ...newPagination }
        })),

      goToPage: (page) =>
        set((state) => ({
          pagination: { ...state.pagination, page }
        })),

      changePageSize: (size) =>
        set(() => ({
          pagination: { page: 1, size }
        })),

      resetPagination: () =>
        set(() => ({
          pagination: defaultPagination,
        })),

      // =====================
      // Acciones para preferencias
      // =====================
      
      setPreferences: (newPreferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences }
        })),

      resetPreferences: () =>
        set(() => ({
          preferences: defaultPreferences,
        })),

      // =====================
      // Acciones para UI state
      // =====================
      
      setUIState: (newState) =>
        set((state) => ({
          uiState: { ...state.uiState, ...newState }
        })),

      setNadadorSearch: (search) =>
        set((state) => ({
          uiState: { ...state.uiState, nadadorSearch: search }
        })),

      setSelectedResultado: (id) =>
        set((state) => ({
          uiState: { ...state.uiState, selectedResultadoId: id }
        })),

      toggleFiltersPanel: () =>
        set((state) => ({
          uiState: { 
            ...state.uiState, 
            showFiltersPanel: !state.uiState.showFiltersPanel 
          }
        })),

      setRefreshing: (isRefreshing) =>
        set((state) => ({
          uiState: { ...state.uiState, isRefreshing }
        })),

      updateLastRefresh: () =>
        set((state) => ({
          uiState: { ...state.uiState, lastRefresh: new Date() }
        })),

      toggleExpandedRow: (id) =>
        set((state) => ({
          uiState: {
            ...state.uiState,
            expandedRows: state.uiState.expandedRows.includes(id)
              ? state.uiState.expandedRows.filter(rowId => rowId !== id)
              : [...state.uiState.expandedRows, id]
          }
        })),
    }),
    {
      name: 'resultados-storage', // Nombre único para localStorage
      partialize: (state) => {
        const { preferences } = state;
        
        // Solo persistir según las preferencias del usuario
        const persistedState: any = {
          preferences: state.preferences,
          sorting: state.sorting, // Siempre persistir ordenamiento
        };

        // Persistir filtros solo si el usuario lo prefiere
        if (preferences.rememberFilters) {
          persistedState.filters = state.filters;
        }

        // Persistir tamaño de página si está habilitado
        if (preferences.persistPageSize) {
          persistedState.pagination = {
            page: 1, // Siempre empezar en página 1
            size: state.pagination.size
          };
        }

        return persistedState;
      }
    }
  )
);

// =====================
// Hooks de conveniencia
// =====================

export const useResultadosFilters = () => {
  const filters = useResultadosStore((state) => state.filters);
  const setFilter = useResultadosStore((state) => state.setFilter);
  const setFilters = useResultadosStore((state) => state.setFilters);
  const clearFilters = useResultadosStore((state) => state.clearFilters);
  const resetFilters = useResultadosStore((state) => state.resetFilters);

  return {
    filters,
    setFilter,
    setFilters,
    clearFilters,
    resetFilters,
  };
};

export const useResultadosSorting = () => {
  const sorting = useResultadosStore((state) => state.sorting);
  const setSorting = useResultadosStore((state) => state.setSorting);
  const updateSorting = useResultadosStore((state) => state.updateSorting);

  return {
    sorting,
    setSorting,
    updateSorting,
  };
};

export const useResultadosPagination = () => {
  const pagination = useResultadosStore((state) => state.pagination);
  const setPagination = useResultadosStore((state) => state.setPagination);
  const goToPage = useResultadosStore((state) => state.goToPage);
  const changePageSize = useResultadosStore((state) => state.changePageSize);
  const resetPagination = useResultadosStore((state) => state.resetPagination);

  return {
    pagination,
    setPagination,
    goToPage,
    changePageSize,
    resetPagination,
  };
};

export const useResultadosPreferences = () => {
  const preferences = useResultadosStore((state) => state.preferences);
  const setPreferences = useResultadosStore((state) => state.setPreferences);
  const resetPreferences = useResultadosStore((state) => state.resetPreferences);

  return {
    preferences,
    setPreferences,
    resetPreferences,
  };
};

export const useResultadosUI = () => {
  const uiState = useResultadosStore((state) => state.uiState);
  const setUIState = useResultadosStore((state) => state.setUIState);
  const setNadadorSearch = useResultadosStore((state) => state.setNadadorSearch);
  const setSelectedResultado = useResultadosStore((state) => state.setSelectedResultado);
  const toggleFiltersPanel = useResultadosStore((state) => state.toggleFiltersPanel);
  const setRefreshing = useResultadosStore((state) => state.setRefreshing);
  const updateLastRefresh = useResultadosStore((state) => state.updateLastRefresh);
  const toggleExpandedRow = useResultadosStore((state) => state.toggleExpandedRow);

  return {
    uiState,
    setUIState,
    setNadadorSearch,
    setSelectedResultado,
    toggleFiltersPanel,
    setRefreshing,
    updateLastRefresh,
    toggleExpandedRow,
  };
};

// =====================
// Actions y utilidades
// =====================

export const resultadosActions = {
  // Aplicar filtros rápidos
  applyQuickFilter: (filterName: string) => {
    const { setFilters, clearFilters } = useResultadosStore.getState();
    
    switch (filterName) {
      case 'solo-validos':
        setFilters({ estado_validacion: 'valido' });
        break;
        
      case 'solo-revisar':
        setFilters({ estado_validacion: 'revisar' });
        break;
        
      case 'solo-femenil':
        setFilters({ rama: 'F' });
        break;
        
      case 'solo-masculino':
        setFilters({ rama: 'M' });
        break;
        
      case 'solo-finales':
        setFilters({ fase: 'Final' });
        break;
        
      case 'esta-semana':
        const hoy = new Date();
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        setFilters({
          fecha_inicio: inicioSemana.toISOString().split('T')[0],
          fecha_fin: hoy.toISOString().split('T')[0],
        });
        break;
        
      case 'limpiar':
        clearFilters();
        break;
        
      default:
        console.warn(`Filtro rápido desconocido: ${filterName}`);
    }
  },

  // Refrescar datos
  refreshData: () => {
    const { setRefreshing, updateLastRefresh } = useResultadosStore.getState();
    setRefreshing(true);
    
    // Simular tiempo de carga mínimo para UX
    setTimeout(() => {
      setRefreshing(false);
      updateLastRefresh();
    }, 500);
  },

  // Exportar estado actual para debugging
  exportState: () => {
    const state = useResultadosStore.getState();
    return {
      filters: state.filters,
      sorting: state.sorting,
      pagination: state.pagination,
      preferences: state.preferences,
    };
  },
};
