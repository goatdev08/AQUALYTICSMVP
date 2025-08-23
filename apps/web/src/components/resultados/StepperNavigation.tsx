/**
 * StepperNavigation - Componente de navegación y progreso del stepper
 * 
 * Proporciona:
 * - Indicador visual de progreso (4 pasos)
 * - Botones de navegación (anterior/siguiente)
 * - Estados visuales (completado, actual, pendiente, error)
 * - Integración con tema "green" y shadcn components
 */

"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useStepper } from '@/contexts/stepper-context';
import { PasoStepper } from '@/types/resultados';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  AlertCircle,
  Trophy,
  Users,
  Target,
  BarChart3 
} from 'lucide-react';

// =====================
// Configuración de pasos
// =====================

interface PasoConfig {
  numero: PasoStepper;
  titulo: string;
  descripcion: string;
  icono: React.ComponentType<{ className?: string }>;
}

const CONFIGURACION_PASOS: PasoConfig[] = [
  {
    numero: 1,
    titulo: 'Competencia',
    descripcion: 'Seleccionar o crear competencia',
    icono: Trophy,
  },
  {
    numero: 2,
    titulo: 'Nadador',
    descripcion: 'Buscar y seleccionar nadador',
    icono: Users,
  },
  {
    numero: 3,
    titulo: 'Prueba',
    descripcion: 'Elegir prueba y fase',
    icono: Target,
  },
  {
    numero: 4,
    titulo: 'Resultados',
    descripcion: 'Capturar segmentos y tiempos',
    icono: BarChart3,
  },
];

// =====================
// Componente indicador de paso
// =====================

interface PasoIndicadorProps {
  config: PasoConfig;
  esActual: boolean;
  estaCompletado: boolean;
  tieneError: boolean;
  onClick: () => void;
  puedeNavegar: boolean;
}

function PasoIndicador({ 
  config, 
  esActual, 
  estaCompletado, 
  tieneError, 
  onClick,
  puedeNavegar 
}: PasoIndicadorProps) {
  const IconoComponent = config.icono;
  
  return (
    <div className="flex flex-col items-center space-y-2">
      {/* Círculo indicador */}
      <button
        onClick={puedeNavegar ? onClick : undefined}
        disabled={!puedeNavegar}
        className={cn(
          // Estilos base
          "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          
          // Estados por defecto
          "border-gray-300 bg-white text-gray-400",
          
          // Estado actual
          esActual && !tieneError && [
            "border-green-500 bg-green-50 text-green-600",
            "focus:ring-green-500",
          ],
          
          // Estado completado
          estaCompletado && !tieneError && [
            "border-green-600 bg-green-600 text-white",
            "focus:ring-green-500",
          ],
          
          // Estado con error
          tieneError && [
            "border-red-500 bg-red-50 text-red-600",
            "focus:ring-red-500",
          ],
          
          // Interactividad
          puedeNavegar && [
            "hover:border-green-400 hover:bg-green-50 hover:text-green-600",
            "cursor-pointer",
          ],
          
          !puedeNavegar && "cursor-not-allowed opacity-60"
        )}
      >
        {tieneError ? (
          <AlertCircle className="w-5 h-5" />
        ) : estaCompletado ? (
          <Check className="w-5 h-5" />
        ) : (
          <IconoComponent className="w-5 h-5" />
        )}
      </button>
      
      {/* Etiquetas */}
      <div className="text-center max-w-[100px]">
        <div className={cn(
          "text-sm font-medium",
          esActual && "text-green-600",
          estaCompletado && !esActual && "text-gray-900",
          tieneError && "text-red-600",
          !esActual && !estaCompletado && !tieneError && "text-gray-500"
        )}>
          {config.titulo}
        </div>
        <div className="text-xs text-gray-500 mt-1 leading-tight">
          {config.descripcion}
        </div>
      </div>
    </div>
  );
}

// =====================
// Componente principal
// =====================

interface StepperNavigationProps {
  className?: string;
  compact?: boolean;
}

export function StepperNavigation({ 
  className,
  compact = false 
}: StepperNavigationProps) {
  const {
    state,
    navegarAPaso,
    siguientePaso,
    pasoAnterior,
    validarPaso,
  } = useStepper();
  
  // Calcular porcentaje de progreso
  const progreso = (Array.from(state.pasos_completados).length / CONFIGURACION_PASOS.length) * 100;
  
  // Validaciones actuales
  const validacionActual = validarPaso(state.paso_actual);
  const tieneErrores = !validacionActual.es_valido;
  
  // Handlers
  const handleSiguiente = () => {
    siguientePaso();
  };
  
  const handleAnterior = () => {
    pasoAnterior();
  };
  
  const handleNavegacionDirecta = (paso: PasoStepper) => {
    // Solo permitir navegación hacia atrás o al paso actual
    if (paso <= state.paso_actual || state.pasos_completados.has(paso - 1)) {
      navegarAPaso(paso);
    }
  };
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Barra de progreso */}
      {!compact && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progreso del registro</span>
            <span>{Math.round(progreso)}% completado</span>
          </div>
          <Progress 
            value={progreso} 
            className="w-full"
          />
        </div>
      )}
      
      {/* Indicadores de pasos */}
      <div className="flex justify-between items-start">
        {CONFIGURACION_PASOS.map((config, index) => {
          const esActual = config.numero === state.paso_actual;
          const estaCompletado = state.pasos_completados.has(config.numero);
          const tieneError = esActual && tieneErrores;
          
          // Permitir navegación hacia atrás o si el paso anterior está completado
          const puedeNavegar = config.numero <= state.paso_actual || 
                               (config.numero > 1 && state.pasos_completados.has(config.numero - 1));
          
          return (
            <React.Fragment key={config.numero}>
              <PasoIndicador
                config={config}
                esActual={esActual}
                estaCompletado={estaCompletado}
                tieneError={tieneError}
                onClick={() => handleNavegacionDirecta(config.numero)}
                puedeNavegar={puedeNavegar}
              />
              
              {/* Línea conectora */}
              {index < CONFIGURACION_PASOS.length - 1 && (
                <div className="flex-1 flex items-center justify-center mt-6">
                  <div className={cn(
                    "h-0.5 w-full transition-colors duration-200",
                    estaCompletado && !compact
                      ? "bg-green-500"
                      : "bg-gray-300"
                  )} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Errores del paso actual */}
      {tieneErrores && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Complete la información requerida:</div>
              <ul className="list-disc list-inside space-y-0.5 text-sm">
                {validacionActual.errores.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Warnings del paso actual */}
      {validacionActual.warnings.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Advertencias:</div>
              <ul className="list-disc list-inside space-y-0.5 text-sm">
                {validacionActual.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Botones de navegación */}
      {!compact && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleAnterior}
            disabled={state.paso_actual === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>
          
          <div className="flex gap-2">
            {state.paso_actual < 4 ? (
              <Button
                onClick={handleSiguiente}
                disabled={tieneErrores}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSiguiente}
                disabled={tieneErrores}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4" />
                Finalizar
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Información de autoguardado */}
      {state.tiene_cambios_sin_guardar && !compact && (
        <div className="text-xs text-gray-500 text-center">
          Guardando cambios automáticamente...
        </div>
      )}
    </div>
  );
}

// =====================
// Componente compacto para uso en formularios
// =====================

interface StepperHeaderProps {
  className?: string;
}

export function StepperHeader({ className }: StepperHeaderProps) {
  return (
    <StepperNavigation 
      className={className}
      compact={true}
    />
  );
}

export { StepperNavigation as default };
