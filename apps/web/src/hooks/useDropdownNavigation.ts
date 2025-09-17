/**
 * Hook para navegación por teclado en dropdowns
 * 
 * Extrae la lógica común de navegación con teclado que se usa en
 * componentes de typeahead como NadadorSelector, CompetenciaSelector, etc.
 * 
 * Funcionalidades:
 * - Navegación con ArrowUp/ArrowDown
 * - Selección con Enter
 * - Cerrar con Escape
 * - Gestión automática de selectedIndex
 */

import { useCallback, useEffect } from 'react';

export interface UseDropdownNavigationProps<T = any> {
  /** Lista de opciones disponibles */
  items: T[];
  /** Índice actualmente seleccionado */
  selectedIndex: number;
  /** Callback para actualizar el índice seleccionado */
  setSelectedIndex: (index: number) => void;
  /** Callback cuando se selecciona un item con Enter */
  onSelectItem: (item: T, index: number) => void;
  /** Callback cuando se presiona Escape */
  onEscape?: () => void;
  /** Si el dropdown está abierto */
  isOpen: boolean;
  /** Si está habilitado */
  enabled?: boolean;
}

export interface UseDropdownNavigationReturn {
  /** Handler para eventos de teclado */
  handleKeyDown: (e: React.KeyboardEvent) => void;
  /** Navegar hacia abajo */
  navigateDown: () => void;
  /** Navegar hacia arriba */
  navigateUp: () => void;
  /** Seleccionar item actual */
  selectCurrent: () => void;
  /** Resetear índice seleccionado */
  resetSelection: () => void;
}

/**
 * Hook para manejar navegación por teclado en dropdowns
 */
export function useDropdownNavigation<T>({
  items,
  selectedIndex,
  setSelectedIndex,
  onSelectItem,
  onEscape,
  isOpen,
  enabled = true,
}: UseDropdownNavigationProps<T>): UseDropdownNavigationReturn {

  // Navegación hacia abajo
  const navigateDown = useCallback(() => {
    if (!isOpen || !enabled || items.length === 0) return;
    
    setSelectedIndex(
      selectedIndex < items.length - 1 ? selectedIndex + 1 : selectedIndex
    );
  }, [isOpen, enabled, items.length, selectedIndex, setSelectedIndex]);

  // Navegación hacia arriba  
  const navigateUp = useCallback(() => {
    if (!isOpen || !enabled || items.length === 0) return;
    
    setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : selectedIndex);
  }, [isOpen, enabled, items.length, selectedIndex, setSelectedIndex]);

  // Seleccionar item actual
  const selectCurrent = useCallback(() => {
    if (!isOpen || !enabled || selectedIndex < 0 || !items[selectedIndex]) return;
    
    onSelectItem(items[selectedIndex], selectedIndex);
  }, [isOpen, enabled, selectedIndex, items, onSelectItem]);

  // Resetear selección
  const resetSelection = useCallback(() => {
    setSelectedIndex(-1);
  }, [setSelectedIndex]);

  // Handler principal de teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || !enabled) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        navigateDown();
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        navigateUp();
        break;
        
      case 'Enter':
        e.preventDefault();
        selectCurrent();
        break;
        
      case 'Escape':
        e.preventDefault();
        resetSelection();
        onEscape?.();
        break;
        
      default:
        // Permitir otras teclas
        break;
    }
  }, [isOpen, enabled, navigateDown, navigateUp, selectCurrent, resetSelection, onEscape]);

  // Efecto para resetear selección cuando cambian los items
  useEffect(() => {
    if (selectedIndex >= items.length) {
      resetSelection();
    }
  }, [items.length, selectedIndex, resetSelection]);

  return {
    handleKeyDown,
    navigateDown,
    navigateUp,
    selectCurrent,
    resetSelection,
  };
}

export default useDropdownNavigation;

