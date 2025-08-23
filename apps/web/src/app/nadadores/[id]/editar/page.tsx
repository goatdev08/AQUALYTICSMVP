"use client";

/**
 * Página para editar un nadador existente
 * 
 * Ruta: /nadadores/[id]/editar
 * Solo accesible para entrenadores (RoleGuard)
 */

import React from 'react';
import { useParams, notFound } from 'next/navigation';
import { ProtectedRoute, RoleGuard } from '@/components/auth';
import { NadadorForm } from '@/components/nadadores';
import { useNadador } from '@/hooks/useNadadores';
import { LoaderIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui';

export default function EditarNadadorPage() {
  const params = useParams();
  const nadadorId = parseInt(params.id as string);
  
  // Hook para obtener datos del nadador
  const { data: nadador, isLoading, isError, error } = useNadador(nadadorId);

  // Validar ID
  if (isNaN(nadadorId)) {
    notFound();
  }

  // Estados de carga y error
  if (isLoading) {
    return (
      <ProtectedRoute>
        <RoleGuard allowedRoles={['entrenador']}>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <LoaderIcon className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
              <p className="text-gray-600">Cargando datos del nadador...</p>
            </div>
          </div>
        </RoleGuard>
      </ProtectedRoute>
    );
  }

  if (isError) {
    return (
      <ProtectedRoute>
        <RoleGuard allowedRoles={['entrenador']}>
          <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
              <Alert>
                <AlertDescription>
                  Error al cargar el nadador: {error?.message}
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </RoleGuard>
      </ProtectedRoute>
    );
  }

  if (!nadador) {
    notFound();
  }

  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['entrenador']}>
        <NadadorForm
          nadador={nadador}
          title={`Editar Nadador: ${nadador.nombre_completo}`}
          submitButtonText="Guardar Cambios"
        />
      </RoleGuard>
    </ProtectedRoute>
  );
}
