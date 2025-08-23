"use client";

/**
 * Página para crear un nuevo nadador
 * 
 * Ruta: /nadadores/nuevo
 * Solo accesible para entrenadores (RoleGuard)
 */

import React from 'react';
import { ProtectedRoute, RoleGuard } from '@/components/auth';
import { NadadorForm } from '@/components/nadadores';

export default function NuevoNadadorPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['entrenador']}>
        <NadadorForm
          title="Agregar Nuevo Nadador"
          submitButtonText="Crear Nadador"
        />
      </RoleGuard>
    </ProtectedRoute>
  );
}
