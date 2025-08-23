/**
 * PruebaSelector - Componente dropdown para selección de pruebas de natación
 * 
 * Componente especializado que:
 * - Consume el catálogo de pruebas via usePruebas hook
 * - Permite filtrado por estilo, distancia y curso  
 * - Integración con React Hook Form y Zod
 * - Estados de carga y error manejados
 * - Búsqueda/typeahead (versión futura)
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { usePruebas, usePruebasList } from "@/hooks/usePruebas";
import { EstiloNatacion, TipoCurso, PruebaSelection } from "@/types/catalogos";

export interface PruebaSelectorProps {
  /** Valor seleccionado (ID de la prueba) */
  value?: number | string;
  /** Callback cuando cambia la selección */
  onChange?: (prueba: PruebaSelection | null) => void;
  /** Placeholder cuando no hay selección */
  placeholder?: string;
  /** Filtros para limitar las opciones */
  filters?: {
    estilo?: EstiloNatacion;
    distancia?: number;
    curso?: TipoCurso;
  };
  /** Mostrar estado de error */
  error?: boolean;
  /** Mensaje de error */
  errorMessage?: string;
  /** Permitir selección vacía */
  allowEmpty?: boolean;
  /** Deshabilitado */
  disabled?: boolean;
  /** Clase CSS adicional */
  className?: string;
  /** Referencia del select */
  ref?: React.Ref<HTMLSelectElement>;
}

/**
 * Componente PruebaSelector básico
 */
export const PruebaSelector = React.forwardRef<HTMLSelectElement, PruebaSelectorProps>(
  ({ 
    value, 
    onChange, 
    placeholder = "Seleccionar prueba...",
    filters,
    error = false,
    errorMessage,
    allowEmpty = true,
    disabled = false,
    className,
    ...props 
  }, ref) => {
    // Obtener pruebas del catálogo con filtros aplicados
    const { pruebas, isLoading, isError } = usePruebas(filters);
    
    // Estado local para el valor seleccionado
    const [selectedValue, setSelectedValue] = React.useState<string>(
      value ? value.toString() : ""
    );

    // Sincronizar con prop value externa
    React.useEffect(() => {
      const newValue = value ? value.toString() : "";
      if (newValue !== selectedValue) {
        setSelectedValue(newValue);
      }
    }, [value, selectedValue]);

    // Manejar cambio de selección
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedId = e.target.value;
      setSelectedValue(selectedId);

      if (onChange) {
        if (selectedId === "" || selectedId === "0") {
          // Selección vacía
          onChange(null);
        } else {
          // Encontrar la prueba seleccionada
          const selectedPrueba = pruebas.find(p => p.id.toString() === selectedId);
          if (selectedPrueba) {
            onChange({
              id: selectedPrueba.id,
              nombre: selectedPrueba.nombre,
              estilo: selectedPrueba.estilo,
              distancia: selectedPrueba.distancia,
              curso: selectedPrueba.curso,
            });
          }
        }
      }
    };

    // Agrupar pruebas por estilo para mejor organización
    const pruebasPorEstilo = React.useMemo(() => {
      const grupos: Record<string, typeof pruebas> = {};
      
      pruebas.forEach(prueba => {
        if (!grupos[prueba.estilo]) {
          grupos[prueba.estilo] = [];
        }
        grupos[prueba.estilo].push(prueba);
      });

      // Ordenar dentro de cada grupo por distancia
      Object.keys(grupos).forEach(estilo => {
        grupos[estilo].sort((a, b) => a.distancia - b.distancia);
      });

      return grupos;
    }, [pruebas]);

    // Estados visuales
    const hasError = error || isError;
    const isDisabled = disabled || isLoading;

    return (
      <div className="space-y-1">
        <select
          {...props}
          ref={ref}
          value={selectedValue}
          onChange={handleChange}
          disabled={isDisabled}
          aria-invalid={hasError}
          className={cn(
            // Estilos base shadcn/ui 
            "flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            // Estados de error
            hasError && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
            // Estado de carga
            isLoading && "animate-pulse",
            className
          )}
        >
          {/* Opción placeholder */}
          {allowEmpty && (
            <option value="" disabled={!allowEmpty}>
              {isLoading ? "Cargando pruebas..." : placeholder}
            </option>
          )}

          {/* Opciones agrupadas por estilo */}
          {Object.entries(pruebasPorEstilo).map(([estilo, pruebasDelEstilo]) => (
            <optgroup key={estilo} label={estilo}>
              {pruebasDelEstilo.map((prueba) => (
                <option key={prueba.id} value={prueba.id}>
                  {prueba.nombre}
                </option>
              ))}
            </optgroup>
          ))}

          {/* Estado sin datos */}
          {pruebas.length === 0 && !isLoading && (
            <option value="" disabled>
              {isError ? "Error cargando pruebas" : "No hay pruebas disponibles"}
            </option>
          )}
        </select>

        {/* Mensaje de error */}
        {errorMessage && (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        )}

        {/* Estado de error de red */}
        {isError && !errorMessage && (
          <p className="text-sm text-destructive" role="alert">
            Error cargando el catálogo de pruebas
          </p>
        )}
      </div>
    );
  }
);

