/**
 * Middleware de Next.js para protección de rutas y autenticación
 * 
 * Este middleware se ejecuta ANTES de que se renderice cualquier página,
 * permitiendo proteger rutas basándose en el estado de autenticación
 * y el rol del usuario.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple logger for middleware (since we can't use external logging libraries)
const logger = {
  warning: (message: string) => console.warn(`[MIDDLEWARE] ${message}`),
  debug: (message: string) => console.debug(`[MIDDLEWARE] ${message}`),
  error: (message: string, error?: any) => console.error(`[MIDDLEWARE] ${message}`, error)
};

/**
 * Rutas que NO requieren autenticación.
 * Estas rutas son accesibles para usuarios no autenticados.
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/auth/callback', // Para el callback de Supabase Auth
];

/**
 * Rutas que requieren autenticación pero no un rol específico.
 * Tanto entrenadores como atletas pueden acceder.
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/nadadores',
  '/competencias',
  '/resultados',
  '/analisis',
];

/**
 * Rutas que requieren rol de ENTRENADOR específicamente.
 * Solo usuarios con rol 'entrenador' pueden acceder.
 */
const TRAINER_ONLY_ROUTES = [
  '/nadadores/crear',
  '/nadadores/editar',
  '/competencias/crear',
  '/competencias/editar',
  '/resultados/crear',
  '/resultados/editar',
  '/registrar', // Formulario de captura en vivo
];

/**
 * Verifica si una ruta específica está en una lista de rutas.
 * 
 * @param pathname - La ruta actual
 * @param routes - Lista de rutas a verificar
 * @returns true si la ruta está en la lista
 */
function isRouteInList(pathname: string, routes: string[]): boolean {
  return routes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
}

/**
 * Middleware principal de Next.js para protección de rutas.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Crear response que se puede modificar
  const response = NextResponse.next();

  // Crear cliente de Supabase para middleware con nueva API
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // Configurar cookie para el request
          request.cookies.set({
            name,
            value,
            ...options,
          });
          // Configurar cookie para el response
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          // Remover cookie del request
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          // Remover cookie del response
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  try {
    // Obtener sesión actual
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    // Si hay error obteniendo la sesión, limpiar y redirigir a login
    if (sessionError) {
      console.error('Error en middleware obteniendo sesión:', sessionError);
      if (!isRouteInList(pathname, PUBLIC_ROUTES)) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      return response;
    }

    // CASO 1: Rutas públicas - siempre permitidas
    if (isRouteInList(pathname, PUBLIC_ROUTES)) {
      // Caso especial: si hay parámetro ?logout=true, permitir acceso a login
      const isLogout = request.nextUrl.searchParams.get('logout') === 'true';
      
      // Si el usuario está autenticado y trata de acceder a login/register,
      // redirigir al dashboard EXCEPTO si viene de logout
      if (session && (pathname === '/login' || pathname === '/register') && !isLogout) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return response;
    }

    // CASO 2: Rutas protegidas - requieren autenticación
    if (isRouteInList(pathname, PROTECTED_ROUTES) || isRouteInList(pathname, TRAINER_ONLY_ROUTES)) {
      // Sin sesión = redirigir a login
      if (!session) {
        const loginUrl = new URL('/login', request.url);
        // Guardar la URL original para redirigir después del login
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // CASO 3: Rutas específicas de entrenador
      if (isRouteInList(pathname, TRAINER_ONLY_ROUTES)) {
        try {
          // Obtener información del usuario para validar rol
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError || !user) {
            logger.warning(`⚠️ No se pudo obtener información del usuario para ruta de entrenador: ${pathname}`);
            return NextResponse.redirect(new URL('/login', request.url));
          }

          // Obtener metadatos del usuario desde Supabase Auth
          const userRole = user.user_metadata?.rol || user.app_metadata?.rol;
          
          // Si no hay rol definido o no es entrenador, denegar acceso
          if (!userRole || userRole !== 'entrenador') {
            logger.warning(`⚠️ Acceso denegado a ruta de entrenador: ${pathname} - Usuario: ${user.email} - Rol: ${userRole || 'undefined'}`);
            // Redirigir a dashboard con mensaje de error
            const dashboardUrl = new URL('/dashboard', request.url);
            dashboardUrl.searchParams.set('error', 'insufficient_permissions');
            dashboardUrl.searchParams.set('message', 'Esta función requiere permisos de entrenador');
            return NextResponse.redirect(dashboardUrl);
          }

          logger.debug(`✅ Acceso autorizado a ruta de entrenador: ${pathname} - Usuario: ${user.email}`);
        } catch (error) {
          logger.error(`❌ Error validando permisos de entrenador para ${pathname}:`, error);
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
    }

    // CASO 4: Rutas no definidas
    // Si no es una ruta conocida, permitir acceso y que Next.js maneje 404
    return response;

  } catch (error) {
    // Error general - redirigir a login si no es ruta pública
    console.error('Error general en middleware:', error);
    if (!isRouteInList(pathname, PUBLIC_ROUTES)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return response;
  }
}

/**
 * Configuración del matcher para Next.js.
 * 
 * Define en qué rutas se ejecuta el middleware.
 * Excluimos archivos estáticos y API routes.
 */
export const config = {
  matcher: [
    /*
     * Ejecutar middleware en todas las rutas excepto:
     * - archivos estáticos (_next/static)
     * - archivos de imagen (.ico, .png, .svg, etc.)
     * - API routes (/api)
     * - archivos internos de Next.js
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
};
