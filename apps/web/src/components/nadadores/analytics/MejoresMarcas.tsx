"use client";

/**
 * Componente para mostrar mejores marcas del nadador
 * Tabla ordenada por tiempo con filtros por curso
 */

import React, { useState, useMemo } from 'react';
import { Button, Alert, AlertDescription } from '@/components/ui';
import { type MejorMarca } from '@/hooks/useNadadorAnalytics';
import { Clock, Award, MapPin } from 'lucide-react';

interface MejoresMarcasProps {
  marcas: MejorMarca[];
  isLoading?: boolean;
}

export default function MejoresMarcas({ marcas, isLoading }: MejoresMarcasProps) {
  const [cursoFilter, setCursoFilter] = useState<'ALL' | 'SC' | 'LC'>('ALL');
  
  // Filtrar y agrupar marcas por prueba
  const marcasFiltradas = useMemo(() => {
    let filtered = cursoFilter === 'ALL' ? marcas : marcas.filter(m => m.curso === cursoFilter);
    
    // Agrupar por prueba y tomar la mejor marca de cada curso
    const grouped = filtered.reduce((acc, marca) => {
      const key = `${marca.prueba}-${marca.curso}`;
      if (!acc[key] || acc[key].tiempo > marca.tiempo) {
        acc[key] = marca;
      }
      return acc;
    }, {} as Record<string, MejorMarca>);
    
    return Object.values(grouped).sort((a, b) => a.tiempo - b.tiempo);
  }, [marcas, cursoFilter]);

  const formatTiempo = (segundos: number): string => {
    const mins = Math.floor(segundos / 60);
    const secs = (segundos % 60).toFixed(2);
    return mins > 0 ? `${mins}:${secs.padStart(5, '0')}` : `${secs}`;
  };

  const formatFecha = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">🏆 Mejores Marcas</h3>
          <div className="flex space-x-2">
            {['ALL', 'SC', 'LC'].map(filter => (
              <div key={filter} className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-gray-200 animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (marcas.length === 0) {
    return (
      <div className="text-center py-12">
        <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No hay marcas registradas</h3>
        <p className="text-gray-600">Las mejores marcas aparecerán aquí una vez que participe en competencias.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">🏆 Mejores Marcas</h3>
          <p className="text-sm text-gray-600">
            Mejores tiempos por prueba y curso ({marcasFiltradas.length} marcas)
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant={cursoFilter === 'ALL' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCursoFilter('ALL')}
          >
            Todos
          </Button>
          <Button
            variant={cursoFilter === 'SC' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCursoFilter('SC')}
          >
            SC (25m)
          </Button>
          <Button
            variant={cursoFilter === 'LC' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCursoFilter('LC')}
          >
            LC (50m)
          </Button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Award className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-900">Mejor Marca Global</span>
          </div>
          <p className="text-2xl font-bold text-green-900 mt-1">
            {formatTiempo(Math.min(...marcas.map(m => m.tiempo)))}
          </p>
          <p className="text-xs text-green-700">
            {marcas.find(m => m.tiempo === Math.min(...marcas.map(m => m.tiempo)))?.prueba}
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-900">Total Pruebas</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-1">{marcasFiltradas.length}</p>
          <p className="text-xs text-blue-700">Diferentes especialidades</p>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center">
            <MapPin className="h-5 w-5 text-purple-600 mr-2" />
            <span className="text-sm font-medium text-purple-900">Última Marca</span>
          </div>
          <p className="text-lg font-bold text-purple-900 mt-1">
            {formatFecha(
              marcas.reduce((latest, m) => 
                new Date(m.fecha) > new Date(latest.fecha) ? m : latest
              ).fecha
            )}
          </p>
          <p className="text-xs text-purple-700">Registro más reciente</p>
        </div>
      </div>

      {/* Tabla de marcas */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prueba
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiempo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Curso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Competencia
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {marcasFiltradas.map((marca, index) => (
                <tr 
                  key={`${marca.prueba}-${marca.curso}-${index}`}
                  className={`hover:bg-gray-50 ${index < 3 ? 'bg-yellow-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center">
                      {index < 3 && <Award className="h-4 w-4 text-yellow-500 mr-2" />}
                      {marca.prueba}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-mono text-lg">{formatTiempo(marca.tiempo)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      marca.curso === 'SC' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {marca.curso} ({marca.lugar})
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatFecha(marca.fecha)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                    {marca.competencia}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {marcasFiltradas.length === 0 && cursoFilter !== 'ALL' && (
        <Alert>
          <AlertDescription>
            No hay marcas registradas para el curso {cursoFilter}. 
            Prueba seleccionar "Todos" para ver todas las marcas disponibles.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
