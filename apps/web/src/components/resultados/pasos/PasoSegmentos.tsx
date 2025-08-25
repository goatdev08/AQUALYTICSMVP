/**
 * PasoSegmentos - Paso 4 del stepper de registro de resultados
 * 
 * Componente que implementa:
 * - Tabla dinámica de segmentos con validación
 * - Previsualización en tiempo real
 * - Captura de datos por segmento (tiempo, brazadas, flecha)
 */

"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useStepper } from '@/contexts/stepper-context';
import { useCreateResultado } from '@/hooks/useResultados';
import { Button } from '@/components/ui/button';
import {
  Alert,
  AlertDescription,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@/components/ui';
import {
  TableIcon,
  ClockIcon,
  AlertTriangleIcon,
  ActivityIcon,
  Calculator,
  Save,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import type {
  SegmentoData,
  DatosGlobales,
  ResumenPrevisualizacion,
  EstiloSegmento,
  CrearResultadoPayload,
} from '@/types/resultados';

// =====================
// Utilidades
// =====================

/** Convierte mm:ss.cc a centésimas */
function parseTimeToCs(timeStr: string): number {
  const regex = /^(\d{1,2}):(\d{2})\.(\d{2})$/;
  const match = timeStr.match(regex);
  if (!match) return 0;
  
  const [, mm, ss, cc] = match;
  return parseInt(mm) * 6000 + parseInt(ss) * 100 + parseInt(cc);
}

/** Convierte centésimas a mm:ss.cc */
function formatCsToTime(cs: number): string {
  const minutes = Math.floor(cs / 6000);
  const seconds = Math.floor((cs % 6000) / 100);
  const centesimals = cs % 100;
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centesimals.toString().padStart(2, '0')}`;
}

/** Calcula número de segmentos según distancia y curso */
function calcularNumSegmentos(distancia: number, curso: 'SC' | 'LC'): number {
  const longitudSegmento = curso === 'SC' ? 25 : 50;
  return Math.floor(distancia / longitudSegmento);
}

/** Calcula distancia de cada segmento */
function calcularDistanciaSegmento(curso: 'SC' | 'LC'): number {
  return curso === 'SC' ? 25 : 50;
}

/** Estilos para IM en orden */
const ESTILOS_IM: EstiloSegmento[] = ['Mariposa', 'Dorso', 'Pecho', 'Libre'];

// =====================
// Componente Principal
// =====================

export function PasoSegmentos() {
  const { state, dispatch } = useStepper();
  const createResultado = useCreateResultado();
  const [resultadoGuardado, setResultadoGuardado] = useState<number | null>(null);
  const [fechaRegistro, setFechaRegistro] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  // Estado derivado
  const competencia = state.paso_competencia.competencia;
  const nadador = state.paso_nadador.nadador;
  const prueba = state.paso_prueba.prueba;
  const fase = state.paso_prueba.fase;
  const segmentosData = state.paso_segmentos;
  
  // Configuración de la prueba
  const configuracionPrueba = useMemo(() => {
    if (!prueba || !competencia) return null;
    
    const numSegmentos = calcularNumSegmentos(prueba.distancia, competencia.curso as 'SC' | 'LC');
    const distanciaSegmento = calcularDistanciaSegmento(competencia.curso as 'SC' | 'LC');
    const esCombinadoIM = prueba.estilo === 'Combinado';
    const permite15m = prueba.distancia === 50;
    
    return {
      numSegmentos,
      distanciaSegmento,
      esCombinadoIM,
      permite15m,
      curso: competencia.curso as 'SC' | 'LC',
    };
  }, [prueba, competencia]);
  
  // Inicializar segmentos
  useEffect(() => {
    if (!configuracionPrueba || segmentosData.segmentos.length > 0) return;
    
    const segmentosIniciales: SegmentoData[] = [];
    
    for (let i = 1; i <= configuracionPrueba.numSegmentos; i++) {
      const estiloSegmento = configuracionPrueba.esCombinadoIM 
        ? ESTILOS_IM[(i - 1) % 4] 
        : prueba!.estilo as EstiloSegmento;
      
      segmentosIniciales.push({
        indice: i,
        distancia_m: configuracionPrueba.distanciaSegmento,
        estilo_segmento: estiloSegmento,
        tiempo: '',
        brazadas: 0,
        flecha_m: 0,
      });
    }
    
    dispatch({
      type: 'ACTUALIZAR_SEGMENTOS',
      data: {
        segmentos: segmentosIniciales,
        datos_globales: {
          tiempo_global: '',
          ...(configuracionPrueba.permite15m && { tiempo_15m: '' }),
        },
      },
    });
  }, [configuracionPrueba, segmentosData.segmentos.length, dispatch, prueba]);
  
  // Cálculos de previsualización
  const resumen = useMemo((): ResumenPrevisualizacion | null => {
    const { segmentos, datos_globales } = segmentosData;
    
    if (!segmentos.length || !datos_globales.tiempo_global) return null;
    
    // Calcular sumas de segmentos
    let suma_parciales_cs = 0;
    let brazadas_totales = 0;
    let flecha_total_m = 0;
    let distancia_sin_flecha_total_m = 0;
    
    for (const seg of segmentos) {
      if (!seg.tiempo) continue;
      
      const tiempo_cs = parseTimeToCs(seg.tiempo);
      const dist_sin_flecha = Math.max(seg.distancia_m - seg.flecha_m, 0);
      
      suma_parciales_cs += tiempo_cs;
      brazadas_totales += seg.brazadas;
      flecha_total_m += seg.flecha_m;
      distancia_sin_flecha_total_m += dist_sin_flecha;
    }
    
    // Tiempo global
    const tiempo_global_cs = parseTimeToCs(datos_globales.tiempo_global);
    
    // Desviación
    const desviacion_cs = suma_parciales_cs - tiempo_global_cs;
    const desviacion_absoluta = Math.abs(desviacion_cs);
    const requiere_revision = desviacion_absoluta > 40; // ±0.40s = 40cs
    
    // Métricas globales
    const distancia_total = prueba!.distancia;
    const velocidad_promedio_mps = tiempo_global_cs > 0 
      ? distancia_total / (tiempo_global_cs / 100) 
      : 0;
    const distancia_por_brazada_global_m = brazadas_totales > 0
      ? distancia_sin_flecha_total_m / brazadas_totales
      : 0;
    
    return {
      suma_parciales_cs,
      brazadas_totales,
      flecha_total_m,
      desviacion_cs,
      desviacion_absoluta,
      requiere_revision,
      distancia_sin_flecha_total_m,
      velocidad_promedio_mps,
      distancia_por_brazada_global_m,
      estado_validacion: requiere_revision ? 'revisar' : 'valido',
    };
  }, [segmentosData, prueba]);
  
  // Handlers
  const handleSegmentoChange = useCallback((indice: number, campo: keyof SegmentoData, valor: string | number) => {
    dispatch({
      type: 'ACTUALIZAR_SEGMENTO',
      indice: indice - 1, // Convertir a índice 0-based
      segmento: { [campo]: valor },
    });
    
    dispatch({ type: 'MARCAR_CAMBIOS', tiene_cambios: true });
  }, [dispatch]);
  
  const handleGlobalChange = useCallback((campo: keyof DatosGlobales, valor: string) => {
    dispatch({
      type: 'ACTUALIZAR_SEGMENTOS',
      data: {
        datos_globales: {
          ...segmentosData.datos_globales,
          [campo]: valor,
        },
      },
    });
    
    dispatch({ type: 'MARCAR_CAMBIOS', tiene_cambios: true });
  }, [dispatch, segmentosData.datos_globales]);
  
  // Validaciones
  const validacionesSegmentos = useMemo(() => {
    const errores: string[] = [];
    const warnings: string[] = [];
    
    const segmentosSinTiempo = segmentosData.segmentos.filter(seg => !seg.tiempo);
    if (segmentosSinTiempo.length > 0) {
      errores.push(`${segmentosSinTiempo.length} segmento(s) sin tiempo registrado`);
    }
    
    const segmentosConFlechaExcesiva = segmentosData.segmentos.filter(
      seg => seg.flecha_m > seg.distancia_m
    );
    if (segmentosConFlechaExcesiva.length > 0) {
      errores.push(`${segmentosConFlechaExcesiva.length} segmento(s) con flecha mayor a la distancia`);
    }
    
    if (!segmentosData.datos_globales.tiempo_global) {
      errores.push('Tiempo global requerido');
    }
    
    if (resumen && resumen.requiere_revision) {
      warnings.push(`Desviación de ${formatCsToTime(Math.abs(resumen.desviacion_cs))} excede tolerancia de 0.40s`);
    }
    
    return { errores, warnings };
  }, [segmentosData, resumen]);
  
  // Completar paso cuando sea válido
  useEffect(() => {
    const esValido = validacionesSegmentos.errores.length === 0 && 
                     segmentosData.datos_globales.tiempo_global && 
                     segmentosData.segmentos.every(s => s.tiempo);
    
    if (esValido) {
      dispatch({ type: 'COMPLETAR_PASO', paso: 4 });
    }
  }, [validacionesSegmentos, segmentosData, dispatch]);
  
  // Render condicional para casos de datos incompletos
  // =====================
  // Funciones de guardado
  // =====================

  /**
   * Construye el payload para crear el resultado en el backend
   */
  const construirPayloadResultado = useCallback((): CrearResultadoPayload | null => {
    if (!competencia || !nadador || !prueba || !fase || !segmentosData.datos_globales.tiempo_global) {
      return null;
    }

    // Convertir segmentos al formato del backend
    const segmentosPayload = segmentosData.segmentos.map((segmento) => ({
      indice: segmento.indice,
      estilo_segmento: segmento.estilo_segmento,
      distancia_m: segmento.distancia_m,
      tiempo_cs: parseTimeToCs(segmento.tiempo),
      brazadas: segmento.brazadas || 0,
      flecha_m: segmento.flecha_m || 0,
    }));

    // Construir payload principal
    const payload: CrearResultadoPayload = {
      nadador_id: nadador.id,
      competencia_id: competencia.id,
      prueba_id: prueba.id,
      fase: fase,
      fecha_registro: fechaRegistro,
      tiempo_global_cs: parseTimeToCs(segmentosData.datos_globales.tiempo_global),
      tiempo_15m_cs: segmentosData.datos_globales.tiempo_15m 
        ? parseTimeToCs(segmentosData.datos_globales.tiempo_15m) 
        : undefined,
      segmentos: segmentosPayload,
    };

    return payload;
  }, [competencia, nadador, prueba, fase, segmentosData, fechaRegistro]);

  /**
   * Handler para guardar el resultado
   */
  const handleGuardarResultado = useCallback(async () => {
    const payload = construirPayloadResultado();
    
    if (!payload) {
      console.error('No se pudo construir el payload del resultado');
      return;
    }

    try {
      const resultado = await createResultado.mutateAsync(payload);
      console.log('Resultado guardado exitosamente:', resultado);
      setResultadoGuardado(resultado.id);
      
      // Limpiar cambios sin guardar
      dispatch({ type: 'MARCAR_CAMBIOS', tiene_cambios: false });
      
    } catch (error) {
      console.error('Error guardando resultado:', error);
    }
  }, [construirPayloadResultado, createResultado, dispatch]);

  // Verificaciones de datos completos
  if (!prueba || !competencia || !configuracionPrueba) {
    return (
      <div className="text-center py-8">
        <Alert className="border-yellow-200 bg-yellow-50 max-w-md mx-auto">
          <AlertTriangleIcon className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Información incompleta:</strong> Completa los pasos anteriores para continuar.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <TableIcon className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          Captura de Segmentos
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Registra los tiempos parciales y datos de cada segmento de la prueba
        </p>
      </div>
      
      {/* Información contextual */}
      <div className="space-y-3 max-w-4xl mx-auto">
        <Alert className="border-purple-200 bg-purple-50">
          <ActivityIcon className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-purple-800">
            <strong>Prueba:</strong> {prueba.nombre} • Fase: {fase}
            <br />
            <span className="text-sm">
              {configuracionPrueba.numSegmentos} segmentos de {configuracionPrueba.distanciaSegmento}m cada uno
              {configuracionPrueba.esCombinadoIM && ' (Combinado Individual)'}
            </span>
          </AlertDescription>
        </Alert>
      </div>
      
      {/* Tabla de segmentos simplificada */}
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TableIcon className="w-5 h-5" />
              Segmentos ({configuracionPrueba.numSegmentos})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {segmentosData.segmentos.map((segmento) => (
                <Card key={segmento.indice} className="p-4">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="w-12 text-center">
                      #{segmento.indice}
                    </Badge>
                    
                    {configuracionPrueba.esCombinadoIM && (
                      <Badge variant="secondary" className="w-20">
                        {segmento.estilo_segmento}
                      </Badge>
                    )}
                    
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-gray-600">Tiempo</label>
                        <Input
                          type="text"
                          placeholder="mm:ss.cc"
                          value={segmento.tiempo}
                          onChange={(e) => handleSegmentoChange(segmento.indice, 'tiempo', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-gray-600">Brazadas</label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={segmento.brazadas || ''}
                          onChange={(e) => handleSegmentoChange(segmento.indice, 'brazadas', parseInt(e.target.value) || 0)}
                          className="text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-gray-600">Flecha (m)</label>
                        <Input
                          type="number"
                          min="0"
                          max={segmento.distancia_m}
                          step="0.1"
                          placeholder="0.0"
                          value={segmento.flecha_m || ''}
                          onChange={(e) => handleSegmentoChange(segmento.indice, 'flecha_m', parseFloat(e.target.value) || 0)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Datos globales */}
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5" />
              Tiempos Globales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="font-medium text-sm w-32">Fecha registro:</label>
              <Input
                type="date"
                value={fechaRegistro}
                onChange={(e) => setFechaRegistro(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="font-medium text-sm w-32">Tiempo Global:</label>
              <Input
                type="text"
                placeholder="mm:ss.cc"
                value={segmentosData.datos_globales.tiempo_global}
                onChange={(e) => handleGlobalChange('tiempo_global', e.target.value)}
                className="flex-1"
              />
            </div>
            
            {configuracionPrueba.permite15m && (
              <div className="flex items-center gap-4">
                <label className="font-medium text-sm w-32">Tiempo 15m:</label>
                <Input
                  type="text"
                  placeholder="mm:ss.cc (opcional)"
                  value={segmentosData.datos_globales.tiempo_15m || ''}
                  onChange={(e) => handleGlobalChange('tiempo_15m', e.target.value)}
                  className="flex-1"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Previsualización */}
      {resumen && (
        <div className="max-w-4xl mx-auto">
          <Card className={`border-2 ${resumen.requiere_revision ? 'border-yellow-300 bg-yellow-50' : 'border-green-300 bg-green-50'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Previsualización
                <Badge variant={resumen.requiere_revision ? "destructive" : "default"}>
                  {resumen.estado_validacion === 'revisar' ? 'REVISAR' : 'VÁLIDO'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Suma parciales:</span>
                  <span>{formatCsToTime(resumen.suma_parciales_cs)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Tiempo global:</span>
                  <span>{segmentosData.datos_globales.tiempo_global}</span>
                </div>
                
                <div className={`flex justify-between p-2 rounded ${resumen.requiere_revision ? 'bg-yellow-100' : 'bg-green-100'}`}>
                  <span className="font-medium">Desviación:</span>
                  <span className={`font-bold ${resumen.requiere_revision ? 'text-yellow-800' : 'text-green-800'}`}>
                    {resumen.desviacion_cs >= 0 ? '+' : ''}{formatCsToTime(Math.abs(resumen.desviacion_cs))}
                    {resumen.desviacion_cs < 0 && ' (-)'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Brazadas totales:</span>
                  <span>{resumen.brazadas_totales}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Velocidad promedio:</span>
                  <span>{resumen.velocidad_promedio_mps.toFixed(2)} m/s</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Dist. por brazada:</span>
                  <span>{resumen.distancia_por_brazada_global_m.toFixed(2)}m</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Validaciones */}
      {(validacionesSegmentos.errores.length > 0 || validacionesSegmentos.warnings.length > 0) && (
        <div className="max-w-4xl mx-auto space-y-3">
          {validacionesSegmentos.errores.map((error, errorIndex) => (
            <Alert key={`error-${errorIndex}`} className="border-red-200 bg-red-50">
              <AlertTriangleIcon className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          ))}
          
          {validacionesSegmentos.warnings.map((warning, warningIndex) => (
            <Alert key={`warning-${warningIndex}`} className="border-yellow-200 bg-yellow-50">
              <AlertTriangleIcon className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Atención:</strong> {warning}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Botón de guardado */}
      <div className="max-w-4xl mx-auto">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-green-800">
                  {resultadoGuardado ? '¡Resultado guardado exitosamente!' : 'Listo para guardar'}
                </h3>
                <p className="text-sm text-green-700">
                  {resultadoGuardado 
                    ? `Resultado ID: ${resultadoGuardado}. Ya puedes cerrar esta ventana.`
                    : validacionesSegmentos.errores.length === 0 
                      ? 'Todos los datos han sido validados. Haz clic en "Guardar Resultado" para finalizar.'
                      : 'Corrige los errores antes de continuar.'
                  }
                </p>
              </div>
              
              <div className="flex gap-2">
                {resultadoGuardado ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Guardado</span>
                  </div>
                ) : (
                  <Button
                    onClick={handleGuardarResultado}
                    disabled={
                      validacionesSegmentos.errores.length > 0 ||
                      createResultado.isPending ||
                      !construirPayloadResultado()
                    }
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {createResultado.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Resultado
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Mostrar errores de guardado */}
            {createResultado.isError && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertTriangleIcon className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Error al guardar:</strong> {createResultado.error?.message || 'Error desconocido'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
}

export default PasoSegmentos;