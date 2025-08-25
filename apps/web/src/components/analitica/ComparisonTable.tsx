/**
 * Componente ComparisonTable - Tabla de comparación de segmentos.
 * 
 * Muestra diferencias detalladas entre segmentos en formato tabular,
 * ideal para análisis numérico preciso.
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ComparacionSegmento, SegmentoPromedio } from '@/hooks/useAnalitica';

// ==========================================
// Tipos de Props
// ==========================================

interface ComparisonTableProps {
  /** Datos de comparación entre segmentos */
  comparacionSegmentos?: ComparacionSegmento[];
  /** Datos de promedios de equipo para referencia */
  promediosEquipo?: SegmentoPromedio[];
  /** Título de la tabla */
  titulo?: string;
  /** Si se debe mostrar información detallada */
  mostrarDetalles?: boolean;
  /** Tema de colores */
  tema?: 'green' | 'blue' | 'purple';
}

// ==========================================
// Utilidades
// ==========================================

/**
 * Formatea tiempo en centésimas a formato legible.
 */
const formatearTiempo = (centesimas: number): string => {
  const minutos = Math.floor(centesimas / 6000);
  const segundos = Math.floor((centesimas % 6000) / 100);
  const centesimasRestantes = centesimas % 100;
  
  if (minutos > 0) {
    return `${minutos}:${segundos.toString().padStart(2, '0')}.${centesimasRestantes.toString().padStart(2, '0')}`;
  }
  return `${segundos}.${centesimasRestantes.toString().padStart(2, '0')}`;
};

/**
 * Obtiene el color para una diferencia de tiempo.
 */
const getColorDiferencia = (diferencia: number, tema: string = 'green') => {
  const colores = {
    green: {
      mejora: 'text-green-600 bg-green-50',
      empeoramiento: 'text-red-600 bg-red-50',
      neutro: 'text-gray-600 bg-gray-50',
    },
    blue: {
      mejora: 'text-blue-600 bg-blue-50',
      empeoramiento: 'text-red-600 bg-red-50', 
      neutro: 'text-gray-600 bg-gray-50',
    },
    purple: {
      mejora: 'text-purple-600 bg-purple-50',
      empeoramiento: 'text-red-600 bg-red-50',
      neutro: 'text-gray-600 bg-gray-50',
    },
  };
  
  const temaColores = colores[tema as keyof typeof colores] || colores.green;
  
  if (diferencia < 0) return temaColores.mejora;
  if (diferencia > 0) return temaColores.empeoramiento;
  return temaColores.neutro;
};

// ==========================================
// Componente Principal
// ==========================================

