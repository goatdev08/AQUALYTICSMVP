/**
 * CompetenciaSelector - Componente reutilizable para búsqueda y selección de competencias
 * 
 * Funcionalidades:
 * - Búsqueda typeahead con debounce usando utilidades comunes
 * - Filtros por curso (SC/LC) y fechas
 * - Navegación por teclado accesible
 * - Selección con callback de confirmación
 * - Estados de loading, error y empty state
 * - UI consistente con tema green y shadcn components
 * - Propiedades ARIA para accesibilidad
 * 
 * Basado en el patrón unificado de NadadorSelector:
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
import { useCompetenciaTypeahead, type CompetenciaSelector as CompetenciaOption, type CursoEnum } from '@/hooks/useCompetencias';
import { 
  Button, 
  Input,
  Alert,
  AlertDescription,
  Badge,
} from '@/components/ui';
import { 
  SearchIcon,
  TrophyIcon,
  LoaderIcon,
  CheckIcon,
  FilterIcon,
  XIcon
} from 'lucide-react';

// =====================
// Tipos y Props
// =====================

export interface CompetenciaSelectorFilters {
  curso?: CursoEnum;
  // Extensible para futuros filtros como fechas
}

export interface CompetenciaSelectorProps {
  // Datos y selección
  value?: CompetenciaOption | null;
  onValueChange: (competencia: CompetenciaOption | null) => void;
  
  // Configuración
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  
  // Filtros iniciales
  initialFilters?: CompetenciaSelectorFilters;
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

export function CompetenciaSelector({
  value,
  onValueChange,
  placeholder = "Buscar competencia por nombre...",
  disabled = false,
  autoFocus = false,
  initialFilters = {},
  showFilters = true,
  className = "",
  maxResults = 10,
  loading: externalLoading = false,
  error: externalError,
}: CompetenciaSelectorProps) {
  
  // =====================
  // Utilidades comunes
  // =====================
  
  // Generar IDs únicos para accesibilidad
  const ariaIds = useMemo(() => generateDropdownIds('competencia-selector'), []);
  
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
  const [filters, setFilters] = useState<CompetenciaSelectorFilters>(initialFilters);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  // Debounce search para performance
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  // =====================
  // Query de competencias
  // =====================
  
  const { 
    data: competencias = [],
    isLoading: queryLoading,
    error: queryError,
  } = useCompetenciaTypeahead(debouncedSearch, maxResults);
  
  // Estado combinado de loading
  const isLoading = externalLoading || queryLoading;
  const error = externalError || queryError?.message;
  
  // =====================
  // Filtros aplicados usando utilidades comunes
  // =====================
  
  const competenciasFiltradas = useMemo(() => {
    return applyFilters(competencias, cleanFilters(filters), {
      includeEmpty: true,
      compare: (itemValue, filterValue) => {
        // Comparación específica para curso
        return itemValue === filterValue;
      }
    });
  }, [competencias, filters]);
  
  // =====================
  // Handlers usando utilidades comunes
  // =====================
  
  const handleSelect = useCallback((competencia: CompetenciaOption) => {
    onValueChange(competencia);
    setSearchTerm(competencia.nombre);
    setIsOpen(false);
    setSelectedIndex(-1);
  }, [onValueChange, setSearchTerm, setIsOpen, setSelectedIndex]);

  // Navegación por teclado usando hook común
  const { handleKeyDown } = useDropdownNavigation({
    items: competenciasFiltradas,
    selectedIndex,
    setSelectedIndex,
    onSelectItem: handleSelect,
    onEscape: () => setIsOpen(false),
    isOpen,
    enabled: !disabled,
  });
  
  const handleFilterChange = useCallback((key: keyof CompetenciaSelectorFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : (value as CursoEnum),
    }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);
  
  const clearSelection = useCallback(() => {
    onValueChange(null);
    clearAndClose();
  }, [onValueChange, clearAndClose]);

  // =====================
  // Propiedades ARIA para accesibilidad
  // =====================
  
  const ariaProps = useMemo(() => {
    return createDropdownAriaProps({
      inputId: ariaIds.inputId,
      listboxId: ariaIds.listboxId,
      groupId: ariaIds.groupId,
      descriptionId: ariaIds.descriptionId,
      label: "Seleccionar Competencia",
      placeholder,
      description: showFilters ? "Usa filtros para refinar tu búsqueda de competencias" : undefined,
    });
  }, [ariaIds, placeholder, showFilters]);
  
  // =====================
  // Render
  // =====================
  
  return (
    <div className={`relative ${className}`}>
      {/* Header con filtros */}
      {showFilters && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrophyIcon className="w-4 h-4 text-muted-foreground" />
            <label {...ariaProps.label} className="text-sm font-medium text-foreground">
              Seleccionar Competencia
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
        <div className="bg-muted/50 border border-border rounded-lg p-3 mb-3 space-y-3">
          {/* Filtro por curso */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
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
            <div className="pt-2 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                disabled={disabled}
                className="text-xs text-muted-foreground"
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
            id={ariaProps.input.id}
            type="text"
            value={searchTerm}
            onChange={handleSearchInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-owns={ariaProps.input['aria-owns']}
            aria-autocomplete="list"
            aria-activedescendant={
              selectedIndex >= 0 && competenciasFiltradas[selectedIndex] 
                ? createOptionId(ariaIds.listboxId, selectedIndex)
                : undefined
            }
            className={`
              pl-10 pr-10
              ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
              ${className || ''}
            `}
          />
          
          {/* Icono de búsqueda */}
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          
          {/* Loading spinner o botón limpiar */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isLoading ? (
              <LoaderIcon className="h-4 w-4 text-muted-foreground animate-spin" />
            ) : searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                disabled={disabled}
                className="h-6 w-6 p-0 hover:bg-muted/50"
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
            className="absolute z-50 w-full mt-1 bg-white border border-border rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {/* Loading state */}
          {isLoading && (
              <div className="flex items-center justify-center py-4">
                <LoaderIcon className="w-4 h-4 animate-spin text-muted-foreground mr-2" />
                <span className="text-sm text-muted-foreground">Buscando...</span>
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
            {!isLoading && !error && competenciasFiltradas.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50 border-b border-border">
                  {formatResultCount(competenciasFiltradas.length, debouncedSearch)}
                </div>
                {competenciasFiltradas.map((competencia, index) => {
                  const optionId = createOptionId(ariaIds.listboxId, index);
                  const isSelected = selectedIndex === index;
                  
                  return (
                    <div
                      key={competencia.id}
                      id={optionId}
                      role="option"
                      aria-selected={isSelected}
                      aria-setsize={competenciasFiltradas.length}
                      aria-posinset={index + 1}
                      className={getOptionClasses(
                        false, // no permanently selected options in this context
                        isSelected,
                        'px-3 py-2 cursor-pointer border-b border-gray-50 last:border-0 transition-colors',
                        'bg-primary/10 text-primary'
                      )}
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevenir que se enfoque el elemento
                        handleSelect(competencia);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <TrophyIcon className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {competencia.nombre}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {competencia.curso === 'SC' ? 'Piscina Corta (25m)' : 'Piscina Larga (50m)'} • {competencia.fecha_inicio} - {competencia.fecha_fin}
                            </div>
                          </div>
                        </div>
                        
                        {isSelected && (
                          <CheckIcon className="w-4 h-4 text-primary" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
            
            {/* Empty state */}
            {!isLoading && !error && competenciasFiltradas.length === 0 && debouncedSearch.length >= 1 && (
              <div className="px-3 py-8 text-center">
                <TrophyIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">
                  No se encontraron competencias
                </p>
                <p className="text-xs text-muted-foreground">
                  Intenta con un término diferente o ajusta los filtros
                </p>
            </div>
          )}
          
            {/* Instrucciones de búsqueda */}
            {!isLoading && debouncedSearch.length < 1 && (
              <div className="px-3 py-4 text-center">
                <SearchIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
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
        <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckIcon className="w-4 h-4 text-primary mr-2" />
              <div>
                <div className="text-sm font-medium text-primary">
                  {value.nombre}
                </div>
                <div className="text-xs text-muted-foreground">
                  {value.curso === 'SC' ? 'Piscina Corta (25m)' : 'Piscina Larga (50m)'} • {value.fecha_inicio} - {value.fecha_fin}
                </div>
              </div>
            </div>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              disabled={disabled}
              className="text-muted-foreground hover:text-primary"
            >
              <XIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompetenciaSelector;