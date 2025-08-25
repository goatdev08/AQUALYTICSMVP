/**
 * Tipos TypeScript para el módulo de registro de resultados
 * Incluye tipos para el stepper, segmentos, validaciones y estado global
 */

import type { PruebaResponse } from '@/hooks/usePruebas';
import type { Competencia } from '@/hooks/useCompetencias';
import type { Nadador } from '@/hooks/useNadadores';

// =====================
// Enums del dominio
// =====================

/** Fases de competencia según PRD */
export type FaseCompetencia = 'Preliminar' | 'Semifinal' | 'Final';

/** Estado de validación del resultado */
export type EstadoValidacion = 'valido' | 'revisar';

/** Estilos de natación para IM */
export type EstiloSegmento = 'Libre' | 'Dorso' | 'Pecho' | 'Mariposa';

// =====================
// Datos de segmento
// =====================

/** Datos de un segmento individual */
export interface SegmentoData {
  indice: number; // 1-based según PRD
  distancia_m: number; // 25 o 50 según curso
  estilo_segmento: EstiloSegmento; // Solo para IM
  
  // Campos de entrada manual
  tiempo: string; // formato mm:ss.cc
  brazadas: number; // entero ≥ 0
  flecha_m: number; // metros con 1 decimal, 0 ≤ flecha ≤ distancia
  
  // Campos calculados (derivados)
  tiempo_cs?: number; // centésimas calculadas
  dist_sin_flecha_m?: number; // max(distancia - flecha, 0)
  velocidad_mps?: number; // distancia / (tiempo_cs / 100)
  dist_por_brazada_m?: number; // dist_sin_flecha / brazadas (si > 0)
}

/** Datos globales del resultado */
export interface DatosGlobales {
  tiempo_global: string; // mm:ss.cc formato UI
  tiempo_15m?: string; // solo si distancia=50, opcional
  
  // Calculados
  tiempo_global_cs?: number;
  tiempo_15m_cs?: number;
}

/** Resumen calculado de previsualización */
export interface ResumenPrevisualizacion {
  // Sumas de segmentos
  suma_parciales_cs: number;
  brazadas_totales: number;
  flecha_total_m: number;
  
  // Comparación con tiempo global
  desviacion_cs: number; // suma_parciales - tiempo_global
  desviacion_absoluta: number; // |desviacion|
  requiere_revision: boolean; // |desviacion| > 40 cs
  
  // Métricas derivadas globales
  distancia_sin_flecha_total_m: number;
  velocidad_promedio_mps: number;
  distancia_por_brazada_global_m: number;
  
  // Estado visual
  estado_validacion: EstadoValidacion;
}

// =====================
// Estado de cada paso
// =====================

/** Datos del Paso 1: Competencia */
export interface PasoCompetenciaData {
  competencia?: Competencia;
  es_nueva_competencia: boolean;
  datos_nueva_competencia?: {
    nombre: string;
    curso: 'SC' | 'LC';
    fecha_inicio: string;
    fecha_fin: string;
    sede?: string;
  };
}

/** Datos del Paso 2: Nadador */
export interface PasoNadadorData {
  nadador?: Nadador;
}

/** Datos del Paso 3: Prueba y Fase */
export interface PasoPruebaData {
  prueba?: PruebaResponse;
  fase: FaseCompetencia;
}

/** Datos del Paso 4: Segmentos */
export interface PasoSegmentosData {
  segmentos: SegmentoData[];
  datos_globales: DatosGlobales;
  resumen?: ResumenPrevisualizacion;
}

// =====================
// Estado global del stepper
// =====================

/** Pasos del stepper */
export type PasoStepper = 1 | 2 | 3 | 4;

/** Estado completo del stepper */
export interface StepperState {
  // Navegación
  paso_actual: PasoStepper;
  pasos_completados: Set<PasoStepper>;
  
  // Datos por paso
  paso_competencia: PasoCompetenciaData;
  paso_nadador: PasoNadadorData;
  paso_prueba: PasoPruebaData;
  paso_segmentos: PasoSegmentosData;
  
  // Estado global
  esta_guardando: boolean;
  errors: Record<string, string>;
  
  // Metadatos
  timestamp_ultima_modificacion: number;
  tiene_cambios_sin_guardar: boolean;
}

/** Estado inicial vacío */
export const STEPPER_INITIAL_STATE: StepperState = {
  paso_actual: 1,
  pasos_completados: new Set(),
  
  paso_competencia: {
    es_nueva_competencia: false,
  },
  
  paso_nadador: {},
  
  paso_prueba: {
    fase: 'Preliminar',
  },
  
  paso_segmentos: {
    segmentos: [],
    datos_globales: {
      tiempo_global: '',
    },
  },
  
  esta_guardando: false,
  errors: {},
  timestamp_ultima_modificacion: Date.now(),
  tiene_cambios_sin_guardar: false,
};

// =====================
// Acciones del stepper
// =====================

