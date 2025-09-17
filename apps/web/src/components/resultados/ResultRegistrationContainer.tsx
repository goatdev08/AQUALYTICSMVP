/**
 * ResultRegistrationContainer - Vista unificada para registro de resultados
 * 
 * Implementa la Fase 3 del PRDv2: Vista única sin stepper visible que orquesta
 * todos los pasos (PasoCompetencia, PasoNadador, PasoPrueba, PasoSegmentos) 
 * en una sola pantalla, activando subsecciones según selección progresiva.
 * 
 * Características:
 * - Vista única sin navegación de pasos visible
 * - Subsecciones se activan progresivamente
 * - Autogeneración de segmentos al seleccionar prueba + curso
 * - TimeInput con máscara mm:ss.cc integrado
 * - Estado persistente y autoguardado
 */

"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  TrophyIcon,
  UserIcon,
  FlagIcon,
  WavesIcon as SwimIcon,
  InfoIcon,
  SaveIcon,
  AlertTriangleIcon,
  Timer as TimerIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Context para comunicación entre pasos
import { StepperProvider, useStepper } from '@/contexts/stepper-context';

// Componentes de pasos existentes (los reutilizamos)
import { PasoCompetencia } from './pasos/PasoCompetencia';
import { PasoNadador } from './pasos/PasoNadador'; 
import { PasoPrueba } from './pasos/PasoPrueba';
import { PasoSegmentos } from './pasos/PasoSegmentos';

// Tipos
import type { Competencia } from '@/hooks/useCompetencias';
import type { Nadador } from '@/hooks/useNadadores';
import type { Prueba } from '@/hooks/usePruebas';

// =====================
// Tipos simplificados para formulario dinámico
// =====================

// =====================
// Configuración de secciones
// =====================

const SECCIONES_CONFIG = [
  {
    key: 'competencia' as const,
    title: 'Competencia',
    description: 'Seleccione o cree una competencia',
    icon: TrophyIcon,
    color: 'text-blue-600'
  },
  {
    key: 'nadador' as const,
    title: 'Nadador',
    description: 'Seleccione el nadador',
    icon: UserIcon,
    color: 'text-primary'
  },
  {
    key: 'prueba' as const,
    title: 'Prueba',
    description: 'Seleccione la prueba y curso',
    icon: FlagIcon,
    color: 'text-purple-600'
  },
  {
    key: 'segmentos' as const,
    title: 'Tiempos y Segmentos',
    description: 'Registre tiempos de segmentos',
    icon: SwimIcon,
    color: 'text-orange-600'
  }
] as const;

// =====================
// Componente de indicador de progreso
// =====================

interface ProgressIndicatorProps {
  estado: UnifiedState;
}

