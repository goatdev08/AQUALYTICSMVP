/**
 * Componente ComparisonView - Vista completa de comparación de rendimiento.
 * 
 * Integra todos los componentes de análisis para mostrar comparaciones
 * detalladas entre nadadores, promedios de equipo y entre registros.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { 
  PacingChart, 
  RadarChart, 
  ConsistenciaChart,
  MetricaRadar,
  DatosConsistencia
} from '@/components/analitica';
import { 
  usePromedioEquipo, 
  useComparacion,
  AnaliticaFilters,
  ComparacionResponse 
} from '@/hooks/useAnalitica';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ==========================================
// Tipos de Props
// ==========================================

interface ComparisonViewProps {
  /** Filtros aplicados para el análisis */
  filtros?: AnaliticaFilters;
  /** ID del primer resultado para comparación */
  resultado1Id?: number;
  /** ID del segundo resultado para comparación */
  resultado2Id?: number;
  /** Modo de comparación */
  modo?: 'promedio-equipo' | 'entre-resultados';
  /** Si se debe mostrar información detallada */
  mostrarDetalles?: boolean;
}

// ==========================================
// Utilidades
// ==========================================

/**
 * Convierte datos de comparación a métricas de radar.
 */
const convertirComparacionARadar = (
  comparacion: ComparacionResponse
): { metricas1: MetricaRadar[], metricas2: MetricaRadar[] } => {
  const { comparacion_segmentos } = comparacion;
  
  // Calcular métricas básicas para cada resultado
  const calcularMetricas = (segmentos: any[], esResultado1: boolean): MetricaRadar[] => {
    if (!segmentos.length) return [];
    
    const datos = segmentos.map(s => esResultado1 ? s.resultado1 : s.resultado2);
    const tiempos = datos.map(d => d.tiempo_cs);
    const brazadas = datos.map(d => d.brazadas || 0).filter(b => b > 0);
    const flechas = datos.map(d => d.flecha_m || 0);
    
    // Velocidad (basada en tiempo promedio - invertida para que menor tiempo = mayor velocidad)
    const tiempoPromedio = tiempos.reduce((sum, t) => sum + t, 0) / tiempos.length;
    const velocidad = tiempoPromedio > 0 ? Math.max(0, 100 - ((tiempoPromedio - 2500) / 50)) : 50;
    
    // Eficiencia (brazadas - menor es mejor, normalizado)
    const brazadasPromedio = brazadas.length > 0 ? brazadas.reduce((sum, b) => sum + b, 0) / brazadas.length : 0;
    const eficiencia = brazadasPromedio > 0 ? Math.max(0, 100 - ((brazadasPromedio - 10) * 5)) : 50;
    
    // Consistencia (basada en variabilidad de tiempos)
    const promedio = tiempos.reduce((sum, t) => sum + t, 0) / tiempos.length;
    const varianza = tiempos.reduce((sum, t) => sum + Math.pow(t - promedio, 2), 0) / tiempos.length;
    const coefVariacion = promedio > 0 ? (Math.sqrt(varianza) / promedio) * 100 : 0;
    const consistencia = Math.max(0, 100 - coefVariacion * 10);
    
    // Resistencia (comparar primera vs segunda mitad)
    const mitad = Math.floor(tiempos.length / 2);
    const primeraMitad = tiempos.slice(0, mitad);
    const segundaMitad = tiempos.slice(mitad);
    const promPrimera = primeraMitad.reduce((a, b) => a + b, 0) / primeraMitad.length;
    const promSegunda = segundaMitad.reduce((a, b) => a + b, 0) / segundaMitad.length;
    const deterioro = promPrimera > 0 ? ((promSegunda - promPrimera) / promPrimera) * 100 : 0;
    const resistencia = Math.max(0, 100 - deterioro * 2);
    
    // Técnica (basada en flecha promedio)
    const flechaPromedio = flechas.length > 0 ? flechas.reduce((sum, f) => sum + f, 0) / flechas.length : 0;
    const tecnica = Math.min(100, Math.max(0, flechaPromedio * 10));
    
    // Explosividad (basada en primer segmento vs promedio)
    const primerSegmento = tiempos[0] || promedio;
    const explosividad = promedio > 0 ? Math.max(0, 100 - ((primerSegmento - promedio) / promedio) * 100) : 50;
    
    return [
      { nombre: 'Velocidad', valor: Math.round(velocidad), unidad: 'puntos' },
      { nombre: 'Eficiencia', valor: Math.round(eficiencia), unidad: 'puntos' },
      { nombre: 'Consistencia', valor: Math.round(consistencia), unidad: 'puntos' },
      { nombre: 'Resistencia', valor: Math.round(resistencia), unidad: 'puntos' },
      { nombre: 'Técnica', valor: Math.round(tecnica), unidad: 'puntos' },
      { nombre: 'Explosividad', valor: Math.round(explosividad), unidad: 'puntos' },
    ];
  };
  
  return {
    metricas1: calcularMetricas(comparacion_segmentos, true),
    metricas2: calcularMetricas(comparacion_segmentos, false),
  };
};

