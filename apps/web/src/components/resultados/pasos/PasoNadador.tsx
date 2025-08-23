/**
 * PasoNadador - Paso 2 del stepper
 * Placeholder temporal para evitar errores de compilación
 * Se implementará en la subtarea 16.3
 */

"use client";

import React from 'react';
import { useStepper } from '@/contexts/stepper-context';

export function PasoNadador() {
  const { state } = useStepper();
  
  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Paso 2: Selección de Nadador
      </h3>
      <p className="text-gray-600">
        Componente en desarrollo - Subtarea 16.3
      </p>
      <div className="mt-4 text-sm text-gray-500">
        Estado actual: {JSON.stringify(state.paso_nadador, null, 2)}
      </div>
    </div>
  );
}

export default PasoNadador;
