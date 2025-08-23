/**
 * Hook useDebounce - Debounce de valores para optimizar búsquedas
 * 
 * Retrasa la actualización de un valor hasta que pase un tiempo específico
 * sin cambios. Útil para búsquedas en tiempo real sin hacer demasiadas requests.
 */

import { useState, useEffect } from 'react';

/**
 * Hook para hacer debounce de un valor
 * 
 * @param value - Valor a hacer debounce
 * @param delay - Tiempo en ms para el retraso (default: 300)
 * @returns Valor con debounce aplicado
 * 
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 * 
 * // debouncedSearch se actualiza 300ms después del último cambio en searchTerm
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function que cancela el timeout si value cambia
    // antes de que se complete el delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Variante del hook que también devuelve el estado de "debouncing"
 */
export function useDebounceWithStatus<T>(value: T, delay: number = 300): [T, boolean] {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isDebouncing, setIsDebouncing] = useState<boolean>(false);

  useEffect(() => {
    setIsDebouncing(true);
    
    const handler = setTimeout(() => {
      setDebouncedValue(value);
      setIsDebouncing(false);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return [debouncedValue, isDebouncing];
}
