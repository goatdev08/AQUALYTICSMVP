/**
 * Utilidades generales para dropdowns
 * 
 * Proporciona funciones de utilidad comunes para componentes
 * de dropdown/typeahead como filtros, conversiones de datos,
 * formateo y validaciones.
 */

import { cn } from '@/lib/utils';

// ============================================================================
// TIPOS GENERALES
// ============================================================================

export interface BaseOption {
  id: string | number;
  label: string;
  value?: any;
}

export interface FilterOption<T = any> {
  key: keyof T;
  value: any;
  label: string;
}

export interface DropdownClassNames {
  container?: string;
  input?: string;
  dropdown?: string;
  option?: string;
  selectedOption?: string;
  emptyState?: string;
  loadingState?: string;
  errorState?: string;
}

// ============================================================================
// UTILIDADES DE FILTROS
// ============================================================================

/**
 * Aplicar filtros a una lista de items
 */
export function applyFilters<T>(
  items: T[],
  filters: Record<string, any>,
  options: {
    /** Incluir items cuando el filtro es undefined/null */
    includeEmpty?: boolean;
    /** Función de comparación personalizada */
    compare?: (itemValue: any, filterValue: any) => boolean;
  } = {}
): T[] {
  const { includeEmpty = true, compare } = options;

  return items.filter(item => {
    return Object.entries(filters).every(([key, filterValue]) => {
      // Si el filtro está vacío, incluir o no según includeEmpty
      if (filterValue === undefined || filterValue === null || filterValue === '') {
        return includeEmpty;
      }

      const itemValue = (item as any)[key];

      // Usar función de comparación personalizada si está disponible
      if (compare) {
        return compare(itemValue, filterValue);
      }

      // Comparación por defecto
      return itemValue === filterValue;
    });
  });
}

/**
 * Limpiar filtros vacíos
 */
export function cleanFilters<T extends Record<string, any>>(filters: T): Partial<T> {
  const cleaned: Partial<T> = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      cleaned[key as keyof T] = value;
    }
  });
  
  return cleaned;
}

/**
 * Contar filtros activos
 */
export function countActiveFilters(filters: Record<string, any>): number {
  return Object.values(cleanFilters(filters)).length;
}

// ============================================================================
// UTILIDADES DE CONVERSIÓN
// ============================================================================

/**
 * Convertir item a formato de opción estándar
 */
export function toOption<T>(
  item: T,
  labelKey: keyof T,
  valueKey?: keyof T,
  idKey: keyof T = 'id' as keyof T
): BaseOption {
  return {
    id: (item as any)[idKey],
    label: String((item as any)[labelKey]),
    value: valueKey ? (item as any)[valueKey] : item,
  };
}

/**
 * Convertir lista de items a opciones
 */
export function toOptions<T>(
  items: T[],
  labelKey: keyof T,
  valueKey?: keyof T,
  idKey: keyof T = 'id' as keyof T
): BaseOption[] {
  return items.map(item => toOption(item, labelKey, valueKey, idKey));
}

// ============================================================================
// UTILIDADES DE CLASES CSS
// ============================================================================

/**
 * Clases CSS por defecto para dropdowns
 */
export const DEFAULT_DROPDOWN_CLASSES: Required<DropdownClassNames> = {
  container: 'relative',
  input: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
  dropdown: 'absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto',
  option: 'px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors',
  selectedOption: 'bg-green-50 text-green-900',
  emptyState: 'px-3 py-8 text-center text-gray-500 text-sm',
  loadingState: 'px-3 py-4 text-center text-gray-500 text-sm',
  errorState: 'px-3 py-4 text-center text-red-500 text-sm',
};

/**
 * Combinar clases CSS personalizadas con las por defecto
 */
export function combineDropdownClasses(customClasses: DropdownClassNames = {}): Required<DropdownClassNames> {
  return {
    container: cn(DEFAULT_DROPDOWN_CLASSES.container, customClasses.container),
    input: cn(DEFAULT_DROPDOWN_CLASSES.input, customClasses.input),
    dropdown: cn(DEFAULT_DROPDOWN_CLASSES.dropdown, customClasses.dropdown),
    option: cn(DEFAULT_DROPDOWN_CLASSES.option, customClasses.option),
    selectedOption: cn(DEFAULT_DROPDOWN_CLASSES.selectedOption, customClasses.selectedOption),
    emptyState: cn(DEFAULT_DROPDOWN_CLASSES.emptyState, customClasses.emptyState),
    loadingState: cn(DEFAULT_DROPDOWN_CLASSES.loadingState, customClasses.loadingState),
    errorState: cn(DEFAULT_DROPDOWN_CLASSES.errorState, customClasses.errorState),
  };
}

/**
 * Generar clases para una opción específica
 */
export function getOptionClasses(
  isSelected: boolean,
  isHighlighted: boolean,
  baseClasses: string,
  selectedClasses: string,
  customClasses?: string
): string {
  return cn(
    baseClasses,
    isSelected && selectedClasses,
    isHighlighted && 'bg-gray-100',
    customClasses
  );
}

// ============================================================================
// UTILIDADES DE VALIDACIÓN
// ============================================================================

/**
 * Validar si un término de búsqueda es válido
 */
export function isValidSearchTerm(term: string, minLength = 1): boolean {
  return typeof term === 'string' && term.trim().length >= minLength;
}

/**
 * Validar si un índice está dentro del rango válido
 */
export function isValidIndex(index: number, arrayLength: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < arrayLength;
}

/**
 * Validar si una opción es seleccionable
 */
export function isSelectableOption<T>(option: T, disabledCheck?: (option: T) => boolean): boolean {
  if (!option) return false;
  if (disabledCheck) return !disabledCheck(option);
  return true;
}

// ============================================================================
// UTILIDADES DE FORMATO
// ============================================================================

/**
 * Formatear texto para mostrar en opciones
 */
export function formatOptionLabel(
  label: string,
  searchTerm?: string,
  options: {
    maxLength?: number;
    highlightSearch?: boolean;
    ellipsis?: string;
  } = {}
): string {
  const { maxLength = 50, highlightSearch = false, ellipsis = '...' } = options;

  let formatted = label;

  // Truncar si excede la longitud máxima
  if (formatted.length > maxLength) {
    formatted = formatted.substring(0, maxLength - ellipsis.length) + ellipsis;
  }

  // TODO: Implementar highlight de términos de búsqueda si es necesario
  // (requeriría retornar JSX en lugar de string)

  return formatted;
}

/**
 * Formatear contador de resultados
 */
export function formatResultCount(count: number, searchTerm?: string): string {
  if (count === 0) {
    return searchTerm ? `No se encontraron resultados para "${searchTerm}"` : 'No hay opciones disponibles';
  }
  
  if (count === 1) {
    return '1 opción encontrada';
  }
  
  return `${count} opciones encontradas`;
}

// ============================================================================
// UTILIDADES DE DEBOUNCE Y PERFORMANCE
// ============================================================================

/**
 * Crear una función debounced (simple implementación)
 */
export function simpleDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle para limitar frecuencia de ejecución
 */
export function simpleThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastExecuted = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastExecuted >= delay) {
      func(...args);
      lastExecuted = now;
    }
  };
}

