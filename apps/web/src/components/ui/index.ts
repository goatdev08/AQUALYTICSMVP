/**
 * Índice unificado de componentes UI
 * 
 * Exporta:
 * 1. Componentes shadcn originales (para uso directo)
 * 2. Wrappers con mapeo Figma (para uso con figmaVariant)
 * 
 * Uso recomendado:
 * - Para proyectos sin Figma: usar componentes shadcn directos
 * - Para proyectos con Figma: usar wrappers cuando tengas variantes específicas
 * - Puedes mezclar ambos enfoques según necesidad
 */

import * as React from "react"

// ============================================================================
// COMPONENTES SHADCN ORIGINALES
// ============================================================================
import { Button as ShadcnButton, buttonVariants } from "./button"
import { Input as ShadcnInput } from "./input"
import { Alert as ShadcnAlert, AlertDescription, AlertTitle } from "./alert"
import { Progress as ShadcnProgress } from "./progress"
import { Checkbox as ShadcnCheckbox } from "./checkbox"
import { Slider as ShadcnSlider } from "./slider"

// Componentes especializados de AquaLytics
import { TimeInput, SimpleTimeInput } from "./time-input"
import { 
  PruebaSelector, 
  SimplePruebaSelector, 
  CascadingPruebaSelector 
} from "./prueba-selector"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs"

// Re-exportar componentes
export { ShadcnButton as Button, buttonVariants }
export { ShadcnInput as Input }
export { ShadcnAlert as Alert, AlertDescription, AlertTitle }
export { ShadcnProgress as Progress }
export { ShadcnCheckbox as Checkbox }
export { ShadcnSlider as Slider }

// Componentes especializados
export { TimeInput, SimpleTimeInput }
export { PruebaSelector, SimplePruebaSelector, CascadingPruebaSelector }
export { Tabs, TabsList, TabsTrigger, TabsContent }

// Tipos derivados de los componentes (para compatibilidad)
export type ButtonProps = React.ComponentProps<typeof ShadcnButton>
export type InputProps = React.ComponentProps<typeof ShadcnInput>
export type AlertProps = React.ComponentProps<typeof ShadcnAlert>
export type ProgressProps = React.ComponentProps<typeof ShadcnProgress>
export type CheckboxProps = React.ComponentProps<typeof ShadcnCheckbox>
export type SliderProps = React.ComponentProps<typeof ShadcnSlider>

// Tipos de componentes especializados
export type { TimeInputProps } from "./time-input"
export type { PruebaSelectorProps } from "./prueba-selector"

// ============================================================================
// WRAPPERS CON MAPEO FIGMA (OPCIONAL)
// ============================================================================
import { ButtonWrapper } from "./button-wrapper"
import { InputWrapper } from "./input-wrapper"
import { AlertWrapper } from "./alert-wrapper"

export { ButtonWrapper }
export { InputWrapper }
export { AlertWrapper }

// Exportar tipos de wrappers
export type { ButtonWrapperProps } from "./button-wrapper"
export type { InputWrapperProps } from "./input-wrapper"
export type { AlertWrapperProps } from "./alert-wrapper"

// ============================================================================
// UTILIDADES DE FIGMA
// ============================================================================
export { 
  mapFigmaVariant, 
  getFigmaComponent, 
  getAvailableFigmaComponents,
  hasFigmaMapping 
} from "@/lib/figma-utils"

// ============================================================================
// ALIASES PARA FACILIDAD DE USO
// ============================================================================

/**
 * Button con soporte opcional de Figma
 * Usa ButtonWrapper pero mantiene nombre familiar
 */
export const FigmaButton = ButtonWrapper

/**
 * Input con soporte opcional de Figma
 */
export const FigmaInput = InputWrapper

/**
 * Alert con soporte opcional de Figma
 */
export const FigmaAlert = AlertWrapper
