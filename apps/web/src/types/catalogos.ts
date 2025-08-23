/**
 * Tipos TypeScript y validadores Zod para catálogos en AquaLytics
 * 
 * Define tipos para pruebas de natación y validadores para formularios relacionados.
 */

import { z } from 'zod';

/**
 * Tipos básicos para el catálogo de pruebas
 */
export type EstiloNatacion = 'Libre' | 'Dorso' | 'Pecho' | 'Mariposa' | 'Combinado';
export type TipoCurso = 'SC' | 'LC';

export interface Prueba {
  id: number;
  nombre: string; // "100m Libre SC"
  estilo: EstiloNatacion;
  distancia: number;
  curso: TipoCurso;
}

export interface CatalogoPruebas {
  pruebas: Prueba[];
  total: number;
  estilos_disponibles: EstiloNatacion[];
  cursos_disponibles: TipoCurso[];
}

/**
 * Validadores Zod
 */

// Regex para validar formato mm:ss.cc
const TIME_REGEX = /^(\d{1,2}):([0-5]\d)\.(\d{2})$/;

/**
 * Schema Zod para validar formato de tiempo mm:ss.cc
 * Permite formatos como "1:23.45", "01:23.45", "0:30.00"
 */
export const timeFormatSchema = z
  .string()
  .min(1, 'El tiempo es requerido')
  .regex(TIME_REGEX, 'Formato de tiempo inválido. Use mm:ss.cc (ej: 1:23.45)')
  .refine((time) => {
    const match = time.match(TIME_REGEX);
    if (!match) return false;
    
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const centiseconds = parseInt(match[3], 10);
    
    // Validaciones adicionales
    return (
      minutes >= 0 && minutes <= 99 &&
      seconds >= 0 && seconds <= 59 &&
      centiseconds >= 0 && centiseconds <= 99
    );
  }, 'Valores de tiempo fuera de rango válido');

/**
 * Schema Zod para selección de estilo de natación
 */
export const estiloSchema = z.enum(['Libre', 'Dorso', 'Pecho', 'Mariposa', 'Combinado'], {
  errorMap: () => ({ message: 'Debe seleccionar un estilo válido' })
});

/**
 * Schema Zod para selección de tipo de curso
 */
export const cursoSchema = z.enum(['SC', 'LC'], {
  errorMap: () => ({ message: 'Debe seleccionar un tipo de curso válido' })
});

/**
 * Schema Zod para selección de distancia
 */
export const distanciaSchema = z
  .number({
    required_error: 'La distancia es requerida',
    invalid_type_error: 'La distancia debe ser un número'
  })
  .int('La distancia debe ser un número entero')
  .min(50, 'La distancia mínima es 50m')
  .max(1500, 'La distancia máxima es 1500m')
  .refine((dist) => {
    // Distancias válidas según PRD
    const validDistances = [50, 100, 200, 400, 800, 1500];
    return validDistances.includes(dist);
  }, 'Distancia no válida. Debe ser: 50, 100, 200, 400, 800 o 1500 metros');

/**
 * Schema Zod para selección de una prueba completa
 */
export const pruebaSelectionSchema = z.object({
  id: z.number().int().positive('ID de prueba debe ser positivo'),
  nombre: z.string().min(1, 'Nombre de prueba es requerido'),
  estilo: estiloSchema,
  distancia: distanciaSchema,
  curso: cursoSchema,
});

/**
 * Schema Zod para filtros de búsqueda de pruebas
 */
export const pruebaFiltersSchema = z.object({
  estilo: estiloSchema.optional(),
  distancia: distanciaSchema.optional(),
  curso: cursoSchema.optional(),
}).optional();

/**
 * Schema Zod para un tiempo de resultado (usado en formularios de captura)
 */
export const tiempoResultadoSchema = z.object({
  tiempo_global: timeFormatSchema,
  tiempo_15m: timeFormatSchema.optional(),
});

/**
 * Schema Zod para validar entrada de tiempo con contexto de prueba
 */
export const tiempoConPruebaSchema = z.object({
  tiempo: timeFormatSchema,
  prueba: pruebaSelectionSchema,
}).refine((data) => {
  // Validación contextual: tiempo 15m solo permitido en pruebas de 50m
  if (data.prueba.distancia !== 50 && data.tiempo.includes('15m')) {
    return false;
  }
  return true;
}, {
  message: 'El tiempo de 15m solo es válido para pruebas de 50 metros',
  path: ['tiempo']
});

/**
 * Tipos derivados de los schemas para TypeScript
 */
export type TimeFormat = z.infer<typeof timeFormatSchema>;
export type EstiloSelect = z.infer<typeof estiloSchema>;
export type CursoSelect = z.infer<typeof cursoSchema>;
export type DistanciaSelect = z.infer<typeof distanciaSchema>;
export type PruebaSelection = z.infer<typeof pruebaSelectionSchema>;
export type PruebaFilters = z.infer<typeof pruebaFiltersSchema>;
export type TiempoResultado = z.infer<typeof tiempoResultadoSchema>;
export type TiempoConPrueba = z.infer<typeof tiempoConPruebaSchema>;

/**
 * Constantes útiles
 */
export const ESTILOS_NATACION: EstiloNatacion[] = ['Libre', 'Dorso', 'Pecho', 'Mariposa', 'Combinado'];
export const TIPOS_CURSO: TipoCurso[] = ['SC', 'LC'];
export const DISTANCIAS_VALIDAS: number[] = [50, 100, 200, 400, 800, 1500];

/**
 * Utilidades de validación
 */
export const validationUtils = {
  isValidTimeFormat: (time: string): boolean => {
    return timeFormatSchema.safeParse(time).success;
  },
  
  isValidEstilo: (estilo: string): estilo is EstiloNatacion => {
    return estiloSchema.safeParse(estilo).success;
  },
  
  isValidCurso: (curso: string): curso is TipoCurso => {
    return cursoSchema.safeParse(curso).success;
  },
  
  isValidDistancia: (distancia: number): boolean => {
    return distanciaSchema.safeParse(distancia).success;
  },
  
  parseTimeOrThrow: (time: string): string => {
    const result = timeFormatSchema.safeParse(time);
    if (!result.success) {
      throw new Error(result.error.errors[0]?.message || 'Formato de tiempo inválido');
    }
    return result.data;
  }
};