export default function ComparisonTable({
  comparacionSegmentos = [],
  promediosEquipo = [],
  titulo = 'Comparación Detallada por Segmentos',
  mostrarDetalles = true,
  tema = 'green',
}: ComparisonTableProps) {
  
  // Renderizar mensaje si no hay datos
  if (!comparacionSegmentos.length && !promediosEquipo.length) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32 text-gray-500">
          <div className="text-center">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-lg font-medium">Sin datos para mostrar</p>
            <p className="text-sm">Proporciona datos de comparación para ver la tabla detallada</p>
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">{titulo}</h3>
        <p className="text-sm text-gray-600 mt-1">
          Análisis detallado por segmento con diferencias y métricas
        </p>
      </div>
      
      <div className="overflow-x-auto">
        {/* Tabla de comparación entre resultados */}
        {comparacionSegmentos.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Segmento</TableHead>
                <TableHead className="text-center">Resultado 1</TableHead>
                <TableHead className="text-center">Resultado 2</TableHead>
                <TableHead className="text-center">Diferencia</TableHead>
                {mostrarDetalles && (
                  <>
                    <TableHead className="text-center">Brazadas 1</TableHead>
                    <TableHead className="text-center">Brazadas 2</TableHead>
                    <TableHead className="text-center">Δ Brazadas</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparacionSegmentos.map((segmento) => (
                <TableRow key={segmento.indice} className="hover:bg-gray-50">
                  <TableCell className="text-center font-medium">
                    <Badge variant="outline">Seg {segmento.indice}</Badge>
                  </TableCell>
                  
                  <TableCell className="text-center font-mono text-sm">
                    {segmento.resultado1.tiempo}
                  </TableCell>
                  
                  <TableCell className="text-center font-mono text-sm">
                    {segmento.resultado2.tiempo}
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <span className={`px-2 py-1 rounded-md font-mono text-sm ${
                      getColorDiferencia(segmento.diferencias.tiempo_cs, tema)
                    }`}>
                      {segmento.diferencias.tiempo_formateado}
                    </span>
                  </TableCell>
                  
                  {mostrarDetalles && (
                    <>
                      <TableCell className="text-center text-sm">
                        {segmento.resultado1.brazadas || '-'}
                      </TableCell>
                      
                      <TableCell className="text-center text-sm">
                        {segmento.resultado2.brazadas || '-'}
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded-md text-sm ${
                          segmento.diferencias.brazadas === 0 ? 'text-gray-600' :
                          segmento.diferencias.brazadas < 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {segmento.diferencias.brazadas === 0 ? '=' : 
                           segmento.diferencias.brazadas > 0 ? `+${segmento.diferencias.brazadas}` :
                           `${segmento.diferencias.brazadas}`
                          }
                        </span>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        {segmento.diferencias.mejora ? (
                          <Badge className="bg-green-100 text-green-800">
                            ✓ Mejora
                          </Badge>
                        ) : segmento.diferencias.tiempo_cs === 0 ? (
                          <Badge variant="outline">
                            = Igual
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            ↑ Empeora
                          </Badge>
                        )}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        
        {/* Tabla de promedios de equipo */}
        {promediosEquipo.length > 0 && comparacionSegmentos.length === 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Segmento</TableHead>
                <TableHead className="text-center">Tiempo Promedio</TableHead>
                <TableHead className="text-center">Brazadas Prom.</TableHead>
                <TableHead className="text-center">Flecha Prom.</TableHead>
                <TableHead className="text-center">Registros</TableHead>
                <TableHead className="text-center">Prueba</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promediosEquipo.map((segmento) => (
                <TableRow key={segmento.indice} className="hover:bg-gray-50">
                  <TableCell className="text-center font-medium">
                    <Badge variant="outline">Seg {segmento.indice}</Badge>
                  </TableCell>
                  
                  <TableCell className="text-center font-mono text-sm">
                    {segmento.tiempo_promedio}
                  </TableCell>
                  
                  <TableCell className="text-center text-sm">
                    {segmento.brazadas_promedio.toFixed(1)}
                  </TableCell>
                  
                  <TableCell className="text-center text-sm">
                    {segmento.flecha_promedio_m.toFixed(2)}m
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {segmento.registros_en_promedio}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="text-center text-xs text-gray-600">
                    {segmento.prueba.estilo} {segmento.prueba.distancia}m {segmento.prueba.curso}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      
      {/* Estadísticas de resumen */}
      {comparacionSegmentos.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-gray-700">Total Segmentos</div>
              <div className="text-lg font-bold text-gray-900">
                {comparacionSegmentos.length}
              </div>
            </div>
            
            <div className="text-center">
              <div className="font-medium text-green-700">Mejoras</div>
              <div className="text-lg font-bold text-green-600">
                {comparacionSegmentos.filter(s => s.diferencias.mejora).length}
              </div>
            </div>
            
            <div className="text-center">
              <div className="font-medium text-red-700">Empeoramientos</div>
              <div className="text-lg font-bold text-red-600">
                {comparacionSegmentos.filter(s => !s.diferencias.mejora && s.diferencias.tiempo_cs !== 0).length}
              </div>
            </div>
            
            <div className="text-center">
              <div className="font-medium text-gray-700">Sin Cambio</div>
              <div className="text-lg font-bold text-gray-600">
                {comparacionSegmentos.filter(s => s.diferencias.tiempo_cs === 0).length}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Leyenda */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
            <span>Mejora (menor tiempo)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-100 border border-red-300"></div>
            <span>Empeoramiento (mayor tiempo)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300"></div>
            <span>Sin cambio</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">💡</span>
            <span>Los tiempos están en formato MM:SS.CC</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
