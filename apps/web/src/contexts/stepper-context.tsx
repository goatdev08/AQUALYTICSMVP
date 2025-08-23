/**
 * StepperContext - Context global para el stepper de registro de resultados
 * 
 * Proporciona estado global, navegación, validaciones y autoguardado
 * para los 4 pasos del stepper de captura de resultados.
 */

"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { 
  StepperState, 
  StepperAction, 
  PasoStepper, 
  STEPPER_INITIAL_STATE,
  ValidacionPaso,
  LOCALSTORAGE_KEY,
  AUTOSAVE_INTERVAL_MS,
  AutoguardadoMetadata
} from '@/types/resultados';
import { isValidTimeFormat } from '@/lib/time-utils';

// =====================
// Reducer del stepper
// =====================

function stepperReducer(state: StepperState, action: StepperAction): StepperState {
  switch (action.type) {
    case 'NAVEGAR_A_PASO':
      return {
        ...state,
        paso_actual: action.paso,
        timestamp_ultima_modificacion: Date.now(),
      };

    case 'COMPLETAR_PASO':
      const nuevos_completados = new Set(state.pasos_completados);
      nuevos_completados.add(action.paso);
      return {
        ...state,
        pasos_completados: nuevos_completados,
        timestamp_ultima_modificacion: Date.now(),
        tiene_cambios_sin_guardar: true,
      };

    case 'ACTUALIZAR_COMPETENCIA':
      return {
        ...state,
        paso_competencia: { ...state.paso_competencia, ...action.data },
        timestamp_ultima_modificacion: Date.now(),
        tiene_cambios_sin_guardar: true,
      };

    case 'ACTUALIZAR_NADADOR':
      return {
        ...state,
        paso_nadador: { ...state.paso_nadador, ...action.data },
        timestamp_ultima_modificacion: Date.now(),
        tiene_cambios_sin_guardar: true,
      };

    case 'ACTUALIZAR_PRUEBA':
      return {
        ...state,
        paso_prueba: { ...state.paso_prueba, ...action.data },
        timestamp_ultima_modificacion: Date.now(),
        tiene_cambios_sin_guardar: true,
      };

    case 'ACTUALIZAR_SEGMENTOS':
      return {
        ...state,
        paso_segmentos: { ...state.paso_segmentos, ...action.data },
        timestamp_ultima_modificacion: Date.now(),
        tiene_cambios_sin_guardar: true,
      };

    case 'ACTUALIZAR_SEGMENTO':
      const segmentos_actualizados = state.paso_segmentos.segmentos.map((seg, idx) =>
        idx === action.indice ? { ...seg, ...action.segmento } : seg
      );
      return {
        ...state,
        paso_segmentos: {
          ...state.paso_segmentos,
          segmentos: segmentos_actualizados,
        },
        timestamp_ultima_modificacion: Date.now(),
        tiene_cambios_sin_guardar: true,
      };

    case 'CALCULAR_RESUMEN':
      // Se implementará cuando se creen las utilidades de cálculo
      return state;

    case 'MARCAR_CAMBIOS':
      return {
        ...state,
        tiene_cambios_sin_guardar: action.tiene_cambios,
        timestamp_ultima_modificacion: Date.now(),
      };

    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.field]: action.message },
      };

    case 'CLEAR_ERROR':
      const nuevos_errores = { ...state.errors };
      delete nuevos_errores[action.field];
      return {
        ...state,
        errors: nuevos_errores,
      };

    case 'SET_GUARDANDO':
      return {
        ...state,
        esta_guardando: action.guardando,
      };

    case 'RESET_STEPPER':
      return {
        ...STEPPER_INITIAL_STATE,
        timestamp_ultima_modificacion: Date.now(),
      };

    case 'CARGAR_DESDE_LOCALSTORAGE':
      return {
        ...state,
        ...action.state,
        // Reconstruir Set desde array si existe
        pasos_completados: action.state.pasos_completados
          ? new Set(Array.from(action.state.pasos_completados))
          : state.pasos_completados,
        tiene_cambios_sin_guardar: false,
      };

    default:
      return state;
  }
}

