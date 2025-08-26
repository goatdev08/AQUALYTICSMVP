/**
 * InfoCard - Componente reutilizable para mostrar información contextual
 * 
 * Proporciona una interfaz consistente para mostrar información importante,
 * filtros actuales, guías de usuario y mensajes informativos.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface InfoItem {
  /** Etiqueta del elemento */
  label: string;
  /** Valor del elemento */
  value: string | number;
  /** Si debe mostrar como badge */
  asBadge?: boolean;
  /** Variante del badge si aplica */
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

interface InfoCardProps {
  /** Icono del header (componente de Lucide React) */
  icon?: LucideIcon;
  /** Título de la card */
  title: string;
  /** Descripción opcional */
  description?: string;
  /** Lista de elementos informativos */
  items?: InfoItem[];
  /** Contenido personalizado en lugar de items */
  children?: React.ReactNode;
  /** Texto del botón de acción */
  actionLabel?: string;
  /** Handler para el botón de acción */
  onAction?: () => void;
  /** URL para redirección (alternativa a onAction) */
  actionHref?: string;
  /** Variante visual del componente */
  variant?: 'default' | 'info' | 'warning' | 'success';
  /** Clases CSS adicionales */
  className?: string;
  /** Si debe mostrar el header */
  showHeader?: boolean;
}

const variantStyles = {
  default: {
    container: 'border-gray-200 bg-gray-50',
    icon: 'text-gray-500',
    title: 'text-gray-900',
    description: 'text-gray-600'
  },
  info: {
    container: 'border-blue-200 bg-blue-50',
    icon: 'text-blue-600',
    title: 'text-blue-900',
    description: 'text-blue-700'
  },
  warning: {
    container: 'border-yellow-200 bg-yellow-50',
    icon: 'text-yellow-600',
    title: 'text-yellow-900',
    description: 'text-yellow-700'
  },
  success: {
    container: 'border-green-200 bg-green-50',
    icon: 'text-green-600',
    title: 'text-green-900',
    description: 'text-green-700'
  }
};

export function InfoCard({
  icon: Icon,
  title,
  description,
  items = [],
  children,
  actionLabel,
  onAction,
  actionHref,
  variant = 'default',
  className,
  showHeader = true
}: InfoCardProps) {
  const styles = variantStyles[variant];
  
  return (
    <Card className={cn(styles.container, className)}>
      {showHeader && (
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {Icon && (
                <Icon className={cn("w-5 h-5", styles.icon)} />
              )}
              <div>
                <CardTitle className={cn("text-lg", styles.title)}>
                  {title}
                </CardTitle>
                {description && (
                  <p className={cn("text-sm mt-1", styles.description)}>
                    {description}
                  </p>
                )}
              </div>
            </div>
            
            {actionLabel && (
              <Button
                size="sm"
                variant={variant === 'default' ? 'outline' : 'default'}
                onClick={onAction}
                {...(actionHref && { asChild: true })}
              >
                {actionHref ? (
                  <a href={actionHref}>{actionLabel}</a>
                ) : (
                  actionLabel
                )}
              </Button>
            )}
          </div>
        </CardHeader>
      )}
      
      <CardContent className={showHeader ? "pt-0" : "pt-6"}>
        {children ? (
          children
        ) : items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {item.label}:
                </span>
                {item.asBadge ? (
                  <Badge variant={item.badgeVariant || 'default'}>
                    {item.value}
                  </Badge>
                ) : (
                  <span className="text-sm text-gray-900">
                    {item.value}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className={cn("text-sm", styles.description)}>
            Sin información disponible
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export { InfoCard as default };
