/**
 * CompetenciaFormStepper - Wrapper del CompetenciaForm para uso en stepper
 * 
 * Evita la redirección automática del CompetenciaForm original y proporciona
 * un flujo integrado dentro del contexto del stepper de registro de resultados.
 */

"use client";

import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Button, 
  Alert, 
  AlertDescription,
} from '@/components/ui';
import { useCompetencias, type Competencia } from '@/hooks/useCompetencias';
import { DateRangePicker, type DateRangeValue } from '@/components/competencias/DateRangePicker';
import { LoaderIcon, SaveIcon, MapPinIcon, CheckCircleIcon } from 'lucide-react';
import { mapFigmaVariant } from '@/lib/figma-utils';

// =====================
// Schema de validación reutilizado
// =====================

const competenciaSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre de la competencia es obligatorio')
    .refine(val => val.trim().length >= 3, {
      message: 'El nombre debe tener al menos 3 caracteres válidos'
    })
    .refine(val => val.trim().length <= 255, {
      message: 'El nombre no puede exceder 255 caracteres'
    })
    .refine(val => /^[a-zA-ZáéíóúüÁÉÍÓÚÜñÑ0-9\s\-_\.()]+$/.test(val.trim()), {
      message: 'El nombre contiene caracteres no válidos. Solo se permiten letras, números, espacios, guiones, puntos y paréntesis'
    }),
    
  curso: z
    .enum(['SC', 'LC'], {
      message: 'Debe seleccionar un tipo de curso válido (SC o LC)'
    }),
    
  rango_fechas: z
    .object({
      lower: z.string().min(1, 'La fecha de inicio es obligatoria'),
      upper: z.string().min(1, 'La fecha de fin es obligatoria'),
    })
    .refine((data) => {
      // Validación básica: que la fecha de fin no sea anterior al inicio
      try {
        const fechaInicio = new Date(data.lower);
        const fechaFin = new Date(data.upper);
        return fechaFin >= fechaInicio;
      } catch {
        return false;
      }
    }, {
      message: 'La fecha de fin no puede ser anterior a la fecha de inicio'
    }),
    
  sede: z
    .string()
    .max(255, {
      message: 'La sede no puede exceder 255 caracteres'
    })
    .optional()
});

type CompetenciaFormData = z.infer<typeof competenciaSchema>;

// =====================
// Props del componente
// =====================

interface CompetenciaFormStepperProps {
  onSuccess: (competencia: Competencia) => void;
  onCancel?: () => void;
  className?: string;
}

// =====================
// Componente principal
// =====================