// =====================
// Validaciones de pasos
// =====================

function validarPaso1(data: StepperState['paso_competencia']): ValidacionPaso {
  const errores: string[] = [];
  
  // VALIDACIÓN CRÍTICA: Debe tener competencia seleccionada independientemente del modo
  if (!data.competencia) {
    if (data.es_nueva_competencia) {
      errores.push('Debe completar la creación de la nueva competencia antes de continuar');
    } else {
      errores.push('Debe seleccionar una competencia existente o crear una nueva');
    }
  }
  
  // Validaciones adicionales si es nueva competencia pero sin datos
  if (data.es_nueva_competencia && !data.competencia && data.datos_nueva_competencia) {
    const { nombre, curso, fecha_inicio, fecha_fin } = data.datos_nueva_competencia;
    
    if (!nombre?.trim()) {
      errores.push('Nombre de competencia es requerido');
    }
    
    if (!curso) {
      errores.push('Curso es requerido (SC o LC)');
    }
    
    if (!fecha_inicio || !fecha_fin) {
      errores.push('Fechas de inicio y fin son requeridas');
    }
    
    if (fecha_inicio && fecha_fin && fecha_inicio > fecha_fin) {
      errores.push('Fecha de fin debe ser posterior a fecha de inicio');
    }
  }
  
  return {
    es_valido: errores.length === 0,
    errores,
    warnings: [],
  };
}

function validarPaso2(data: StepperState['paso_nadador']): ValidacionPaso {
  const errores: string[] = [];
  
  if (!data.nadador) {
    errores.push('Debe seleccionar un nadador');
  }
  
  return {
    es_valido: errores.length === 0,
    errores,
    warnings: [],
  };
}

function validarPaso3(data: StepperState['paso_prueba']): ValidacionPaso {
  const errores: string[] = [];
  
  if (!data.prueba) {
    errores.push('Debe seleccionar una prueba');
  }
  
  if (!data.fase) {
    errores.push('Debe seleccionar una fase');
  }
  
  return {
    es_valido: errores.length === 0,
    errores,
    warnings: [],
  };
}

function validarPaso4(data: StepperState['paso_segmentos']): ValidacionPaso {
  const errores: string[] = [];
  const warnings: string[] = [];
  
  // Validar tiempo global
  if (!data.datos_globales.tiempo_global?.trim()) {
    errores.push('Tiempo global es requerido');
  } else if (!isValidTimeFormat(data.datos_globales.tiempo_global)) {
    errores.push('Formato de tiempo global inválido (use mm:ss.cc)');
  }
  
  // Validar 15m si aplica (solo para pruebas de 50m)
  if (data.datos_globales.tiempo_15m && !isValidTimeFormat(data.datos_globales.tiempo_15m)) {
    errores.push('Formato de tiempo 15m inválido (use mm:ss.cc)');
  }
  
  // Validar segmentos
  if (data.segmentos.length === 0) {
    errores.push('Debe ingresar al menos un segmento');
  }
  
  data.segmentos.forEach((segmento, idx) => {
    const num = idx + 1;
    
    if (!segmento.tiempo?.trim()) {
      errores.push(`Segmento ${num}: Tiempo es requerido`);
    } else if (!isValidTimeFormat(segmento.tiempo)) {
      errores.push(`Segmento ${num}: Formato de tiempo inválido`);
    }
    
    if (segmento.brazadas < 0) {
      errores.push(`Segmento ${num}: Brazadas no pueden ser negativas`);
    }
    
    if (segmento.flecha_m < 0) {
      errores.push(`Segmento ${num}: Flecha no puede ser negativa`);
    }
    
    if (segmento.flecha_m > segmento.distancia_m) {
      errores.push(`Segmento ${num}: Flecha no puede ser mayor a la distancia del segmento`);
    }
  });
  
  // Warning si hay desviación significativa
  if (data.resumen && data.resumen.desviacion_absoluta > 40) {
    warnings.push(`Desviación de ${(data.resumen.desviacion_absoluta / 100).toFixed(2)}s excede tolerancia. El resultado se marcará para revisión.`);
  }
  
  return {
    es_valido: errores.length === 0,
    errores,
    warnings,
  };
}

