"use client";

/**
 * Formulario para crear y editar nadadores
 * 
 * Usa React Hook Form + Zod para validaciones robustas
 * Integrado con TanStack Query para optimistic updates
 * Componentes shadcn para UI consistente
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Button, 
  Input, 
  Alert, 
  AlertDescription,
  Checkbox 
} from '@/components/ui';
import { useNadadores, type Nadador } from '@/hooks/useNadadores';
import { LoaderIcon, SaveIcon, ArrowLeftIcon } from 'lucide-react';

// ============================================================================
// SCHEMA DE VALIDACIÓN
// ============================================================================

const nadadorSchema = z.object({
  nombre_completo: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(255, 'El nombre no puede exceder 255 caracteres')
    .regex(/^[a-zA-ZáéíóúüÁÉÍÓÚÜñÑ\s]+$/, 'El nombre solo debe contener letras y espacios'),
    
  fecha_nacimiento: z
    .string()
    .min(1, 'La fecha de nacimiento es requerida')
    .refine((date) => {
      const parsedDate = new Date(date);
      const today = new Date();
      return parsedDate <= today;
    }, 'La fecha de nacimiento no puede ser futura')
    .refine((date) => {
      const parsedDate = new Date(date);
      const minDate = new Date('1950-01-01');
      return parsedDate >= minDate;
    }, 'La fecha de nacimiento debe ser posterior a 1950'),
    
  rama: z
    .enum(['F', 'M'], {
      required_error: 'Debe seleccionar una rama',
      invalid_type_error: 'La rama debe ser Femenino o Masculino'
    }),
    
  peso: z
    .string()
    .optional()
    .transform((val) => val === '' ? undefined : val)
    .refine((val) => {
      if (val === undefined) return true;
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 && num <= 200;
    }, 'El peso debe ser un número positivo menor a 200 kg')
});

type NadadorFormData = z.infer<typeof nadadorSchema>;

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

interface NadadorFormProps {
  /** Nadador existente para edición (undefined para creación) */
  nadador?: Nadador;
  /** Título del formulario */
  title: string;
  /** Texto del botón de submit */
  submitButtonText: string;
}

