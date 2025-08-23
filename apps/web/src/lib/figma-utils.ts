/**
 * Utilidades para mapeo de componentes Figma a shadcn/ui
 * Enfoque MVP: Simple, flexible y opcional
 */

import figmaMap from '@/styles/figma-map.json'

// Tipos para figma-map.json
export interface FigmaComponent {
  tag: string
  nodeId?: string
  properties?: Record<string, string | number | boolean>
  variants?: FigmaVariant[]
  paletteFromNode?: boolean
}

export interface FigmaVariant {
  label: string
  nodeId: string
  properties: Record<string, string | number | boolean>
}

export interface FigmaMap {
  tags: Record<string, string>
  components: Record<string, FigmaComponent>
}

// Typed figma map
const typedFigmaMap = figmaMap as FigmaMap

/**
 * Mapea propiedades de Figma a props de shadcn/ui
 * Enfoque flexible: solo aplica mapeo si existe en figma-map.json
 * 
 * @param componentName - Nombre del componente (ej: "Button")
 * @param variantLabel - Label específico si usa variantes (ej: "buttonsolid")
 * @param fallbackProps - Props por defecto de shadcn
 * @returns Props mapeados o fallback
 */
export function mapFigmaVariant<T = Record<string, string | number | boolean>>(
  componentName: string,
  variantLabel?: string,
  fallbackProps: T = {} as T
): T {
  const component = typedFigmaMap.components[componentName]
  
  // Si no existe mapeo en Figma, usar fallback (shadcn estándar)
  if (!component) {
    return fallbackProps
  }

  let figmaProps: Record<string, string | number | boolean> = {}

  // Si tiene variantes y se especifica un label
  if (component.variants && variantLabel) {
    const variant = component.variants.find(v => v.label === variantLabel)
    if (variant) {
      figmaProps = variant.properties
    }
  }
  // Si no tiene variantes, usar properties directas
  else if (component.properties) {
    figmaProps = component.properties
  }

  // Convertir props de Figma a props de shadcn
  const mappedProps = convertFigmaPropsToShadcn(figmaProps)

  // Combinar con fallback props, dando prioridad a Figma
  return {
    ...fallbackProps,
    ...mappedProps,
  } as T
}

/**
 * Convierte propiedades de Figma a formato shadcn
 * Mapea nombres y valores específicos
 */
function convertFigmaPropsToShadcn(figmaProps: Record<string, string | number | boolean>): Record<string, string | number | boolean> {
  const shadcnProps: Record<string, string | number | boolean> = {}

  for (const [key, value] of Object.entries(figmaProps)) {
    switch (key) {
      // Mapeos de color
      case 'color':
        if (value === 'success') {
          // Para tema green, 'success' se mapea a 'default' en shadcn (usa primary)
          shadcnProps.variant = shadcnProps.variant || 'default'
        } else if (value === 'warning') {
          shadcnProps.variant = 'destructive' // shadcn no tiene warning, usar destructive
        } else if (value === 'default') {
          shadcnProps.variant = 'secondary'
        }
        break

      // Mapeos de variante
      case 'variant':
        if (value === 'solid') {
          shadcnProps.variant = 'default'
        } else if (value === 'bordered') {
          shadcnProps.variant = 'outline'
        } else if (value === 'flat') {
          shadcnProps.variant = 'secondary'
        } else if (value === 'shadow') {
          shadcnProps.variant = 'default'
          shadcnProps.className = 'shadow-lg'
        } else {
          shadcnProps.variant = value
        }
        break

      // Mapeos de tamaño
      case 'size':
        // shadcn usa: "default" | "sm" | "lg" | "icon"
        if (value === 'md') {
          shadcnProps.size = 'default'
        } else {
          shadcnProps.size = value
        }
        break

      // Mapeos de estado
      case 'isDisabled':
        shadcnProps.disabled = value
        break

      case 'isIconOnly':
        if (value) {
          shadcnProps.size = 'icon'
        }
        break

      // Props directas (sin mapeo necesario)
      case 'radius':
      case 'state':
      case 'lineThrough':
      case 'labelPlacement':
      case 'hovered':
      case 'selected':
        // Estos se pueden pasar directamente como className o data attributes
        shadcnProps[`data-${key.toLowerCase()}`] = value
        break

      default:
        // Props no reconocidas se pasan como data attributes
        shadcnProps[`data-${key.toLowerCase()}`] = value
        break
    }
  }

  return shadcnProps
}

/**
 * Obtiene la configuración completa de un componente Figma
 * Útil para debugging y desarrollo
 */
export function getFigmaComponent(componentName: string): FigmaComponent | null {
  return typedFigmaMap.components[componentName] || null
}

/**
 * Lista todos los componentes disponibles en figma-map
 */
export function getAvailableFigmaComponents(): string[] {
  return Object.keys(typedFigmaMap.components)
}

/**
 * Verifica si un componente tiene mapeo en Figma
 */
export function hasFigmaMapping(componentName: string): boolean {
  return componentName in typedFigmaMap.components
}
