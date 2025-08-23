/**
 * Alert wrapper con mapeo opcional de Figma
 * Extiende shadcn/ui Alert con capacidad de usar variantes de figma-map.json
 */

import * as React from "react"
import { Alert as ShadcnAlert, AlertDescription, AlertTitle } from "./alert"
import { mapFigmaVariant } from "@/lib/figma-utils"
import { cn } from "@/lib/utils"

// Definir el tipo AlertProps basado en el componente Alert
type AlertProps = React.ComponentProps<typeof ShadcnAlert>

export interface AlertWrapperProps extends AlertProps {
  figmaVariant?: string
}

const AlertWrapper = React.forwardRef<
  HTMLDivElement,
  AlertWrapperProps
>(({ figmaVariant, className, ...props }, ref) => {
  // Si no hay figmaVariant, usar Alert de shadcn directamente
  if (!figmaVariant) {
    return <ShadcnAlert ref={ref} className={className} {...props} />
  }

  // Mapear props de Figma a shadcn (Alert tiene color: "warning")
  const mappedProps = mapFigmaVariant<AlertProps>(
    'Alert',
    figmaVariant,
    props
  )

  // Combinar clases CSS
  const combinedClassName = cn(
    mappedProps.className,
    className
  )

  return (
    <ShadcnAlert
      ref={ref}
      {...mappedProps}
      className={combinedClassName}
    />
  )
})

AlertWrapper.displayName = "AlertWrapper"

// También exportar los subcomponentes
export { AlertWrapper, AlertDescription, AlertTitle }
