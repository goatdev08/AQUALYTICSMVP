"use client";

/**
 * Componente ProximasCompetencias
 * 
 * Muestra un widget de próximas competencias para el dashboard
 * Integrado con useCompetencias hook y diseño shadcn
 */

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  CalendarIcon, 
  MapPinIcon, 
  ChevronRightIcon,
  LoaderIcon,
  TrophyIcon,
  PlusIcon
} from 'lucide-react';
import { useCompetencias } from '@/hooks/useCompetencias';
import { Button, Alert, AlertDescription } from '@/components/ui';
import { EntrenadorOnly } from '@/components/auth';
import { mapFigmaVariant } from '@/lib/figma-utils';

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Formatea fecha para mostrar al usuario
 */
function formatFecha(fechaISO: string): string {
  try {
    const fecha = new Date(fechaISO);
    return format(fecha, 'dd MMM yyyy', { locale: es });
  } catch {
    return fechaISO;
  }
}

/**
 * Obtiene días restantes hasta una fecha
 */
function getDiasRestantes(fechaISO: string): number {
  try {
    const fecha = new Date(fechaISO);
    const hoy = new Date();
    const diffTime = fecha.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch {
    return 0;
  }
}

/**
 * Obtiene color de badge según días restantes
 */
function getDiasColor(dias: number): { bg: string; text: string; icon: string } {
  if (dias < 0) {
    return { bg: 'bg-red-100', text: 'text-red-800', icon: '⚠️' };
  } else if (dias === 0) {
    return { bg: 'bg-green-100', text: 'text-green-800', icon: '🏆' };
  } else if (dias <= 7) {
    return { bg: 'bg-orange-100', text: 'text-orange-800', icon: '⏰' };
  } else if (dias <= 30) {
    return { bg: 'bg-blue-100', text: 'text-blue-800', icon: '📅' };
  } else {
    return { bg: 'bg-gray-100', text: 'text-gray-800', icon: '📆' };
  }
}

// ============================================================================
// COMPONENTES
// ============================================================================

function CompetenciaItem({ competencia }: { competencia: any }) {
  const diasRestantes = getDiasRestantes(competencia.rango_fechas.lower);
  const diasColor = getDiasColor(diasRestantes);
  
  const diasTexto = diasRestantes < 0 
    ? 'Finalizada' 
    : diasRestantes === 0 
      ? 'Hoy' 
      : `${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}`;

  return (
    <Link href={`/competencias/${competencia.id}`}>
      <div className="group p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200 cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-green-700">
              {competencia.nombre}
            </h4>
            
            <div className="flex items-center mt-1 text-xs text-gray-500">
              <CalendarIcon className="h-3 w-3 mr-1" />
              <span>{formatFecha(competencia.rango_fechas.lower)}</span>
            </div>
            
            {competencia.sede && (
              <div className="flex items-center mt-1 text-xs text-gray-500">
                <MapPinIcon className="h-3 w-3 mr-1" />
                <span className="truncate">{competencia.sede}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${diasColor.bg} ${diasColor.text}`}>
                {diasColor.icon} {diasTexto}
              </span>
              
              <span className="text-xs text-gray-400 font-medium">
                {competencia.curso === 'SC' ? '25m' : '50m'}
              </span>
            </div>
          </div>
          
          <ChevronRightIcon className="h-4 w-4 text-gray-400 group-hover:text-green-500 transition-colors" />
        </div>
      </div>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            <div className="h-3 bg-gray-100 rounded w-2/3"></div>
            <div className="flex justify-between items-center">
              <div className="h-5 bg-gray-200 rounded w-16"></div>
              <div className="h-3 bg-gray-100 rounded w-8"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

interface ProximasCompetenciasProps {
  limit?: number;
  showHeader?: boolean;
  compact?: boolean;
}

export function ProximasCompetencias({ 
  limit = 5, 
  showHeader = true, 
  compact = false 
}: ProximasCompetenciasProps) {
  const { useProximasCompetencias } = useCompetencias();
  const { data: competencias, isLoading, error } = useProximasCompetencias(limit);
  
  // Props Figma
  const primaryButtonProps = mapFigmaVariant('Button', 'buttonsolid', {});
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${compact ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <TrophyIcon className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Próximas Competencias</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/competencias">
              <Button variant="outline" size="sm" className="text-xs">
                Ver todas
              </Button>
            </Link>
            
            <EntrenadorOnly fallback={null}>
              <Link href="/competencias/nueva">
                <Button size="sm" className="text-xs" {...primaryButtonProps}>
                  <PlusIcon className="h-3 w-3 mr-1" />
                  Nueva
                </Button>
              </Link>
            </EntrenadorOnly>
          </div>
        </div>
      )}

      {/* Contenido */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Error al cargar competencias: {
              error instanceof Error ? error.message : 'Error desconocido'
            }
          </AlertDescription>
        </Alert>
      )}

      {isLoading && <LoadingSkeleton />}

      {competencias && (
        <>
          {competencias.length > 0 ? (
            <div className="space-y-3">
              {competencias.map((competencia) => (
                <CompetenciaItem key={competencia.id} competencia={competencia} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrophyIcon className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                No hay competencias próximas
              </h4>
              <p className="text-xs text-gray-600 mb-4">
                Aún no hay competencias programadas para las próximas fechas.
              </p>
              
              <EntrenadorOnly fallback={null}>
                <Link href="/competencias/nueva">
                  <Button size="sm" {...primaryButtonProps}>
                    <PlusIcon className="h-3 w-3 mr-1" />
                    Programar Competencia
                  </Button>
                </Link>
              </EntrenadorOnly>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ProximasCompetencias;
