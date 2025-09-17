/**
 * PasoPrueba - Paso 3 del stepper de registro de resultados
 * 
 * Permite la selección de prueba (estilo, distancia, curso) y fase de competencia
 * usando filtros dinámicos y selección de fase según las especificaciones del PRD.
 */

"use client";

import React, { useCallback, useEffect, useMemo } from 'react';
import { useStepper } from '@/contexts/stepper-context';
import { PruebaSelectorSimplificado, type PruebaSelection } from '@/components/pruebas';
import { 
  Alert, 
  AlertDescription,
} from '@/components/ui';
import { 
  ActivityIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
  UserIcon,
} from 'lucide-react';

// =====================
// Componente Principal
// =====================

export function PasoPrueba() {
  const { state, dispatch } = useStepper();
  
  // =====================
  // Estado derivado
  // =====================
  
  const pruebaActual = state.paso_prueba.prueba;
  const faseActual = state.paso_prueba.fase;
  const tienePruebaSeleccionada = !!pruebaActual;
  
  // Contexto de pasos anteriores
  const competencia = state.paso_competencia.competencia;
  const nadador = state.paso_nadador.nadador;
  
  // =====================
  // Filtros iniciales basados en competencia
  // =====================
  
  const cursoInicial = useMemo(() => {
    // Si hay competencia seleccionada, usar su curso como filtro inicial
    return competencia?.curso as 'SC' | 'LC' | undefined;
  }, [competencia]);
  
  // =====================
  // Handlers
  // =====================
  
  const handlePruebaSeleccionada = useCallback((selection: PruebaSelection | null) => {
    if (!selection) {
      // Limpiar selección
      dispatch({
        type: 'ACTUALIZAR_PRUEBA',
        data: { 
          prueba: undefined,
          fase: 'Preliminar', // Reset a fase por defecto
        }
      });
      return;
    }
    
    // Actualizar prueba y fase en el estado del stepper
    dispatch({
      type: 'ACTUALIZAR_PRUEBA',
      data: { 
        prueba: selection.prueba,
        fase: selection.fase,
      }
    });
  }, [dispatch]);
  
  // =====================
  // Effects
  // =====================
  
  // Auto-completar paso cuando se selecciona prueba y fase
  useEffect(() => {
    if (pruebaActual && faseActual) {
      dispatch({ type: 'COMPLETAR_PASO', paso: 3 });
    }
  }, [pruebaActual, faseActual, dispatch]);
  
  // =====================
  // Valor actual para PruebaSelector
  // =====================
  
  const valorActual: PruebaSelection | null = useMemo(() => {
    if (pruebaActual && faseActual) {
      return {
        prueba: pruebaActual,
        fase: faseActual,
      };
    }
    return null;
  }, [pruebaActual, faseActual]);
  
  // =====================
  // Render
  // =====================
  
  return (
    <div className="space-y-6">
      {/* Encabezado del paso */}
      <div className="text-center space-y-2">
        {/* Header simplificado - FormSection ya maneja los indicadores visuales */}
        <h2 className="text-xl font-semibold text-gray-900 text-center">
          Seleccionar Prueba y Fase
        </h2>
      </div>
      
      {/* Información contextual de competencia y nadador */}
      {/* Contexto previo ahora solo en sticky panel */}
      
      {/* Selector simplificado de prueba y fase */}
      <div className="max-w-4xl mx-auto">
        <PruebaSelectorSimplificado
          value={valorActual}
          onSelect={handlePruebaSeleccionada}
          placeholder="Buscar prueba por nombre, estilo o distancia..."
          initialCurso={cursoInicial}
          autoFocus={true}
          className="w-full"
        />
      </div>
      
      {/* Estado de selección ahora solo en sticky panel */}
      
      {/* Información de pruebas innecesaria - sticky panel guía el proceso */}
      
      {/* Advertencias ahora solo en sticky panel con "próximos pasos" */}
    </div>
  );
}

export default PasoPrueba;