export default function NadadorForm({ 
  nadador, 
  title, 
  submitButtonText 
}: NadadorFormProps) {
  const router = useRouter();
  const { mutations } = useNadadores();
  
  // Configurar form con valores por defecto
  const form = useForm<NadadorFormData>({
    resolver: zodResolver(nadadorSchema),
    defaultValues: {
      nombre_completo: nadador?.nombre_completo || '',
      fecha_nacimiento: nadador?.fecha_nacimiento || '',
      rama: nadador?.rama || undefined,
      peso: nadador?.peso?.toString() || '',
    },
    mode: 'onChange', // Validación en tiempo real
  });

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting, isDirty },
    watch,
    setValue 
  } = form;

  // Watch rama para UI reactiva
  const watchedRama = watch('rama');

  // ========================================
  // HANDLERS
  // ========================================

  const onSubmit = async (data: NadadorFormData) => {
    try {
      const submitData = {
        nombre_completo: data.nombre_completo.trim(),
        fecha_nacimiento: data.fecha_nacimiento,
        rama: data.rama,
        peso: data.peso ? parseFloat(data.peso) : undefined,
      };

      if (nadador) {
        // Editar nadador existente
        await mutations.update.mutateAsync({
          id: nadador.id,
          data: submitData
        });
      } else {
        // Crear nuevo nadador
        await mutations.create.mutateAsync(submitData);
      }
      
      // Redirigir a la lista
      router.push('/nadadores');
    } catch (error) {
      console.error('Error al guardar nadador:', error);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      if (!window.confirm('¿Estás seguro? Se perderán los cambios no guardados.')) {
        return;
      }
    }
    router.back();
  };

  // Estados de loading/error de las mutations
  const isLoading = mutations.create.isLoading || mutations.update.isLoading;
  const mutationError = mutations.create.error || mutations.update.error;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              <p className="mt-2 text-gray-600">
                {nadador 
                  ? 'Modifica los datos del nadador seleccionado' 
                  : 'Completa la información para agregar un nuevo nadador al equipo'
                }
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/nadadores')}
              className="flex items-center space-x-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Volver</span>
            </Button>
          </div>
        </div>

        {/* Error general */}
        {mutationError && (
          <Alert className="mb-6">
            <AlertDescription>
              Error al guardar: {mutationError.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Formulario */}
        <div className="bg-white shadow-lg rounded-lg">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            
            {/* Nombre completo */}
            <div className="space-y-2">
              <label htmlFor="nombre_completo" className="block text-sm font-medium text-gray-700">
                Nombre completo *
              </label>
              <Input
                id="nombre_completo"
                {...register('nombre_completo')}
                placeholder="Ej: María González López"
                disabled={isLoading}
                className={errors.nombre_completo ? 'border-red-500' : ''}
              />
              {errors.nombre_completo && (
                <p className="text-sm text-red-600">{errors.nombre_completo.message}</p>
              )}
            </div>

            {/* Fecha de nacimiento */}
            <div className="space-y-2">
              <label htmlFor="fecha_nacimiento" className="block text-sm font-medium text-gray-700">
                Fecha de nacimiento *
              </label>
              <Input
                id="fecha_nacimiento"
                type="date"
                {...register('fecha_nacimiento')}
                disabled={isLoading}
                className={errors.fecha_nacimiento ? 'border-red-500' : ''}
              />
              {errors.fecha_nacimiento && (
                <p className="text-sm text-red-600">{errors.fecha_nacimiento.message}</p>
              )}
            </div>

            {/* Rama (género) */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Rama *
              </label>
              <div className="flex space-x-6">
                <label className="flex items-center space-x-2">
                  <Checkbox
                    checked={watchedRama === 'F'}
                    onCheckedChange={() => setValue('rama', 'F')}
                    disabled={isLoading}
                  />
                  <span className="text-sm font-medium">Femenino</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox
                    checked={watchedRama === 'M'}
                    onCheckedChange={() => setValue('rama', 'M')}
                    disabled={isLoading}
                  />
                  <span className="text-sm font-medium">Masculino</span>
                </label>
              </div>
              {errors.rama && (
                <p className="text-sm text-red-600">{errors.rama.message}</p>
              )}
            </div>

            {/* Peso (opcional) */}
            <div className="space-y-2">
              <label htmlFor="peso" className="block text-sm font-medium text-gray-700">
                Peso (kg) <span className="text-gray-500">(opcional)</span>
              </label>
              <Input
                id="peso"
                type="number"
                step="0.1"
                min="0"
                max="200"
                {...register('peso')}
                placeholder="Ej: 65.5"
                disabled={isLoading}
                className={errors.peso ? 'border-red-500' : ''}
              />
              {errors.peso && (
                <p className="text-sm text-red-600">{errors.peso.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Campo opcional. Útil para análisis de rendimiento.
              </p>
            </div>

            {/* Preview de categoría */}
            {watchedRama && form.watch('fecha_nacimiento') && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-1">Vista previa</h4>
                <div className="text-sm text-blue-700">
                  <p><strong>Rama:</strong> {watchedRama === 'F' ? 'Femenino' : 'Masculino'}</p>
                  <p><strong>Edad estimada:</strong> {
                    (() => {
                      const birthDate = new Date(form.watch('fecha_nacimiento'));
                      const today = new Date();
                      const age = today.getFullYear() - birthDate.getFullYear();
                      return `${age} años`;
                    })()
                  }</p>
                  <p><strong>Categoría estimada:</strong> {
                    (() => {
                      const birthDate = new Date(form.watch('fecha_nacimiento'));
                      const today = new Date();
                      const age = today.getFullYear() - birthDate.getFullYear();
                      if (age <= 12) return '11-12';
                      if (age <= 14) return '13-14';
                      if (age <= 16) return '15-16';
                      return '17+';
                    })()
                  }</p>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !isDirty}
                className="flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <LoaderIcon className="h-4 w-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <SaveIcon className="h-4 w-4" />
                    <span>{submitButtonText}</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
