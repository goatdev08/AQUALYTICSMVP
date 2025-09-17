/**
 * Página de registro de resultados - /resultados/registrar
 * 
 * Página principal para la nueva vista unificada de registro de resultados (PRDv2 Fase 3).
 * Vista única sin stepper visible que orquesta todos los pasos progresivamente.
 * Incluye protección por roles (solo entrenadores) y manejo de errores.
 */

import React from 'react';
import { Metadata } from 'next';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { AppLayout } from '@/components/layout';
import { ResultRegistrationContainer, StepperErrorBoundary } from '@/components/resultados';

// =====================
// Metadatos de la página
// =====================

export const metadata: Metadata = {
  title: 'Registrar Resultados | AquaLytics',
  description: 'Vista unificada para registro de resultados de natación. Competencia, nadador, prueba y segmentos en una sola pantalla con auto-generación de tiempos.',
};

// =====================
// Componente de página
// =====================

export default function RegistrarResultadosPageRoute() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['entrenador']}>
        <AppLayout 
          title="Registrar Resultado" 
          description="Vista unificada para registro de resultados de natación"
        >
          <StepperErrorBoundary>
            <ResultRegistrationContainer />
          </StepperErrorBoundary>
        </AppLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}
