/**
 * PruebaSelectorSimplificado - Versión optimizada con UX simplificada
 * 
 * Mejoras vs versión original:
 * - Solo toggle SC/LC (más relevante)
 * - Búsqueda como método principal
 * - UI más limpia y directa
 * - Menos redundancia de filtros
 */

"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { usePruebas, type PruebaResponse, type TipoCurso } from '@/hooks/usePruebas';
import { type FaseCompetencia } from '@/types/resultados';
import { 
  Button, 
  Input,
  Alert,
  AlertDescription,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { 
  SearchIcon, 
  ActivityIcon, 
  LoaderIcon,
  CheckIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  XIcon,
} from 'lucide-react';
import { mapFigmaVariant } from '@/lib/figma-utils';

// =====================
// Tipos y Props
// =====================

export interface PruebaSelection {
  prueba: PruebaResponse;
  fase: FaseCompetencia;
}

export interface PruebaSelectorSimplificadoProps {
  // Datos y selección
  value?: PruebaSelection | null;
  onSelect: (selection: PruebaSelection | null) => void;
  
  // Configuración
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  
  // Filtro inicial de curso
  initialCurso?: TipoCurso;
  
  // Personalización
  className?: string;
  
  // Estados
  loading?: boolean;
  error?: string;
}

// =====================
// Constantes
// =====================

const FASES_COMPETENCIA: FaseCompetencia[] = ['Preliminar', 'Semifinal', 'Final'];

const FASE_LABELS: Record<FaseCompetencia, string> = {
  'Preliminar': 'Preliminar',
  'Semifinal': 'Semifinal',  
  'Final': 'Final',
};

const CURSO_LABELS: Record<TipoCurso, string> = {
  'SC': 'Piscina 25m (SC)',
  'LC': 'Piscina 50m (LC)',
};

// =====================
// Componente Principal
// =====================

export function PruebaSelectorSimplificado({
  value,
  onSelect,
  placeholder = "Buscar prueba por nombre, estilo o distancia...",
  disabled = false,
  autoFocus = false,
  initialCurso,
  className = "",
  loading: externalLoading = false,
  error: externalError,
}: PruebaSelectorSimplificadoProps) {
  
  // =====================
  // Estado local
  // =====================
  
  const [searchTerm, setSearchTerm] = useState('');
  const [cursoFilter, setCursoFilter] = useState<TipoCurso | undefined>(initialCurso);
  const [selectedPrueba, setSelectedPrueba] = useState<PruebaResponse | null>(
    value?.prueba || null
  );
  const [selectedFase, setSelectedFase] = useState<FaseCompetencia>(
    value?.fase || 'Preliminar'
  );
  
  // =====================
  // Query de pruebas (solo filtro por curso si está activo)
  // =====================
  
  const {
    pruebas,
    isLoading: queryLoading,
    error: queryError,
  } = usePruebas(cursoFilter ? { curso: cursoFilter } : {});
  
  // Estado combinado
  const isLoading = externalLoading || queryLoading;
  const error = externalError || queryError;
  
  // =====================
  // Filtros de búsqueda local
  // =====================
  
  const pruebasFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return pruebas;
    
    const searchLower = searchTerm.toLowerCase();
    return pruebas.filter(prueba =>
      prueba.nombre.toLowerCase().includes(searchLower) ||
      prueba.estilo.toLowerCase().includes(searchLower) ||
      prueba.distancia.toString().includes(searchLower)
    );
  }, [pruebas, searchTerm]);
  
  // =====================
  // Handlers
  // =====================
  
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);
  
  const handleCursoToggle = useCallback(() => {
    setCursoFilter(prev => {
      if (!prev) return 'SC';
      if (prev === 'SC') return 'LC';
      return undefined; // Volver a "Todo"
    });
    setSearchTerm(''); // Limpiar búsqueda al cambiar curso
  }, []);
  
  const handlePruebaSelect = useCallback((prueba: PruebaResponse) => {
    setSelectedPrueba(prueba);
    // Auto-enviar selección si ya hay una fase seleccionada
    if (selectedFase) {
      onSelect({ prueba, fase: selectedFase });
    }
  }, [selectedFase, onSelect]);
  
  const handleFaseSelect = useCallback((fase: FaseCompetencia) => {
    setSelectedFase(fase);
    // Auto-enviar selección si ya hay una prueba seleccionada
    if (selectedPrueba) {
      onSelect({ prueba: selectedPrueba, fase });
    }
  }, [selectedPrueba, onSelect]);
  
  const clearSelection = useCallback(() => {
    setSelectedPrueba(null);
    setSelectedFase('Preliminar');
    setSearchTerm('');
    onSelect(null);
  }, [onSelect]);
  
  // =====================
  // Props de componentes
  // =====================
  
  const inputProps = mapFigmaVariant('Input', 'Droplistborder', {
    className: 'transition-colors',
  });

  const primaryButtonProps = mapFigmaVariant('Button', 'Primary', {});
  
  // =====================
  // Render
  // =====================
  
  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* Header con toggle de curso */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ActivityIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Seleccionar Prueba y Fase
          </span>
        </div>
        
        {/* Toggle SC/LC */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Curso:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCursoToggle}
            className="h-7 px-2 text-xs"
            disabled={disabled}
          >
            {cursoFilter ? (
              <>
                {cursoFilter === 'SC' ? (
                  <ToggleRightIcon className="w-3 h-3 mr-1" />
                ) : (
                  <ToggleLeftIcon className="w-3 h-3 mr-1" />
                )}
                {CURSO_LABELS[cursoFilter]}
              </>
            ) : (
              <>
                <ToggleLeftIcon className="w-3 h-3 mr-1" />
                Todo
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Búsqueda de prueba */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Prueba</CardTitle>
          {cursoFilter && (
            <Badge variant="secondary" className="text-xs w-fit">
              Filtrado por {CURSO_LABELS[cursoFilter]}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Input de búsqueda */}
          <div className="relative">
            <Input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={placeholder}
              disabled={disabled}
              autoFocus={autoFocus}
              className={`
                pl-10
                ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
                ${inputProps.className || ''}
              `}
              {...(({ className, ...rest }) => rest)(inputProps)}
            />
            
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            
            {isLoading && (
              <LoaderIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
            )}
            
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <XIcon className="w-3 h-3" />
              </Button>
            )}
          </div>
          
          {/* Lista de pruebas */}
          <div className="max-h-72 overflow-y-auto border border-gray-200 rounded-md">
            {/* Loading state */}
            {isLoading && pruebasFiltradas.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <LoaderIcon className="w-4 h-4 animate-spin text-gray-400 mr-2" />
                <span className="text-sm text-gray-500">Cargando catálogo de pruebas...</span>
              </div>
            )}
            
            {/* Error state */}
            {error && !isLoading && (
              <div className="p-4">
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
                <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <span>
                    {pruebasFiltradas.length} prueba{pruebasFiltradas.length !== 1 ? 's' : ''} disponible{pruebasFiltradas.length !== 1 ? 's' : ''}
                  </span>
                  {searchTerm && (
                    <Badge variant="outline" className="text-xs">
                      Resultados para "{searchTerm}"
                    </Badge>
                  )}
                </div>
                
                {pruebasFiltradas.map((prueba) => (
                  <div
                    key={prueba.id}
                    className={`
                      px-3 py-3 cursor-pointer border-b border-gray-50 last:border-0
                      ${selectedPrueba?.id === prueba.id ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'}
                      transition-colors
                    `}
                    onClick={() => handlePruebaSelect(prueba)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <ActivityIcon className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {prueba.nombre}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span>{prueba.estilo}</span>
                            <span>•</span>
                            <span>{prueba.distancia}m</span>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs h-4 px-1">
                              {prueba.curso}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {selectedPrueba?.id === prueba.id && (
                        <CheckIcon className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
            
            {/* Empty state */}
            {!isLoading && !error && pruebasFiltradas.length === 0 && (
              <div className="px-3 py-8 text-center">
                <ActivityIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-1">
                  {searchTerm 
                    ? `No se encontraron pruebas para "${searchTerm}"` 
                    : 'No hay pruebas disponibles'
                  }
                </p>
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                    className="text-xs mt-2"
                  >
                    Limpiar búsqueda
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Selección de fase */}
      {selectedPrueba && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Fase de Competencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {FASES_COMPETENCIA.map((fase) => (
                <Button
                  key={fase}
                  variant={selectedFase === fase ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFaseSelect(fase)}
                  disabled={disabled}
                  className="text-sm"
                  {...(selectedFase === fase ? primaryButtonProps : {})}
                >
                  {FASE_LABELS[fase]}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Selección confirmada */}
      {selectedPrueba && selectedFase && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckIcon className="w-4 h-4 text-green-600 mr-2" />
                <div>
                  <div className="text-sm font-medium text-green-900">
                    {selectedPrueba.nombre}
                  </div>
                  <div className="text-xs text-green-700">
                    Fase: {FASE_LABELS[selectedFase]}
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="text-green-700 hover:text-green-900 hover:bg-green-100"
                disabled={disabled}
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
    </div>
  );
}

export default PruebaSelectorSimplificado;
