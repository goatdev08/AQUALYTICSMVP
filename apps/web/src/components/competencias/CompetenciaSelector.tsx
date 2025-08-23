"use client";

/**
 * Componente CompetenciaSelector
 * 
 * Selector de competencias con búsqueda typeahead para formularios
 * Diseñado para formularios de registro de resultados y otros casos de uso
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  CheckIcon,
  SearchIcon,
  LoaderIcon,
  CalendarIcon,
  MapPinIcon,
  XIcon
} from 'lucide-react';
import { useCompetencias } from '@/hooks/useCompetencias';
import { useDebounce } from '@/hooks/useDebounce';
import { mapFigmaVariant } from '@/lib/figma-utils';

// ============================================================================
// TYPES
// ============================================================================

export interface CompetenciaOption {
  id: number;
  nombre: string;
  curso: string;
  rango_fechas: {
    lower: string;
    upper: string;
  };
  sede?: string;
}

export interface CompetenciaSelectorProps {
  value?: CompetenciaOption | null;
  onValueChange?: (competencia: CompetenciaOption | null) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  className?: string;
  includeFinalizadas?: boolean;
  cursoFilter?: 'SC' | 'LC';
}

// ============================================================================
// UTILIDADES
// ============================================================================

function formatFechaCorta(fechaISO: string): string {
  try {
    const fecha = new Date(fechaISO);
    return format(fecha, 'dd MMM', { locale: es });
  } catch {
    return fechaISO;
  }
}

function getEstadoCompetencia(rango_fechas: { lower: string; upper: string }): {
  estado: string;
  color: string;
} {
  const hoy = new Date();
  const inicio = new Date(rango_fechas.lower);
  const fin = new Date(rango_fechas.upper);
  
  if (fin < hoy) {
    return { estado: 'Finalizada', color: 'text-gray-500' };
  } else if (inicio <= hoy && hoy <= fin) {
    return { estado: 'Activa', color: 'text-green-600' };
  } else {
    return { estado: 'Próxima', color: 'text-blue-600' };
  }
}

// ============================================================================
// COMPONENTES
// ============================================================================

function CompetenciaOptionItem({ 
  competencia, 
  isSelected, 
  isHighlighted,
  onClick 
}: {
  competencia: CompetenciaOption;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
}) {
  const estadoInfo = getEstadoCompetencia(competencia.rango_fechas);
  
  return (
    <div
      className={`px-3 py-2 cursor-pointer border-l-2 transition-colors ${
        isHighlighted 
          ? 'bg-green-50 border-green-500' 
          : 'border-transparent hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {competencia.nombre}
            </h4>
            {isSelected && (
              <CheckIcon className="h-4 w-4 text-green-600 flex-shrink-0" />
            )}
          </div>
          
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center text-xs text-gray-500">
              <CalendarIcon className="h-3 w-3 mr-1" />
              <span>
                {formatFechaCorta(competencia.rango_fechas.lower)} - {formatFechaCorta(competencia.rango_fechas.upper)}
              </span>
            </div>
            
            {competencia.sede && (
              <div className="flex items-center text-xs text-gray-500">
                <MapPinIcon className="h-3 w-3 mr-1" />
                <span className="truncate max-w-24">{competencia.sede}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1 ml-3">
          <span className={`text-xs font-medium ${estadoInfo.color}`}>
            {estadoInfo.estado}
          </span>
          <span className="text-xs text-gray-400">
            {competencia.curso === 'SC' ? '25m' : '50m'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function CompetenciaSelector({
  value,
  onValueChange,
  placeholder = "Seleccionar competencia...",
  disabled = false,
  error,
  required = false,
  className = "",
  includeFinalizadas = false,
  cursoFilter
}: CompetenciaSelectorProps) {
  const { useCompetenciasList } = useCompetencias();
  
  // ========================================
  // ESTADO LOCAL
  // ========================================
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  
  // ========================================
  // QUERIES
  // ========================================
  
  const filters = useMemo(() => {
    const baseFilters: any = {
      search: debouncedSearch || undefined,
      size: 20 // Limitar resultados para typeahead
    };
    
    if (cursoFilter) {
      baseFilters.curso = cursoFilter;
    }
    
    // Filtrar competencias finalizadas si no se incluyen
    if (!includeFinalizadas) {
      const hoy = new Date();
      baseFilters.fecha_fin = hoy.toISOString().split('T')[0]; // >= hoy
    }
    
    return baseFilters;
  }, [debouncedSearch, cursoFilter, includeFinalizadas]);
  
  const { 
    data: competenciasData, 
    isLoading, 
    error: fetchError 
  } = useCompetenciasList(filters);
  
  const opciones = competenciasData?.competencias || [];
  
  // DEBUG: Logs removidos después de corrección
  
  // ========================================
  // EFFECTS
  // ========================================
  
  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Reset highlighted index when options change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [opciones]);
  
  // ========================================
  // HANDLERS
  // ========================================
  
  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      inputRef.current?.focus();
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };
  
  const handleOptionSelect = (competencia: CompetenciaOption) => {
    onValueChange?.(competencia);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };
  
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange?.(null);
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(prev => 
          prev < opciones.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : opciones.length - 1);
        }
        break;
        
      case 'Enter':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          handleOptionSelect(opciones[highlightedIndex]);
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;
        
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
        
      case 'Tab':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };
  
  // ========================================
  // PROPS FIGMA
  // ========================================
  
  const inputProps = mapFigmaVariant('Input', 'Droplistborder', {});
  
  // ========================================
  // RENDER VALUES
  // ========================================
  
  const displayValue = value ? value.nombre : '';
  const showPlaceholder = !value && !searchTerm;
  const inputValue = isOpen ? searchTerm : displayValue;
  
  // ========================================
  // RENDER
  // ========================================
  
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input Container */}
      <div 
        className={`
          relative flex items-center border rounded-lg bg-white transition-colors cursor-pointer
          ${error ? 'border-red-300' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
          ${isOpen ? 'border-green-500 ring-1 ring-green-500' : ''}
        `}
        onClick={handleInputClick}
      >
        {/* Search Icon */}
        <SearchIcon className="h-4 w-4 text-gray-400 ml-3" />
        
        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={showPlaceholder ? placeholder : ''}
          disabled={disabled}
          required={required}
          className={`
            flex-1 px-3 py-2 bg-transparent text-sm placeholder-gray-500 outline-none
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
          autoComplete="off"
        />
        
        {/* Clear Button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
        
        {/* Dropdown Arrow */}
        <div className="px-3 pointer-events-none">
          {isOpen ? (
            <ChevronUpIcon className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
      
      {/* Dropdown List */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-3">
              <LoaderIcon className="h-4 w-4 animate-spin text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">Buscando...</span>
            </div>
          )}
          
          {fetchError && (
            <div className="px-3 py-2 text-sm text-red-600">
              Error al cargar competencias
            </div>
          )}
          
          {!isLoading && !fetchError && opciones.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-600">
              {debouncedSearch ? 
                `No se encontraron competencias para "${debouncedSearch}"` :
                'No hay competencias disponibles'
              }
            </div>
          )}
          
          {!isLoading && !fetchError && opciones.length > 0 && (
            <div ref={listRef}>
              {opciones.map((competencia, index) => (
                <CompetenciaOptionItem
                  key={competencia.id}
                  competencia={competencia}
                  isSelected={value?.id === competencia.id}
                  isHighlighted={index === highlightedIndex}
                  onClick={() => handleOptionSelect(competencia)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CompetenciaSelector;