/**
 * Convierte segmentos de comparación a datos de consistencia.
 */
const convertirAConsistencia = (segmentos: any[], esResultado1: boolean): DatosConsistencia[] => {
  const datos = segmentos.map(s => esResultado1 ? s.resultado1 : s.resultado2);
  const tiempos = datos.map(d => d.tiempo_cs);
  const promedio = tiempos.reduce((sum, t) => sum + t, 0) / tiempos.length;
  
  return datos.map((dato, index) => ({
    indice: segmentos[index].indice,
    tiempo_cs: dato.tiempo_cs,
    desviacion: dato.tiempo_cs - promedio,
    percentil: 50, // Simplificado para el ejemplo
  }));
};

// ==========================================
// Componente Principal
// ==========================================

export default function ComparisonView({
  filtros = {},
  resultado1Id,
  resultado2Id,
  modo = 'promedio-equipo',
  mostrarDetalles = true,
}: ComparisonViewProps) {
  
  const [tabActiva, setTabActiva] = useState('pacing');
  
  // Hooks para datos
  const { 
    data: promediosData, 
    loading: loadingPromedios, 
    error: errorPromedios 
  } = usePromedioEquipo(modo === 'promedio-equipo' ? filtros : {});
  
  const { 
    data: comparacionData, 
    loading: loadingComparacion, 
    error: errorComparacion,
    comparar
  } = useComparacion();
  
  // Efectuar comparación cuando se proporcionan IDs
  React.useEffect(() => {
    if (modo === 'entre-resultados' && resultado1Id && resultado2Id) {
      comparar(resultado1Id, resultado2Id);
    }
  }, [modo, resultado1Id, resultado2Id, comparar]);
  
  // Datos procesados para gráficos
  const datosGraficos = useMemo(() => {
    if (modo === 'promedio-equipo' && promediosData) {
      return {
        segmentosPromedio: promediosData.segmentos_promedio,
        metadatos: promediosData.metadatos,
      };
    }
    
    if (modo === 'entre-resultados' && comparacionData) {
      const { metricas1, metricas2 } = convertirComparacionARadar(comparacionData);
      const consistencia1 = convertirAConsistencia(comparacionData.comparacion_segmentos, true);
      const consistencia2 = convertirAConsistencia(comparacionData.comparacion_segmentos, false);
      
      return {
        comparacion: comparacionData,
        metricas1,
        metricas2,
        consistencia1,
        consistencia2,
      };
    }
    
    return null;
  }, [modo, promediosData, comparacionData]);
  
  // Estados de carga y error
  const loading = loadingPromedios || loadingComparacion;
  const error = errorPromedios || errorComparacion;
  
  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <span className="ml-3">Cargando análisis comparativo...</span>
        </div>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="flex items-center text-red-700">
          <span className="text-2xl mr-3">⚠️</span>
          <div>
            <h3 className="font-medium">Error en la comparación</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </Card>
    );
  }
  
  if (!datosGraficos) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="text-lg font-medium mb-2">Sin datos para comparar</h3>
          <p className="text-sm">
            {modo === 'promedio-equipo' 
              ? 'Ajusta los filtros para ver promedios de equipo'
              : 'Proporciona dos resultados válidos para comparar'
            }
          </p>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header con información del modo */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {modo === 'promedio-equipo' ? 'Comparación vs Promedio de Equipo' : 'Comparación entre Resultados'}
            </h2>
            <p className="text-gray-600 mt-1">
              {modo === 'promedio-equipo' 
                ? 'Análisis del rendimiento individual comparado con promedios del equipo'
                : 'Comparación detallada entre dos registros del mismo nadador'
              }
            </p>
          </div>
          
          <Badge variant="outline" className="text-lg px-3 py-1">
            {modo === 'promedio-equipo' ? '👥 vs 🏊‍♂️' : '🏊‍♂️ vs 🏊‍♂️'}
          </Badge>
        </div>
        
        {/* Información específica del modo */}
        {modo === 'entre-resultados' && datosGraficos.comparacion && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="font-medium text-green-800">Resultado 1</div>
              <div className="text-green-700">
                {datosGraficos.comparacion.resultado1.tiempo_global} - {datosGraficos.comparacion.resultado1.competencia}
              </div>
              <div className="text-xs text-green-600">
                {new Date(datosGraficos.comparacion.resultado1.fecha_registro).toLocaleDateString()}
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="font-medium text-blue-800">Resultado 2</div>
              <div className="text-blue-700">
                {datosGraficos.comparacion.resultado2.tiempo_global} - {datosGraficos.comparacion.resultado2.competencia}
              </div>
              <div className="text-xs text-blue-600">
                {new Date(datosGraficos.comparacion.resultado2.fecha_registro).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </Card>
      
      {/* Tabs para diferentes vistas */}
      <Tabs value={tabActiva} onValueChange={setTabActiva}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger 
            value="pacing" 
            isActive={tabActiva === 'pacing'}
            onClick={() => setTabActiva('pacing')}
          >
            Análisis de Pacing
          </TabsTrigger>
          <TabsTrigger 
            value="radar" 
            isActive={tabActiva === 'radar'}
            onClick={() => setTabActiva('radar')}
          >
            Fortalezas/Debilidades
          </TabsTrigger>
          <TabsTrigger 
            value="consistencia" 
            isActive={tabActiva === 'consistencia'}
            onClick={() => setTabActiva('consistencia')}
          >
            Consistencia
          </TabsTrigger>
        </TabsList>
        
        {/* Tab de Pacing */}
        <TabsContent value="pacing" isActive={tabActiva === 'pacing'} className="space-y-4">
          {modo === 'promedio-equipo' && datosGraficos.segmentosPromedio && (
            <PacingChart
              promediosEquipo={datosGraficos.segmentosPromedio}
              titulo="Comparación de Pacing vs Promedio de Equipo"
              altura={500}
              tema="green"
            />
          )}
          
          {modo === 'entre-resultados' && datosGraficos.comparacion && (
            <PacingChart
              comparacionSegmentos={datosGraficos.comparacion.comparacion_segmentos}
              titulo={`Comparación de Pacing - ${datosGraficos.comparacion.nadador.nombre}`}
              altura={500}
              tema="green"
            />
          )}
        </TabsContent>
        
        {/* Tab de Radar */}
        <TabsContent value="radar" isActive={tabActiva === 'radar'} className="space-y-4">
          {modo === 'entre-resultados' && datosGraficos.metricas1 && datosGraficos.metricas2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RadarChart
                metricas={datosGraficos.metricas1}
                titulo="Resultado 1 - Análisis de Fortalezas"
                nombreNadador="Resultado 1"
                altura={400}
                tema="green"
                mostrarArea={true}
              />
              
              <RadarChart
                metricas={datosGraficos.metricas2}
                titulo="Resultado 2 - Análisis de Fortalezas"
                nombreNadador="Resultado 2"
                altura={400}
                tema="blue"
                mostrarArea={true}
              />
            </div>
          )}
          
          {modo === 'promedio-equipo' && (
            <div className="text-center p-8 text-gray-500">
              <div className="text-4xl mb-2">🚧</div>
              <p>Análisis de radar disponible solo para comparación entre resultados</p>
            </div>
          )}
        </TabsContent>
        
        {/* Tab de Consistencia */}
        <TabsContent value="consistencia" isActive={tabActiva === 'consistencia'} className="space-y-4">
          {modo === 'entre-resultados' && datosGraficos.consistencia1 && datosGraficos.consistencia2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ConsistenciaChart
                segmentos={datosGraficos.consistencia1}
                titulo="Consistencia - Resultado 1"
                altura={400}
                tipo="combinado"
                tema="green"
                mostrarEstadisticas={true}
              />
              
              <ConsistenciaChart
                segmentos={datosGraficos.consistencia2}
                titulo="Consistencia - Resultado 2"
                altura={400}
                tipo="combinado"
                tema="blue"
                mostrarEstadisticas={true}
              />
            </div>
          )}
          
          {modo === 'promedio-equipo' && (
            <div className="text-center p-8 text-gray-500">
              <div className="text-4xl mb-2">🚧</div>
              <p>Análisis de consistencia disponible solo para comparación entre resultados</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Resumen de comparación (solo para entre-resultados) */}
      {modo === 'entre-resultados' && datosGraficos.comparacion && mostrarDetalles && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Resumen de la Comparación</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Diferencia global */}
            <div className="text-center">
              <div className="text-2xl font-bold mb-2" style={{
                color: datosGraficos.comparacion.comparacion_global.mejora ? '#10b981' : '#ef4444'
              }}>
                {datosGraficos.comparacion.comparacion_global.diferencia_formateada}
              </div>
              <div className="text-sm text-gray-600">Diferencia Global</div>
              <div className="text-xs text-gray-500">
                {datosGraficos.comparacion.comparacion_global.diferencia_porcentaje.toFixed(2)}%
              </div>
            </div>
            
            {/* Segmentos mejorados */}
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {datosGraficos.comparacion.resumen.segmentos_mejorados}
              </div>
              <div className="text-sm text-gray-600">Segmentos Mejorados</div>
              <div className="text-xs text-gray-500">
                de {datosGraficos.comparacion.resumen.total_segmentos_comparados} totales
              </div>
            </div>
            
            {/* Segmentos empeorados */}
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 mb-2">
                {datosGraficos.comparacion.resumen.segmentos_empeorados}
              </div>
              <div className="text-sm text-gray-600">Segmentos Empeorados</div>
              <div className="text-xs text-gray-500">
                requieren atención
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
