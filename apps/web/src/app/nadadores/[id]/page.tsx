"use client";

/**
 * Página de perfil avanzado del nadador con analytics
 * 
 * Ruta: /nadadores/[id]
 * Sistema de tabs con mejores marcas, evolución, distribución y registros
 */

import React, { useState, lazy, Suspense } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { ProtectedRoute, RoleGuard } from '@/components/auth';
import { useNadador } from '@/hooks/useNadadores';
import { useNadadorAnalytics } from '@/hooks/useNadadorAnalytics';

import { LoaderIcon, ArrowLeftIcon, EditIcon, TrendingUp, Award, BarChart3, Trophy } from 'lucide-react';
import { Button, Alert, AlertDescription, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { CategoriaInfo } from '@/components/nadadores';

// Lazy loading de componentes pesados para mejor performance
const MarcasUnificadas = lazy(() => import('@/components/nadadores/analytics/MarcasUnificadas'));
const EvolucionTemporal = lazy(() => import('@/components/nadadores/analytics/EvolucionTemporal'));
const DistribucionEstilos = lazy(() => import('@/components/nadadores/analytics/DistribucionEstilos'));
const RankingIntraEquipo = lazy(() => import('@/components/nadadores/analytics/RankingIntraEquipo'));

// Loader component para lazy loading
const TabLoader = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <LoaderIcon className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
      <p className="text-muted-foreground">Cargando {title.toLowerCase()}...</p>
    </div>
  </div>
);

