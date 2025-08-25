/**
 * Store de Zustand para filtros del Dashboard
 * 
 * Maneja el estado persistente de filtros según PRD:
 * - fecha, prueba, curso, rama
 * - Persistencia por sesión
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Tipos para los filtros del dashboard
export interface DashboardFilters {
  // Filtros de fecha
  fechaDesde?: Date;
  fechaHasta?: Date;
  
  // Filtros de prueba
  estilo?: string;
  distancia?: number;
  curso?: string; // 'SC' | 'LC'
  
  // Filtros de nadador
  rama?: string; // 'F' | 'M'
  categoria?: string;
  
  // Filtros adicionales
  competenciaId?: number;
  estadoValidacion?: string;
}

// Estado del store
interface DashboardState {
  // Filtros actuales
  filters: DashboardFilters;
  
  // Configuración de vista
  viewConfig: {
    // Configuración de gráficos
    chartHeight: number;
    showLegend: boolean;
    showPercentages: boolean;
    
    // Configuración de listas
    maxItemsPerList: number;
    diasProximasCompetencias: number;
    diasAtletasDestacados: number;
    maxActividadReciente: number;
  };
  
  // Estado de UI
  uiState: {
    // Paneles expandidos/colapsados
    expandedPanels: {
      kpis: boolean;
      charts: boolean;
      lists: boolean;
      activity: boolean;
    };
    
    // Loading states
    isRefreshing: boolean;
    lastRefresh?: Date;
  };
  
  // Acciones
  setFilters: (filters: Partial<DashboardFilters>) => void;
  clearFilters: () => void;
  resetFilters: () => void;
  
  setViewConfig: (config: Partial<DashboardState['viewConfig']>) => void;
  setUIState: (state: Partial<DashboardState['uiState']>) => void;
  
  togglePanel: (panel: keyof DashboardState['uiState']['expandedPanels']) => void;
  setRefreshing: (isRefreshing: boolean) => void;
  updateLastRefresh: () => void;
}

// Valores por defecto
const defaultFilters: DashboardFilters = {};

const defaultViewConfig: DashboardState['viewConfig'] = {
  chartHeight: 300,
  showLegend: true,
  showPercentages: true,
  maxItemsPerList: 5,
  diasProximasCompetencias: 30,
  diasAtletasDestacados: 30,
  maxActividadReciente: 10,
};

const defaultUIState: DashboardState['uiState'] = {
  expandedPanels: {
    kpis: true,
    charts: true,
    lists: true,
    activity: true,
  },
  isRefreshing: false,
};

// Store de Zustand con persistencia
export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      filters: defaultFilters,
      viewConfig: defaultViewConfig,
      uiState: defaultUIState,

      // Acciones para filtros
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),

      clearFilters: () =>
        set(() => ({
          filters: defaultFilters,
        })),

      resetFilters: () =>
        set(() => ({
          filters: defaultFilters,
        })),

      // Acciones para configuración de vista
      setViewConfig: (newConfig) =>
        set((state) => ({
          viewConfig: { ...state.viewConfig, ...newConfig },
        })),

      // Acciones para estado de UI
      setUIState: (newState) =>
        set((state) => ({
          uiState: { ...state.uiState, ...newState },
        })),

      togglePanel: (panel) =>
        set((state) => ({
          uiState: {
            ...state.uiState,
            expandedPanels: {
              ...state.uiState.expandedPanels,
              [panel]: !state.uiState.expandedPanels[panel],
            },
          },
        })),

      setRefreshing: (isRefreshing) =>
        set((state) => ({
          uiState: { ...state.uiState, isRefreshing },
        })),

      updateLastRefresh: () =>
        set((state) => ({
          uiState: { ...state.uiState, lastRefresh: new Date() },
        })),
    }),
    {
      name: 'dashboard-storage', // Nombre único para localStorage
      partialize: (state) => ({
        // Solo persistir filtros y configuración de vista
        filters: state.filters,
        viewConfig: state.viewConfig,
        // No persistir uiState para que se reinicie en cada sesión
      }),
    }
  )
);

// Hooks de conveniencia para acceder a partes específicas del store
export const useDashboardFilters = () => {
  const filters = useDashboardStore((state) => state.filters);
  const setFilters = useDashboardStore((state) => state.setFilters);
  const clearFilters = useDashboardStore((state) => state.clearFilters);
  const resetFilters = useDashboardStore((state) => state.resetFilters);

  return {
    filters,
    setFilters,
    clearFilters,
    resetFilters,
  };
};

export const useDashboardViewConfig = () => {
  const viewConfig = useDashboardStore((state) => state.viewConfig);
  const setViewConfig = useDashboardStore((state) => state.setViewConfig);

  return {
    viewConfig,
    setViewConfig,
  };
};

export const useDashboardUI = () => {
  const uiState = useDashboardStore((state) => state.uiState);
  const setUIState = useDashboardStore((state) => state.setUIState);
  const togglePanel = useDashboardStore((state) => state.togglePanel);
  const setRefreshing = useDashboardStore((state) => state.setRefreshing);
  const updateLastRefresh = useDashboardStore((state) => state.updateLastRefresh);

  return {
    uiState,
    setUIState,
    togglePanel,
    setRefreshing,
    updateLastRefresh,
  };
};

// Hook para obtener filtros formateados para API calls
export const useDashboardApiFilters = () => {
  const filters = useDashboardStore((state) => state.filters);

  // Convertir filtros internos al formato esperado por la API
  const apiFilters = {
    estilo: filters.estilo,
    distancia: filters.distancia,
    curso: filters.curso,
    rama: filters.rama,
    // Agregar más conversiones según sea necesario
  };

  // Remover valores undefined/null
  const cleanFilters = Object.fromEntries(
    Object.entries(apiFilters).filter(([_, value]) => value != null)
  );

  return cleanFilters;
};

// Acciones globales del dashboard
export const dashboardActions = {
  // Refrescar todos los datos
  refreshAll: () => {
    const { setRefreshing, updateLastRefresh } = useDashboardStore.getState();
    setRefreshing(true);
    
    // Simular tiempo de carga
    setTimeout(() => {
      setRefreshing(false);
      updateLastRefresh();
    }, 1000);
  },

  // Aplicar filtros predefinidos
  applyQuickFilter: (filterName: string) => {
    const { setFilters } = useDashboardStore.getState();
    
    switch (filterName) {
      case 'esta-semana':
        const hoy = new Date();
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        setFilters({
          fechaDesde: inicioSemana,
          fechaHasta: hoy,
        });
        break;
        
      case 'este-mes':
        const inicioMes = new Date();
        inicioMes.setDate(1);
        setFilters({
          fechaDesde: inicioMes,
          fechaHasta: new Date(),
        });
        break;
        
      case 'solo-femenil':
        setFilters({ rama: 'F' });
        break;
        
      case 'solo-masculino':
        setFilters({ rama: 'M' });
        break;
        
      case 'solo-sc':
        setFilters({ curso: 'SC' });
        break;
        
      case 'solo-lc':
        setFilters({ curso: 'LC' });
        break;
        
      default:
        console.warn(`Filtro rápido desconocido: ${filterName}`);
    }
  },
};
