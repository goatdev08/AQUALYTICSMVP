"use client";

/**
 * Ejemplo de uso del CompetenciaSelector
 * 
 * Demuestra cómo integrar el selector en un formulario
 * Este componente puede servir como referencia para futuros desarrolladores
 */

import React, { useState } from 'react';
import { CompetenciaSelector, type CompetenciaOption } from './CompetenciaSelector';
import { Button } from '@/components/ui';

export function CompetenciaSelectorExample() {
  const [selectedCompetencia, setSelectedCompetencia] = useState<CompetenciaOption | null>(null);
  const [formData, setFormData] = useState({
    competencia: null as CompetenciaOption | null,
    observaciones: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert(`Competencia seleccionada: ${formData.competencia?.nombre || 'Ninguna'}`);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Ejemplo: Selector de Competencias
      </h2>
      
      {/* Ejemplo básico */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Selector Básico</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Competencia
            </label>
            <CompetenciaSelector
              value={selectedCompetencia}
              onValueChange={setSelectedCompetencia}
              placeholder="Buscar o seleccionar competencia..."
              className="w-full"
            />
          </div>
          
          {selectedCompetencia && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900">Competencia Seleccionada:</h4>
              <p className="text-sm text-green-800 mt-1">
                <strong>{selectedCompetencia.nombre}</strong> - {selectedCompetencia.curso} 
                {selectedCompetencia.sede && ` en ${selectedCompetencia.sede}`}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Ejemplo en formulario */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Integración en Formulario</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Competencia *
            </label>
            <CompetenciaSelector
              value={formData.competencia}
              onValueChange={(competencia) => setFormData(prev => ({ ...prev, competencia }))}
              placeholder="Seleccionar competencia para registrar resultados..."
              required
              error={formData.competencia ? undefined : "Selecciona una competencia"}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
              placeholder="Observaciones opcionales..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <Button
            type="submit"
            disabled={!formData.competencia}
            className="w-full"
          >
            Continuar con la Competencia Seleccionada
          </Button>
        </form>
      </div>
      
      {/* Ejemplo con filtros */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Con Filtros</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Solo Piscina Corta (25m)
            </label>
            <CompetenciaSelector
              placeholder="Solo competencias SC..."
              cursoFilter="SC"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Incluir Finalizadas
            </label>
            <CompetenciaSelector
              placeholder="Todas las competencias..."
              includeFinalizadas={true}
              className="w-full"
            />
          </div>
        </div>
      </div>
      
      {/* Información técnica */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Características Técnicas:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Búsqueda typeahead con debounce de 300ms</li>
          <li>• Navegación por teclado (flechas, Enter, Escape)</li>
          <li>• Filtrado por estado (activas, próximas, finalizadas)</li>
          <li>• Filtrado por tipo de curso (SC/LC)</li>
          <li>• Estados de loading, error y empty</li>
          <li>• Integración completa con useCompetencias hook</li>
          <li>• Responsive design y accesible</li>
          <li>• Tema consistente con shadcn y Figma</li>
        </ul>
      </div>
    </div>
  );
}

export default CompetenciaSelectorExample;
