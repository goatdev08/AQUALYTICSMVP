/**
 * Input wrapper con mapeo opcional de Figma
 * Extiende shadcn/ui Input con capacidad de usar variantes de figma-map.json
 */

import * as React from "react"
import { Input as ShadcnInput } from "./input"
import { mapFigmaVariant } from "@/lib/figma-utils"
import { cn } from "@/lib/utils"

// Definir el tipo InputProps basado en el componente Input
type InputProps = React.ComponentProps<typeof ShadcnInput>

export interface InputWrapperProps extends InputProps {
  figmaVariant?: 'Droplistborder' | 'Droplistflat' | string
}

const InputWrapper = React.forwardRef<
  HTMLInputElement,
  InputWrapperProps
>(({ figmaVariant, className, ...props }, ref) => {
  // Si no hay figmaVariant, usar Input de shadcn directamente
  if (!figmaVariant) {
    return <ShadcnInput ref={ref} className={className} {...props} />
  }

  // Mapear props de Figma a shadcn
  const mappedProps = mapFigmaVariant<InputProps>(
    'Input',
    figmaVariant,
    props
  )

  // Combinar clases CSS
  const combinedClassName = cn(
    mappedProps.className,
    className
  )

  return (
    <ShadcnInput
      ref={ref}
      {...mappedProps}
      className={combinedClassName}
    />
  )
})

InputWrapper.displayName = "InputWrapper"

export { InputWrapper }
