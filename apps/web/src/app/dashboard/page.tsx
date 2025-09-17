'use client';

/**
 * Página del Dashboard
 * 
 * Dashboard principal con diseño moderno:
 * - Layout con sidebar colapsible
 * - KPIs mejorados con bordes redondeados
 * - Gráficos en cards elegantes
 * - Tema verde consistente
 * - Navegación intuitiva
 */

import { ProtectedRoute } from '@/components/auth';
import { AppLayout } from '@/components/layout';
import { ResultadoDetailModal } from '@/components/resultados';
import { 
  Top5Chart,
  PieChart,
  ProximasCompetenciasList,
  AtletasDestacadosList,
  ActividadRecienteTable
} from '@/components/dashboard';
import { useDashboardResumen } from '@/hooks/useDashboard';
import { useDashboardApiFilters } from '@/stores/dashboard-store';
import { CalendarIcon, UsersIcon, BarChartIcon, TrendingUp, Target, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';



function DashboardContent() {
  const searchParams = useSearchParams();
  const [sharedResultadoId, setSharedResultadoId] = useState<number | null>(null);
  
  // Hooks del dashboard
  const { data: resumenData } = useDashboardResumen();
  const apiFilters = useDashboardApiFilters();

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

  return (
    <div className="p-6 space-y-10 max-w-7xl mx-auto min-h-screen">
      {/* Welcome Section */}
      <div className="space-y-2 pb-2">
        <h2 className="text-lg font-medium text-muted-foreground">
          Panel de Control
        </h2>
        <p className="text-sm text-muted-foreground/80">
          Vista general de tu equipo de natación
        </p>
      </div>

      {/* KPIs principales con diseño mejorado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 bg-gradient-to-br from-accent/20 to-accent/30 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-accent-foreground">Total Nadadores</p>
                <p className="text-2xl font-bold text-foreground">
                  {resumenData?.total_nadadores || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-accent rounded-lg flex items-center justify-center">
                <UsersIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Competencias</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {resumenData?.total_competencias || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Registros</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {resumenData?.total_registros || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-muted-foreground rounded-lg flex items-center justify-center">
                <BarChartIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">PBs Recientes</p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {resumenData?.pbs_recientes || 0}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">Últimos 30 días</p>
              </div>
              <div className="h-12 w-12 bg-amber-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principales con cards mejorados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card data-testid="dashboard-top5" className="rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 relative overflow-hidden">
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-primary" />
              Top 5 Nadadores
            </CardTitle>
            <CardDescription className="text-sm">
              Mejores tiempos por prueba y rama
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[380px] w-full overflow-hidden">
              <Top5Chart
                initialFilters={apiFilters}
                className="h-full w-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="dashboard-distribucion" className="rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 relative">
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-5 w-5 text-primary" />
              Distribución por Estilo
            </CardTitle>
            <CardDescription className="text-sm">
              Análisis de especialización del equipo
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="w-full">
              <PieChart height={320} className="w-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listas informativas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="relative z-10" data-testid="dashboard-proximas">
          <ProximasCompetenciasList className="rounded-xl shadow-sm" />
        </div>
        <div className="relative z-10" data-testid="dashboard-destacados">
          <AtletasDestacadosList className="rounded-xl shadow-sm" />
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="relative z-10">
        <Card data-testid="dashboard-actividad" className="rounded-xl shadow-sm border border-border/50">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-base">Actividad Reciente</CardTitle>
            <CardDescription className="text-sm">
              Últimos registros y actualizaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-hidden">
              <ActividadRecienteTable />
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Modal compartido vía URL */}
      {sharedResultadoId && (
        <ResultadoDetailModal
          resultadoId={sharedResultadoId}
          triggerText="Detalle Compartido"
          triggerVariant="ghost"
          className="hidden"
          autoOpen={true}
          onClose={() => {
            setSharedResultadoId(null);
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
      <AppLayout 
        title="Dashboard" 
        description="Vista general de tu equipo de natación"
      >
        <DashboardContent />
      </AppLayout>
    </ProtectedRoute>
  );
}
