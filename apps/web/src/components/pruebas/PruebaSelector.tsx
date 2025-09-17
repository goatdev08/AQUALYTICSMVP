/**
 * PruebaSelector - Componente reutilizable para búsqueda y selección de pruebas de natación
 * 
 * Funcionalidades:
 * - Búsqueda typeahead con debounce usando utilidades comunes
 * - Filtros por estilo, distancia y curso (SC/LC)
 * - Navegación por teclado accesible
 * - Selección con callback de confirmación
 * - Estados de loading, error y empty state
 * - UI consistente con tema green y shadcn components
 * - Propiedades ARIA para accesibilidad
 * 
 * Basado en el patrón unificado establecido:
 * - useDropdownState para gestión de estado
 * - useDropdownNavigation para navegación por teclado
 * - dropdown-aria para accesibilidad
 * - dropdown-utils para utilidades comunes
 */

"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useDropdownState, useDropdownNavigation } from '@/hooks';
import { createDropdownAriaProps, generateDropdownIds, createOptionId } from '@/lib/dropdown-aria';
import { applyFilters, cleanFilters, getOptionClasses, formatResultCount, countActiveFilters } from '@/lib/dropdown-utils';
import { usePruebasTypeahead, type PruebaResponse, type EstiloNatacion, type TipoCurso } from '@/hooks/usePruebas';
import { 
  Button, 
  Input,
  Alert,
  AlertDescription,
  Badge,
} from '@/components/ui';
import { 
  SearchIcon, 
  WavesIcon, 
  ActivityIcon,
  LoaderIcon,
  CheckIcon,
  FilterIcon,
  XIcon
} from 'lucide-react';
import { mapFigmaVariant } from '@/lib/figma-utils';

// =====================
// Tipos y Props
// =====================

export interface PruebaSelectorFilters {
  estilo?: EstiloNatacion;
  curso?: TipoCurso;
  // Extensible para futuros filtros como distancia
}

export interface PruebaSelectorProps {
  // Datos y selección
  value?: PruebaResponse | null;
  onSelect: (prueba: PruebaResponse | null) => void;
  
  // Configuración
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  
  // Filtros iniciales
  initialFilters?: PruebaSelectorFilters;
  showFilters?: boolean;
  
  // Personalización
  className?: string;
  maxResults?: number;
  
  // Estados
  loading?: boolean;
  error?: string;
}

// =====================
// Componente Principal
// =====================

