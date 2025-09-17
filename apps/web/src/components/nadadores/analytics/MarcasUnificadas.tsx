"use client";

/**
 * Componente MarcasUnificadas
 * 
 * Unifica los tabs "Resultados" y "Marcas" en un solo componente con subsecciones:
 * - Personal Records (PRs): Mejores marcas del nadador
 * - Recent Results: Resultados recientes con detalles
 * 
 * Según PRDv2.txt: "Marcas: PRs + recientes, búsqueda con filtros"
 */

import React, { useState, useMemo } from 'react';
import { Nadador } from '@/hooks/useNadadores';
import { NadadorAnalytics, MejorMarca } from '@/hooks/useNadadorAnalytics';
import { useResultados, type ResultadoSearchFilters } from '@/hooks/useResultados';
import { usePruebas } from '@/hooks/usePruebas';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Button,
  Badge,
  Alert,
  AlertDescription,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input
} from '@/components/ui';
import { 
  Trophy, 
  Activity,
  Clock, 
  Award, 
  MapPin,
  Eye,
  Calendar,
  Target,
  Timer,
  Filter,
  Search,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { ResultadoDetailModal } from '@/components/resultados';

interface MarcasUnificadasProps {
  nadador: Nadador;
  analyticsData: NadadorAnalytics | null;
  isLoading: boolean;
}

export default function MarcasUnificadas({ 
  nadador, 
  analyticsData, 
  isLoading 
}: MarcasUnificadasProps) {
  const [showPersonalRecords, setShowPersonalRecords] = useState(false); // Colapsable para PRs
  const [cursoFilter, setCursoFilter] = useState<'ALL' | 'SC' | 'LC'>('ALL');
  const [selectedResultadoId, setSelectedResultadoId] = useState<number | null>(null);
  
  // Estados para filtros de resultados recientes - inicializados con valores seguros
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [pruebaSeleccionada, setPruebaSeleccionada] = useState<string>('all');
  const [estadoValidacion, setEstadoValidacion] = useState<string>('all');
  
  const [filtros, setFiltros] = useState<ResultadoSearchFilters>({
    nadador_id: nadador?.id || 0, // Siempre filtrar por este nadador con fallback seguro
  });
  
  // Hook para obtener pruebas (para filtro por estilo)
  const { data: pruebasData } = usePruebas();
  
  // Hook para obtener resultados recientes con filtros (siempre activo)
  const { 
    data: resultadosData, 
    isLoading: resultadosLoading, 
    refetch: refetchResultados 
  } = useResultados(filtros, 1, 20, true); // Siempre habilitado
  
  // Auto-aplicar filtros iniciales cuando cambia el nadador
  React.useEffect(() => {
    if (nadador?.id && filtros.nadador_id !== nadador.id) {
      setFiltros(prev => ({ ...prev, nadador_id: nadador.id }));
    }
  }, [nadador?.id, filtros.nadador_id]);



  // Función para aplicar filtros
  const aplicarFiltros = () => {
    if (!nadador?.id) return;
    
    const nuevosFiltros: ResultadoSearchFilters = {
      nadador_id: nadador.id,
      ...(fechaInicio && { fecha_inicio: fechaInicio }),
      ...(fechaFin && { fecha_fin: fechaFin }),
      ...(pruebaSeleccionada !== 'all' && { prueba_id: parseInt(pruebaSeleccionada) }),
      ...(estadoValidacion !== 'all' && { estado_validacion: estadoValidacion as 'valido' | 'revisar' }),
    };
    setFiltros(nuevosFiltros);
  };

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    if (!nadador?.id) return;
    
    setFechaInicio('');
    setFechaFin('');
    setPruebaSeleccionada('all');
    setEstadoValidacion('all');
    setFiltros({ nadador_id: nadador.id });
  };

  // Formatear tiempo desde segundos
  const formatTiempo = (segundos: number): string => {
    const mins = Math.floor(segundos / 60);
    const secs = (segundos % 60).toFixed(2);
    return mins > 0 ? `${mins}:${secs.padStart(5, '0')}` : `${secs}`;
  };

  // Formatear fecha
  const formatFecha = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filtrar y procesar Personal Records (PRs)
  const marcasFiltradas = useMemo(() => {
    const marcas = analyticsData?.mejores_marcas || [];
    let filtered = cursoFilter === 'ALL' ? marcas : marcas.filter(m => m.curso === cursoFilter);
    
    // Agrupar por prueba y tomar la mejor marca de cada curso
    const grouped = filtered.reduce((acc, marca) => {
      const key = `${marca.prueba}-${marca.curso}`;
      if (!acc[key] || acc[key].tiempo > marca.tiempo) {
        acc[key] = marca;
      }
      return acc;
    }, {} as Record<string, MejorMarca>);
    
    return Object.values(grouped).sort((a, b) => a.tiempo - b.tiempo);
  }, [analyticsData?.mejores_marcas, cursoFilter]);

  // Calcular métricas de distribución por estilo en PRs
  const distribucionEstilos = useMemo(() => {
    const marcas = analyticsData?.mejores_marcas || [];
    const distribucion = marcas.reduce((acc, marca) => {
      const estilo = marca.prueba.split(' ')[1] || 'Otro'; // Extraer estilo básico
      acc[estilo] = (acc[estilo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(distribucion)
      .map(([estilo, cantidad]) => ({ estilo, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [analyticsData?.mejores_marcas]);

  // Métricas dinámicas según filtros activos
  const filtrosActivos = useMemo(() => {
    const activos = [];
    if (pruebaSeleccionada !== 'all') activos.push('Estilo');
    if (estadoValidacion !== 'all') activos.push('Estado'); 
    if (fechaInicio) activos.push('Fecha');
    return activos;
  }, [pruebaSeleccionada, estadoValidacion, fechaInicio]);

  // Early return si no hay datos de nadador
  if (!nadador?.id) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Alert className="max-w-md mx-auto">
            <AlertDescription>
              No se pudo cargar la información del nadador
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-12 bg-muted rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas generales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Marcas del Nadador
            </div>
            <div className="flex items-center gap-2">
              {filtrosActivos.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  {filtrosActivos.length} filtro{filtrosActivos.length > 1 ? 's' : ''} activo{filtrosActivos.length > 1 ? 's' : ''}
                </Badge>
              )}
              <Badge variant="outline" className="font-mono">
                Resultados: {resultadosData?.total || 0}
              </Badge>
              <Badge variant="secondary" className="font-mono">
                PRs: {marcasFiltradas.length}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            Resultados recientes con filtros avanzados y acceso a Personal Records
            {cursoFilter !== 'ALL' && (
              <Badge variant="outline" className="ml-2 text-xs">
                PRs filtrados por: {cursoFilter}
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analyticsData?.estadisticas_generales && (
            <div className="space-y-6 mb-6">
              {/* Estadísticas principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {analyticsData.estadisticas_generales.total_pruebas}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Total Pruebas</div>
                </div>
                <div className="text-center p-4 bg-accent/20 rounded-lg border border-accent/30">
                  <div className="text-2xl font-bold text-accent-foreground">
                    {analyticsData.estadisticas_generales.total_competencias}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Competencias</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-700">
                    {marcasFiltradas.length}
                  </div>
                  <div className="text-sm text-yellow-600 font-medium">Personal Records</div>
                  {cursoFilter !== 'ALL' && (
                    <Badge variant="outline" className="text-xs mt-1">
                      Filtrado por {cursoFilter}
                    </Badge>
                  )}
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700">
                    {analyticsData.estadisticas_generales.eventos_ultimo_mes}
                  </div>
                  <div className="text-sm text-purple-600 font-medium">Eventos Recientes</div>
                </div>
              </div>

              {/* Personal Records - Sección colapsable */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                    Personal Records ({marcasFiltradas.length})
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPersonalRecords(!showPersonalRecords)}
                    className="h-8 px-3 text-xs"
                  >
                    {showPersonalRecords ? 'Ocultar' : 'Ver PRs'}
                  </Button>
                </div>
                
                {showPersonalRecords && (
                  <div className="space-y-3">
                    {/* Filtros de curso para PRs */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Filtrar:</span>
                      {(['ALL', 'SC', 'LC'] as const).map((curso) => (
                        <Button
                          key={curso}
                          variant={cursoFilter === curso ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCursoFilter(curso)}
                          className="h-7 px-2 text-xs"
                        >
                          {curso === 'ALL' ? 'Todos' : curso}
                        </Button>
                      ))}
                    </div>

                    {/* Lista compacta de PRs */}
                    {marcasFiltradas.length > 0 ? (
                      <div className="grid gap-2">
                        {marcasFiltradas.slice(0, 5).map((marca, index) => (
                          <div 
                            key={`${marca.prueba}-${marca.curso}`} 
                            className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs h-5">
                                {marca.curso}
                              </Badge>
                              <span className="font-medium">{marca.prueba}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-yellow-700">
                                {formatTiempo(marca.tiempo)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatFecha(marca.fecha)}
                              </div>
                            </div>
                          </div>
                        ))}
                        {marcasFiltradas.length > 5 && (
                          <div className="text-xs text-center text-gray-500 py-2">
                            ... y {marcasFiltradas.length - 5} más
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-sm text-gray-500">
                        No hay Personal Records
                        {cursoFilter !== 'ALL' && ` en curso ${cursoFilter}`}
                      </div>
                    )}

                    {/* Distribución por estilos */}
                    {distribucionEstilos.length > 0 && (
                      <div className="border-t pt-3">
                        <h5 className="text-xs font-medium text-gray-600 mb-2">
                          Distribución por Estilos:
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {distribucionEstilos.map(({ estilo, cantidad }) => (
                            <Badge
                              key={estilo}
                              variant="secondary"
                              className="text-xs h-6"
                            >
                              {estilo} ({cantidad})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resultados Recientes - Siempre visibles */}
          <div className="space-y-4">
            {/* Panel de filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  Resultados Recientes
                  <Badge variant="outline" className="font-mono text-xs">
                    {resultadosData?.total || 0} encontrados
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Filtros avanzados para buscar resultados específicos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Filtro por Estilo/Prueba */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Estilo/Prueba</label>
                    <Select value={pruebaSeleccionada} onValueChange={setPruebaSeleccionada}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los estilos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estilos</SelectItem>
                        {pruebasData?.pruebas?.map((prueba) => (
                          <SelectItem key={prueba.id} value={prueba.id.toString()}>
                            {prueba.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por Estado */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Estado</label>
                    <Select value={estadoValidacion} onValueChange={setEstadoValidacion}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="valido">Válido</SelectItem>
                        <SelectItem value="revisar">Revisar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Fecha Inicio */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Desde</label>
                    <Input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                    />
                  </div>

                  {/* Fecha Fin */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Hasta</label>
                    <Input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                    />
                  </div>
                </div>

                {/* Botones de acción compactos */}
                <div className="flex items-center gap-2">
                  <Button onClick={aplicarFiltros} size="sm" className="h-8">
                    <Search className="h-3 w-3 mr-1" />
                    Filtrar
                  </Button>
                  <Button variant="outline" onClick={limpiarFiltros} size="sm" className="h-8">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Limpiar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de resultados recientes */}
            {resultadosLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-gray-600">Cargando resultados...</p>
              </div>
            ) : resultadosData?.resultados && resultadosData.resultados.length > 0 ? (
              <div className="space-y-4">
                {resultadosData.total > 20 && (
                  <div className="text-center">
                    <Badge variant="outline" className="text-xs">
                      Mostrando primeros 20 de {resultadosData.total} resultados
                    </Badge>
                  </div>
                )}
                
                <div className="grid gap-3">
                  {resultadosData.resultados.map((resultado) => (
                    <Card 
                      key={resultado.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedResultadoId(resultado.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">
                                {resultado.prueba_estilo && resultado.prueba_distancia 
                                  ? `${resultado.prueba_estilo} ${resultado.prueba_distancia}m`
                                  : 'Prueba'
                                }
                              </span>
                              <Badge 
                                variant={resultado.estado_validacion === 'valido' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {resultado.estado_validacion}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-700">
                              {Math.floor(resultado.tiempo_global_cs / 6000).toString().padStart(2, '0')}:
                              {Math.floor((resultado.tiempo_global_cs % 6000) / 100).toString().padStart(2, '0')}.
                              {(resultado.tiempo_global_cs % 100).toString().padStart(2, '0')}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatFecha(resultado.fecha_registro)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {resultado.competencia_nombre || 'Competencia'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>Ver detalles</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">
                    No se encontraron resultados
                    {filtrosActivos.length > 0 ? ' con los filtros aplicados' : ' para este nadador'}
                  </p>
                  {filtrosActivos.length > 0 ? (
                    <Button variant="outline" size="sm" onClick={limpiarFiltros}>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Limpiar filtros
                    </Button>
                  ) : (
                    <p className="text-sm text-gray-400">
                      Los resultados aparecerán aquí cuando se registren
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalle */}
      {selectedResultadoId && (
        <ResultadoDetailModal
          resultadoId={selectedResultadoId}
          autoOpen={true}
          onClose={() => setSelectedResultadoId(null)}
        />
      )}
    </div>
  );
}
