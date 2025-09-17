/**
 * Hook para gestionar el estado de dropdowns
 * 
 * Extrae la lógica común de estado de dropdowns que se usa en
 * componentes de typeahead como NadadorSelector, CompetenciaSelector, etc.
 * 
 * Funcionalidades:
 * - Estado de apertura/cierre
 * - Índice de selección
 * - Término de búsqueda
 * - Estados de loading y error
 * - Funciones de limpieza
 */

import { useState, useCallback, useMemo } from 'react';

export interface UseDropdownStateProps {
  /** Valor inicial para el término de búsqueda */
  initialSearchTerm?: string;
  /** Valor inicial para el estado de apertura */
  initialIsOpen?: boolean;
  /** Mínima longitud para abrir el dropdown */
  minSearchLength?: number;
  /** Callback cuando cambia el término de búsqueda */
  onSearchChange?: (term: string) => void;
  /** Callback cuando cambia el estado de apertura */
  onOpenChange?: (isOpen: boolean) => void;
}

export interface UseDropdownStateReturn {
  // Estados básicos
  /** Término de búsqueda actual */
  searchTerm: string;
  /** Si el dropdown está abierto */
  isOpen: boolean;
  /** Índice del item seleccionado */
  selectedIndex: number;
  
  // Funciones de control
  /** Actualizar término de búsqueda */
  setSearchTerm: (term: string) => void;
  /** Actualizar estado de apertura */
  setIsOpen: (isOpen: boolean) => void;
  /** Actualizar índice seleccionado */
  setSelectedIndex: (index: number) => void;
  
  // Funciones de conveniencia
  /** Abrir dropdown */
  openDropdown: () => void;
  /** Cerrar dropdown */
  closeDropdown: () => void;
  /** Toggle dropdown */
  toggleDropdown: () => void;
  /** Limpiar búsqueda y cerrar */
  clearAndClose: () => void;
  /** Resetear todo el estado */
  resetState: () => void;
  
  // Handlers para eventos comunes
  /** Handler para cambios en el input de búsqueda */
  handleSearchInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Handler para focus en el input */
  handleInputFocus: () => void;
  /** Handler para blur en el input (con delay) */
  handleInputBlur: () => void;
  
  // Estados derivados
  /** Si debe mostrar el dropdown (isOpen && searchTerm cumple condiciones) */
  shouldShowDropdown: boolean;
}

/**
 * Hook para manejar el estado de dropdowns de typeahead
 */
export function useDropdownState({
  initialSearchTerm = '',
  initialIsOpen = false,
  minSearchLength = 1,
  onSearchChange,
  onOpenChange,
}: UseDropdownStateProps = {}): UseDropdownStateReturn {

  // Estados básicos
  const [searchTerm, setSearchTermState] = useState(initialSearchTerm);
  const [isOpen, setIsOpenState] = useState(initialIsOpen);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Función para actualizar término de búsqueda
  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
    setSelectedIndex(-1); // Reset selection when search changes
    
    // Auto-abrir/cerrar basado en longitud mínima
    const shouldOpen = term.length >= minSearchLength;
    setIsOpenState(shouldOpen);
    
    // Callbacks opcionales
    onSearchChange?.(term);
    onOpenChange?.(shouldOpen);
  }, [minSearchLength, onSearchChange, onOpenChange]);

  // Función para actualizar estado de apertura
  const setIsOpen = useCallback((open: boolean) => {
    setIsOpenState(open);
    onOpenChange?.(open);
    
    // Reset selection when closing
    if (!open) {
      setSelectedIndex(-1);
    }
  }, [onOpenChange]);

  // Funciones de conveniencia
  const openDropdown = useCallback(() => setIsOpen(true), [setIsOpen]);
  
  const closeDropdown = useCallback(() => setIsOpen(false), [setIsOpen]);
  
  const toggleDropdown = useCallback(() => setIsOpen(!isOpen), [isOpen, setIsOpen]);

  const clearAndClose = useCallback(() => {
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
  }, [setSearchTerm, setIsOpen]);

  const resetState = useCallback(() => {
    setSearchTermState(initialSearchTerm);
    setIsOpenState(initialIsOpen);
    setSelectedIndex(-1);
  }, [initialSearchTerm, initialIsOpen]);

  // Handlers para eventos comunes
  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, [setSearchTerm]);

  const handleInputFocus = useCallback(() => {
    if (searchTerm.length >= minSearchLength) {
      setIsOpen(true);
    }
  }, [searchTerm.length, minSearchLength, setIsOpen]);

  const handleInputBlur = useCallback(() => {
    // Delay para permitir clicks en el dropdown
    setTimeout(() => {
      setIsOpen(false);
    }, 200); // Aumentado a 200ms para mayor seguridad
  }, [setIsOpen]);

  // Estados derivados
  const shouldShowDropdown = useMemo(() => {
    return isOpen && searchTerm.length >= minSearchLength;
  }, [isOpen, searchTerm.length, minSearchLength]);

  return {
    // Estados básicos
    searchTerm,
    isOpen,
    selectedIndex,
    
    // Funciones de control
    setSearchTerm,
    setIsOpen,
    setSelectedIndex,
    
    // Funciones de conveniencia
    openDropdown,
    closeDropdown,
    toggleDropdown,
    clearAndClose,
    resetState,
    
    // Handlers para eventos
    handleSearchInputChange,
    handleInputFocus,
    handleInputBlur,
    
    // Estados derivados
    shouldShowDropdown,
  };
}

export default useDropdownState;

