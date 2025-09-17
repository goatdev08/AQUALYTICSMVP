'use client';

/**
 * Página de Login - AquaLytics
 * 
 * Página de inicio de sesión funcional con:
 * - React Hook Form + Zod para validación
 * - Integración con Supabase Auth vía useAuth
 * - UI con shadcn/ui + tema "green"
 * - Manejo de estados de loading y error
 * - Redirección automática post-login
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  AlertCircleIcon
} from 'lucide-react';

// Esquema de validación con Zod
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Formato de email inválido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // React Hook Form con validación Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // 🎯 REDIRECCIÓN AUTOMÁTICA: Si está autenticado, ir al dashboard
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Mostrar loading mientras se verifica autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <LoaderIcon className="h-8 w-8 animate-spin text-primary mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-medium">🏊‍♂️ AquaLytics</p>
            <p className="text-xs text-muted-foreground">Verificando sesión...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si ya está autenticado, mostrar mensaje mientras redirige
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <LoaderIcon className="h-8 w-8 animate-spin text-primary mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-primary">¡Sesión activa!</p>
            <p className="text-xs text-muted-foreground">Redirigiendo al dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Manejar envío del formulario
  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn.mutateAsync(data);
      // La redirección se maneja automáticamente en useAuth
      reset(); // Limpiar formulario en caso de error
    } catch (error) {
      // El error se maneja automáticamente en useAuth
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-white dark:from-green-950 dark:via-blue-950 dark:to-gray-900 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Card Container */}
        <div className="bg-card/80 backdrop-blur-sm border rounded-2xl p-8 shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <span className="text-white font-bold text-lg">🏊</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              AquaLytics
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Inicia sesión en tu cuenta
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

          {/* Contraseña */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium leading-none">
              Contraseña
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Tu contraseña"
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

          {/* Error del servidor */}
          {signIn.error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>
                {(signIn.error as Error)?.message || 'Error al iniciar sesión'}
              </AlertDescription>
            </Alert>
          )}



          {/* Botón de envío */}
          <Button
            type="submit"
            className="w-full"
            disabled={signIn.isLoading}
          >
            {signIn.isLoading ? (
              <>
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                {signIn.isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </Button>


        </form>

        {/* Enlaces adicionales */}
        <div className="text-center space-y-2 mt-6">
          <p className="text-sm text-muted-foreground">
            ¿No tienes una cuenta?{' '}
            <Link
              href="/register"
              className="text-primary hover:underline font-medium"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
        </div>

        {/* Link externo a la landing */}
        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
