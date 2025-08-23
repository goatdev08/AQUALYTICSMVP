/**
 * Button wrapper con mapeo opcional de Figma
 * Extiende shadcn/ui Button con capacidad de usar variantes de figma-map.json
 * 
 * Uso:
 * - Normal: <Button variant="outline">Click</Button> (shadcn estándar)
 * - Con Figma: <Button figmaVariant="buttonsolid">Click</Button>
 * - Combinado: <Button figmaVariant="buttonborder" className="extra-class">Click</Button>
 */

import * as React from "react"
import { Button as ShadcnButton } from "./button"
import { mapFigmaVariant } from "@/lib/figma-utils"
import { cn } from "@/lib/utils"

// Definir el tipo ButtonProps basado en el componente Button
type ButtonProps = React.ComponentProps<typeof ShadcnButton>

// Extender props de shadcn con figmaVariant opcional
export interface ButtonWrapperProps extends ButtonProps {
  figmaVariant?: 'buttonsolid' | 'buttonborder' | string
}

const ButtonWrapper = React.forwardRef<
  HTMLButtonElement,
  ButtonWrapperProps
>(({ figmaVariant, className, ...props }, ref) => {
  // Si no hay figmaVariant, usar Button de shadcn directamente
  if (!figmaVariant) {
    return <ShadcnButton ref={ref} className={className} {...props} />
  }

  // Mapear props de Figma a shadcn
  const mappedProps = mapFigmaVariant<ButtonProps>(
    'Button',
    figmaVariant,
    props // fallback a las props normales
  )

  // Combinar clases CSS (figma + custom)
  const combinedClassName = cn(
    mappedProps.className,
    className
  )

  return (
    <ShadcnButton
      ref={ref}
      {...mappedProps}
      className={combinedClassName}
    />
  )
})

ButtonWrapper.displayName = "ButtonWrapper"

export { ButtonWrapper }