export default function PerfilNadadorPage() {
  const params = useParams();
  const router = useRouter();
  const nadadorId = parseInt(params.id as string);
  const [activeTab, setActiveTab] = useState('informacion');
  
  // Hook para obtener datos del nadador
  const { data: nadador, isLoading, isError, error, isFetched } = useNadador(nadadorId) as any;
  
  // Hook para obtener analytics (lazy loading)
  const { 
    data: analytics, 
    isLoading: analyticsLoading, 
    isError: analyticsError 
  } = useNadadorAnalytics(nadador);
  
  // Type guard para analytics
  const analyticsData = analytics as import('@/hooks/useNadadorAnalytics').NadadorAnalytics | null;

  // Validar ID
  if (isNaN(nadadorId)) {
    notFound();
  }

  // Estados de carga y error
  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <LoaderIcon className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Cargando perfil del nadador...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Si hay error 404 explícito desde el backend, mostrar notFound
  if (isError && (error as any)?.message && String((error as any).message).includes('404')) {
    notFound();
  }

  // Errores distintos de 404: mostrar alerta de error
  if (isError && !(String((error as any)?.message || '').includes('404'))) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <Alert>
              <AlertDescription>
                Error al cargar el perfil: {error?.message}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Evitar 404 prematuro: solo cuando la query terminó de obtenerse y no hay datos
  if (isFetched && !isLoading && !nadador) {
    notFound();
  }

  // Si aún no hay datos del nadador (primera pintura/rehidratación), mostrar loader seguro
  if (!nadador) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <LoaderIcon className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Cargando perfil del nadador...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{nadador.nombre_completo}</h1>
                <p className="mt-2 text-muted-foreground">
                  Perfil detallado con análisis de rendimiento
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => router.push('/nadadores')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span>Volver</span>
                </Button>
                <RoleGuard allowedRoles={['entrenador']}>
                  <Button
                    onClick={() => router.push(`/nadadores/${nadador.id}/editar`)}
                    className="flex items-center space-x-2"
                  >
                    <EditIcon className="h-4 w-4" />
                    <span>Editar</span>
                  </Button>
                </RoleGuard>
              </div>
            </div>
          </div>

                      {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger 
                value="informacion"
                isActive={activeTab === 'informacion'}
                onClick={() => setActiveTab('informacion')}
                className="flex items-center space-x-2"
              >
                <span>📋</span>
                <span>Información</span>
              </TabsTrigger>
              <TabsTrigger 
                value="marcas"
                isActive={activeTab === 'marcas'}
                onClick={() => setActiveTab('marcas')}
                className="flex items-center space-x-2"
              >
                <Award className="h-4 w-4" />
                <span>Marcas</span>
              </TabsTrigger>
              <TabsTrigger 
                value="evolucion"
                isActive={activeTab === 'evolucion'}
                onClick={() => setActiveTab('evolucion')}
                className="flex items-center space-x-2"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Evolución</span>
              </TabsTrigger>
              <TabsTrigger 
                value="distribucion"
                isActive={activeTab === 'distribucion'}
                onClick={() => setActiveTab('distribucion')}
                className="flex items-center space-x-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Estilos</span>
              </TabsTrigger>
              <TabsTrigger 
                value="ranking"
                isActive={activeTab === 'ranking'}
                onClick={() => setActiveTab('ranking')}
                className="flex items-center space-x-2"
              >
                <Trophy className="h-4 w-4" />
                <span>Ranking</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab Contents */}
            
            {/* Información Personal */}
            <TabsContent value="informacion" isActive={activeTab === 'informacion'}>
              <div className="bg-card shadow rounded-lg">
                <div className="px-6 py-6">
                  <h2 className="text-xl font-semibold text-foreground mb-6">Información Personal</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Nombre completo</dt>
                      <dd className="mt-1 text-lg text-foreground">{nadador.nombre_completo}</dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Rama</dt>
                      <dd className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                          nadador.rama === 'F' 
                            ? 'bg-pink-100 text-pink-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {nadador.rama === 'F' ? 'Femenino' : 'Masculino'}
                        </span>
                      </dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Fecha de nacimiento</dt>
                      <dd className="mt-1 text-lg text-foreground">
                        {new Date(nadador.fecha_nacimiento).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Peso</dt>
                      <dd className="mt-1 text-lg text-foreground">
                        {nadador.peso ? `${nadador.peso} kg` : 'No registrado'}
                      </dd>
                    </div>
                  </div>

                  {/* Información detallada de categoría */}
                  <div className="mt-8 pt-6 border-t">
                    <CategoriaInfo 
                      categoriaActual={nadador.categoria_actual}
                      fechaNacimiento={new Date(nadador.fecha_nacimiento)}
                      edadActual={nadador.edad_actual}
                    />
                  </div>

                  {/* Estadísticas generales */}
                  {analyticsData?.estadisticas_generales && (
                    <div className="mt-8 pt-6 border-t">
                      <h3 className="text-lg font-semibold text-foreground mb-4">Estadísticas Generales</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <p className="text-2xl font-bold text-blue-900">
                            {analyticsData.estadisticas_generales.total_competencias}
                          </p>
                          <p className="text-sm text-blue-700">Competencias</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                          <p className="text-2xl font-bold text-green-900">
                            {analyticsData.estadisticas_generales.total_pruebas}
                          </p>
                          <p className="text-sm text-green-700">Pruebas totales</p>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-4">
                          <p className="text-2xl font-bold text-yellow-900">
                            {/* Campo no presente en el tipo actual; mostrar guión hasta definirlo en backend */}
                            —
                          </p>
                          <p className="text-sm text-yellow-700">Lugar promedio</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4">
                          <p className="text-2xl font-bold text-purple-900">
                            {analyticsData.estadisticas_generales.eventos_ultimo_mes}
                          </p>
                          <p className="text-sm text-purple-700">Eventos recientes</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>



            {/* Marcas Unificadas (PRs + Resultados Recientes) */}
            <TabsContent value="marcas" isActive={activeTab === 'marcas'}>
              {analyticsError ? (
                <Alert>
                  <AlertDescription>
                    Error al cargar las marcas y resultados. Por favor, intenta de nuevo más tarde.
                  </AlertDescription>
                </Alert>
              ) : (
                <Suspense fallback={<TabLoader title="Marcas y Resultados" />}>
                  <MarcasUnificadas 
                    nadador={nadador}
                    analyticsData={analyticsData}
                    isLoading={analyticsLoading}
                  />
                </Suspense>
              )}
            </TabsContent>

            {/* Evolución Temporal */}
            <TabsContent value="evolucion" isActive={activeTab === 'evolucion'}>
              {analyticsError ? (
                <Alert>
                  <AlertDescription>
                    Error al cargar la evolución temporal. Por favor, intenta de nuevo más tarde.
                  </AlertDescription>
                </Alert>
              ) : (
                <Suspense fallback={<TabLoader title="Evolución Temporal" />}>
                  <EvolucionTemporal 
                    evolucion={analyticsData?.evolucion_temporal || []} 
                    isLoading={analyticsLoading}
                  />
                </Suspense>
              )}
            </TabsContent>

            {/* Distribución de Estilos */}
            <TabsContent value="distribucion" isActive={activeTab === 'distribucion'}>
              {analyticsError ? (
                <Alert>
                  <AlertDescription>
                    Error al cargar la distribución de estilos. Por favor, intenta de nuevo más tarde.
                  </AlertDescription>
                </Alert>
              ) : (
                <Suspense fallback={<TabLoader title="Distribución de Estilos" />}>
                  <DistribucionEstilos 
                    distribucion={analyticsData?.distribucion_estilos || []} 
                    isLoading={analyticsLoading}
                  />
                </Suspense>
              )}
            </TabsContent>

            {/* Ranking Intra-Equipo */}
            <TabsContent value="ranking" isActive={activeTab === 'ranking'}>
              {analyticsError ? (
                <Alert>
                  <AlertDescription>
                    Error al cargar el ranking del equipo. Por favor, intenta de nuevo más tarde.
                  </AlertDescription>
                </Alert>
              ) : (
                <Suspense fallback={<TabLoader title="Ranking Intra-Equipo" />}>
                  <RankingIntraEquipo 
                    rankingData={analyticsData?.ranking_intra_equipo || {
                      prueba_seleccionada: '—',
                      curso_seleccionado: 'SC',
                      ranking: [],
                      posicion_nadador_actual: 0,
                      estadisticas: {
                        total_participantes: 0,
                        mejor_tiempo_equipo: 0,
                        mejor_tiempo_equipo_formateado: '0.00',
                        promedio_equipo: 0,
                        promedio_equipo_formateado: '0.00',
                        nadador_mas_participaciones: ''
                      }
                    }} 
                    nadadorActualId={nadador?.id || 0}
                    isLoading={analyticsLoading}
                  />
                </Suspense>
              )}
            </TabsContent>
          </Tabs>
          
        </div>
      </div>
    </ProtectedRoute>
  );
}
