"use client";

/**
 * Página de detalle de una competencia específica
 * 
 * Muestra información completa de una competencia
 * y permite realizar acciones como editar o eliminar
 */

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeftIcon,
  LoaderIcon,
  EditIcon
} from 'lucide-react';
import { useCompetencias } from '@/hooks/useCompetencias';
import { Button, Alert, AlertDescription } from '@/components/ui';
import { EntrenadorOnly } from '@/components/auth';
import { CompetenciaDetail } from '@/components/competencias';



// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function CompetenciaDetailPage() {
  const params = useParams();
  const competenciaId = parseInt(params?.id as string);
  
  const { useCompetenciaById } = useCompetencias();
  const { 
    data: competencia, 
    isLoading, 
    error 
  } = useCompetenciaById(competenciaId);

  // ========================================
  // LOADING STATE
  // ========================================
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <LoaderIcon className="h-8 w-8 animate-spin text-green-600 mr-3" />
            <span className="text-lg text-gray-600">Cargando competencia...</span>
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // ERROR STATE
  // ========================================
  
  if (error || !competencia) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Alert className="max-w-md mx-auto">
              <AlertDescription>
                {error ? 
                  'Error al cargar la competencia. Por favor, intenta de nuevo.' :
                  'No se encontró la competencia solicitada.'
                }
              </AlertDescription>
            </Alert>
            
            <div className="mt-6">
              <Link href="/competencias">
                <Button variant="outline" className="inline-flex items-center">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Volver a Competencias
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header con navegación */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/competencias">
                <Button variant="outline" size="sm" className="inline-flex items-center">
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Volver
                </Button>
              </Link>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {competencia.nombre}
                </h1>
                <p className="text-gray-600 mt-1">
                  Detalle de competencia
                </p>
              </div>
            </div>
            
            <EntrenadorOnly>
              <Link href={`/competencias/${competencia.id}/editar`}>
                <Button className="inline-flex items-center">
                  <EditIcon className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
            </EntrenadorOnly>
          </div>
        </div>

        {/* Información principal usando el componente CompetenciaDetail */}
        <div className="rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <CompetenciaDetail
            competencia={competencia}
            showEditButton={true}
            showHeader={true}
            compact={false}
          />
        </div>

        {/* Acciones adicionales */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-4">
            <Link href="/competencias">
              <Button variant="outline">
                Ver Todas las Competencias
              </Button>
            </Link>
            
            <EntrenadorOnly>
              <Link href="/competencias/nueva">
                <Button>
                  Nueva Competencia
                </Button>
              </Link>
            </EntrenadorOnly>
          </div>
        </div>
      </div>
    </div>
  );
}
