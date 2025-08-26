/**
 * EmptyState - Componente reutilizable para estados vacíos
 * 
 * Proporciona una interfaz consistente para mostrar cuando no hay datos disponibles,
 * con iconos, mensajes descriptivos y CTAs opcionales.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  /** Icono a mostrar (componente de Lucide React) */
  icon?: LucideIcon;
  /** Título principal del estado vacío */
  title: string;
  /** Descripción detallada del estado */
  description: string;
  /** Texto del botón de acción principal */
  actionLabel?: string;
  /** Handler para el botón de acción principal */
  onAction?: () => void;
  /** URL para redirección (alternativa a onAction) */
  actionHref?: string;
  /** Texto del botón secundario */
  secondaryActionLabel?: string;
  /** Handler para el botón secundario */
  onSecondaryAction?: () => void;
  /** Información adicional a mostrar */
  additionalInfo?: string;
  /** Variante visual del componente */
  variant?: 'default' | 'info' | 'warning' | 'success';
  /** Clases CSS adicionales */
  className?: string;
  /** Si debe mostrar como card o solo contenido */
  asCard?: boolean;
}

const variantStyles = {
  default: {
    container: 'border-gray-200 bg-gray-50',
    icon: 'text-gray-400',
    title: 'text-gray-900',
    description: 'text-gray-600',
    additionalInfo: 'text-gray-500'
  },
  info: {
    container: 'border-blue-200 bg-blue-50',
    icon: 'text-blue-500',
    title: 'text-blue-900',
    description: 'text-blue-700',
    additionalInfo: 'text-blue-600'
  },
  warning: {
    container: 'border-yellow-200 bg-yellow-50',
    icon: 'text-yellow-500',
    title: 'text-yellow-900',
    description: 'text-yellow-700',
    additionalInfo: 'text-yellow-600'
  },
  success: {
    container: 'border-green-200 bg-green-50',
    icon: 'text-green-500',
    title: 'text-green-900',
    description: 'text-green-700',
    additionalInfo: 'text-green-600'
  }
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  secondaryActionLabel,
  onSecondaryAction,
  additionalInfo,
  variant = 'default',
  className,
  asCard = true
}: EmptyStateProps) {
  const styles = variantStyles[variant];
  
  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center text-center py-12 px-6",
      !asCard && styles.container,
      className
    )}>
      {/* Icono */}
      {Icon && (
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center mb-6",
          variant === 'default' ? 'bg-gray-100' :
          variant === 'info' ? 'bg-blue-100' :
          variant === 'warning' ? 'bg-yellow-100' :
          'bg-green-100'
        )}>
          <Icon className={cn("w-8 h-8", styles.icon)} />
        </div>
      )}
      
      {/* Título */}
      <h3 className={cn("text-lg font-semibold mb-3", styles.title)}>
        {title}
      </h3>
      
      {/* Descripción */}
      <p className={cn("text-sm max-w-md mb-6", styles.description)}>
        {description}
      </p>
      
      {/* Botones de acción */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {actionLabel && (
            <Button
              onClick={onAction}
              {...(actionHref && { asChild: true })}
              className="min-w-32"
            >
              {actionHref ? (
                <a href={actionHref}>{actionLabel}</a>
              ) : (
                actionLabel
              )}
            </Button>
          )}
          
          {secondaryActionLabel && (
            <Button
              variant="outline"
              onClick={onSecondaryAction}
              className="min-w-32"
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
      
      {/* Información adicional */}
      {additionalInfo && (
        <p className={cn("text-xs", styles.additionalInfo)}>
          {additionalInfo}
        </p>
      )}
    </div>
  );
  
  if (asCard) {
    return (
      <Card className={cn(styles.container, className)}>
        <CardContent className="p-0">
          {content}
        </CardContent>
      </Card>
    );
  }
  
  return content;
}

export { EmptyState as default };
