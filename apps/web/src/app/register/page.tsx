'use client';

/**
 * Página de Register - AquaLytics
 * 
 * Página de registro funcional con:
 * - React Hook Form + Zod para validación
 * - Selector de rol (entrenador/atleta)
 * - Integración con Supabase Auth vía useAuth
 * - UI con shadcn/ui + tema "green"
 * - Confirmación de contraseña
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { 
  Button, 
  Input, 
  Alert, 
  AlertDescription 
} from '@/components/ui';
import { 
  EyeIcon, 
  EyeOffIcon, 
  LoaderIcon, 
  AlertCircleIcon,
  UserIcon,
  ShieldIcon
} from 'lucide-react';

// Esquema de validación con Zod
const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Formato de email inválido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z
    .string()
    .min(1, 'Debes confirmar tu contraseña'),
  rol: z.enum(['entrenador', 'atleta'], {
    message: 'Debes seleccionar un rol',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp, isAuthenticated } = useAuth();

  // React Hook Form con validación Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      rol: 'atleta', // Valor por defecto
    },
  });

  const selectedRol = watch('rol');

  // Si ya está autenticado, no debería ver esta página
  if (isAuthenticated) {
    return null;
  }

  // Manejar envío del formulario
  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...signUpData } = data;
      await signUp.mutateAsync(signUpData);
      // La redirección se maneja automáticamente en useAuth
      reset();
    } catch (error) {
      console.error('Error en registro:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 mb-4">
            <span className="text-2xl">🏊‍♂️</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Únete a AquaLytics
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Crea tu cuenta para empezar a analizar tu natación
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium leading-none">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Rol */}
          <div className="space-y-3">
            <label className="text-sm font-medium leading-none">
              ¿Cuál es tu rol?
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Opción Atleta */}
              <label
                className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedRol === 'atleta'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <input
                  type="radio"
                  value="atleta"
                  {...register('rol')}
                  className="sr-only"
                />
                <UserIcon className={`h-6 w-6 mb-2 ${
                  selectedRol === 'atleta' ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <span className={`text-sm font-medium ${
                  selectedRol === 'atleta' ? 'text-primary' : 'text-foreground'
                }`}>
                  Atleta
                </span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  Ver resultados y estadísticas
                </span>
              </label>

              {/* Opción Entrenador */}
              <label
                className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedRol === 'entrenador'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <input
                  type="radio"
                  value="entrenador"
                  {...register('rol')}
                  className="sr-only"
                />
                <ShieldIcon className={`h-6 w-6 mb-2 ${
                  selectedRol === 'entrenador' ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <span className={`text-sm font-medium ${
                  selectedRol === 'entrenador' ? 'text-primary' : 'text-foreground'
                }`}>
                  Entrenador
                </span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  Gestionar y crear contenido
                </span>
              </label>
            </div>
            {errors.rol && (
              <p className="text-sm text-destructive">
                {errors.rol.message}
              </p>
            )}
          </div>

          {/* Contraseña */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium leading-none">
              Contraseña
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Al menos 6 caracteres"
                {...register('password')}
                className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOffIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirmar Contraseña */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium leading-none">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repite tu contraseña"
                {...register('confirmPassword')}
                className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOffIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Error del servidor */}
          {signUp.error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>
                {(signUp.error as Error)?.message || 'Error al crear cuenta'}
              </AlertDescription>
            </Alert>
          )}

          {/* Botón de envío */}
          <Button
            type="submit"
            className="w-full"
            disabled={signUp.isLoading}
          >
            {signUp.isLoading ? (
              <>
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              'Crear Cuenta'
            )}
          </Button>
        </form>

        {/* Enlaces adicionales */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Inicia sesión aquí
            </Link>
          </p>
          
          <p className="text-xs text-muted-foreground">
            <Link
              href="/"
              className="hover:underline"
            >
              ← Volver al inicio
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
