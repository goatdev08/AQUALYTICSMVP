'use client';

/**
 * Página del Dashboard
 * 
 * Página protegida para usuarios autenticados.
 * Integrada con sistema de autenticación y roles.
 */

import { ProtectedRoute } from '@/components/auth';
import { useAuth } from '@/hooks/useAuth';
import { ResultadoDetailModal } from '@/components/resultados';
import { 
  KPICard,
  Top5Chart,
  PieChart,
  ProximasCompetenciasList,
  AtletasDestacadosList,
  ActividadRecienteTable
} from '@/components/dashboard';
import { useDashboardResumen } from '@/hooks/useDashboard';
import { useDashboardFilters, useDashboardApiFilters } from '@/stores/dashboard-store';
import { LoaderIcon, CalendarIcon, UsersIcon, BarChartIcon, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';



function DashboardContent() {
  const { user, signOut, isLoading, isEntrenador } = useAuth();
  const searchParams = useSearchParams();
  const [sharedResultadoId, setSharedResultadoId] = useState<number | null>(null);
  
  // Hooks del dashboard
  const { data: resumenData, isLoading: resumenLoading, error: resumenError } = useDashboardResumen();
  const apiFilters = useDashboardApiFilters();

  // Dashboard funcionando correctamente

  // Manejar compartir vía URL ?detalle={id}
  useEffect(() => {
    const detalleParam = searchParams.get('detalle');
    if (detalleParam) {
      const resultadoId = parseInt(detalleParam, 10);
      if (!isNaN(resultadoId) && resultadoId > 0) {
        setSharedResultadoId(resultadoId);
      }
    }
  }, [searchParams]);

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
          
          {/* KPIs principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPICard
              label="Total Nadadores"
              value={resumenData?.total_nadadores || 0}
              icon={<UsersIcon />}
              isLoading={resumenLoading}
              variant="default"
            />
            <KPICard
              label="Total Competencias"
              value={resumenData?.total_competencias || 0}
              icon={<CalendarIcon />}
              isLoading={resumenLoading}
              variant="success"
            />
            <KPICard
              label="Total Registros"
              value={resumenData?.total_registros || 0}
              icon={<BarChartIcon />}
              isLoading={resumenLoading}
              variant="info"
            />
            <KPICard
              label="PBs Recientes"
              value={resumenData?.pbs_recientes || 0}
              icon={<TrendingUp />}
              isLoading={resumenLoading}
              variant="warning"
              description="Últimos 30 días"
            />
          </div>

          {/* Gráficos principales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Top5Chart
              initialFilters={apiFilters}
              className="lg:col-span-1"
            />
            <PieChart
              className="lg:col-span-1"
            />
          </div>

          {/* Listas y actividad */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <ProximasCompetenciasList
              className="lg:col-span-1"
            />
            <AtletasDestacadosList
              className="lg:col-span-1"
            />
          </div>

          {/* Actividad reciente */}
          <div className="mb-8">
            <ActividadRecienteTable />
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
              
              {/* BOTÓN DE PRUEBA DEL MODAL - Resultado ID 14 */}
              <ResultadoDetailModal 
                resultadoId={14}
                triggerText="🔍 Probar Modal Detalles"
                triggerVariant="outline"
                className="border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 relative"
              >
                <span className="absolute -top-1 -right-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
                  Demo
                </span>
              </ResultadoDetailModal>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Acceso directo a los módulos funcionales de AquaLytics
            </p>
          </div>

        </div>
      </div>

      {/* Modal compartido vía URL */}
      {sharedResultadoId && (
        <ResultadoDetailModal
          resultadoId={sharedResultadoId}
          triggerText="Detalle Compartido"
          triggerVariant="ghost"
          className="hidden" // Trigger oculto, se abre automáticamente
          autoOpen={true}
          onClose={() => {
            setSharedResultadoId(null);
            // Limpiar query param de la URL
            const url = new URL(window.location.href);
            url.searchParams.delete('detalle');
            window.history.replaceState({}, '', url.toString());
          }}
        />
      )}
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