export function PruebaSelector({
  value,
  onSelect,
  placeholder = "Buscar prueba por nombre, estilo o distancia...",
  disabled = false,
  autoFocus = false,
  initialFilters = {},
  showFilters = true,
  className = "",
  maxResults = 15,
  loading: externalLoading = false,
  error: externalError,
}: PruebaSelectorProps) {
  
  // =====================
  // Utilidades comunes
  // =====================
  
  // Generar IDs únicos para accesibilidad
  const ariaIds = useMemo(() => generateDropdownIds('prueba-selector'), []);
  
  // Estado del dropdown usando hook común
  const {
    searchTerm,
    isOpen,
    selectedIndex,
    setSearchTerm,
    setIsOpen,
    setSelectedIndex,
    handleSearchInputChange,
    handleInputFocus,
    handleInputBlur,
    clearAndClose,
    shouldShowDropdown,
  } = useDropdownState({
    initialSearchTerm: value?.nombre || '',
    minSearchLength: 1,
  });
  
  // Estados adicionales específicos del componente
  const [filters, setFilters] = useState<PruebaSelectorFilters>(initialFilters);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  // Debounce search para performance
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  // =====================
  // Query de pruebas
  // =====================
  
  const {
    data: pruebas = [],
    isLoading: queryLoading,
    error: queryError,
  } = usePruebasTypeahead(debouncedSearch, maxResults);
  
  // Estado combinado de loading
  const isLoading = externalLoading || queryLoading;
  const error = externalError || queryError?.message;
  
  // =====================
  // Filtros aplicados usando utilidades comunes
  // =====================
  
  const pruebasFiltradas = useMemo(() => {
    return applyFilters(pruebas, cleanFilters(filters), {
      includeEmpty: true,
      compare: (itemValue, filterValue) => {
        // Comparación específica para estilo y curso
        return itemValue === filterValue;
      }
    });
  }, [pruebas, filters]);
  
  // =====================
  // Handlers usando utilidades comunes
  // =====================
  
  const handleSelect = useCallback((prueba: PruebaResponse) => {
    onSelect(prueba);
    setSearchTerm(prueba.nombre);
    setIsOpen(false);
    setSelectedIndex(-1);
  }, [onSelect, setSearchTerm, setIsOpen, setSelectedIndex]);

  // Navegación por teclado usando hook común
  const { handleKeyDown } = useDropdownNavigation({
    items: pruebasFiltradas,
    selectedIndex,
    setSelectedIndex,
    onSelectItem: handleSelect,
    onEscape: () => setIsOpen(false),
    isOpen,
    enabled: !disabled,
  });
  
  const handleFilterChange = useCallback((key: keyof PruebaSelectorFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);
  
  const clearSelection = useCallback(() => {
    onSelect(null);
    clearAndClose();
  }, [onSelect, clearAndClose]);

  // =====================
  // Propiedades ARIA para accesibilidad
  // =====================
  
  const ariaProps = useMemo(() => {
    return createDropdownAriaProps({
      inputId: ariaIds.inputId,
      listboxId: ariaIds.listboxId,
      groupId: ariaIds.groupId,
      descriptionId: ariaIds.descriptionId,
      label: "Seleccionar Prueba",
      placeholder,
      description: showFilters ? "Usa filtros para refinar tu búsqueda de pruebas" : undefined,
    });
  }, [ariaIds, placeholder, showFilters]);
  
  // =====================
  // Props de componentes
  // =====================
  
  const inputProps = mapFigmaVariant('Input', 'Droplistborder', {
    className: 'transition-colors',
  });

  const primaryButtonProps = mapFigmaVariant('Button', 'Primary', {});
  const secondaryButtonProps = mapFigmaVariant('Button', 'Secondary', {});
  
  // =====================
  // Render
  // =====================
  
  return (
    <div className={`relative ${className}`}>
      {/* Header con filtros */}
      {showFilters && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <WavesIcon className="w-4 h-4 text-gray-500" />
            <label {...ariaProps.label} className="text-sm font-medium text-gray-700">
              Seleccionar Prueba
            </label>
            {countActiveFilters(filters) > 0 && (
              <Badge variant="secondary" className="text-xs">
                {countActiveFilters(filters)} filtro(s)
              </Badge>
            )}
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            disabled={disabled}
            className="text-xs"
          >
            <FilterIcon className="w-3 h-3 mr-1" />
            Filtros
          </Button>
        </div>
      )}
      
      {/* Panel de filtros */}
      {showFilters && showFilterPanel && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 space-y-3">
          {/* Filtro por estilo */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Estilo de Natación
            </label>
            <div className="flex flex-wrap gap-2">
              {['all', 'Libre', 'Espalda', 'Pecho', 'Mariposa', 'Combinado'].map(estilo => (
                <Button
                  key={estilo}
                  type="button"
                  variant={filters.estilo === estilo || (estilo === 'all' && !filters.estilo) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('estilo', estilo)}
                  className="text-xs"
                  disabled={disabled}
                >
                  {estilo === 'all' ? 'Todos' : estilo}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Filtro por curso */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Curso de Natación
            </label>
            <div className="flex gap-2">
              {['all', 'SC', 'LC'].map(curso => (
                <Button
                  key={curso}
                  type="button"
                  variant={filters.curso === curso || (curso === 'all' && !filters.curso) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('curso', curso)}
                  className="text-xs"
                  disabled={disabled}
                >
                  {curso === 'all' ? 'Todos' : curso === 'SC' ? 'Piscina Corta (25m)' : 'Piscina Larga (50m)'}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Limpiar filtros */}
          {countActiveFilters(filters) > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                disabled={disabled}
                className="text-xs text-gray-600"
              >
                <XIcon className="w-3 h-3 mr-1" />
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Input de búsqueda */}
      <div className="relative">
        <div className="relative">
          <Input
            {...ariaProps.input}
            type="text"
            value={searchTerm}
            onChange={handleSearchInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            aria-expanded={shouldShowDropdown}
            aria-activedescendant={
              selectedIndex >= 0 && pruebasFiltradas[selectedIndex] 
                ? createOptionId(ariaIds.listboxId, selectedIndex)
                : undefined
            }
            className={`
              pl-10 pr-10
              ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
              ${inputProps.className || ''}
            `}
            {...(({ className, 'aria-expanded': _, 'aria-activedescendant': __, ...rest }) => rest)(inputProps)}
          />
          
          {/* Icono de búsqueda */}
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          
          {/* Loading spinner o botón limpiar */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isLoading ? (
              <LoaderIcon className="h-4 w-4 text-gray-400 animate-spin" />
            ) : searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                disabled={disabled}
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                <XIcon className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Dropdown de resultados */}
        {shouldShowDropdown && (
          <div 
            {...ariaProps.listbox}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <LoaderIcon className="w-4 h-4 animate-spin text-gray-400 mr-2" />
                <span className="text-sm text-gray-500">Buscando...</span>
              </div>
            )}
            
            {/* Error state */}
            {error && !isLoading && (
              <div className="p-3">
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800 text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            {/* Resultados */}
            {!isLoading && !error && pruebasFiltradas.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-100">
                  {formatResultCount(pruebasFiltradas.length, debouncedSearch)}
                </div>
                {pruebasFiltradas.map((prueba, index) => {
                  const optionId = createOptionId(ariaIds.listboxId, index);
                  const isSelected = selectedIndex === index;
                  
                  return (
                    <div
                      key={prueba.id}
                      id={optionId}
                      role="option"
                      aria-selected={isSelected}
                      aria-setsize={pruebasFiltradas.length}
                      aria-posinset={index + 1}
                      className={getOptionClasses(
                        false, // no permanently selected options in this context
                        isSelected,
                        'px-3 py-2 cursor-pointer border-b border-gray-50 last:border-0 transition-colors',
                        'bg-green-50 text-green-900'
                      )}
                      onClick={() => handleSelect(prueba)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <WavesIcon className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {prueba.nombre}
                            </div>
                            <div className="text-xs text-gray-500">
                              {prueba.estilo} • {prueba.distancia}m • {prueba.curso === 'SC' ? 'Piscina Corta' : 'Piscina Larga'}
                            </div>
                          </div>
                        </div>
                        
                        {isSelected && (
                          <CheckIcon className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
            
            {/* Empty state */}
            {!isLoading && !error && pruebasFiltradas.length === 0 && debouncedSearch.length >= 1 && (
              <div className="px-3 py-8 text-center">
                <WavesIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-1">
                  No se encontraron pruebas
                </p>
                <p className="text-xs text-gray-400">
                  Intenta con un término diferente o ajusta los filtros
                </p>
              </div>
            )}
            
            {/* Instrucciones de búsqueda */}
            {!isLoading && debouncedSearch.length < 1 && (
              <div className="px-3 py-4 text-center">
                <SearchIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Escribe un carácter para comenzar a buscar
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      
      {/* Selección actual */}
      {value && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckIcon className="w-4 h-4 text-green-600 mr-2" />
              <div>
                <div className="text-sm font-medium text-green-900">
                  {value.nombre}
                </div>
                <div className="text-xs text-green-700">
                  {value.estilo} • {value.distancia}m • {value.curso === 'SC' ? 'Piscina Corta' : 'Piscina Larga'}
                </div>
              </div>
            </div>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              disabled={disabled}
              className="text-green-700 hover:text-green-900"
            >
              <XIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PruebaSelector;

