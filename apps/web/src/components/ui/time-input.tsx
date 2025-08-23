/**
 * TimeInput - Componente de entrada para tiempos en formato mm:ss.cc
 * 
 * Componente especializado que extiende el Input básico con:
 * - Validación de formato mm:ss.cc en tiempo real
 * - Placeholders inteligentes
 * - Estados de error visuales
 * - Integración con React Hook Form y Zod
 * - Conversión automática a centésimas
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { isValidTimeFormat, parseTimeToCs, formatCsToTime } from "@/lib/time-utils";
import { timeFormatSchema } from "@/types/catalogos";

export interface TimeInputProps extends Omit<React.ComponentProps<"input">, "type" | "value" | "onChange"> {
  /** Valor del tiempo en formato string mm:ss.cc */
  value?: string;
  /** Callback cuando el tiempo cambia (incluye validación) */
  onChange?: (value: string, isValid: boolean, centiseconds?: number) => void;
  /** Mostrar estado de error visualmente */
  error?: boolean;
  /** Mensaje de error personalizado */
  errorMessage?: string;
  /** Placeholder personalizado */
  placeholder?: string;
  /** Permitir valores vacíos */
  allowEmpty?: boolean;
  /** Clase CSS adicional */
  className?: string;
  /** Referencia del input */
  ref?: React.Ref<HTMLInputElement>;
}

/**
 * Componente TimeInput
 */
export const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
  ({ 
    value = "", 
    onChange, 
    error = false, 
    errorMessage,
    placeholder = "mm:ss.cc (ej: 1:23.45)",
    allowEmpty = true,
    className,
    ...props 
  }, ref) => {
    const [inputValue, setInputValue] = React.useState<string>(value);
    const [isValid, setIsValid] = React.useState<boolean>(true);
    const [isDirty, setIsDirty] = React.useState<boolean>(false);

    // Sincronizar con prop value externa
    React.useEffect(() => {
      if (value !== inputValue) {
        setInputValue(value);
        setIsValid(value === "" ? allowEmpty : isValidTimeFormat(value));
      }
    }, [value, inputValue, allowEmpty]);

    // Manejar cambios en el input
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      setIsDirty(true);

      // Validar formato
      const isEmpty = newValue.trim() === "";
      const valid = isEmpty ? allowEmpty : isValidTimeFormat(newValue);
      setIsValid(valid);

      // Callback con información de validación
      if (onChange) {
        let centiseconds: number | undefined;
        if (valid && !isEmpty) {
          try {
            centiseconds = parseTimeToCs(newValue);
          } catch {
            // Si falla el parsing, marcar como inválido
            setIsValid(false);
          }
        }
        onChange(newValue, valid, centiseconds);
      }
    };

    // Formatear automáticamente al perder foco (opcional)
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const value = e.target.value.trim();
      
      // Si el valor es válido y no está vacío, intentar formatear
      if (value && isValid) {
        try {
          const cs = parseTimeToCs(value);
          const formatted = formatCsToTime(cs);
          
          // Solo actualizar si cambió el formato
          if (formatted !== value) {
            setInputValue(formatted);
            if (onChange) {
              onChange(formatted, true, cs);
            }
          }
        } catch {
          // Mantener valor original si hay error
        }
      }

      // Llamar al onBlur original si existe
      props.onBlur?.(e);
    };

    // Estados visuales
    const hasError = error || (isDirty && !isValid);
    const shouldShowError = hasError && errorMessage;

    return (
      <div className="space-y-1">
        <Input
          {...props}
          ref={ref}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          aria-invalid={hasError}
          className={cn(
            // Estilos base
            "font-mono text-center tracking-wider",
            // Estados de error
            hasError && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
            // Estados válidos  
            isValid && isDirty && !hasError && "border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500/20",
            className
          )}
        />
        
        {/* Mensaje de error */}
        {shouldShowError && (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

TimeInput.displayName = "TimeInput";

/**
 * Hook para usar TimeInput con React Hook Form
 * Simplifica la integración con formularios
 */
export function useTimeInputField(name: string, defaultValue = "") {
  const [value, setValue] = React.useState<string>(defaultValue);
  const [centiseconds, setCentiseconds] = React.useState<number | undefined>();
  const [error, setError] = React.useState<string>("");

  const handleChange = (newValue: string, isValid: boolean, cs?: number) => {
    setValue(newValue);
    setCentiseconds(cs);

    // Validar con schema Zod
    const result = timeFormatSchema.safeParse(newValue);
    if (!result.success && newValue.trim() !== "") {
      setError(result.error.errors[0]?.message || "Formato inválido");
    } else {
      setError("");
    }
  };

  return {
    value,
    onChange: handleChange,
    error: !!error,
    errorMessage: error,
    centiseconds,
    isValid: !error && value !== "",
    reset: () => {
      setValue(defaultValue);
      setCentiseconds(undefined);
      setError("");
    }
  };
}

/**
 * TimeInput controlado simple para casos básicos
 */
interface SimpleTimeInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export function SimpleTimeInput({ 
  value, 
  onChange, 
  label, 
  error, 
  required, 
  className 
}: SimpleTimeInputProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-1">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      
      <TimeInput
        value={value}
        onChange={(val) => onChange(val)}
        error={!!error}
        errorMessage={error}
        allowEmpty={!required}
      />
    </div>
  );
}

export { TimeInput as default };
