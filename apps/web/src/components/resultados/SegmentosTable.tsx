'use client';

/**
 * Tabla de Segmentos para Modal de Detalles
 * 
 * Muestra segmentos ordenados por índice con todos los campos calculados
 * Parte de la subtarea 17.5: "Build Segment Table and Global Summary Components"
 */

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge
} from '@/components/ui';
import { formatTime } from '@/lib/time-utils';
import type { SegmentoResponse } from '@/types/resultados';

interface SegmentosTableProps {
  segmentos: SegmentoResponse[];
}

export function SegmentosTable({ segmentos }: SegmentosTableProps) {
  const formatDecimal = (value: number | string | null | undefined, unit = '', decimals = 2): string => {
    if (value === null || value === undefined) return '-';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `${numValue.toFixed(decimals)}${unit}`;
  };

  const getEstiloBadge = (estilo: string) => {
    const colorMap = {
      'Libre': 'bg-blue-100 text-blue-800',
      'Dorso': 'bg-purple-100 text-purple-800',
      'Pecho': 'bg-green-100 text-green-800',
      'Mariposa': 'bg-orange-100 text-orange-800'
    };

    return (
      <Badge 
        variant="secondary" 
        className={`text-xs ${colorMap[estilo as keyof typeof colorMap] || 'bg-gray-100 text-gray-800'}`}
      >
        {estilo}
      </Badge>
    );
  };

  if (!segmentos || segmentos.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No hay segmentos registrados para este resultado.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-green-50">
            <TableHead className="w-16 text-center font-semibold">
              #
            </TableHead>
            <TableHead className="min-w-20">
              Estilo
            </TableHead>
            <TableHead className="w-20 text-center">
              Dist. (m)
            </TableHead>
            <TableHead className="w-24 text-center">
              Tiempo
            </TableHead>
            <TableHead className="w-20 text-center">
              Brazadas
            </TableHead>
            <TableHead className="w-20 text-center">
              Flecha (m)
            </TableHead>
            <TableHead className="w-24 text-center">
              Dist. s/Flecha
            </TableHead>
            <TableHead className="w-24 text-center">
              Velocidad
            </TableHead>
            <TableHead className="w-24 text-center">
              Dist./Brazada
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {segmentos
            .sort((a, b) => a.indice - b.indice) // Asegurar orden por índice
            .map((segmento) => (
            <TableRow 
              key={segmento.id} 
              className="hover:bg-green-50/50 transition-colors"
            >
              {/* Índice */}
              <TableCell className="text-center font-medium">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm mx-auto">
                  {segmento.indice}
                </div>
              </TableCell>

              {/* Estilo */}
              <TableCell>
                {getEstiloBadge(segmento.estilo_segmento)}
              </TableCell>

              {/* Distancia */}
              <TableCell className="text-center font-mono">
                {segmento.distancia_m}m
              </TableCell>

              {/* Tiempo */}
              <TableCell className="text-center font-mono font-semibold">
                {formatTime(segmento.tiempo_cs)}
              </TableCell>

              {/* Brazadas */}
              <TableCell className="text-center">
                {segmento.brazadas === 0 ? (
                  <span className="text-gray-400">-</span>
                ) : (
                  <span className="font-medium">{segmento.brazadas}</span>
                )}
              </TableCell>

              {/* Flecha */}
              <TableCell className="text-center font-mono">
                {formatDecimal(segmento.flecha_m, 'm', 1)}
              </TableCell>

              {/* Distancia sin Flecha */}
              <TableCell className="text-center font-mono text-green-700">
                {formatDecimal(segmento.dist_sin_flecha_m, 'm', 2)}
              </TableCell>

              {/* Velocidad */}
              <TableCell className="text-center font-mono text-blue-700">
                {formatDecimal(segmento.velocidad_mps, ' m/s', 2)}
              </TableCell>

              {/* Distancia por Brazada */}
              <TableCell className="text-center font-mono text-purple-700">
                {segmento.dist_por_brazada_m ? 
                  formatDecimal(segmento.dist_por_brazada_m, 'm', 2) : 
                  <span className="text-gray-400">-</span>
                }
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Resumen de la Tabla */}
      <div className="mt-4 px-4 py-2 bg-gray-50 border-t text-xs text-gray-600">
        <div className="flex justify-between items-center">
          <span>
            Total: <strong>{segmentos.length} segmentos</strong>
          </span>
          <span className="text-right">
            Ordenados por índice • Tiempos en formato MM:SS.CC
          </span>
        </div>
      </div>
    </div>
  );
}

export default SegmentosTable;