export type StepperAction =
  | { type: 'NAVEGAR_A_PASO'; paso: PasoStepper }
  | { type: 'COMPLETAR_PASO'; paso: PasoStepper }
  | { type: 'ACTUALIZAR_COMPETENCIA'; data: Partial<PasoCompetenciaData> }
  | { type: 'ACTUALIZAR_NADADOR'; data: Partial<PasoNadadorData> }
  | { type: 'ACTUALIZAR_PRUEBA'; data: Partial<PasoPruebaData> }
  | { type: 'ACTUALIZAR_SEGMENTOS'; data: Partial<PasoSegmentosData> }
  | { type: 'ACTUALIZAR_SEGMENTO'; indice: number; segmento: Partial<SegmentoData> }
  | { type: 'CALCULAR_RESUMEN' }
  | { type: 'MARCAR_CAMBIOS'; tiene_cambios: boolean }
  | { type: 'SET_ERROR'; field: string; message: string }
  | { type: 'CLEAR_ERROR'; field: string }
  | { type: 'SET_GUARDANDO'; guardando: boolean }
  | { type: 'RESET_STEPPER' }
  | { type: 'CARGAR_DESDE_LOCALSTORAGE'; state: Partial<StepperState> };

// =====================
// Validaciones
// =====================

/** Resultado de validación de un paso */
export interface ValidacionPaso {
  es_valido: boolean;
  errores: string[];
  warnings: string[];
}

/** Configuración de validación por paso */
export interface ValidacionConfig {
  paso_1: (data: PasoCompetenciaData) => ValidacionPaso;
  paso_2: (data: PasoNadadorData) => ValidacionPaso;
  paso_3: (data: PasoPruebaData) => ValidacionPaso;
  paso_4: (data: PasoSegmentosData) => ValidacionPaso;
}

// =====================
// Autoguardado
// =====================

/** Configuración de localStorage */
export const LOCALSTORAGE_KEY = 'aqualytics_stepper_state';
export const AUTOSAVE_INTERVAL_MS = 5000; // 5 segundos

/** Metadatos de autoguardado */
export interface AutoguardadoMetadata {
  timestamp: number;
  version: string;
  user_id?: string;
}

// =====================
// API Payloads
// =====================

/** Payload para crear resultado completo */
export interface CrearResultadoPayload {
  nadador_id: number;
  competencia_id: number;
  prueba_id: number;
  fase: FaseCompetencia;
  fecha_registro: string; // ISO date
  
  // Tiempos globales en centésimas
  tiempo_global_cs: number;
  tiempo_15m_cs?: number;
  
  // Segmentos
  segmentos: {
    indice: number;
    estilo_segmento: EstiloSegmento;
    distancia_m: number;
    tiempo_cs: number;
    brazadas: number;
    flecha_m: number;
  }[];
}

/** Respuesta del servidor al crear resultado */
export interface ResultadoResponse {
  id: number;
  nadador_id: number;
  competencia_id: number;
  prueba_id: number;
  fase: FaseCompetencia;
  fecha_registro: string;
  tiempo_global_cs: number;
  tiempo_15m_cs?: number;
  categoria_label: string;
  estado_validacion: EstadoValidacion;
  desviacion_parciales_cs: number;
  capturado_por: number;
  created_at: string;
  
  // Segmentos incluidos
  segmentos: {
    id: number;
    resultado_id: number;
    indice: number;
    estilo_segmento: EstiloSegmento;
    distancia_m: number;
    tiempo_cs: number;
    brazadas: number;
    flecha_m: number;
    dist_sin_flecha_m: number;
    velocidad_mps: number;
    dist_por_brazada_m?: number;
  }[];
  
  // Resumen calculado por el backend
  resumen: ResumenPrevisualizacion;
}

// =====================
// Tipos adicionales para hooks
// =====================

/** Filtros de búsqueda para resultados */
export interface ResultadoSearchFilters {
  nadador_id?: number;
  competencia_id?: number;
  prueba_id?: number;
  fase?: FaseCompetencia;
  rama?: 'F' | 'M';
  fecha_inicio?: string;
  fecha_fin?: string;
  estado_validacion?: EstadoValidacion;
  capturado_por?: number;
}

/** Lista paginada de resultados */
export interface ResultadoListResponse {
  total: number;
  resultados: ResultadoResponse[];
}

/** Segmento con campos calculados */
export interface SegmentoResponse {
  id: number;
  resultado_id: number;
  indice: number;
  estilo_segmento: EstiloSegmento;
  distancia_m: number;
  tiempo_cs: number;
  brazadas: number;
  flecha_m: number;
  dist_sin_flecha_m: number;
  velocidad_mps: number;
  dist_por_brazada_m?: number;
  created_at: string;
}

/** Resumen global con métricas calculadas */
export interface ResumenGlobal {
  suma_parciales_cs: number;
  desviacion_cs: number;
  desviacion_absoluta_cs: number;
  requiere_revision: boolean;
  brazadas_totales: number;
  flecha_total_m: number;
  distancia_sin_flecha_total_m: number;
  distancia_total_m: number;
  velocidad_promedio_mps: number;
  distancia_por_brazada_global_m?: number;
}

/** Respuesta completa del endpoint GET /resultados/{id} */
export interface ResultadoCompletoResponse {
  resultado: ResultadoResponse;
  segmentos: SegmentoResponse[];
  resumen_global: ResumenGlobal;
}
