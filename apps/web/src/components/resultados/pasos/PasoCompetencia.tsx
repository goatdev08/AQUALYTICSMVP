/**
 * PasoCompetencia - Paso 1 del stepper de registro de resultados
 * 
 * Permite al usuario seleccionar una competencia existente o crear una nueva.
 * Integra CompetenciaSelector para búsqueda y CompetenciaForm para creación.
 * 
 * Funcionalidades:
 * - Selección de competencia existente con typeahead
 * - Toggle para crear nueva competencia
 * - Validaciones integradas con el estado del stepper
 * - UI consistente con tema "green" y shadcn components
 */

"use client";

import React, { useState, useCallback } from 'react';
import { useStepper } from '@/contexts/stepper-context';
import { useCompetencias } from '@/hooks/useCompetencias';
import { CompetenciaSelector } from '@/components/competencias/CompetenciaSelector';
import { CompetenciaFormStepper } from './CompetenciaFormStepper';
import { Button, Alert, AlertDescription, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { 
  PlusIcon, 
  SearchIcon, 
  TrophyIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  InfoIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CompetenciaOption } from '@/components/competencias/CompetenciaSelector';
import type { Competencia } from '@/hooks/useCompetencias';

// =====================
// Tipos locales
// =====================

type ModoSeleccion = 'seleccionar' | 'crear';

// =====================
// Componente principal
// =====================

export function PasoCompetencia() {
  const { state, dispatch } = useStepper();
  const { useCompetenciasList } = useCompetencias();
  const { data: competenciasResponse, isLoading: competenciasLoading } = useCompetenciasList();
  
  // Estado local
  const [modo, setModo] = useState<ModoSeleccion>(
    state.paso_competencia.es_nueva_competencia ? 'crear' : 'seleccionar'
  );
  const [competenciaSeleccionada, setCompetenciaSeleccionada] = useState<CompetenciaOption | null>(
    state.paso_competencia.competencia ? {
      id: state.paso_competencia.competencia.id,
      nombre: state.paso_competencia.competencia.nombre,
      curso: state.paso_competencia.competencia.curso,
      rango_fechas: {
        lower: state.paso_competencia.competencia.rango_fechas.lower,
        upper: state.paso_competencia.competencia.rango_fechas.upper,
      },
      sede: state.paso_competencia.competencia.sede,
    } : null
  );

  // =====================
  // Handlers
  // =====================

  const handleModoChange = useCallback((nuevoModo: ModoSeleccion) => {
    setModo(nuevoModo);
    
    // Limpiar estado previo cuando cambia el modo
    dispatch({
      type: 'ACTUALIZAR_COMPETENCIA',
      data: {
        es_nueva_competencia: nuevoModo === 'crear',
        competencia: undefined,
        datos_nueva_competencia: undefined,
      },
    });
    
    setCompetenciaSeleccionada(null);
  }, [dispatch]);

  const handleCompetenciaSeleccionada = useCallback((competencia: CompetenciaOption | null) => {
    setCompetenciaSeleccionada(competencia);
    
    if (competencia) {
      // Convertir CompetenciaOption a Competencia para el estado del stepper
      const competenciaCompleta: Competencia = {
        id: competencia.id,
        equipo_id: 0, // Se llenará desde el context de auth
        nombre: competencia.nombre,
        curso: competencia.curso as 'SC' | 'LC',
        rango_fechas: {
          lower: competencia.rango_fechas.lower,
          upper: competencia.rango_fechas.upper,
          bounds: '[)',
        },
        sede: competencia.sede,
        created_at: '',
        updated_at: '',
        duracion_dias: 0,
        es_proxima: false,
        es_activa: false,
        estado: 'Próxima' as const,
      };
      
      dispatch({
        type: 'ACTUALIZAR_COMPETENCIA',
        data: {
          competencia: competenciaCompleta,
          es_nueva_competencia: false,
          datos_nueva_competencia: undefined,
        },
      });
    } else {
      dispatch({
        type: 'ACTUALIZAR_COMPETENCIA',
        data: {
          competencia: undefined,
          es_nueva_competencia: false,
        },
      });
    }
  }, [dispatch]);

  const handleCompetenciaCreada = useCallback((competenciaCreada: Competencia) => {
    // Actualizar estado del stepper con la nueva competencia
    dispatch({
      type: 'ACTUALIZAR_COMPETENCIA',
      data: {
        competencia: competenciaCreada,
        es_nueva_competencia: true,
        datos_nueva_competencia: {
          nombre: competenciaCreada.nombre,
          curso: competenciaCreada.curso,
          fecha_inicio: competenciaCreada.rango_fechas.lower,
          fecha_fin: competenciaCreada.rango_fechas.upper,
          sede: competenciaCreada.sede,
        },
      },
    });

    // Convertir también para el estado local
    const competenciaOption = {
      id: competenciaCreada.id,
      nombre: competenciaCreada.nombre,
      curso: competenciaCreada.curso,
      rango_fechas: {
        lower: competenciaCreada.rango_fechas.lower,
        upper: competenciaCreada.rango_fechas.upper,
      },
      sede: competenciaCreada.sede,
    };
    setCompetenciaSeleccionada(competenciaOption);

    // Cambiar automáticamente a modo selección para mostrar la confirmación
    setModo('seleccionar');
  }, [dispatch]);

  // =====================
  // Estado derivado
  // =====================

  const competenciaActual = state.paso_competencia.competencia;
  const tieneCompetenciaSeleccionada = !!competenciaActual;
  const competencias = competenciasResponse?.competencias || [];
  const totalCompetencias = competencias.length;

  // DEBUG: Logs removidos después de corrección

  // =====================
  // Render
  // =====================

  return (
    <div className="space-y-6">
      {/* Encabezado del paso */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <TrophyIcon className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-left">
            <h2 className="text-xl font-semibold text-gray-900">
              Paso 1: Seleccionar Competencia
            </h2>
            <p className="text-sm text-gray-600">
              Elija una competencia existente o cree una nueva
            </p>
          </div>
        </div>
      </div>

      {/* Selector de modo */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">¿Qué desea hacer?</CardTitle>
            {totalCompetencias > 0 && (
              <div className="text-sm text-gray-500">
                {totalCompetencias} competencia{totalCompetencias !== 1 ? 's' : ''} disponible{totalCompetencias !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Opción: Seleccionar existente */}
            <button
              onClick={() => handleModoChange('seleccionar')}
              className={cn(
                "p-4 rounded-lg border-2 text-left transition-all duration-200",
                "hover:border-green-300 hover:bg-green-50",
                modo === 'seleccionar'
                  ? "border-green-500 bg-green-50 ring-2 ring-green-500/20"
                  : "border-gray-200 bg-white"
              )}
            >
              <div className="flex items-start gap-3">
                <SearchIcon className={cn(
                  "w-5 h-5 mt-0.5 flex-shrink-0",
                  modo === 'seleccionar' ? "text-green-600" : "text-gray-400"
                )} />
                <div>
                  <h3 className={cn(
                    "font-medium",
                    modo === 'seleccionar' ? "text-green-900" : "text-gray-900"
                  )}>
                    Seleccionar existente
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Busque entre las competencias registradas
                  </p>
                  {modo === 'seleccionar' && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                      <CheckCircleIcon className="w-3 h-3" />
                      Opción seleccionada
                    </div>
                  )}
                </div>
              </div>
            </button>

            {/* Opción: Crear nueva */}
            <button
              onClick={() => handleModoChange('crear')}
              className={cn(
                "p-4 rounded-lg border-2 text-left transition-all duration-200",
                "hover:border-green-300 hover:bg-green-50",
                modo === 'crear'
                  ? "border-green-500 bg-green-50 ring-2 ring-green-500/20"
                  : "border-gray-200 bg-white"
              )}
            >
              <div className="flex items-start gap-3">
                <PlusIcon className={cn(
                  "w-5 h-5 mt-0.5 flex-shrink-0",
                  modo === 'crear' ? "text-green-600" : "text-gray-400"
                )} />
                <div>
                  <h3 className={cn(
                    "font-medium",
                    modo === 'crear' ? "text-green-900" : "text-gray-900"
                  )}>
                    Crear nueva competencia
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Registre una nueva competencia en el sistema
                  </p>
                  {modo === 'crear' && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                      <CheckCircleIcon className="w-3 h-3" />
                      Opción seleccionada
                    </div>
                  )}
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Contenido según el modo seleccionado */}
      <Card>
        <CardContent className="p-6">
          {modo === 'seleccionar' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <SearchIcon className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-gray-900">Buscar competencia existente</h3>
              </div>
              
              {/* Selector de competencia */}
              <CompetenciaSelector
                value={competenciaSeleccionada}
                onValueChange={handleCompetenciaSeleccionada}
                placeholder="Escriba para buscar una competencia..."
                className="w-full"
                includeFinalizadas={true}
                disabled={competenciasLoading}
              />

              {/* Información de la competencia seleccionada */}
              {tieneCompetenciaSeleccionada && competenciaActual && (
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-medium text-green-900">
                        Competencia seleccionada: {competenciaActual.nombre}
                      </div>
                      <div className="text-sm space-y-1">
                        <div>• Curso: {competenciaActual.curso === 'SC' ? 'Piscina corta (25m)' : 'Piscina larga (50m)'}</div>
                        <div>• Fechas: {competenciaActual.rango_fechas.lower} - {competenciaActual.rango_fechas.upper}</div>
                        {competenciaActual.sede && <div>• Sede: {competenciaActual.sede}</div>}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Estado vacío cuando no hay competencias */}
              {!competenciasLoading && totalCompetencias === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <TrophyIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">
                    No hay competencias registradas en su equipo.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleModoChange('crear')}
                    className="mt-3"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Crear primera competencia
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PlusIcon className="w-5 h-5 text-green-600" />
                  <h3 className="font-medium text-gray-900">Crear nueva competencia</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleModoChange('seleccionar')}
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Volver a buscar
                </Button>
              </div>

              {/* Formulario de creación */}
              <div className="space-y-4">
                <p className="text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <strong>✨ Flujo integrado:</strong> La competencia se seleccionará automáticamente después de crearla.
                </p>
                
                <CompetenciaFormStepper 
                  onSuccess={handleCompetenciaCreada}
                  onCancel={() => handleModoChange('seleccionar')}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información contextual */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <InfoIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h4 className="font-medium text-blue-900">Información importante</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Todas las competencias se asocian automáticamente a su equipo</li>
              <li>• Puede cambiar entre las opciones en cualquier momento</li>
              <li>• El progreso se guarda automáticamente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PasoCompetencia;