PruebaSelector.displayName = "PruebaSelector";

/**
 * Hook para usar PruebaSelector con React Hook Form
 */
export function usePruebaSelectorField(defaultValue?: number) {
  const [selectedPrueba, setSelectedPrueba] = React.useState<PruebaSelection | null>(null);
  const [error, setError] = React.useState<string>("");

  const handleChange = (prueba: PruebaSelection | null) => {
    setSelectedPrueba(prueba);
    
    // Limpiar error cuando se selecciona una prueba válida
    if (prueba) {
      setError("");
    }
  };

  const validate = (required = false) => {
    if (required && !selectedPrueba) {
      setError("Debe seleccionar una prueba");
      return false;
    }
    return true;
  };

  return {
    value: selectedPrueba?.id,
    onChange: handleChange,
    error: !!error,
    errorMessage: error,
    selectedPrueba,
    validate,
    reset: () => {
      setSelectedPrueba(null);
      setError("");
    }
  };
}

/**
 * PruebaSelector simplificado para casos básicos
 */
interface SimplePruebaSelectorProps {
  value?: number;
  onChange: (prueba: PruebaSelection | null) => void;
  label?: string;
  error?: string;
  required?: boolean;
  filters?: PruebaSelectorProps['filters'];
  className?: string;
}

export function SimplePruebaSelector({ 
  value, 
  onChange, 
  label, 
  error, 
  required, 
  filters,
  className 
}: SimplePruebaSelectorProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-1">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      
      <PruebaSelector
        value={value}
        onChange={onChange}
        filters={filters}
        error={!!error}
        errorMessage={error}
        allowEmpty={!required}
      />
    </div>
  );
}

/**
 * Selectores en cascada para estilo → distancia → curso
 * Útil para formularios más avanzados
 */
interface CascadingPruebaSelectorProps {
  onPruebaSelected: (prueba: PruebaSelection | null) => void;
  label?: string;
  className?: string;
}

export function CascadingPruebaSelector({ 
  onPruebaSelected, 
  label,
  className 
}: CascadingPruebaSelectorProps) {
  const [selectedEstilo, setSelectedEstilo] = React.useState<EstiloNatacion>();
  const [selectedDistancia, setSelectedDistancia] = React.useState<number>();
  const [selectedCurso, setSelectedCurso] = React.useState<TipoCurso>();
  
  const { estilosDisponibles, getDistancias } = usePruebas();
  
  // Obtener distancias disponibles para el estilo seleccionado
  const distanciasDisponibles = selectedEstilo ? getDistancias(selectedEstilo) : [];
  
  // Reset en cadena cuando cambia el estilo
  React.useEffect(() => {
    setSelectedDistancia(undefined);
    setSelectedCurso(undefined);
    onPruebaSelected(null);
  }, [selectedEstilo, onPruebaSelected]);

  // Reset del curso cuando cambia la distancia
  React.useEffect(() => {
    setSelectedCurso(undefined);
    onPruebaSelected(null);
  }, [selectedDistancia, onPruebaSelected]);

  // Selección final cuando se tienen todos los valores
  React.useEffect(() => {
    if (selectedEstilo && selectedDistancia && selectedCurso) {
      // Aquí se buscaría la prueba específica
      // Por simplicidad, se crea el objeto directamente
      const prueba: PruebaSelection = {
        id: 0, // Se asignaría el ID real en implementación completa
        nombre: `${selectedDistancia}m ${selectedEstilo} ${selectedCurso}`,
        estilo: selectedEstilo,
        distancia: selectedDistancia,
        curso: selectedCurso
      };
      onPruebaSelected(prueba);
    }
  }, [selectedEstilo, selectedDistancia, selectedCurso, onPruebaSelected]);

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <label className="block text-sm font-medium">
          {label}
        </label>
      )}
      
      {/* Selector de estilo */}
      <select
        value={selectedEstilo || ""}
        onChange={(e) => setSelectedEstilo(e.target.value as EstiloNatacion)}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
      >
        <option value="">Seleccionar estilo...</option>
        {estilosDisponibles.map(estilo => (
          <option key={estilo} value={estilo}>
            {estilo}
          </option>
        ))}
      </select>

      {/* Selector de distancia (habilitado cuando hay estilo) */}
      {selectedEstilo && (
        <select
          value={selectedDistancia || ""}
          onChange={(e) => setSelectedDistancia(Number(e.target.value))}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        >
          <option value="">Seleccionar distancia...</option>
          {distanciasDisponibles.map(distancia => (
            <option key={distancia} value={distancia}>
              {distancia}m
            </option>
          ))}
        </select>
      )}

      {/* Selector de curso (habilitado cuando hay estilo y distancia) */}
      {selectedEstilo && selectedDistancia && (
        <select
          value={selectedCurso || ""}
          onChange={(e) => setSelectedCurso(e.target.value as TipoCurso)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        >
          <option value="">Seleccionar curso...</option>
          <option value="SC">Short Course (25m)</option>
          <option value="LC">Long Course (50m)</option>
        </select>
      )}
    </div>
  );
}

export { PruebaSelector as default };
