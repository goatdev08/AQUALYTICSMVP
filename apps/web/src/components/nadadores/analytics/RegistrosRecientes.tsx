"use client";

/**
 * Componente para mostrar registros recientes del nadador
 * Tabla paginada con los eventos más recientes
 */

import React, { useState, useMemo } from 'react';
import { Button, Alert, AlertDescription } from '@/components/ui';
import { type RegistroReciente } from '@/hooks/useNadadorAnalytics';
import { ChevronLeft, ChevronRight, Calendar, Trophy, Clock, Star } from 'lucide-react';

interface RegistrosRecientesProps {
  registros: RegistroReciente[];
  isLoading?: boolean;
}

const REGISTROS_POR_PAGINA = 8;

export default function RegistrosRecientes({ registros, isLoading }: RegistrosRecientesProps) {
  const [paginaActual, setPaginaActual] = useState(1);
  
  // Calcular paginación
  const totalPaginas = Math.ceil(registros.length / REGISTROS_POR_PAGINA);
  const registrosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * REGISTROS_POR_PAGINA;
    const fin = inicio + REGISTROS_POR_PAGINA;
    return registros.slice(inicio, fin);
  }, [registros, paginaActual]);

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

  const getLugarColor = (lugar: number): string => {
    switch (lugar) {
      case 1: return 'bg-yellow-100 text-yellow-800';
      case 2: return 'bg-gray-100 text-gray-800';  
      case 3: return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getLugarIcon = (lugar: number): string => {
    switch (lugar) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '📍';
    }
  };

  // Estadísticas rápidas
  const estadisticas = useMemo(() => {
    if (registros.length === 0) return null;

    const podios = registros.filter(r => r.lugar <= 3).length;
    const promedioLugar = registros.reduce((sum, r) => sum + r.lugar, 0) / registros.length;
    const mejorLugar = Math.min(...registros.map(r => r.lugar));
    const ultimaCompetencia = registros[0]; // Ya están ordenados por fecha desc

    return {
      podios,
      promedioLugar: Math.round(promedioLugar * 10) / 10,
      mejorLugar,
      ultimaCompetencia,
    };
  }, [registros]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">📅 Registros Recientes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 animate-pulse rounded"></div>
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-gray-200 animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (registros.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No hay registros recientes</h3>
        <p className="text-gray-600">Los eventos recientes aparecerán aquí una vez que participe en competencias.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">📅 Registros Recientes</h3>
        <p className="text-sm text-gray-600">
          Últimas participaciones - {registros.length} eventos en total
        </p>
      </div>

      {/* Estadísticas destacadas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <Trophy className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-sm font-medium text-yellow-900">Podios</span>
            </div>
            <p className="text-2xl font-bold text-yellow-900 mt-1">{estadisticas.podios}</p>
            <p className="text-xs text-yellow-700">
              Top 3 finishes
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Star className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">Mejor Lugar</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 mt-1">
              {getLugarIcon(estadisticas.mejorLugar)} {estadisticas.mejorLugar}°
            </p>
            <p className="text-xs text-blue-700">
              Mejor posición
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-900">Promedio</span>
            </div>
            <p className="text-2xl font-bold text-green-900 mt-1">{estadisticas.promedioLugar}°</p>
            <p className="text-xs text-green-700">
              Posición promedio
            </p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-purple-600 mr-2" />
              <span className="text-sm font-medium text-purple-900">Último Evento</span>
            </div>
            <p className="text-lg font-bold text-purple-900 mt-1">
              {formatFecha(estadisticas.ultimaCompetencia.fecha)}
            </p>
            <p className="text-xs text-purple-700 truncate">
              {estadisticas.ultimaCompetencia.competencia}
            </p>
          </div>
        </div>
      )}

      {/* Tabla de registros */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Competencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prueba
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiempo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lugar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puntos
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {registrosPaginados.map((registro) => (
                <tr 
                  key={registro.id}
                  className={`hover:bg-gray-50 ${registro.lugar <= 3 ? 'bg-yellow-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatFecha(registro.fecha)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                    {registro.competencia}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {registro.prueba}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-mono text-lg">{formatTiempo(registro.tiempo)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLugarColor(registro.lugar)}`}>
                      {getLugarIcon(registro.lugar)} {registro.lugar}° lugar
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {registro.puntaje ? (
                      <span className="font-semibold text-green-600">{registro.puntaje} pts</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-700">
            <span>
              Mostrando {((paginaActual - 1) * REGISTROS_POR_PAGINA) + 1} a{' '}
              {Math.min(paginaActual * REGISTROS_POR_PAGINA, registros.length)} de{' '}
              {registros.length} registros
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
              disabled={paginaActual === 1}
              className="flex items-center space-x-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(pagina => (
                <Button
                  key={pagina}
                  variant={pagina === paginaActual ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaginaActual(pagina)}
                  className="min-w-[40px]"
                >
                  {pagina}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas}
              className="flex items-center space-x-1"
            >
              <span>Siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
