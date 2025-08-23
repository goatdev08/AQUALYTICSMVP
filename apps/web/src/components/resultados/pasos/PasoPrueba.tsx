/**
 * PasoPrueba - Paso 3 del stepper
 * Placeholder temporal para evitar errores de compilación
 * Se implementará en la subtarea 16.4
 */

"use client";

import React from 'react';
import { useStepper } from '@/contexts/stepper-context';

export function PasoPrueba() {
  const { state } = useStepper();
  
  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Paso 3: Selección de Prueba y Fase
      </h3>
      <p className="text-gray-600">
        Componente en desarrollo - Subtarea 16.4
      </p>
      <div className="mt-4 text-sm text-gray-500">
        Estado actual: {JSON.stringify(state.paso_prueba, null, 2)}
      </div>
    </div>
  );
}

export default PasoPrueba;
