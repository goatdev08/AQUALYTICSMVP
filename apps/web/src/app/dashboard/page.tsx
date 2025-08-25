'use client';

/**
 * Página del Dashboard
 * 
 * Página protegida para usuarios autenticados.
 * Integrada con sistema de autenticación y roles.
 */

import { ProtectedRoute } from '@/components/auth';
import { useAuth } from '@/hooks/useAuth';
import { ProximasCompetencias } from '@/components/competencias';
import { LoaderIcon, CalendarIcon, UsersIcon, BarChartIcon } from 'lucide-react';
import Link from 'next/link';



function DashboardContent() {
  const { user, signOut, isLoading, isEntrenador } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await signOut.mutateAsync();
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header con información del usuario */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  🏊‍♂️ Dashboard de AquaLytics
                </h1>
                <p className="text-sm text-gray-600 mt-2">
                  Bienvenido, <span className="font-medium">{user?.email}</span>
                </p>
                <div className="flex items-center mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isEntrenador ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {isEntrenador ? '👨‍🏫 Entrenador' : '🏊‍♂️ Atleta'}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    Equipo ID: {user?.equipo_id}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                disabled={signOut.isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {signOut.isLoading ? (
                  <>
                    <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                    Cerrando sesión...
                  </>
                ) : (
                  'Cerrar Sesión'
                )}
              </button>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="text-sm text-green-800">
              <p className="font-medium">🏊‍♂️ ¡Sistema de Resultados Implementado!</p>
              <p className="mt-1">
                Módulo completo de registro de resultados con stepper de 4 pasos, cálculos automáticos 
                y vista de detalles. Sistema de autenticación y roles funcionando correctamente.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link href="/nadadores">
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-indigo-100 rounded-md flex items-center justify-center">
                        <UsersIcon className="h-4 w-4 text-indigo-600" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Nadadores
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          Gestionar equipo
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/competencias">
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                        <CalendarIcon className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Competencias
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          Ver calendario
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/resultados/registrar">
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                        <BarChartIcon className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Resultados
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          Registrar tiempos
                        </dd>
                      </dl>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        ¡Nuevo!
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Widget de Próximas Competencias */}
          <div className="mb-8">
            <ProximasCompetencias />
          </div>

          {/* Sección de módulos funcionales */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">📱 Módulos Disponibles</h3>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/nadadores"
                className="inline-flex items-center px-4 py-2 border border-green-300 rounded-md shadow-sm bg-green-50 text-sm font-medium text-green-700 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                🏊‍♂️ Gestión de Nadadores
              </Link>
              <Link
                href="/competencias"
                className="inline-flex items-center px-4 py-2 border border-green-300 rounded-md shadow-sm bg-green-50 text-sm font-medium text-green-700 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                🏆 Gestión de Competencias
              </Link>
              <Link
                href="/resultados/registrar"
                className="inline-flex items-center px-4 py-2 border border-green-300 rounded-md shadow-sm bg-green-50 text-sm font-medium text-green-700 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 relative"
              >
                📊 Registro de Resultados
                <span className="absolute -top-1 -right-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                  ¡Nuevo!
                </span>
              </Link>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Acceso directo a los módulos funcionales de AquaLytics
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
