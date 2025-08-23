/**
 * NadadorSelector - Componente reutilizable para búsqueda y selección de nadadores
 * 
 * Funcionalidades:
 * - Búsqueda typeahead con debounce
 * - Filtros por rama (F/M) y categoría (11-12, 13-14, 15-16, 17+)
 * - Selección con callback de confirmación
 * - Estados de loading, error y empty state
 * - UI consistente con tema green y shadcn components
 */

"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useNadadorTypeahead, type Nadador } from '@/hooks/useNadadores';
import { 
  Button, 
  Input,
  Alert,
  AlertDescription,
  Badge,
} from '@/components/ui';
import { 
  SearchIcon, 
  UserIcon, 
  UsersIcon,
  LoaderIcon,
  CheckIcon,
  FilterIcon,
  XIcon
} from 'lucide-react';
import { mapFigmaVariant } from '@/lib/figma-utils';

// =====================
// Tipos y Props
// =====================

export interface NadadorOption {
  id: number;
  nombre_completo: string;
  rama: 'F' | 'M';
  edad_actual: number;
  categoria_actual: string;
}

export interface NadadorSelectorFilters {
  rama?: 'F' | 'M';
  categoria?: '11-12' | '13-14' | '15-16' | '17+';
}

export interface NadadorSelectorProps {
  // Datos y selección
  value?: NadadorOption | null;
  onSelect: (nadador: NadadorOption) => void;
  
  // Configuración
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  
  // Filtros iniciales
  initialFilters?: NadadorSelectorFilters;
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

export function NadadorSelector({
  value,
  onSelect,
  placeholder = "Buscar nadador por nombre...",
  disabled = false,
  autoFocus = false,
  initialFilters = {},
  showFilters = true,
  className = "",
  maxResults = 10,
  loading: externalLoading = false,
  error: externalError,
}: NadadorSelectorProps) {
  
  // =====================
  // Estado local
  // =====================
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [filters, setFilters] = useState<NadadorSelectorFilters>(initialFilters);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  // Debounce search para performance
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  // =====================
  // Query de nadadores
  // =====================
  
  const {
    data: nadadores = [],
    isLoading: queryLoading,
    error: queryError,
  } = useNadadorTypeahead(debouncedSearch, maxResults);
  
  // Estado combinado de loading
  const isLoading = externalLoading || queryLoading;
  const error = externalError || queryError?.message;
  
  // =====================
  // Filtros aplicados
  // =====================
  
  const nadadoresFiltrados = useMemo(() => {
    let filtered = nadadores;
    
    if (filters.rama) {
      filtered = filtered.filter(n => n.rama === filters.rama);
    }
    
    if (filters.categoria) {
      filtered = filtered.filter(n => n.categoria_actual === filters.categoria);
    }
    
    return filtered;
  }, [nadadores, filters]);
  
  // =====================
  // Handlers
  // =====================
  
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setSelectedIndex(-1);
    setIsOpen(newValue.length >= 2);
  }, []);
  
  const handleSelect = useCallback((nadador: Nadador) => {
    // Convertir Nadador a NadadorOption
    const nadadorOption: NadadorOption = {
      id: nadador.id,
      nombre_completo: nadador.nombre_completo,
      rama: nadador.rama,
      edad_actual: nadador.edad_actual,
      categoria_actual: nadador.categoria_actual,
    };
    
    onSelect(nadadorOption);
    setSearchTerm(nadador.nombre_completo);
    setIsOpen(false);
    setSelectedIndex(-1);
  }, [onSelect]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < nadadoresFiltrados.length - 1 ? prev + 1 : prev
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && nadadoresFiltrados[selectedIndex]) {
          handleSelect(nadadoresFiltrados[selectedIndex]);
        }
        break;
        
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  }, [isOpen, selectedIndex, nadadoresFiltrados, handleSelect]);
  
  const handleFilterChange = useCallback((key: keyof NadadorSelectorFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);
  
  const clearSelection = useCallback(() => {
    setSearchTerm('');
    onSelect(null);
    setIsOpen(false);
  }, [onSelect]);
  
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
            <UsersIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Seleccionar Nadador
            </span>
            {Object.keys(filters).length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {Object.keys(filters).length} filtro(s)
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
          {/* Filtro por rama */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Rama
            </label>
            <div className="flex gap-2">
              {['all', 'F', 'M'].map(rama => (
                <Button
                  key={rama}
                  type="button"
                  variant={filters.rama === rama || (rama === 'all' && !filters.rama) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('rama', rama)}
                  className="text-xs"
                  disabled={disabled}
                >
                  {rama === 'all' ? 'Todos' : rama === 'F' ? 'Femenino' : 'Masculino'}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Filtro por categoría */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <div className="flex flex-wrap gap-2">
              {['all', '11-12', '13-14', '15-16', '17+'].map(categoria => (
                <Button
                  key={categoria}
                  type="button"
                  variant={filters.categoria === categoria || (categoria === 'all' && !filters.categoria) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('categoria', categoria)}
                  className="text-xs"
                  disabled={disabled}
                >
                  {categoria === 'all' ? 'Todas' : categoria}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Limpiar filtros */}
          {Object.keys(filters).length > 0 && (
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
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => searchTerm.length >= 2 && setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 150)}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            className={`
              pl-10 pr-10
              ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
              ${inputProps.className || ''}
            `}
            {...(({ className, ...rest }) => rest)(inputProps)}
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
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
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
            {!isLoading && !error && nadadoresFiltrados.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-100">
                  {nadadoresFiltrados.length} nadador{nadadoresFiltrados.length !== 1 ? 'es' : ''} encontrado{nadadoresFiltrados.length !== 1 ? 's' : ''}
                </div>
                {nadadoresFiltrados.map((nadador, index) => (
                  <div
                    key={nadador.id}
                    className={`
                      px-3 py-2 cursor-pointer border-b border-gray-50 last:border-0
                      ${selectedIndex === index ? 'bg-green-50' : 'hover:bg-gray-50'}
                      transition-colors
                    `}
                    onClick={() => handleSelect(nadador)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <UserIcon className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {nadador.nombre_completo}
                          </div>
                          <div className="text-xs text-gray-500">
                            {nadador.rama === 'F' ? 'Femenino' : 'Masculino'} • {nadador.edad_actual} años • {nadador.categoria_actual}
                          </div>
                        </div>
                      </div>
                      
                      {selectedIndex === index && (
                        <CheckIcon className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
            
            {/* Empty state */}
            {!isLoading && !error && nadadoresFiltrados.length === 0 && debouncedSearch.length >= 2 && (
              <div className="px-3 py-8 text-center">
                <UserIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-1">
                  No se encontraron nadadores
                </p>
                <p className="text-xs text-gray-400">
                  Intenta con un término diferente o ajusta los filtros
                </p>
              </div>
            )}
            
            {/* Instrucciones de búsqueda */}
            {!isLoading && debouncedSearch.length < 2 && (
              <div className="px-3 py-4 text-center">
                <SearchIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Escribe al menos 2 caracteres para buscar
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
                  {value.nombre_completo}
                </div>
                <div className="text-xs text-green-700">
                  {value.rama === 'F' ? 'Femenino' : 'Masculino'} • {value.edad_actual} años • {value.categoria_actual}
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

export default NadadorSelector;
