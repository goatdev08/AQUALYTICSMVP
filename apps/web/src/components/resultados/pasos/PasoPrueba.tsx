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
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <ActivityIcon className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          Seleccionar Prueba y Fase
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Elige la prueba específica y la fase de competencia para este resultado
        </p>
      </div>
      
      {/* Información contextual de competencia y nadador */}
      <div className="space-y-3">
        {competencia && (
          <Alert className="border-blue-200 bg-blue-50">
            <InfoIcon className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Competencia:</strong> {competencia.nombre}
              <br />
              <span className="text-sm">
                Curso: {competencia.curso} • {competencia.rango_fechas ? 
                  `${competencia.rango_fechas}` : 'Sin fechas definidas'
                }
              </span>
            </AlertDescription>
          </Alert>
        )}
        
        {nadador && (
          <Alert className="border-green-200 bg-green-50">
            <UserIcon className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Nadador:</strong> {nadador.nombre_completo}
              <br />
              <span className="text-sm">
                {nadador.rama === 'F' ? 'Femenino' : 'Masculino'} • {nadador.edad_actual} años • Categoría {nadador.categoria_actual}
              </span>
            </AlertDescription>
          </Alert>
        )}
      </div>
      
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
      
      {/* Estado de selección completada */}
      {tienePruebaSeleccionada && pruebaActual && faseActual && (
        <div className="max-w-4xl mx-auto">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircleIcon className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-2">
                <div>
                  <strong>Prueba confirmada:</strong> {pruebaActual.nombre}
                </div>
                <div>
                  <strong>Fase:</strong> {faseActual}
                </div>
                <div className="text-sm pt-1 border-t border-green-200">
                  <strong>Detalles:</strong> {pruebaActual.estilo} • {pruebaActual.distancia}m • {pruebaActual.curso}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Instrucciones de ayuda */}
      {!tienePruebaSeleccionada && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              💡 Información de pruebas:
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Pruebas disponibles según el catálogo oficial de natación</li>
              {competencia?.curso && (
                <li>• Filtradas automáticamente para curso {competencia.curso}</li>
              )}
              <li>• Usa filtros para refinar por estilo, distancia o curso</li>
              <li>• Selecciona la fase de competencia correspondiente</li>
              <li>• La búsqueda incluye nombre, estilo y distancia</li>
            </ul>
          </div>
        </div>
      )}
      
      {/* Advertencias por contexto faltante */}
      {!competencia && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangleIcon className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Atención:</strong> No se ha seleccionado una competencia en el paso 1.
            Para continuar, regresa al Paso 1 y selecciona una competencia.
          </AlertDescription>
        </Alert>
      )}
      
      {!nadador && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangleIcon className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Atención:</strong> No se ha seleccionado un nadador en el paso 2.
            Para continuar, regresa al Paso 2 y selecciona un nadador.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default PasoPrueba;
