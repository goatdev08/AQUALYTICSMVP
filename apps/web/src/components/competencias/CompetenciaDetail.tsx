"use client";

/**
 * Componente CompetenciaDetail  
 * 
 * Muestra información detallada de una competencia específica
 * Puede usarse tanto en páginas como en modales
 */

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  CalendarIcon,
  MapPinIcon,
  EditIcon,
  TrophyIcon,
  UsersIcon
} from 'lucide-react';
import { Button } from '@/components/ui';
import { EntrenadorOnly } from '@/components/auth';

// ============================================================================
// TYPES
// ============================================================================

export interface CompetenciaDetailProps {
  competencia: {
    id: number;
    nombre: string;
    curso: string;
    fecha_inicio: string;
    fecha_fin: string;
    sede?: string;
  };
  showEditButton?: boolean;
  showHeader?: boolean;
  compact?: boolean;
  className?: string;
}

// ============================================================================
// UTILIDADES
// ============================================================================

function formatFecha(fechaISO: string): string {
  try {
    const fecha = new Date(fechaISO);
    return format(fecha, "d 'de' MMMM 'de' yyyy", { locale: es });
  } catch {
    return fechaISO;
  }
}

function getEstadoInfo(fechaInicio: string, fechaFin: string): {
  estado: string;
  color: string;
  descripcion: string;
} {
  const hoy = new Date();
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  
  if (fin < hoy) {
    return { 
      estado: 'Finalizada', 
      color: 'text-gray-600 bg-gray-100',
      descripcion: 'Esta competencia ya terminó'
    };
  } else if (inicio <= hoy && hoy <= fin) {
    return { 
      estado: 'En Curso', 
      color: 'text-green-600 bg-green-100',
      descripcion: 'La competencia está actualmente en curso'
    };
  } else {
    const diasRestantes = Math.ceil((inicio.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return { 
      estado: 'Próxima', 
      color: 'text-blue-600 bg-blue-100',
      descripcion: `Faltan ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''} para el inicio`
    };
  }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function CompetenciaDetail({
  competencia,
  showEditButton = true,
  showHeader = true,
  compact = false,
  className = ""
}: CompetenciaDetailProps) {
  
  const estadoInfo = getEstadoInfo(competencia.fecha_inicio, competencia.fecha_fin);
  const duracion = Math.ceil(
    (new Date(competencia.fecha_fin).getTime() - new Date(competencia.fecha_inicio).getTime()) / 
    (1000 * 60 * 60 * 24)
  );

  return (
    <div className={`bg-white ${compact ? 'p-4' : 'p-6'} ${className}`}>
      
      {/* Header opcional */}
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={compact ? "text-xl font-bold text-gray-900" : "text-2xl font-bold text-gray-900"}>
              {competencia.nombre}
            </h2>
            <p className="text-gray-600 mt-1">
              Competencia de natación
            </p>
          </div>
          
          {showEditButton && (
            <EntrenadorOnly>
              <Link href={`/competencias/${competencia.id}/editar`}>
                <Button size={compact ? "sm" : "default"} className="inline-flex items-center">
                  <EditIcon className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
            </EntrenadorOnly>
          )}
        </div>
      )}

      {/* Badge de estado */}
      <div className="flex items-center justify-between mb-4">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${estadoInfo.color}`}>
          <TrophyIcon className="h-4 w-4 mr-1" />
          {estadoInfo.estado}
        </div>
        
        <div className="text-sm text-gray-500">
          ID: {competencia.id}
        </div>
      </div>

      {/* Descripción del estado */}
      {!compact && (
        <div className="mb-6">
          <p className="text-gray-600">
            {estadoInfo.descripcion}
          </p>
        </div>
      )}

      {/* Grid de información */}
      <div className={compact ? "space-y-3" : "grid md:grid-cols-2 gap-6"}>
        
        {/* Fechas */}
        <div className="space-y-2">
          <div className="flex items-start space-x-3">
            <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">Fechas</h3>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Inicio:</strong> {formatFecha(competencia.fecha_inicio)}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Fin:</strong> {formatFecha(competencia.fecha_fin)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Duración: {duracion} día{duracion !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Sede */}
          {competencia.sede && (
            <div className="flex items-start space-x-3">
              <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">Sede</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {competencia.sede}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Información técnica */}
        {!compact && (
          <div className="space-y-2">
            <div className="flex items-start space-x-3">
              <UsersIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">Tipo de Curso</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {competencia.curso === 'SC' ? 'Piscina Corta (25m)' : 'Piscina Larga (50m)'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CompetenciaDetail;
