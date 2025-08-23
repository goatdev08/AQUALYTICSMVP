/**
 * StepperContainer - Componente contenedor principal del stepper de resultados
 * 
 * Componente que:
 * - Envuelve todo el flujo del stepper en el StepperProvider
 * - Renderiza la navegación y el contenido del paso actual
 * - Maneja transiciones entre pasos
 * - Proporciona layout responsive y consistente
 */

"use client";

import React, { Suspense } from 'react';
import { cn } from '@/lib/utils';
import { StepperProvider } from '@/contexts/stepper-context';
import { StepperNavigation } from './StepperNavigation';
import { useStepper } from '@/contexts/stepper-context';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Importaciones lazy de los pasos (se crearán en las siguientes subtareas)
const PasoCompetencia = React.lazy(() => import('./pasos/PasoCompetencia'));
const PasoNadador = React.lazy(() => import('./pasos/PasoNadador'));
const PasoPrueba = React.lazy(() => import('./pasos/PasoPrueba'));
const PasoSegmentos = React.lazy(() => import('./pasos/PasoSegmentos'));

// =====================
// Componente de loading
// =====================

function StepperLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center gap-3 text-gray-600">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Cargando paso...</span>
      </div>
    </div>
  );
}

// =====================
// Componente de contenido del paso
// =====================

function StepperContent() {
  const { state } = useStepper();
  
  // Renderizar el componente del paso actual
  const renderPasoActual = () => {
    switch (state.paso_actual) {
      case 1:
        return (
          <Suspense fallback={<StepperLoader />}>
            <PasoCompetencia />
          </Suspense>
        );
      
      case 2:
        return (
          <Suspense fallback={<StepperLoader />}>
            <PasoNadador />
          </Suspense>
        );
      
      case 3:
        return (
          <Suspense fallback={<StepperLoader />}>
            <PasoPrueba />
          </Suspense>
        );
      
      case 4:
        return (
          <Suspense fallback={<StepperLoader />}>
            <PasoSegmentos />
          </Suspense>
        );
      
      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">Paso no válido</p>
          </div>
        );
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Navegación del stepper */}
      <Card>
        <CardHeader className="pb-4">
          <StepperNavigation />
        </CardHeader>
      </Card>
      
      {/* Contenido del paso actual */}
      <Card>
        <CardContent className="p-6">
          <div className="min-h-[400px]">
            {renderPasoActual()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =====================
// Componente principal
// =====================

interface StepperContainerProps {
  className?: string;
  autoguardado?: boolean;
  onCompletado?: (resultadoId: number) => void;
  onCancelado?: () => void;
}

export function StepperContainer({ 
  className,
  autoguardado = true,
  onCompletado,
  onCancelado 
}: StepperContainerProps) {
  return (
    <div className={cn("max-w-4xl mx-auto p-4", className)}>
      <StepperProvider autoguardado={autoguardado}>
        <div className="space-y-6">
          {/* Encabezado */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Registrar Nuevo Resultado
            </h1>
            <p className="text-gray-600">
              Complete los 4 pasos para capturar los resultados de natación con precisión
            </p>
          </div>
          
          {/* Contenido principal */}
          <StepperContent />
          
          {/* Información adicional */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <div className="space-y-1">
                <h3 className="font-medium text-blue-900">Información importante</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Los cambios se guardan automáticamente cada 5 segundos</li>
                  <li>• Use los atajos de teclado en el paso de segmentos para mayor eficiencia</li>
                  <li>• La previsualización detectará automáticamente desviaciones &gt; 0.40s</li>
                  <li>• Todos los campos obligatorios deben completarse para avanzar</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </StepperProvider>
    </div>
  );
}

// =====================
// HOC para usar con páginas Next.js
// =====================

interface RegistrarResultadosPageProps {
  className?: string;
  title?: string;
}

export function RegistrarResultadosPage({ 
  className,
  title = "Registrar Resultados" 
}: RegistrarResultadosPageProps) {
  return (
    <div className={cn("min-h-screen bg-gray-50 py-8", className)}>
      <div className="container mx-auto">
        {/* Breadcrumb opcional */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li>
              <a href="/dashboard" className="hover:text-green-600">
                Dashboard
              </a>
            </li>
            <li>/</li>
            <li className="text-gray-900 font-medium">
              {title}
            </li>
          </ol>
        </nav>
        
        <StepperContainer />
      </div>
    </div>
  );
}

// =====================
// Error Boundary para el stepper
// =====================

interface StepperErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class StepperErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  StepperErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): StepperErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('StepperContainer error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <Card className="max-w-2xl mx-auto m-8">
          <CardContent className="p-6 text-center space-y-4">
            <div className="text-red-600">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900">
              Error en el registro de resultados
            </h2>
            
            <p className="text-gray-600">
              Ha ocurrido un error inesperado. Por favor, recargue la página o contacte al administrador.
            </p>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Recargar página
              </button>
              
              <button
                onClick={() => this.setState({ hasError: false })}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reintentar
              </button>
            </div>
            
            {/* Mostrar detalles del error en desarrollo */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-4 bg-gray-100 rounded text-left text-sm">
                <summary className="cursor-pointer font-medium">
                  Detalles del error (dev)
                </summary>
                <pre className="mt-2 whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }
    
    return this.props.children;
  }
}

export { StepperContainer as default };
