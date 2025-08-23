"use client";

/**
 * Componente para mostrar ranking intra-equipo del nadador
 * Tabla comparativa con compañeros de equipo en pruebas específicas
 */

import React, { useState, useMemo } from 'react';
import { Button, Alert, AlertDescription, Input } from '@/components/ui';
import { type RankingData, type RankingNadador } from '@/hooks/useNadadorAnalytics';
import { Trophy, TrendingUp, TrendingDown, Users, Target, Award, Filter } from 'lucide-react';

interface RankingIntraEquipoProps {
  rankingData: RankingData;
  nadadorActualId: number;
  isLoading?: boolean;
}

export default function RankingIntraEquipo({ 
  rankingData, 
  nadadorActualId,
  isLoading 
}: RankingIntraEquipoProps) {
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('Todas');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filtrar ranking por categoría y búsqueda
  const rankingFiltrado = useMemo(() => {
    let filtered = [...rankingData.ranking];

    if (categoriaFiltro !== 'Todas') {
      filtered = filtered.filter(n => n.categoria === categoriaFiltro);
    }

    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      if (categoriaFiltro === 'Todas') {
        return a.posicion_equipo - b.posicion_equipo;
      } else {
        return a.posicion_categoria - b.posicion_categoria;
      }
    });
  }, [rankingData.ranking, categoriaFiltro, searchTerm]);

  // Obtener categorías únicas
  const categorias = useMemo(() => {
    const unique = [...new Set(rankingData.ranking.map(n => n.categoria))];
    return ['Todas', ...unique.sort()];
  }, [rankingData.ranking]);

  const formatTiempo = (segundos: number): string => {
    const mins = Math.floor(segundos / 60);
    const secs = (segundos % 60).toFixed(2);
    return mins > 0 ? `${mins}:${secs.padStart(5, '0')}` : `${secs}`;
  };

  const getTendenciaIcon = (tendencia: number) => {
    if (tendencia > 0.1) return <TrendingDown className="h-4 w-4 text-red-500" />;
    if (tendencia < -0.1) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return <div className="h-4 w-4 rounded-full bg-gray-300" />;
  };

  const getTendenciaTexto = (tendencia: number): string => {
    if (tendencia > 0.1) return `+${Math.abs(tendencia).toFixed(1)}s`;
    if (tendencia < -0.1) return `-${Math.abs(tendencia).toFixed(1)}s`;
    return 'Estable';
  };

  const getPosicionColor = (posicion: number): string => {
    switch (posicion) {
      case 1: return 'bg-yellow-100 text-yellow-800';
      case 2: return 'bg-gray-100 text-gray-800';
      case 3: return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getPosicionIcon = (posicion: number): string => {
    switch (posicion) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${posicion}`;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">🏆 Ranking Intra-Equipo</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-gray-200 animate-pulse rounded"></div>
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-gray-200 animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!rankingData.ranking || rankingData.ranking.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No hay datos de ranking</h3>
        <p className="text-gray-600">Los datos de ranking aparecerán aquí cuando haya más resultados de equipo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">🏆 Ranking Intra-Equipo</h3>
        <p className="text-sm text-gray-600">
          Posición en {rankingData.prueba_seleccionada} {rankingData.curso_seleccionado} - 
          {rankingData.estadisticas.total_participantes} nadadores del equipo
        </p>
      </div>

      {/* Estadísticas destacadas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <Trophy className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-sm font-medium text-yellow-900">Tu Posición</span>
          </div>
          <p className="text-2xl font-bold text-yellow-900 mt-1">
            {getPosicionIcon(rankingData.posicion_nadador_actual || 0)} #{rankingData.posicion_nadador_actual}
          </p>
          <p className="text-xs text-yellow-700">
            En {rankingData.prueba_seleccionada}
          </p>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Award className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-900">Mejor Tiempo Equipo</span>
          </div>
          <p className="text-2xl font-bold text-green-900 mt-1">
            {formatTiempo(rankingData.estadisticas.mejor_tiempo_equipo)}
          </p>
          <p className="text-xs text-green-700">
            Record del equipo
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Target className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-900">Promedio Equipo</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-1">
            {formatTiempo(rankingData.estadisticas.promedio_equipo)}
          </p>
          <p className="text-xs text-blue-700">
            Tiempo promedio
          </p>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-purple-600 mr-2" />
            <span className="text-sm font-medium text-purple-900">Más Activo</span>
          </div>
          <p className="text-lg font-bold text-purple-900 mt-1">
            {rankingData.estadisticas.nadador_mas_participaciones}
          </p>
          <p className="text-xs text-purple-700">
            Mayor participación
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="categoria-filter" className="block text-sm font-medium text-gray-700 mb-1">
              <Filter className="inline h-4 w-4 mr-1" />
              Categoría
            </label>
            <select
              id="categoria-filter"
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="nadador-search" className="block text-sm font-medium text-gray-700 mb-1">
              🔍 Buscar Nadador
            </label>
            <Input
              id="nadador-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nombre del nadador..."
              className="w-full"
            />
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setCategoriaFiltro('Todas');
                setSearchTerm('');
              }}
              className="w-full"
            >
              Limpiar filtros
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla de ranking */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posición
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nadador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mejor Tiempo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prom. Últimos 3
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tendencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participaciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rankingFiltrado.map((nadador, index) => {
                const isCurrentUser = nadador.nadador_id === nadadorActualId;
                const posicion = categoriaFiltro === 'Todas' ? nadador.posicion_equipo : nadador.posicion_categoria;
                
                return (
                  <tr 
                    key={nadador.nadador_id}
                    className={`hover:bg-gray-50 ${
                      isCurrentUser ? 'bg-green-50 ring-2 ring-green-200' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPosicionColor(posicion)}`}>
                        {getPosicionIcon(posicion)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {nadador.nombre_completo}
                        {isCurrentUser && <span className="ml-2 text-xs text-green-600 font-bold">(Tú)</span>}
                      </div>
                      <div className="text-sm text-gray-500">
                        Categoría {nadador.categoria}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-mono text-lg">{formatTiempo(nadador.mejor_tiempo)}</span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-mono">{formatTiempo(nadador.promedio_ultimos_3)}</span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        {getTendenciaIcon(nadador.tendencia)}
                        <span className="text-xs font-medium">
                          {getTendenciaTexto(nadador.tendencia)}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <span className="font-semibold">{nadador.total_participaciones}</span> eventos
                      </div>
                      <div className="text-xs text-gray-400 truncate max-w-xs">
                        Último: {nadador.ultima_competencia}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {rankingFiltrado.length === 0 && (categoriaFiltro !== 'Todas' || searchTerm) && (
        <Alert>
          <AlertDescription>
            No hay nadadores que coincidan con los filtros seleccionados. 
            Prueba ajustar la categoría o término de búsqueda.
          </AlertDescription>
        </Alert>
      )}

      {/* Info adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">📊 Información del Ranking</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
          <div>
            <p><strong>Prueba:</strong> {rankingData.prueba_seleccionada}</p>
            <p><strong>Curso:</strong> {rankingData.curso_seleccionado} ({rankingData.curso_seleccionado === 'SC' ? '25m' : '50m'})</p>
          </div>
          <div>
            <p><strong>Filtros activos:</strong> {categoriaFiltro} - {rankingData.rama_filtro === 'F' ? 'Femenino' : 'Masculino'}</p>
            <p><strong>Nadadores mostrados:</strong> {rankingFiltrado.length} de {rankingData.ranking.length}</p>
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          💡 El ranking se basa en los mejores tiempos personales de cada nadador en esta prueba específica.
        </p>
      </div>
      
    </div>
  );
}
