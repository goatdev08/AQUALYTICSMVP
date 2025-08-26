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
import { Badge as ShadcnBadge, badgeVariants } from "./badge"

// Componentes adicionales shadcn
import { 
  Dialog, DialogTrigger, DialogContent, DialogHeader, 
  DialogFooter, DialogTitle, DialogDescription, DialogClose,
  Sheet, SheetTrigger, SheetContent, SheetHeader,
  SheetFooter, SheetTitle, SheetDescription, SheetClose
} from "./dialog"
import { 
  Table, TableHeader, TableBody, TableCell, 
  TableHead, TableRow, TableCaption, TableFooter 
} from "./table"

// Componentes especializados de AquaLytics
import { TimeInput, SimpleTimeInput } from "./time-input"
import { ThemeToggle, ThemeToggleCompact, ThemeToggleWithLabel } from "./theme-toggle"
import { SkipLinks, Landmark, useSkipLinks } from "./skip-links"
import { AccessibilityInfo, AccessibilityInfoCompact } from "./accessibility-info"
import { Sidebar, MobileSidebar, SidebarContainer } from "./sidebar"
// PruebaSelector components removed - using PruebaSelectorSimplificado from @/components/pruebas
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs"
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "./card"
import { Skeleton } from "./skeleton"
import { 
  Select, SelectContent, SelectItem, SelectTrigger, 
  SelectValue, SelectLabel, SelectGroup, SelectSeparator 
} from "./select"

// Re-exportar componentes
export { ShadcnButton as Button, buttonVariants }
export { ShadcnInput as Input }
export { ShadcnAlert as Alert, AlertDescription, AlertTitle }
export { ShadcnProgress as Progress }
export { ShadcnCheckbox as Checkbox }
export { ShadcnSlider as Slider }
export { ShadcnBadge as Badge, badgeVariants }
export { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter }
export { Skeleton }

// Componentes Dialog y Table
export { 
  Dialog, DialogTrigger, DialogContent, DialogHeader, 
  DialogFooter, DialogTitle, DialogDescription, DialogClose,
  Sheet, SheetTrigger, SheetContent, SheetHeader,
  SheetFooter, SheetTitle, SheetDescription, SheetClose
}
export { 
  Table, TableHeader, TableBody, TableCell, 
  TableHead, TableRow, TableCaption, TableFooter 
}

// Componentes especializados
export { TimeInput, SimpleTimeInput }
export { ThemeToggle, ThemeToggleCompact, ThemeToggleWithLabel }
export { SkipLinks, Landmark, useSkipLinks }
export { AccessibilityInfo, AccessibilityInfoCompact }
export { Sidebar, MobileSidebar, SidebarContainer }
export { Tabs, TabsList, TabsTrigger, TabsContent }
export { 
  Select, SelectContent, SelectItem, SelectTrigger, 
  SelectValue, SelectLabel, SelectGroup, SelectSeparator 
}

// Tipos derivados de los componentes (para compatibilidad)
export type ButtonProps = React.ComponentProps<typeof ShadcnButton>
export type InputProps = React.ComponentProps<typeof ShadcnInput>
export type AlertProps = React.ComponentProps<typeof ShadcnAlert>
export type ProgressProps = React.ComponentProps<typeof ShadcnProgress>
export type CheckboxProps = React.ComponentProps<typeof ShadcnCheckbox>
export type SliderProps = React.ComponentProps<typeof ShadcnSlider>
export type BadgeProps = React.ComponentProps<typeof ShadcnBadge>

// Tipos de componentes especializados
export type { TimeInputProps } from "./time-input"

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