// =====================
// Context y Provider
// =====================

interface StepperContextValue {
  // Estado
  state: StepperState;
  dispatch: React.Dispatch<StepperAction>;
  
  // Navegación
  navegarAPaso: (paso: PasoStepper) => void;
  siguientePaso: () => boolean;
  pasoAnterior: () => void;
  puedeAvanzar: (paso: PasoStepper) => boolean;
  
  // Validaciones
  validarPaso: (paso: PasoStepper) => ValidacionPaso;
  validarTodosLosPasos: () => Record<PasoStepper, ValidacionPaso>;
  
  // Autoguardado
  guardarEnLocalStorage: () => void;
  cargarDesdeLocalStorage: () => boolean;
  limpiarAutoguardado: () => void;
  
  // Utilidades
  resetearStepper: () => void;
  marcarCambios: (tiene_cambios: boolean) => void;
}

const StepperContext = createContext<StepperContextValue | null>(null);

interface StepperProviderProps {
  children: React.ReactNode;
  autoguardado?: boolean;
}

export function StepperProvider({ children, autoguardado = true }: StepperProviderProps) {
  const [state, dispatch] = useReducer(stepperReducer, STEPPER_INITIAL_STATE);
  
  // =====================
  // Funciones de validación
  // =====================
  
  const validarPaso = useCallback((paso: PasoStepper): ValidacionPaso => {
    switch (paso) {
      case 1:
        return validarPaso1(state.paso_competencia);
      case 2:
        return validarPaso2(state.paso_nadador);
      case 3:
        return validarPaso3(state.paso_prueba);
      case 4:
        return validarPaso4(state.paso_segmentos);
      default:
        return { es_valido: false, errores: ['Paso inválido'], warnings: [] };
    }
  }, [state]);
  
  // =====================
  // Funciones de navegación
  // =====================
  
  const navegarAPaso = useCallback((paso: PasoStepper) => {
    dispatch({ type: 'NAVEGAR_A_PASO', paso });
  }, []);
  
  const siguientePaso = useCallback((): boolean => {
    const validation = validarPaso(state.paso_actual);
    
    if (!validation.es_valido) {
      // Marcar errores en el estado
      validation.errores.forEach(error => {
        dispatch({ type: 'SET_ERROR', field: `paso_${state.paso_actual}`, message: error });
      });
      return false;
    }
    
    // Limpiar errores y marcar paso como completado
    dispatch({ type: 'CLEAR_ERROR', field: `paso_${state.paso_actual}` });
    dispatch({ type: 'COMPLETAR_PASO', paso: state.paso_actual });
    
    // Navegar al siguiente paso si existe
    if (state.paso_actual < 4) {
      navegarAPaso((state.paso_actual + 1) as PasoStepper);
    }
    
    return true;
  }, [state.paso_actual, navegarAPaso, validarPaso]);
  
  const pasoAnterior = useCallback(() => {
    if (state.paso_actual > 1) {
      navegarAPaso((state.paso_actual - 1) as PasoStepper);
    }
  }, [state.paso_actual, navegarAPaso]);
  
  const puedeAvanzar = useCallback((paso: PasoStepper): boolean => {
    return validarPaso(paso).es_valido;
  }, [validarPaso]);
  
  const validarTodosLosPasos = useCallback((): Record<PasoStepper, ValidacionPaso> => {
    return {
      1: validarPaso1(state.paso_competencia),
      2: validarPaso2(state.paso_nadador),
      3: validarPaso3(state.paso_prueba),
      4: validarPaso4(state.paso_segmentos),
    };
  }, [state]);
  
  // =====================
  // Funciones de autoguardado
  // =====================
  
  const guardarEnLocalStorage = useCallback(() => {
    try {
      const metadata: AutoguardadoMetadata = {
        timestamp: Date.now(),
        version: '1.0.0',
      };
      
      const dataToSave = {
        ...state,
        // Convertir Set a array para serialización
        pasos_completados: Array.from(state.pasos_completados),
        metadata,
      };
      
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(dataToSave));
      dispatch({ type: 'MARCAR_CAMBIOS', tiene_cambios: false });
    } catch (error) {
      console.error('Error guardando en localStorage:', error);
    }
  }, [state]);
  
  const cargarDesdeLocalStorage = useCallback((): boolean => {
    try {
      const saved = localStorage.getItem(LOCALSTORAGE_KEY);
      if (!saved) return false;
      
      const parsed = JSON.parse(saved);
      
      // Validar que los datos sean del formato esperado
      if (parsed && typeof parsed === 'object' && parsed.paso_actual) {
        dispatch({ type: 'CARGAR_DESDE_LOCALSTORAGE', state: parsed });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error cargando desde localStorage:', error);
      return false;
    }
  }, []);
  
  const limpiarAutoguardado = useCallback(() => {
    try {
      localStorage.removeItem(LOCALSTORAGE_KEY);
    } catch (error) {
      console.error('Error limpiando localStorage:', error);
    }
  }, []);
  
  // =====================
  // Utilidades generales
  // =====================
  
  const resetearStepper = useCallback(() => {
    dispatch({ type: 'RESET_STEPPER' });
  }, []);
  
  const marcarCambios = useCallback((tiene_cambios: boolean) => {
    dispatch({ type: 'MARCAR_CAMBIOS', tiene_cambios });
  }, []);
  
  // =====================
  // Efectos de autoguardado
  // =====================
  
  // Cargar estado inicial desde localStorage
  useEffect(() => {
    if (autoguardado) {
      cargarDesdeLocalStorage();
    }
  }, [cargarDesdeLocalStorage, autoguardado]);
  
  // Autoguardado periódico
  useEffect(() => {
    if (!autoguardado || !state.tiene_cambios_sin_guardar) {
      return;
    }
    
    const interval = setInterval(() => {
      if (state.tiene_cambios_sin_guardar) {
        guardarEnLocalStorage();
      }
    }, AUTOSAVE_INTERVAL_MS);
    
    return () => clearInterval(interval);
  }, [autoguardado, state.tiene_cambios_sin_guardar, guardarEnLocalStorage]);
  
  // Guardar antes de cerrar la página
  useEffect(() => {
    if (!autoguardado) return;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.tiene_cambios_sin_guardar) {
        guardarEnLocalStorage();
        e.preventDefault();
        return (e.returnValue = 'Hay cambios sin guardar. ¿Está seguro de salir?');
      }
      return undefined;
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [autoguardado, state.tiene_cambios_sin_guardar, guardarEnLocalStorage]);
  
  // =====================
  // Context value
  // =====================
  
  const contextValue: StepperContextValue = {
    state,
    dispatch,
    navegarAPaso,
    siguientePaso,
    pasoAnterior,
    puedeAvanzar,
    validarPaso,
    validarTodosLosPasos,
    guardarEnLocalStorage,
    cargarDesdeLocalStorage,
    limpiarAutoguardado,
    resetearStepper,
    marcarCambios,
  };
  
  return (
    <StepperContext.Provider value={contextValue}>
      {children}
    </StepperContext.Provider>
  );
}

// =====================
// Hook para usar el context
// =====================

export function useStepper() {
  const context = useContext(StepperContext);
  
  if (!context) {
    throw new Error('useStepper debe usarse dentro de un StepperProvider');
  }
  
  return context;
}
