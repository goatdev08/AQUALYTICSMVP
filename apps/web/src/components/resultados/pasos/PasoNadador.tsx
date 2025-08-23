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
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <UserIcon className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          Seleccionar Nadador
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Busca y selecciona el nadador que participó en esta competencia
        </p>
      </div>
      
      {/* Información contextual de la competencia */}
      {competencia && (
        <Alert className="border-blue-200 bg-blue-50">
          <InfoIcon className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Competencia seleccionada:</strong> {competencia.nombre}
            <br />
            <span className="text-sm">
              {competencia.curso} • {competencia.rango_fechas ? 
                `${competencia.rango_fechas}` : 'Sin fechas definidas'
              }
            </span>
          </AlertDescription>
        </Alert>
      )}
      
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
      {tieneNadadorSeleccionado && nadadorActual && (
        <div className="max-w-2xl mx-auto">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircleIcon className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Nadador seleccionado:</strong> {nadadorActual.nombre_completo}
              <br />
              <div className="text-sm mt-1 space-x-3">
                <span>
                  <strong>Rama:</strong> {nadadorActual.rama === 'F' ? 'Femenino' : 'Masculino'}
                </span>
                <span>
                  <strong>Edad:</strong> {nadadorActual.edad_actual} años
                </span>
                <span>
                  <strong>Categoría:</strong> {nadadorActual.categoria_actual}
                </span>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Instrucciones de ayuda */}
      {!tieneNadadorSeleccionado && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              💡 Consejos de búsqueda:
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Escribe cualquier carácter del nombre para buscar</li>
              <li>• Usa los filtros para refinar por rama o categoría</li>
              <li>• Navega con las flechas ↑/↓ y selecciona con Enter</li>
              <li>• La búsqueda incluye nombres y apellidos</li>
            </ul>
          </div>
        </div>
      )}
      
      {/* Advertencia si no hay competencia */}
      {!competencia && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangleIcon className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Atención:</strong> No se ha seleccionado una competencia en el paso anterior.
            Para continuar, regresa al Paso 1 y selecciona una competencia.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default PasoNadador;
