/**
 * Página de registro de resultados - /resultados/registrar
 * 
 * Página principal para acceder al stepper de registro de resultados.
 * Incluye protección por roles (solo entrenadores) y manejo de errores.
 */

import React from 'react';
import { Metadata } from 'next';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { RegistrarResultadosPage, StepperErrorBoundary } from '@/components/resultados';

// =====================
// Metadatos de la página
// =====================

export const metadata: Metadata = {
  title: 'Registrar Resultados | AquaLytics',
  description: 'Captura de resultados de natación con stepper de 4 pasos: competencia, nadador, prueba y segmentos.',
};

// =====================
// Componente de página
// =====================

export default function RegistrarResultadosPageRoute() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['entrenador']}>
        <StepperErrorBoundary>
          <RegistrarResultadosPage />
        </StepperErrorBoundary>
      </RoleGuard>
    </ProtectedRoute>
  );
}
