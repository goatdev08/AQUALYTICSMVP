'use client';

/**
 * Componente KPICard - Tarjeta de KPI reutilizable
 * 
 * Muestra una métrica individual con icono, label y valor.
 * Tema verde consistente con shadcn/ui.
 */

import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

export interface KPICardProps {
  /** Título/label del KPI */
  label: string;
  /** Valor principal del KPI */
  value: string | number;
  /** Icono opcional para mostrar */
  icon?: ReactNode;
  /** Descripción adicional opcional */
  description?: string;
  /** Valor de progreso (0-100) para mostrar barra de progreso */
  progress?: number;
  /** Estado de carga */
  isLoading?: boolean;
  /** Variante de color */
  variant?: 'default' | 'success' | 'warning' | 'info';
  /** Clase CSS adicional */
  className?: string;
}

export function KPICard({
  label,
  value,
  icon,
  description,
  progress,
  isLoading = false,
  variant = 'default',
  className = ''
}: KPICardProps) {
  // Configuración de colores por variante (tema verde)
  const variantStyles = {
    default: {
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      valueBg: 'bg-green-50',
      valueText: 'text-green-900'
    },
    success: {
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      valueBg: 'bg-emerald-50',
      valueText: 'text-emerald-900'
    },
    warning: {
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      valueBg: 'bg-yellow-50',
      valueText: 'text-yellow-900'
    },
    info: {
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      valueBg: 'bg-blue-50',
      valueText: 'text-blue-900'
    }
  };

  const styles = variantStyles[variant];

  if (isLoading) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
          {progress !== undefined && (
            <div className="mt-4">
              <Skeleton className="h-2 w-full" />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          {/* Icono */}
          {icon && (
            <div className={`p-3 rounded-md ${styles.iconBg}`}>
              <div className={`h-6 w-6 ${styles.iconColor}`}>
                {icon}
              </div>
            </div>
          )}
          
          {/* Contenido principal */}
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">
              {label}
            </p>
            <div className={`inline-flex items-baseline px-3 py-1 rounded-md ${styles.valueBg}`}>
              <p className={`text-2xl font-bold ${styles.valueText}`}>
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
            </div>
            {description && (
              <p className="text-xs text-gray-500 mt-2">
                {description}
              </p>
            )}
          </div>
        </div>
        
        {/* Barra de progreso opcional */}
        {progress !== undefined && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Progreso</span>
              <span>{progress}%</span>
            </div>
            <Progress 
              value={progress} 
              className="h-2"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default KPICard;