function ProgressIndicator({ estado }: ProgressIndicatorProps) {
  const completedCount = Object.values(estado).filter(s => s.isCompleted).length;
  const totalCount = Object.keys(estado).length;
  const progress = (completedCount / totalCount) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Progreso del registro</span>
        <span className="font-medium">{completedCount}/{totalCount} completado</span>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      <div className="flex gap-2 flex-wrap">
        {SECCIONES_CONFIG.map((config) => {
          const seccion = estado[config.key];
          const IconComponent = config.icon;
          
          return (
            <Badge 
              key={config.key}
              variant={seccion.isCompleted ? "default" : seccion.isActive ? "secondary" : "outline"}
              className={cn(
                "flex items-center gap-1 text-xs",
                seccion.isCompleted && "bg-green-100 text-green-800 border-green-200"
              )}
            >
              <IconComponent className="w-3 h-3" />
              {config.title}
              {seccion.isCompleted && <CheckCircleIcon className="w-3 h-3" />}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

// =====================
// Componente de sección
// =====================

interface SeccionProps {
  config: typeof SECCIONES_CONFIG[number];
  estado: SeccionState;
  children: React.ReactNode;
  onActivate?: () => void;
}

function Seccion({ config, estado, children, onActivate }: SeccionProps) {
  const IconComponent = config.icon;
  
  return (
    <Card className={cn(
      "transition-all duration-200",
      estado.isActive && "ring-2 ring-green-500 ring-opacity-50",
      estado.isCompleted && "border-green-300 bg-primary/10/50",
      !estado.canActivate && "opacity-50"
    )}>
      <CardHeader 
        className={cn(
          "pb-3 cursor-pointer transition-colors",
          estado.canActivate && "hover:bg-gray-50",
          !estado.canActivate && "cursor-not-allowed"
        )}
        onClick={() => estado.canActivate && onActivate?.()}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            estado.isCompleted ? "bg-green-100" : "bg-gray-100"
          )}>
            <IconComponent className={cn(
              "w-5 h-5",
              estado.isCompleted ? "text-primary" : config.color
            )} />
          </div>
          
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {config.title}
              {estado.isCompleted && (
                <CheckCircleIcon className="w-5 h-5 text-primary" />
              )}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">{config.description}</p>
          </div>
          
          {estado.hasError && (
            <AlertTriangleIcon className="w-5 h-5 text-red-500" />
          )}
        </div>
      </CardHeader>
      
      {estado.isActive && (
        <CardContent className="pt-0">
          <div className="border-t pt-4">
            {children}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// =====================
// Nuevos componentes para formulario dinámico
// =====================

// FormSection - Envuelve cada sección del formulario dinámico
interface FormSectionProps {
  title: string;
  icon: React.ReactNode;
  isCompleted: boolean;
  isEnabled: boolean;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  icon,
  isCompleted,
  isEnabled,
  children
}) => {
  const [isExpanded, setIsExpanded] = useState(isEnabled);

  useEffect(() => {
    if (isEnabled && !isExpanded) {
      setIsExpanded(true);
    }
  }, [isEnabled]);

  return (
    <Card className={cn(
      "transition-all duration-300 border-2",
      isCompleted && "border-green-200 bg-primary/10/30",
      !isEnabled && "opacity-60 bg-gray-50",
      isEnabled && !isCompleted && "border-blue-200 bg-blue-50/20"
    )}>
      <CardHeader 
        className="pb-2 py-3 cursor-pointer hover:bg-slate-50 transition-colors rounded-t-lg"
        onClick={() => isEnabled && setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-1.5 rounded-md",
              isCompleted && "bg-green-100 text-green-700",
              isEnabled && !isCompleted && "bg-blue-100 text-blue-700",
              !isEnabled && "bg-gray-100 text-gray-400"
            )}>
              {icon}
            </div>
            <span className={cn(
              "font-semibold text-base",
              isCompleted && "text-green-800",
              isEnabled && !isCompleted && "text-blue-800",
              !isEnabled && "text-muted-foreground"
            )}>
              {title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isCompleted && (
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-0.5">
                <CheckCircleIcon className="w-3 h-3 mr-1" />
                Completado
              </Badge>
            )}
            {!isEnabled && (
              <Badge variant="outline" className="text-muted-foreground text-xs px-2 py-0.5">
                Pendiente
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && isEnabled && (
        <CardContent className="pt-0 pb-3">
          {children}
        </CardContent>
      )}
    </Card>
  );
};

// DynamicSummaryPanel - Panel lateral con resumen dinámico completo
interface DynamicSummaryPanelProps {
  stepperState: any;
  canSubmit: boolean;
}

const DynamicSummaryPanel: React.FC<DynamicSummaryPanelProps> = ({
  stepperState,
  canSubmit
}) => {
  const { competencia } = stepperState.paso_competencia;
  const { nadador } = stepperState.paso_nadador;
  const { prueba, fase } = stepperState.paso_prueba;
  const { segmentos, tiempo_global, tiempo_15m } = stepperState.paso_segmentos;

  return (
    <div className="space-y-3 sticky top-4">
      
      {/* Resumen del progreso */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-blue-800 text-lg">
            <InfoIcon className="w-5 h-5" />
            Resumen Completo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          
          {/* Competencia */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrophyIcon className="w-4 h-4 text-gray-600" />
              <span className="font-semibold text-sm text-gray-800">Competencia</span>
            </div>
            {competencia ? (
              <div className="ml-6 p-2 bg-primary/10 border border-green-200 rounded-md">
                <div className="font-medium text-green-800 text-sm">{competencia.nombre}</div>
                <div className="text-xs text-green-700 mt-0.5 space-y-0.5">
                  <div>📏 {competencia.curso === 'SC' ? 'Piscina corta (25m)' : 'Piscina larga (50m)'}</div>
                  <div>📅 {competencia.rango_fechas?.lower} - {competencia.rango_fechas?.upper}</div>
                  {competencia.sede && <div>📍 {competencia.sede}</div>}
                </div>
              </div>
            ) : (
              <div className="ml-6 p-2 bg-gray-100 border border-gray-200 rounded-md text-xs text-gray-600">
                Seleccione una competencia
              </div>
            )}
          </div>

          {/* Nadador */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-gray-600" />
              <span className="font-semibold text-sm text-gray-800">Nadador</span>
            </div>
            {nadador ? (
              <div className="ml-6 p-2 bg-primary/10 border border-green-200 rounded-md">
                <div className="font-medium text-green-800 text-sm">{nadador.nombre_completo}</div>
                <div className="text-xs text-green-700 mt-0.5 space-y-0.5">
                  <div>👤 {nadador.rama === 'F' ? 'Femenino' : 'Masculino'}</div>
                  <div>🎂 {nadador.edad_actual} años</div>
                  <div>🏷️ Categoría {nadador.categoria_actual}</div>
                </div>
              </div>
            ) : (
              <div className="ml-6 p-2 bg-gray-100 border border-gray-200 rounded-md text-xs text-gray-600">
                {competencia ? 'Seleccione un nadador' : 'Primero seleccione competencia'}
              </div>
            )}
          </div>

          {/* Prueba */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <SwimIcon className="w-4 h-4 text-gray-600" />
              <span className="font-semibold text-sm text-gray-800">Prueba</span>
            </div>
            {prueba ? (
              <div className="ml-6 p-2 bg-primary/10 border border-green-200 rounded-md">
                <div className="font-medium text-green-800 text-sm">
                  {prueba.distancia}m {prueba.estilo}
                </div>
                <div className="text-xs text-green-700 mt-0.5 space-y-0.5">
                  <div>📏 {prueba.curso === 'SC' ? 'Piscina corta' : 'Piscina larga'}</div>
                  {fase && <div>🎯 Fase: {fase}</div>}
                </div>
              </div>
            ) : (
              <div className="ml-6 p-2 bg-gray-100 border border-gray-200 rounded-md text-xs text-gray-600">
                {nadador ? 'Seleccione una prueba' : 'Primero seleccione nadador'}
              </div>
            )}
          </div>

          {/* Tiempos */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TimerIcon className="w-4 h-4 text-gray-600" />
              <span className="font-semibold text-sm text-gray-800">Tiempos</span>
            </div>
            {segmentos?.length > 0 ? (
              <div className="ml-6 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-xs text-blue-800 space-y-0.5">
                  <div>⏱️ {segmentos.length} segmentos</div>
                  {tiempo_global && <div>🏁 Global: {tiempo_global}</div>}
                  {tiempo_15m && <div>⚡ 15m: {tiempo_15m}</div>}
                </div>
              </div>
            ) : (
              <div className="ml-6 p-2 bg-gray-100 border border-gray-200 rounded-md text-xs text-gray-600">
                {prueba ? 'Complete los tiempos' : 'Primero seleccione prueba'}
              </div>
            )}
          </div>
          
        </CardContent>
      </Card>

      {/* Estado y acciones */}
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          
          {/* Estado de guardado */}
          <div className="flex items-center gap-2 mb-4 text-sm">
            <div className="w-2 h-2 rounded-full bg-primary/100"></div>
            <span className="text-gray-600">Guardado automático activo</span>
          </div>

          {/* Botón de envío */}
          <Button 
            className="w-full"
            size="lg"
            disabled={!canSubmit}
          >
            {canSubmit ? (
              <>
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Registrar Resultado
              </>
            ) : (
              <>
                <ClockIcon className="w-4 h-4 mr-2" />
                Complete el formulario
              </>
            )}
          </Button>

          {/* Ayuda rápida */}
          {!canSubmit && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-xs text-amber-800">
                <div className="font-medium mb-1">Próximos pasos:</div>
                {!competencia && <div>• Seleccione una competencia</div>}
                {competencia && !nadador && <div>• Seleccione un nadador</div>}
                {nadador && !prueba && <div>• Seleccione una prueba</div>}
                {prueba && <div>• Complete los tiempos</div>}
              </div>
            </div>
          )}
          
        </CardContent>
      </Card>
      
    </div>
  );
};

// =====================
// Componente principal del contenedor unificado
// =====================

function UnifiedContainerContent() {
  const { state: stepperState, dispatch } = useStepper();

  // Calcular si podemos enviar el formulario
  const canSubmit = useMemo(() => {
    const hasCompetencia = !!stepperState.paso_competencia.competencia?.id;
    const hasNadador = !!stepperState.paso_nadador.nadador?.id;
    const hasPrueba = !!stepperState.paso_prueba.prueba?.id;
    const hasSegmentos = !!stepperState.paso_segmentos.segmentos?.length;
    
    return hasCompetencia && hasNadador && hasPrueba && hasSegmentos;
  }, [stepperState]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 to-accent/20 p-3">
      <div className="max-w-7xl mx-auto">
        
        {/* Encabezado ultra-compacto */}
        <div className="mb-4 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            Registrar Nuevo Resultado
          </h1>
          <div className="flex items-center justify-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/100"></div>
              <span>Auto-guardado</span>
            </div>
            <div className="flex items-center gap-1">
              <ClockIcon className="w-3 h-3" />
              <span>Segmentos automáticos</span>
            </div>
          </div>
        </div>

        {/* Layout principal: Formulario + Resumen */}
        <div className="grid lg:grid-cols-3 gap-4">
          
          {/* Columna principal: Formulario dinámico */}
          <div className="lg:col-span-2 space-y-2">
            
            {/* Sección 1: Competencia */}
            <FormSection
              title="1. Competencia"
              icon={<TrophyIcon className="w-4 h-4" />}
              isCompleted={!!stepperState.paso_competencia.competencia?.id}
              isEnabled={true}
            >
              <PasoCompetencia />
            </FormSection>

            {/* Sección 2: Nadador */}
            <FormSection
              title="2. Nadador"
              icon={<UserIcon className="w-4 h-4" />}
              isCompleted={!!stepperState.paso_nadador.nadador?.id}
              isEnabled={!!stepperState.paso_competencia.competencia?.id}
            >
              <PasoNadador />
            </FormSection>

            {/* Sección 3: Prueba */}
            <FormSection
              title="3. Prueba"
              icon={<SwimIcon className="w-4 h-4" />}
              isCompleted={!!stepperState.paso_prueba.prueba?.id}
              isEnabled={!!stepperState.paso_nadador.nadador?.id}
            >
              <PasoPrueba />
            </FormSection>

            {/* Sección 4: Tiempos */}
            <FormSection
              title="4. Tiempos y Segmentos"
              icon={<TimerIcon className="w-4 h-4" />}
              isCompleted={false}
              isEnabled={!!stepperState.paso_prueba.prueba?.id}
            >
              <PasoSegmentos />
            </FormSection>

          </div>

          {/* Panel lateral: Resumen dinámico */}
          <div className="lg:col-span-1">
            <DynamicSummaryPanel 
              stepperState={stepperState}
              canSubmit={canSubmit}
            />
          </div>
          
        </div>
      </div>
    </div>
  );
}

// =====================
// Componente principal con Provider
// =====================

interface ResultRegistrationContainerProps {
  onCompleted?: (resultadoId: number) => void;
  onCancelled?: () => void;
  className?: string;
}

export function ResultRegistrationContainer({ 
  onCompleted,
  onCancelled,
  className 
}: ResultRegistrationContainerProps) {
  return (
    <div className={cn("min-h-screen bg-gray-50 py-6", className)}>
      <StepperProvider autoguardado={true}>
        <UnifiedContainerContent />
      </StepperProvider>
    </div>
  );
}

export { ResultRegistrationContainer as default };
