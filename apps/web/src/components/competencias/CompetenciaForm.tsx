"use client";

/**
 * Formulario para crear y editar competencias
 * 
 * Usa React Hook Form + Zod para validaciones robustas
 * Integrado con TanStack Query para optimistic updates
 * Componentes Figma + shadcn/ui para UI consistente con tema "success"
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Button, 
  Alert, 
  AlertDescription,
} from '@/components/ui';
import { useCompetencias, type Competencia } from '@/hooks/useCompetencias';
import { DateRangePicker, type DateRangeValue } from './DateRangePicker';
import { LoaderIcon, SaveIcon, ArrowLeftIcon, MapPinIcon } from 'lucide-react';
import { mapFigmaVariant } from '@/lib/figma-utils';

// ============================================================================
// SCHEMA DE VALIDACIÓN
// ============================================================================

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
      lower: z.string().min(1, 'La fecha de inicio es requerida'),
      upper: z.string().min(1, 'La fecha de fin es requerida'),
    })
    .superRefine((data, ctx) => {
      // Validar fechas válidas
      if (!data.lower || !data.upper) {
        if (!data.lower) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'La fecha de inicio es requerida',
            path: ['lower']
          });
        }
        if (!data.upper) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'La fecha de fin es requerida',
            path: ['upper']
          });
        }
        return;
      }

      const fechaInicio = new Date(data.lower);
      const fechaFin = new Date(data.upper);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      // Validar que las fechas sean válidas
      if (isNaN(fechaInicio.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La fecha de inicio no es válida',
          path: ['lower']
        });
        return;
      }

      if (isNaN(fechaFin.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La fecha de fin no es válida',
          path: ['upper']
        });
        return;
      }

      // Validar que la fecha de inicio no sea muy antigua (máximo 6 años atrás para registros históricos)
      const seisAñosAtras = new Date(hoy.getFullYear() - 6, hoy.getMonth(), hoy.getDate());
      if (fechaInicio < seisAñosAtras) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La fecha de inicio no puede ser anterior a 6 años (para registros históricos)',
          path: ['lower']
        });
      }

      // Validar que la fecha de fin no sea anterior al inicio
      if (fechaFin < fechaInicio) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La fecha de fin no puede ser anterior a la fecha de inicio',
          path: ['upper']
        });
      }

      // Validar duración máxima (30 días)
      const duracion = Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24));
      if (duracion > 30) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La duración de la competencia no puede exceder 30 días',
          path: ['upper']
        });
      }

      // Validar que no sea muy lejana en el futuro
      const cincoAñosEnFuturo = new Date(hoy.getFullYear() + 5, hoy.getMonth(), hoy.getDate());
      if (fechaInicio > cincoAñosEnFuturo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La fecha de inicio no puede ser más de 5 años en el futuro',
          path: ['lower']
        });
      }

      if (fechaFin > cincoAñosEnFuturo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La fecha de fin no puede ser más de 5 años en el futuro',
          path: ['upper']
        });
      }
    }),
    
  sede: z
    .string()
    .optional()
    .refine(val => !val || val.trim() === '' || val.trim().length <= 255, {
      message: 'La sede no puede exceder 255 caracteres'
    })
    .refine(val => !val || val.trim() === '' || /^[a-zA-ZáéíóúüÁÉÍÓÚÜñÑ0-9\s\-_\.(),]+$/.test(val.trim()), {
      message: 'La sede contiene caracteres no válidos. Solo se permiten letras, números, espacios, guiones, puntos, comas y paréntesis'
    })
});

type CompetenciaFormData = z.infer<typeof competenciaSchema>;

// ============================================================================
// TIPOS DE PROPS
// ============================================================================

interface CompetenciaFormProps {
  competencia?: Competencia;
  mode: 'create' | 'edit';
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Convierte competencia existente a formato del formulario
 */
function competenciaToFormData(competencia: Competencia): CompetenciaFormData {
  return {
    nombre: competencia.nombre,
    curso: competencia.curso,
    rango_fechas: {
      lower: competencia.rango_fechas.lower,
      upper: competencia.rango_fechas.upper,
    },
    sede: competencia.sede || '',
  };
}

