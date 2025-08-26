/**
 * Página de Análisis - Análisis de resultados específicos y comparaciones
 */

'use client';

import React, { useState } from 'react';
import { useResultados } from '@/hooks/useResultados';
import { useNadadores } from '@/hooks/useNadadores';
import { useAuthContext } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState, InfoCard } from '@/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { BarChart3, AlertCircle, Search, User, Trophy, Activity } from 'lucide-react';
import { ResultadoDetailModal } from '@/components/resultados';
import type { Nadador } from '@/hooks/useNadadores';

export default function AnaliticaPage() {
  // Estados principales
  const [modoAnalisis, setModoAnalisis] = useState<'busqueda' | 'comparacion'>('busqueda');
  const [nadadorSeleccionado, setNadadorSeleccionado] = useState<string>('');
  const [resultadoSeleccionado, setResultadoSeleccionado] = useState<string>('');
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [filtrosPrueba, setFiltrosPrueba] = useState({
    estilo: 'todos',
    distancia: 'todas',
    curso: 'todos'
  });

  // Hook de autenticación
  const { user, loading: authLoading } = useAuthContext();

  // Hooks para datos
  const nadadoresData = useNadadores();
  const { nadadores, isLoading: loadingNadadores, error: errorNadadores } = nadadoresData;
  const { data: resultados, isLoading: loadingResultados, error: errorResultados } = useResultados({
    nadador_id: nadadorSeleccionado ? parseInt(nadadorSeleccionado) : undefined
  });

  // Debug logs
  console.log('🔍 Debug Analítica:', {
    user: user ? { email: user.email, rol: user.rol, equipo_id: user.equipo_id } : null,
    authLoading,
    nadadores: nadadores?.length || 0,
    loadingNadadores,
    errorNadadores,
    nadadorSeleccionado,
    resultados: resultados?.resultados?.length || 0,
    loadingResultados,
    errorResultados
  });

  // Filtrar resultados y aplicar filtros de prueba (temporalmente mostramos todos)
  const resultadosFiltrados = resultados?.resultados?.filter((resultado: any) => {
    // Aplicar filtros de prueba
    if (filtrosPrueba.estilo !== 'todos' && resultado.prueba_estilo !== filtrosPrueba.estilo) {
      return false;
    }
    
    if (filtrosPrueba.distancia !== 'todas' && resultado.prueba_distancia !== parseInt(filtrosPrueba.distancia)) {
      return false;
    }
    
    if (filtrosPrueba.curso !== 'todos' && resultado.prueba_curso !== filtrosPrueba.curso) {
      return false;
    }
    
    return true;
  }) || [];

  // Los resultados se muestran todos, con o sin segmentos

  // Filtrar nadadores por búsqueda
  const nadadoriesFiltrados = nadadores?.filter((nadador: Nadador) =>
    nadador.nombre_completo.toLowerCase().includes(busquedaTexto.toLowerCase())
  ) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Análisis de Resultados
          </h1>
          <p className="text-gray-600 mt-2">
            Selecciona un resultado específico para analizar sus segmentos y rendimiento
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={modoAnalisis === 'busqueda' ? 'default' : 'outline'}
            onClick={() => setModoAnalisis('busqueda')}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Buscar Resultado
          </Button>
        <Button 
            variant={modoAnalisis === 'comparacion' ? 'default' : 'outline'}
            onClick={() => setModoAnalisis('comparacion')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Comparar
        </Button>
        </div>
      </div>

      {/* Selector de Nadador y Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Seleccionar Resultado para Análisis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Búsqueda de nadador */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="busqueda-nadador" className="block text-sm font-medium text-gray-700">
                Buscar Nadador
              </label>
              <Input
                id="busqueda-nadador"
                placeholder="Escribe el nombre del nadador..."
                value={busquedaTexto}
                onChange={(e) => setBusquedaTexto(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="nadador-select" className="block text-sm font-medium text-gray-700">
                Seleccionar Nadador
            </label>
              <Select value={nadadorSeleccionado} onValueChange={setNadadorSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder={
                    loadingNadadores ? "Cargando nadadores..." : 
                    errorNadadores ? "Error al cargar nadadores" :
                    "Elige un nadador"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {loadingNadadores ? (
                    <SelectItem value="loading" disabled>Cargando...</SelectItem>
                  ) : errorNadadores ? (
                    <SelectItem value="error" disabled>Error al cargar nadadores</SelectItem>
                  ) : nadadoriesFiltrados.length === 0 ? (
                    <SelectItem value="empty" disabled>No se encontraron nadadores</SelectItem>
                  ) : (
                    nadadoriesFiltrados.map((nadador: Nadador) => (
                      <SelectItem key={nadador.id} value={nadador.id.toString()}>
                        {nadador.nombre_completo}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Filtros de prueba */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="estilo-filter" className="block text-sm font-medium text-gray-700">
                Filtrar por Estilo
              </label>
              <Select value={filtrosPrueba.estilo} onValueChange={(value) => 
                setFiltrosPrueba(prev => ({ ...prev, estilo: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estilos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Libre">Libre</SelectItem>
                  <SelectItem value="Espalda">Espalda</SelectItem>
                  <SelectItem value="Pecho">Pecho</SelectItem>
                  <SelectItem value="Mariposa">Mariposa</SelectItem>
                  <SelectItem value="Combinado">Combinado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="distancia-filter" className="block text-sm font-medium text-gray-700">
                Filtrar por Distancia
            </label>
              <Select value={filtrosPrueba.distancia} onValueChange={(value) => 
                setFiltrosPrueba(prev => ({ ...prev, distancia: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las distancias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="50">50m</SelectItem>
                  <SelectItem value="100">100m</SelectItem>
                  <SelectItem value="200">200m</SelectItem>
                  <SelectItem value="400">400m</SelectItem>
                </SelectContent>
              </Select>
          </div>
          
            <div className="space-y-2">
              <label htmlFor="curso-filter" className="block text-sm font-medium text-gray-700">
                Filtrar por Curso
            </label>
              <Select value={filtrosPrueba.curso} onValueChange={(value) => 
                setFiltrosPrueba(prev => ({ ...prev, curso: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los cursos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="SC">Piscina Corta (25m)</SelectItem>
                  <SelectItem value="LC">Piscina Larga (50m)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mensaje de estado de autenticación */}
      {authLoading && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-700">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
              <span>Cargando información de usuario...</span>
          </div>
          </CardContent>
        </Card>
      )}

      {!authLoading && !user && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>Para usar esta función, necesitas <a href="/login" className="underline font-medium">iniciar sesión</a>.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Resultados Disponibles */}
      {user && nadadorSeleccionado && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Resultados Disponibles
              {loadingResultados && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500 ml-2"></div>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resultadosFiltrados.length === 0 ? (
              <EmptyState
                icon={AlertCircle}
                title="Sin resultados disponibles"
                description="El nadador seleccionado no tiene resultados registrados que coincidan con los filtros aplicados."
                actionLabel="Registrar Resultado"
                actionHref="/resultados/registrar"
                variant="info"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resultadosFiltrados.map((resultado: any) => (
                  <Card 
                    key={resultado.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      resultadoSeleccionado === resultado.id.toString() 
                        ? 'ring-2 ring-green-500 bg-green-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setResultadoSeleccionado(resultado.id.toString())}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="default">
                            Resultado #{resultado.id}
                          </Badge>
                          <Badge variant="outline">
                            {resultado.fase}
                          </Badge>
                        </div>
                        
                        <div className="text-lg font-bold text-green-600">
                          {Math.floor(resultado.tiempo_global_cs / 6000)}:
                          {Math.floor((resultado.tiempo_global_cs % 6000) / 100).toString().padStart(2, '0')}.
                          {(resultado.tiempo_global_cs % 100).toString().padStart(2, '0')}
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <p>Competencia ID: {resultado.competencia_id}</p>
                          <p>{new Date(resultado.fecha_registro).toLocaleDateString('es-ES')}</p>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            {resultado.segmentos?.length || 0} segmentos
                          </span>
                          <ResultadoDetailModal
                            resultadoId={resultado.id}
                            triggerText="Ver Detalle"
                            triggerVariant="ghost"
                            className="text-xs p-1 h-auto"
                          />
            </div>
          </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Análisis del Resultado Seleccionado */}
      {user && resultadoSeleccionado && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Análisis de Segmentos
            </CardTitle>
          </CardHeader>
          <CardContent>
                          {(() => {
                const resultado = resultadosFiltrados.find((r: any) => r.id.toString() === resultadoSeleccionado);
                if (!resultado) {
                  return (
                    <EmptyState
                      icon={AlertCircle}
                      title="Sin datos de resultado"
                      description="No se pudo encontrar la información del resultado seleccionado."
                      variant="warning"
                    />
                  );
                }

              return (
        <div className="space-y-6">
                  {/* Información del resultado */}
                  <InfoCard
                    icon={Trophy}
                    title="Resultado Seleccionado"
                    description={`Resultado #${resultado.id} - Prueba ID: ${resultado.prueba_id}`}
                    items={[
                      { 
                        label: 'Tiempo', 
                        value: `${Math.floor(resultado.tiempo_global_cs / 6000)}:${Math.floor((resultado.tiempo_global_cs % 6000) / 100).toString().padStart(2, '0')}.${(resultado.tiempo_global_cs % 100).toString().padStart(2, '0')}`, 
                        asBadge: true, 
                        badgeVariant: 'default' 
                      },
                                              { label: 'Fecha', value: new Date(resultado.fecha_registro).toLocaleDateString('es-ES') },
                        { label: 'Segmentos', value: (resultado.segmentos?.length || 0).toString() },
                        { label: 'Nadador', value: nadadores?.find((n: Nadador) => n.id.toString() === nadadorSeleccionado)?.nombre_completo || '' },
                        { label: 'Fase', value: resultado.fase },
                      { label: 'Estado', value: resultado.estado_validacion, asBadge: true, badgeVariant: resultado.estado_validacion === 'valido' ? 'default' : 'destructive' }
                    ]}
                    variant="success"
                  />

                  {/* Tabla de segmentos o mensaje de no disponibles */}
                  {resultado.segmentos && resultado.segmentos.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left">Segmento</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Estilo</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Tiempo</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Brazadas</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Flecha (m)</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Velocidad (m/s)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resultado.segmentos.map((segmento: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-medium">
                                {segmento.indice}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {segmento.estilo_segmento}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 font-mono">
                                {Math.floor(segmento.tiempo_cs / 100)}:{(segmento.tiempo_cs % 100).toString().padStart(2, '0')}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {segmento.brazadas}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {segmento.flecha_m.toFixed(1)}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {segmento.velocidad_mps?.toFixed(2) || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                        </table>
                      </div>
                    ) : (
                      <EmptyState
                        icon={AlertCircle}
                        title="Sin análisis de segmentos"
                        description="Este resultado no tiene información detallada de segmentos para analizar. Los segmentos se registran durante la captura del resultado."
                        actionLabel="Registrar con Segmentos"
                        actionHref="/resultados/registrar"
                        variant="info"
                      />
                    )}

                    {/* Gráfico de análisis de segmentos - solo si hay segmentos */}
                    {resultado.segmentos && resultado.segmentos.length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-4">Visualización de Segmentos</h4>
                        <p className="text-sm text-gray-600">
                          Aquí se puede integrar un gráfico específico para mostrar la progresión de tiempos, 
                          velocidades y otras métricas por segmento del resultado seleccionado.
                        </p>
          </div>
                    )}
                </div>
              );
            })()}
          </CardContent>
            </Card>
      )}

      {/* Estado inicial */}
      {!nadadorSeleccionado && user && (
        <EmptyState
          icon={User}
          title="Selecciona un Nadador"
          description="Para comenzar el análisis, selecciona un nadador de la lista superior. Puedes usar la búsqueda para encontrar nadadores específicos."
          additionalInfo="Solo se mostrarán resultados que tengan análisis de segmentos disponibles."
          variant="info"
        />
      )}
    </div>
  );
}
