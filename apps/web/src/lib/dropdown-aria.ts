/**
 * Utilidades para atributos ARIA en dropdowns
 * 
 * Proporciona funciones para generar los atributos ARIA correctos
 * para componentes de dropdown/combobox accesibles según las
 * especificaciones WAI-ARIA.
 * 
 * Referencia: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 */

export interface DropdownAriaOptions {
  /** ID único para el input */
  inputId?: string;
  /** ID único para el listbox */
  listboxId?: string;
  /** ID único para el grupo de opciones */
  groupId?: string;
  /** ID único para las descripciones */
  descriptionId?: string;
  /** Label del input */
  label?: string;
  /** Placeholder del input */
  placeholder?: string;
  /** Descripción adicional */
  description?: string;
}

export interface DropdownAriaProps {
  input: React.InputHTMLAttributes<HTMLInputElement> & {
    'aria-expanded': boolean;
    'aria-haspopup': 'listbox';
    'aria-owns': string;
    'aria-autocomplete': 'list';
    'aria-activedescendant'?: string;
  };
  listbox: React.HTMLAttributes<HTMLElement> & {
    'aria-labelledby': string;
    role: 'listbox';
    id: string;
  };
  option: (optionId: string, index: number, isSelected: boolean) => React.HTMLAttributes<HTMLElement> & {
    role: 'option';
    id: string;
    'aria-selected': boolean;
    'aria-setsize': number;
    'aria-posinset': number;
  };
  label: React.LabelHTMLAttributes<HTMLLabelElement> & {
    htmlFor: string;
  };
  description?: React.HTMLAttributes<HTMLElement> & {
    id: string;
  };
}

/**
 * Genera IDs únicos para componentes de dropdown
 */
export function generateDropdownIds(baseId?: string): Required<Omit<DropdownAriaOptions, 'label' | 'placeholder' | 'description'>> {
  const base = baseId || `dropdown-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    inputId: `${base}-input`,
    listboxId: `${base}-listbox`,
    groupId: `${base}-group`,
    descriptionId: `${base}-description`,
  };
}

/**
 * Genera propiedades ARIA para un dropdown/combobox
 */
export function createDropdownAriaProps({
  inputId = 'dropdown-input',
  listboxId = 'dropdown-listbox',
  groupId = 'dropdown-group',
  descriptionId = 'dropdown-description',
  label,
  placeholder,
  description,
}: DropdownAriaOptions = {}): DropdownAriaProps {
  
  return {
    // Props para el input
    input: {
      id: inputId,
      role: 'combobox',
      'aria-expanded': false, // Se debe actualizar dinámicamente
      'aria-haspopup': 'listbox',
      'aria-owns': listboxId,
      'aria-autocomplete': 'list',
      'aria-labelledby': label ? groupId : undefined,
      'aria-describedby': description ? descriptionId : undefined,
      placeholder,
    },

    // Props para el listbox
    listbox: {
      id: listboxId,
      role: 'listbox',
      'aria-labelledby': groupId,
    },

    // Función para props de opciones
    option: (optionId: string, index: number, isSelected: boolean) => ({
      id: optionId,
      role: 'option',
      'aria-selected': isSelected,
      'aria-setsize': -1, // Se debe actualizar con el total de opciones
      'aria-posinset': index + 1,
    }),

    // Props para el label
    label: {
      id: groupId,
      htmlFor: inputId,
    },

    // Props para la descripción (opcional)
    ...(description && {
      description: {
        id: descriptionId,
      },
    }),
  };
}

/**
 * Actualiza propiedades ARIA dinámicas del input
 */
export function updateInputAriaProps(
  baseProps: DropdownAriaProps['input'],
  updates: {
    isExpanded?: boolean;
    activeDescendant?: string;
    totalOptions?: number;
  }
): DropdownAriaProps['input'] {
  return {
    ...baseProps,
    'aria-expanded': updates.isExpanded ?? baseProps['aria-expanded'],
    'aria-activedescendant': updates.activeDescendant || undefined,
  };
}

/**
 * Actualiza propiedades ARIA de una opción específica
 */
export function updateOptionAriaProps(
  baseProps: ReturnType<DropdownAriaProps['option']>,
  updates: {
    isSelected?: boolean;
    totalOptions?: number;
    position?: number;
  }
): ReturnType<DropdownAriaProps['option']> {
  return {
    ...baseProps,
    'aria-selected': updates.isSelected ?? baseProps['aria-selected'],
    'aria-setsize': updates.totalOptions ?? baseProps['aria-setsize'],
    'aria-posinset': updates.position ?? baseProps['aria-posinset'],
  };
}

/**
 * Roles ARIA comunes para dropdowns
 */
export const DROPDOWN_ROLES = {
  COMBOBOX: 'combobox' as const,
  LISTBOX: 'listbox' as const,
  OPTION: 'option' as const,
  GROUP: 'group' as const,
} as const;

/**
 * Propiedades ARIA comunes
 */
export const ARIA_PROPS = {
  EXPANDED: 'aria-expanded' as const,
  HASPOPUP: 'aria-haspopup' as const,
  OWNS: 'aria-owns' as const,
  AUTOCOMPLETE: 'aria-autocomplete' as const,
  ACTIVEDESCENDANT: 'aria-activedescendant' as const,
  SELECTED: 'aria-selected' as const,
  LABELLEDBY: 'aria-labelledby' as const,
  DESCRIBEDBY: 'aria-describedby' as const,
  SETSIZE: 'aria-setsize' as const,
  POSINSET: 'aria-posinset' as const,
} as const;

/**
 * Utilidad para generar ID de opción
 */
export function createOptionId(baseId: string, optionIndex: number): string {
  return `${baseId}-option-${optionIndex}`;
}

/**
 * Verifica si un elemento está actualmente seleccionado para navegación por teclado
 */
export function isActiveDescendant(elementId: string, activeDescendantId?: string): boolean {
  return elementId === activeDescendantId;
}