/**
 * Extrae mensaje de error legible desde el error del servidor
 */
function getErrorMessage(error: any): string {
  // Error de red o timeout
  if (!error?.response) {
    return 'Error de conexión. Verifica tu conexión a internet e inténtalo de nuevo.';
  }
  
  const status = error.response?.status;
  const detail = error.response?.data?.detail;
  
  // Error de validación (422)
  if (status === 422) {
    if (typeof detail === 'string') {
      return detail;
    }
    // Si es un array de errores de validación de Pydantic
    if (Array.isArray(detail)) {
      const firstError = detail[0];
      return firstError?.msg || 'Error de validación en los datos enviados';
    }
    return 'Los datos proporcionados no son válidos';
  }
  
  // Error de autorización
  if (status === 401) {
    return 'No tienes autorización para realizar esta acción. Inicia sesión nuevamente.';
  }
  
  if (status === 403) {
    return 'No tienes permisos suficientes para realizar esta acción.';
  }
  
  // Error no encontrado
  if (status === 404) {
    return 'La competencia no fue encontrada.';
  }
  
  // Error del servidor
  if (status >= 500) {
    return 'Error interno del servidor. Inténtalo de nuevo más tarde.';
  }
  
  // Error genérico
  return detail || 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function CompetenciaForm({ competencia, mode }: CompetenciaFormProps) {
  const router = useRouter();
  const { useCreateCompetencia, useUpdateCompetencia } = useCompetencias();
  
  // ========================================
  // MUTATIONS
  // ========================================
  
  const createMutation = useCreateCompetencia();
  const updateMutation = useUpdateCompetencia();
  
  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  // ========================================
  // FORMULARIO CON REACT HOOK FORM
  // ========================================
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CompetenciaFormData>({
    resolver: zodResolver(competenciaSchema),
    defaultValues: competencia ? competenciaToFormData(competencia) : {
      nombre: '',
      curso: 'SC',
      rango_fechas: {
        lower: '',
        upper: ''
      },
      sede: '',
    }
  });

  // Watch para el DateRangePicker
  const rangoFechas = watch('rango_fechas');

  // ========================================
  // HANDLERS
  // ========================================
  
  const onSubmit = async (data: CompetenciaFormData) => {
    console.log('🚀 onSubmit ejecutado con datos:', data);
    console.log('🔍 Errores de validación:', errors);
    
    try {
      // Limpiar y preparar los datos
      const nombreLimpio = data.nombre.trim();
      const sedeLimpia = data.sede && data.sede.trim() !== '' ? data.sede.trim() : undefined;
      
      console.log('✅ Datos procesados:', { nombreLimpio, sedeLimpia, rango_fechas: data.rango_fechas });
      
      if (mode === 'create') {
        console.log('📝 Creando competencia...');
        const nuevaCompetencia = await createMutation.mutateAsync({
          nombre: nombreLimpio,
          curso: data.curso,
          fecha_inicio: data.rango_fechas.lower,
          fecha_fin: data.rango_fechas.upper,
          sede: sedeLimpia,
        });
        
        console.log('✅ Competencia creada exitosamente:', nuevaCompetencia);
        // Navegar de vuelta a la lista de competencias
        router.push('/competencias');
      } else {
        if (!competencia?.id) throw new Error('ID de competencia no válido');
        
        await updateMutation.mutateAsync({
          id: competencia.id,
          updates: {
            nombre: nombreLimpio,
            curso: data.curso,
            fecha_inicio: data.rango_fechas.lower,
            fecha_fin: data.rango_fechas.upper,
            sede: sedeLimpia,
          }
        });
        
        // Navegar de vuelta a la lista de competencias
        router.push('/competencias');
      }
    } catch (error) {
      console.error('❌ Error al guardar competencia:', error);
      console.error('❌ Error detalles:', {
        message: error instanceof Error ? error.message : 'Error desconocido',
        response: (error as any)?.response?.data,
        status: (error as any)?.response?.status
      });
    }
  };

  const handleCancel = () => {
    // Siempre regresar a la lista de competencias
    router.push('/competencias');
  };

  const handleDateRangeChange = (value: DateRangeValue | null) => {
    if (value) {
      setValue('rango_fechas', value, { shouldValidate: true });
    }
  };

  // ========================================
  // PROPS DE COMPONENTES FIGMA
  // ========================================
  
  const primaryButtonProps = mapFigmaVariant('Button', 'buttonsolid', {});
  
  const secondaryButtonProps = mapFigmaVariant('Button', 'buttonborder', {});

  // ========================================
  // RENDER
  // ========================================
  
  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={(e) => {
        console.log('🔥 Form submit disparado');
        handleSubmit(onSubmit)(e);
      }} className="space-y-6">
        
        {/* Header */}
        <div className="border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Nueva Competencia' : 'Editar Competencia'}
          </h1>
          <p className="text-gray-600 mt-1">
            {mode === 'create' 
              ? 'Crea una nueva competencia para tu equipo'
              : 'Modifica los datos de la competencia'
            }
          </p>
        </div>

        {/* Error general */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Error al {mode === 'create' ? 'crear' : 'actualizar'} competencia:</strong>
              <br />
              {getErrorMessage(error)}
            </AlertDescription>
          </Alert>
        )}

        {/* Campo: Nombre */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Nombre de la competencia <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('nombre')}
            placeholder="Ej: Copa Nacional de Natación 2024"
            disabled={isLoading}
            className={`
              w-full px-3 py-2 border rounded-full
              text-sm placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
              disabled:bg-gray-50 disabled:text-gray-500
              ${errors.nombre ? 'border-red-300' : 'border-gray-300'}
            `}
          />
          {errors.nombre && (
            <p className="text-sm text-red-600 mt-1">
              {errors.nombre.message}
            </p>
          )}
        </div>

        {/* Campo: Tipo de Curso */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Tipo de curso <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            {/* Opción SC (25m) */}
            <label className={`
              flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer
              transition-all duration-200 hover:bg-green-50
              ${watch('curso') === 'SC' 
                ? 'border-green-500 bg-green-50 text-green-700' 
                : 'border-gray-200 hover:border-green-300'
              }
            `}>
              <input
                type="radio"
                {...register('curso')}
                value="SC"
                disabled={isLoading}
                className="sr-only"
              />
              <div className="text-center">
                <div className="text-lg font-semibold">SC</div>
                <div className="text-sm text-gray-600">Piscina Corta (25m)</div>
              </div>
            </label>

            {/* Opción LC (50m) */}
            <label className={`
              flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer
              transition-all duration-200 hover:bg-green-50
              ${watch('curso') === 'LC' 
                ? 'border-green-500 bg-green-50 text-green-700' 
                : 'border-gray-200 hover:border-green-300'
              }
            `}>
              <input
                type="radio"
                {...register('curso')}
                value="LC"
                disabled={isLoading}
                className="sr-only"
              />
              <div className="text-center">
                <div className="text-lg font-semibold">LC</div>
                <div className="text-sm text-gray-600">Piscina Larga (50m)</div>
              </div>
            </label>
          </div>
          {errors.curso && (
            <p className="text-sm text-red-600 mt-1">
              {errors.curso.message}
            </p>
          )}
        </div>

        {/* Campo: Rango de Fechas */}
        <DateRangePicker
          value={rangoFechas}
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
            <p className="text-sm text-red-600 mt-1">
              {errors.sede.message}
            </p>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 flex items-center justify-center"
            {...primaryButtonProps}
          >
            {isLoading ? (
              <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <SaveIcon className="h-4 w-4 mr-2" />
            )}
            {mode === 'create' ? 'Crear Competencia' : 'Guardar Cambios'}
          </Button>

          <Button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center"
            {...secondaryButtonProps}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CompetenciaForm;
