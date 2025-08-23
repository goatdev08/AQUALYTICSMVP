/**
 * DateRangePicker Component - Selector de rango de fechas
 * 
 * Componente reutilizable para seleccionar rangos de fechas en competencias.
 * Integra tema Figma "success" con shadcn/ui para consistencia visual.
 * Incluye validación de fechas y UX responsivo.
 */

'use client';

import React, { useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import { mapFigmaVariant } from '@/lib/figma-utils';

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

export interface DateRangeValue {
  lower: string; // formato ISO date (YYYY-MM-DD)
  upper: string; // formato ISO date (YYYY-MM-DD)
}

export interface DateRangePickerProps {
  value?: DateRangeValue;
  onChange?: (value: DateRangeValue | null) => void;
  onBlur?: () => void;
  label?: string;
  placeholder?: {
    inicio?: string;
    fin?: string;
  };
  disabled?: boolean;
  error?: string | {
    inicio?: string;
    fin?: string;
    general?: string;
  };
  required?: boolean;
  className?: string;
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Convierte fecha ISO string a formato input date (YYYY-MM-DD)
 */
function toInputDate(isoString?: string): string {
  if (!isoString) return '';
  
  try {
    const date = new Date(isoString);
    return format(date, 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

/**
 * Convierte fecha de input (YYYY-MM-DD) a ISO string
 */
function fromInputDate(inputDate: string): string {
  if (!inputDate) return '';
  
  try {
    const date = new Date(inputDate);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  } catch {
    return '';
  }
}

/**
 * Valida que la fecha de fin no sea anterior a la de inicio
 */
function validateDateRange(inicio: string, fin: string): string | null {
  if (!inicio || !fin) return null;
  
  const fechaInicio = new Date(inicio);
  const fechaFin = new Date(fin);
  
  if (fechaFin < fechaInicio) {
    return 'La fecha de fin no puede ser anterior a la fecha de inicio';
  }
  
  return null;
}

/**
 * Formatea fecha para mostrar al usuario
 */
function formatDisplayDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return format(date, 'dd MMM yyyy', { locale: es });
  } catch {
    return isoString;
  }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function DateRangePicker({
  value,
  onChange,
  onBlur,
  label = 'Fechas de la competencia',
  placeholder = {
    inicio: 'Fecha de inicio',
    fin: 'Fecha de fin',
  },
  disabled = false,
  error,
  required = false,
  className = '',
}: DateRangePickerProps) {
  
  // ========================================
  // ESTADO Y VALORES DERIVADOS
  // ========================================
  
  const fechaInicio = toInputDate(value?.lower);
  const fechaFin = toInputDate(value?.upper);
  
  // Obtener props de Figma para inputs
  const inputProps = mapFigmaVariant('Input', 'Droplistborder', {
    className: 'transition-colors',
  });

  // ========================================
  // HANDLERS
  // ========================================
  
  const handleFechaInicioChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevaFechaInicio = e.target.value;
    const fechaInicioISO = fromInputDate(nuevaFechaInicio);
    const fechaFinISO = value?.upper || '';
    
    if (nuevaFechaInicio && fechaFinISO) {
      // Emitir el cambio para que el padre maneje la validación
      if (onChange) {
        onChange({
          lower: fechaInicioISO,
          upper: fechaFinISO,
        });
      }
    } else if (nuevaFechaInicio) {
      if (onChange) {
        onChange({
          lower: fechaInicioISO,
          upper: fechaFinISO,
        });
      }
    } else {
      if (onChange) {
        onChange(null);
      }
    }
  }, [value?.upper, onChange]);
  
  const handleFechaFinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevaFechaFin = e.target.value;
    const fechaFinISO = fromInputDate(nuevaFechaFin);
    const fechaInicioISO = value?.lower || '';
    
    if (fechaInicioISO && nuevaFechaFin) {
      // Emitir el cambio para que el padre maneje la validación
      if (onChange) {
        onChange({
          lower: fechaInicioISO,
          upper: fechaFinISO,
        });
      }
    } else if (nuevaFechaFin) {
      if (onChange) {
        onChange({
          lower: fechaInicioISO,
          upper: fechaFinISO,
        });
      }
    } else {
      if (onChange) {
        onChange(null);
      }
    }
  }, [value?.lower, onChange]);

  // ========================================
  // VALIDACIÓN LOCAL Y MANEJO DE ERRORES
  // ========================================
  
  const localValidationError = value?.lower && value?.upper 
    ? validateDateRange(value.lower, value.upper)
    : null;

  // Manejar errores específicos o genéricos
  const errorMessages = typeof error === 'string' 
    ? { general: error }
    : error || {};

  const errorInicio = errorMessages.inicio;
  const errorFin = errorMessages.fin;
  const errorGeneral = errorMessages.general || localValidationError;

  // ========================================
  // RENDER
  // ========================================
  
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Container de inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Input fecha de inicio */}
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de inicio
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="relative">
            <input
              type="date"
              value={fechaInicio}
              onChange={handleFechaInicioChange}
              onBlur={onBlur}
              disabled={disabled}
              placeholder={placeholder.inicio}
              className={`
                w-full px-3 py-2 pr-10
                border rounded-full
                text-sm
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                ${errorInicio ? 'border-red-300' : 'border-gray-300'}
                ${inputProps.className || ''}
              `}
              {...(({ className, ...rest }) => rest)(inputProps)}
            />
            <Calendar 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" 
            />
          </div>
          {errorInicio && (
            <p className="mt-1 text-sm text-red-600">{errorInicio}</p>
          )}
        </div>
        
        {/* Input fecha de fin */}
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de fin
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="relative">
            <input
              type="date"
              value={fechaFin}
              onChange={handleFechaFinChange}
              onBlur={onBlur}
              disabled={disabled}
              placeholder={placeholder.fin}
              className={`
                w-full px-3 py-2 pr-10
                border rounded-full
                text-sm
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                ${errorFin ? 'border-red-300' : 'border-gray-300'}
                ${inputProps.className || ''}
              `}
              {...(({ className, ...rest }) => rest)(inputProps)}
            />
            <Calendar 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" 
            />
          </div>
          {errorFin && (
            <p className="mt-1 text-sm text-red-600">{errorFin}</p>
          )}
        </div>
      </div>
      
      {/* Resumen visual del rango seleccionado */}
      {value?.lower && value?.upper && !errorInicio && !errorFin && !errorGeneral && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center text-sm text-green-700">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="font-medium">
              {formatDisplayDate(value.lower)} - {formatDisplayDate(value.upper)}
            </span>
            {value.lower === value.upper && (
              <span className="ml-2 text-xs text-green-600">(1 día)</span>
            )}
          </div>
        </div>
      )}
      
      {/* Error message general */}
      {errorGeneral && !errorInicio && !errorFin && (
        <p className="text-sm text-red-600 mt-1">
          {errorGeneral}
        </p>
      )}
    </div>
  );
}

export default DateRangePicker;
