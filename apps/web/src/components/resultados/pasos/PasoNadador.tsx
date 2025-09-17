/**
 * PasoNadador - Paso 2 del stepper de registro de resultados
 * 
 * Permite la búsqueda y selección de nadador usando búsqueda typeahead
 * con filtros por rama y categoría según las especificaciones del PRD.
 */

"use client";

import React, { useCallback, useEffect } from 'react';
import { useStepper } from '@/contexts/stepper-context';
import { NadadorSelector, type NadadorOption } from '@/components/nadadores/NadadorSelector';
import { 
  Alert, 
  AlertDescription,
} from '@/components/ui';
import { 
  UserIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
} from 'lucide-react';

// =====================
// Componente Principal
// =====================

export function PasoNadador() {
  const { state, dispatch } = useStepper();
  
  // =====================
  // Estado derivado
  // =====================
  
  const nadadorActual = state.paso_nadador.nadador;
  const tieneNadadorSeleccionado = !!nadadorActual;
  const competencia = state.paso_competencia.competencia;
  
  // =====================
  // Handlers
  // =====================
  
  const handleNadadorSeleccionado = useCallback((nadador: NadadorOption | null) => {
    // Convertir NadadorOption a Nadador para el estado del stepper
    const nadadorParaEstado = nadador ? {
      id: nadador.id,
      equipo_id: 0, // Se infiere del contexto del usuario
      nombre_completo: nadador.nombre_completo,
      fecha_nacimiento: '', // No necesario para el stepper
      rama: nadador.rama,
      peso: undefined,
      edad_actual: nadador.edad_actual,
      categoria_actual: nadador.categoria_actual,
    } : undefined;
    
    dispatch({
      type: 'ACTUALIZAR_NADADOR',
      data: { nadador: nadadorParaEstado }
    });
  }, [dispatch]);
  
  // =====================
  // Effects
  // =====================
  
  // Auto-completar paso cuando se selecciona un nadador
  useEffect(() => {
    if (nadadorActual) {
      dispatch({ type: 'COMPLETAR_PASO', paso: 2 });
    }
  }, [nadadorActual, dispatch]);
  
  // =====================
  // Render
  // =====================
  
  return (
    <div className="space-y-6">
      {/* Encabezado del paso */}
      <div className="text-center space-y-2">
        {/* Header simplificado - FormSection ya maneja los indicadores visuales */}
        <h2 className="text-xl font-semibold text-gray-900 text-center">
          Seleccionar Nadador
        </h2>
      </div>
      
      {/* Información contextual ahora solo en sticky panel */}
      
      {/* Selector de nadador */}
      <div className="max-w-2xl mx-auto">
        <NadadorSelector
          value={nadadorActual ? {
            id: nadadorActual.id,
            nombre_completo: nadadorActual.nombre_completo,
            rama: nadadorActual.rama,
            edad_actual: nadadorActual.edad_actual,
            categoria_actual: nadadorActual.categoria_actual,
          } : null}
          onSelect={handleNadadorSeleccionado}
          placeholder="Buscar nadador por nombre..."
          showFilters={true}
          autoFocus={true}
          maxResults={15}
          className="w-full"
        />
      </div>
      
      {/* Estado de selección */}
      {/* Información del nadador ahora solo en sticky panel */}
      
      {/* Instrucciones innecesarias - sticky panel guía el proceso */}
      
      {/* Advertencias innecesarias - sticky panel muestra estado */}
    </div>
  );
}

export default PasoNadador;