export function CompetenciaFormStepper({
  onSuccess,
  onCancel,
  className = ""
}: CompetenciaFormStepperProps) {
  const { useCreateCompetencia } = useCompetencias();
  const createMutation = useCreateCompetencia();
  
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // =====================
  // Form setup
  // =====================
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    reset,
  } = useForm<CompetenciaFormData>({
    resolver: zodResolver(competenciaSchema),
    mode: 'onChange',
    defaultValues: {
      nombre: '',
      curso: 'SC',
      sede: '',
      rango_fechas: {
        lower: '',
        upper: '',
      },
    },
  });

  // Estado local para DateRangePicker (evitar ciclo de re-renders)
  const [localDateRange, setLocalDateRange] = useState<DateRangeValue | null>(null);
  
  // =====================
  // Handlers
  // =====================
  
  const handleDateRangeChange = useCallback((newRange: DateRangeValue | null) => {
    // Actualizar estado local inmediatamente (evita reset visual)
    setLocalDateRange(newRange);
    
    // Actualizar formulario
    if (newRange?.lower) {
      setValue('rango_fechas.lower', newRange.lower, { shouldValidate: true });
    }
    if (newRange?.upper) {
      setValue('rango_fechas.upper', newRange.upper, { shouldValidate: true });
    }
    
    // Si no hay rango (reset), limpiar ambos campos
    if (!newRange) {
      setValue('rango_fechas.lower', '', { shouldValidate: true });
      setValue('rango_fechas.upper', '', { shouldValidate: true });
    }
  }, [setValue]);

  const onSubmit = useCallback(async (data: CompetenciaFormData) => {
    try {
      const payload = {
        nombre: data.nombre.trim(),
        curso: data.curso,
        fecha_inicio: data.rango_fechas.lower,
        fecha_fin: data.rango_fechas.upper,
        sede: data.sede?.trim() || undefined,
      };
      
      const nuevaCompetencia = await createMutation.mutateAsync(payload);
      
      setSuccessMessage(`Competencia "${nuevaCompetencia.nombre}" creada exitosamente.`);
      
      // Llamar al callback de éxito después de un breve delay para mostrar el mensaje
      setTimeout(() => {
        onSuccess(nuevaCompetencia);
        setSuccessMessage('');
        setLocalDateRange(null); // Limpiar estado local también
        reset();
      }, 1500);
      
    } catch (error) {
      console.error('Error creating competencia:', error);
    }
  }, [createMutation, onSuccess, reset]);

  // =====================
  // Estado derivado
  // =====================
  
  const isLoading = createMutation.isPending;
  const error = createMutation.error;

  // Props de botón siguiendo theme
  const primaryButtonProps = mapFigmaVariant('Button', 'Primary', {});

  // =====================
  // Render
  // =====================
  
  if (successMessage) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Alert className="border-green-200 bg-green-50">
          <CheckCircleIcon className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <LoaderIcon className="h-4 w-4 animate-spin" />
            Seleccionando automáticamente...
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-4 ${className}`}>
      {/* Error general */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error?.message || 'Error al crear la competencia. Inténtelo de nuevo.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Campo: Nombre */}
      <div className="space-y-2">
        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
          Nombre de la competencia <span className="text-red-500">*</span>
        </label>
        <input
          id="nombre"
          type="text"
          {...register('nombre')}
          placeholder="Ej: Campeonato Nacional de Natación 2024"
          disabled={isLoading}
          className={`
            w-full px-3 py-2 border rounded-full text-sm placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
            disabled:bg-gray-50 disabled:text-gray-500
            ${errors.nombre ? 'border-red-300' : 'border-gray-300'}
          `}
        />
        {errors.nombre && (
          <p className="text-sm text-red-600">{errors.nombre.message}</p>
        )}
      </div>

      {/* Campo: Curso */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Tipo de piscina <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              {...register('curso')}
              value="SC"
              disabled={isLoading}
              className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
            />
            <span className="text-sm">
              <span className="font-medium">Piscina Corta</span>
              <span className="text-gray-500 block">25 metros (SC)</span>
            </span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              {...register('curso')}
              value="LC"
              disabled={isLoading}
              className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
            />
            <span className="text-sm">
              <span className="font-medium">Piscina Larga</span>
              <span className="text-gray-500 block">50 metros (LC)</span>
            </span>
          </label>
        </div>
        {errors.curso && (
          <p className="text-sm text-red-600">{errors.curso.message}</p>
        )}
      </div>

      {/* Campo: Rango de Fechas */}
      <DateRangePicker
        value={localDateRange || undefined}
        onChange={handleDateRangeChange}
        label="Fechas de la competencia"
        required
        error={{
          inicio: errors.rango_fechas?.lower?.message,
          fin: errors.rango_fechas?.upper?.message,
          general: errors.rango_fechas?.message
        }}
        disabled={isLoading}
      />

      {/* Campo: Sede (opcional) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Sede <span className="text-sm text-gray-500 font-normal">(opcional)</span>
        </label>
        <div className="relative">
          <input
            type="text"
            {...register('sede')}
            placeholder="Ej: Piscina Olímpica Municipal, Ciudad"
            disabled={isLoading}
            className={`
              w-full px-3 py-2 pl-10 border rounded-full
              text-sm placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
              disabled:bg-gray-50 disabled:text-gray-500
              ${errors.sede ? 'border-red-300' : 'border-gray-300'}
            `}
          />
          <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        {errors.sede && (
          <p className="text-sm text-red-600">{errors.sede.message}</p>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={isLoading || !isValid}
          className="flex-1 flex items-center justify-center"
          {...primaryButtonProps}
        >
          {isLoading ? (
            <>
              <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
              Creando...
            </>
          ) : (
            <>
              <SaveIcon className="w-4 h-4 mr-2" />
              Crear Competencia
            </>
          )}
        </Button>
        
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setLocalDateRange(null); // Limpiar estado local
              reset(); // Limpiar formulario
              onCancel();
            }}
            disabled={isLoading}
            className="px-6"
          >
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}

export default CompetenciaFormStepper;
