"use client";

/**
 * Componente para mostrar información detallada de la categoría de un nadador
 */

import React from 'react';
import { Calendar, TrendingUp, Users, Info } from 'lucide-react';
import { getInfoCategoria, calcularProximoCambioCategoria, getNombreCategoria } from '@/lib/categoria-utils';
import { Alert, AlertDescription } from '@/components/ui';

interface CategoriaInfoProps {
  categoriaActual: string;
  fechaNacimiento: Date;
  edadActual: number;
  className?: string;
}

export default function CategoriaInfo({ 
  categoriaActual, 
  fechaNacimiento, 
  edadActual, 
  className = "" 
}: CategoriaInfoProps) {
  const infoCategoria = getInfoCategoria(categoriaActual);
  const proximoCambio = calcularProximoCambioCategoria(fechaNacimiento);

  if (!infoCategoria) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Categoría no reconocida: {categoriaActual}
        </AlertDescription>
      </Alert>
    );
  }

  const formatearFecha = (fecha: Date): string => {
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const diasHastaCambio = proximoCambio 
    ? Math.ceil((proximoCambio.fechaCambio.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Información actual */}
      <div className="bg-accent/20 border border-accent/30 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <Users className="h-5 w-5 text-accent-foreground mr-2" />
          <h3 className="text-lg font-semibold text-accent-foreground">Categoría Actual</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Categoría</p>
            <p className="text-2xl font-bold text-foreground">{getNombreCategoria(categoriaActual)}</p>
            <p className="text-xs text-muted-foreground mt-1">{infoCategoria.descripcion}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-1">Edad actual</p>
            <p className="text-2xl font-bold text-foreground">{edadActual} años</p>
            <p className="text-xs text-muted-foreground mt-1">
              Rango de categoría: {infoCategoria.edadMinima}
              {infoCategoria.edadMaxima ? `-${infoCategoria.edadMaxima}` : '+'} años
            </p>
          </div>
        </div>
      </div>

      {/* Información de próximo cambio */}
      {proximoCambio && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <TrendingUp className="h-5 w-5 text-amber-600 mr-2" />
            <h4 className="text-md font-semibold text-amber-900">Próximo Cambio de Categoría</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-amber-700 mb-1">Siguiente categoría</p>
              <p className="text-lg font-bold text-amber-900">
                {getNombreCategoria(proximoCambio.categoriaSiguiente)}
              </p>
            </div>
            
            <div>
              <div className="flex items-center text-sm text-amber-700 mb-1">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Fecha de cambio</span>
              </div>
              <p className="text-lg font-bold text-amber-900">
                {formatearFecha(proximoCambio.fechaCambio)}
              </p>
              {diasHastaCambio && diasHastaCambio > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  {diasHastaCambio > 30 
                    ? `${Math.round(diasHastaCambio / 30)} mes(es)`
                    : `${diasHastaCambio} día(s)`
                  } restantes
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Información adicional - Solo mostrar para menores de 17 años */}
      {!proximoCambio && edadActual < 17 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center">
            <Info className="h-4 w-4 text-primary mr-2" />
            <p className="text-sm text-foreground">
              <strong>Categoría Mayor:</strong> Este nadador ya se encuentra en la categoría de mayor edad (17+).
            </p>
          </div>
        </div>
      )}

      {/* Nota informativa - Compacta para 17+, completa para menores */}
      {edadActual >= 17 ? (
        <div className="text-xs text-muted-foreground text-center">
          💡 Categoría calculada según edad al momento de la competencia.
        </div>
      ) : (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded p-3">
          💡 <strong>Nota:</strong> Las categorías se calculan según la edad del nadador al momento de la competencia. 
          La información mostrada refleja la categoría actual basada en la fecha de hoy.
        </div>
      )}
    </div>
  );
}
