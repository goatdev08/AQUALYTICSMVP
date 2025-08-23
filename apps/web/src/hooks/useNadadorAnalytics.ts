"use client";

/**
 * Hook para analytics y estadísticas de nadadores
 * 
 * Genera datos mock realistas basados en el perfil del nadador
 * para mejores marcas, evolución temporal y distribución de estilos
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type Nadador } from './useNadadores';

// ============================================================================
// TIPOS DE DATOS
// ============================================================================

export interface MejorMarca {
  prueba: string;
  curso: 'SC' | 'LC'; // Short Course (25m) | Long Course (50m)  
  tiempo: number; // en segundos
  fecha: string;
  competencia: string;
  lugar: string;
}

export interface EvolucionTiempo {
  fecha: string;
  prueba: string;
  tiempo: number;
  competencia: string;
}

export interface DistribucionEstilo {
  estilo: string;
  pruebas_nadadas: number;
  mejor_tiempo: number;
  prueba_mejor_tiempo: string; // ⭐ NUEVO: Contexto específico
  promedio: number;
  prueba_promedio: string; // ⭐ NUEVO: Contexto específico  
  porcentaje: number;
}

export interface RegistroReciente {
  id: number;
  fecha: string;
  competencia: string;
  prueba: string;
  tiempo: number;
  lugar: number;
  puntaje?: number;
}

export interface RankingNadador {
  nadador_id: number;
  nombre_completo: string;
  posicion_equipo: number;
  posicion_categoria: number;
  mejor_tiempo: number;
  promedio_ultimos_3: number;
  tendencia: number; // Positivo = mejorando, Negativo = empeorando
  total_participaciones: number;
  ultima_competencia: string;
  categoria: string;
}

export interface RankingData {
  prueba_seleccionada?: string;
  curso_seleccionado?: string;
  categoria_filtro?: string;
  rama_filtro?: string;
  ranking: RankingNadador[];
  posicion_nadador_actual?: number;
  estadisticas: {
    total_participantes: number;
    mejor_tiempo_equipo: number;
    promedio_equipo: number;
    nadador_mas_participaciones: string;
  };
}

export interface NadadorAnalytics {
  mejores_marcas: MejorMarca[];
  evolucion_temporal: EvolucionTiempo[];
  distribucion_estilos: DistribucionEstilo[];
  registros_recientes: RegistroReciente[];
  ranking_intra_equipo: RankingData;
  estadisticas_generales: {
    total_competencias: number;
    total_pruebas: number;
    mejor_lugar_promedio: number;
    eventos_ultimo_mes: number;
  };
}

// ============================================================================
// DATOS MOCK REALISTAS
// ============================================================================

const PRUEBAS_NATACION = [
  '50 Libre', '100 Libre', '200 Libre', '400 Libre', '800 Libre', '1500 Libre',
  '50 Espalda', '100 Espalda', '200 Espalda',
  '50 Pecho', '100 Pecho', '200 Pecho',
  '50 Mariposa', '100 Mariposa', '200 Mariposa',
  '200 Combinado Individual', '400 Combinado Individual'
];

const COMPETENCIAS_MOCK = [
  'Campeonato Nacional Juvenil',
  'Copa del Atlántico',
  'Festival de Natación',
  'Torneo Regional',
  'Liga Municipal',
  'Campeonato Intercolegial',
  'Open de Invierno',
  'Festival de Primavera'
];

const ESTILOS = ['Libre', 'Espalda', 'Pecho', 'Mariposa', 'Combinado'];

// ============================================================================
// GENERADORES DE DATOS MOCK
// ============================================================================

function generateMejoresMarcas(nadador: Nadador): MejorMarca[] {
  const marcas: MejorMarca[] = [];
  const numPruebas = Math.min(8, Math.floor(Math.random() * 6) + 5); // 5-8 pruebas
  
  const pruebasSeleccionadas = PRUEBAS_NATACION
    .sort(() => 0.5 - Math.random())
    .slice(0, numPruebas);

  pruebasSeleccionadas.forEach(prueba => {
    const tiempoBase = getBaseTiempo(prueba, nadador.rama, nadador.categoria_actual);
    const variacion = (Math.random() - 0.5) * tiempoBase * 0.1; // ±10% variación
    
    // SC (Short Course)
    marcas.push({
      prueba,
      curso: 'SC',
      tiempo: tiempoBase + variacion,
      fecha: generateFechaReciente(),
      competencia: COMPETENCIAS_MOCK[Math.floor(Math.random() * COMPETENCIAS_MOCK.length)],
      lugar: '25m'
    });

    // LC (Long Course) - ligeramente más lento
    if (Math.random() > 0.3) { // 70% de posibilidad de tener marca LC
      marcas.push({
        prueba,
        curso: 'LC', 
        tiempo: tiempoBase + variacion + (tiempoBase * 0.03), // 3% más lento en LC
        fecha: generateFechaReciente(),
        competencia: COMPETENCIAS_MOCK[Math.floor(Math.random() * COMPETENCIAS_MOCK.length)],
        lugar: '50m'
      });
    }
  });

  return marcas.sort((a, b) => a.tiempo - b.tiempo);
}

function generateEvolucionTemporal(nadador: Nadador): EvolucionTiempo[] {
  const evolucion: EvolucionTiempo[] = [];
  const pruebaFavorita = PRUEBAS_NATACION[Math.floor(Math.random() * 6)]; // Preferir estilos libres
  
  // Generar 8-12 registros históricos
  const numRegistros = Math.floor(Math.random() * 5) + 8;
  const tiempoBase = getBaseTiempo(pruebaFavorita, nadador.rama, nadador.categoria_actual);
  
  for (let i = 0; i < numRegistros; i++) {
    const mesesAtras = (numRegistros - i) * (Math.random() * 2 + 1); // 1-3 meses entre eventos
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() - mesesAtras);
    
    // Simular mejora progresiva con algunas fluctuaciones
    const progreso = (i / numRegistros) * 0.15; // Mejora hasta 15%
    const fluctuacion = (Math.random() - 0.5) * 0.05; // ±5% fluctuación
    const tiempo = tiempoBase * (1 - progreso + fluctuacion);
    
    evolucion.push({
      fecha: fecha.toISOString().split('T')[0],
      prueba: pruebaFavorita,
      tiempo,
      competencia: COMPETENCIAS_MOCK[Math.floor(Math.random() * COMPETENCIAS_MOCK.length)]
    });
  }

  return evolucion.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
}

function generateDistribucionEstilos(nadador: Nadador): DistribucionEstilo[] {
  return ESTILOS.map(estilo => {
    const pruebasNadadas = Math.floor(Math.random() * 15) + 5; // 5-20 pruebas
    
    // Generar pruebas realistas - MISMA PRUEBA para mejor tiempo y promedio (coherencia lógica)
    const pruebasDisponibles = [`50 ${estilo}`, `100 ${estilo}`];
    if (estilo === 'Libre') {
      pruebasDisponibles.push(`200 ${estilo}`, `400 ${estilo}`);
    }
    
    // ⭐ NUEVA LÓGICA: Una sola prueba por estilo (coherente)
    const pruebaSeleccionada = pruebasDisponibles[Math.floor(Math.random() * pruebasDisponibles.length)];
    
    const tiempoBase = getBaseTiempo(pruebaSeleccionada, nadador.rama, nadador.categoria_actual);
    const mejorTiempo = tiempoBase * (0.9 + Math.random() * 0.15); // 90%-105% del base
    const promedio = mejorTiempo * (1.03 + Math.random() * 0.05); // 3-8% más lento que el mejor (REALISTA)
    
    return {
      estilo,
      pruebas_nadadas: pruebasNadadas,
      mejor_tiempo: mejorTiempo,
      prueba_mejor_tiempo: pruebaSeleccionada, // ⭐ MISMA PRUEBA (coherente)
      promedio,
      prueba_promedio: pruebaSeleccionada, // ⭐ MISMA PRUEBA (coherente)
      porcentaje: 0 // Se calculará después
    };
  }).map(dist => {
    const total = ESTILOS.reduce((sum, _) => sum + Math.floor(Math.random() * 15) + 5, 0);
    return {
      ...dist,
      porcentaje: Math.round((dist.pruebas_nadadas / total) * 100)
    };
  }).sort((a, b) => b.pruebas_nadadas - a.pruebas_nadadas);
}

function generateRegistrosRecientes(nadador: Nadador): RegistroReciente[] {
  const registros: RegistroReciente[] = [];
  const numRegistros = Math.floor(Math.random() * 8) + 5; // 5-12 registros
  
  for (let i = 0; i < numRegistros; i++) {
    const diasAtras = Math.floor(Math.random() * 60); // Últimos 60 días
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - diasAtras);
    
    const prueba = PRUEBAS_NATACION[Math.floor(Math.random() * PRUEBAS_NATACION.length)];
    const tiempo = getBaseTiempo(prueba, nadador.rama, nadador.categoria_actual) * (0.95 + Math.random() * 0.1);
    const lugar = Math.floor(Math.random() * 8) + 1; // 1-8 lugar
    
    registros.push({
      id: i + 1,
      fecha: fecha.toISOString().split('T')[0],
      competencia: COMPETENCIAS_MOCK[Math.floor(Math.random() * COMPETENCIAS_MOCK.length)],
      prueba,
      tiempo,
      lugar,
      puntaje: lugar <= 3 ? Math.floor(Math.random() * 200) + 600 : undefined // Solo top 3 tienen puntaje
    });
  }

  return registros.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

function generateRankingIntraEquipo(nadador: Nadador): RankingData {
  // Generar datos de ranking coherentes para el equipo
  const pruebasComunes = ['50 Libre', '100 Libre', '50 Espalda', '100 Espalda', '50 Pecho', '100 Pecho'];
  
  // Seleccionar prueba "más fuerte" del nadador basada en su perfil
  const pruebaFavorita = pruebasComunes[Math.floor(Math.random() * pruebasComunes.length)];
  const cursoPreferido = Math.random() > 0.5 ? 'SC' : 'LC';
  
  // Generar compañeros de equipo ficticios
  const nombresEquipo = [
    'Ana Martínez', 'Carlos Ruiz', 'María López', 'David González',
    'Laura Hernández', 'Miguel Torres', 'Sofia Ramírez', 'Pablo Morales',
    'Carla Vargas', 'Fernando Jiménez', 'Isabella Cruz', 'Andrés Silva'
  ].filter(nombre => nombre !== nadador.nombre_completo);

  const totalNadadoresEquipo = Math.min(10, Math.floor(Math.random() * 6) + 6); // 6-10 nadadores
  const nadadores = nombresEquipo.slice(0, totalNadadoresEquipo - 1); // -1 porque incluimos al nadador actual
  
  // Tiempo base para la prueba seleccionada
  const tiempoBaseNadador = getBaseTiempo(pruebaFavorita, nadador.rama, nadador.categoria_actual);
  const mejorTiempoNadador = tiempoBaseNadador * (0.9 + Math.random() * 0.1); // 90%-100% del base
  
  // Generar ranking del equipo
  const rankingEquipo: RankingNadador[] = [];
  
  // Agregar al nadador actual
  const posicionNadador = Math.floor(Math.random() * Math.min(5, totalNadadoresEquipo)) + 1; // Top 5 o total
  const tendenciaNadador = (Math.random() - 0.5) * 2; // -1 a +1 segundos
  
  rankingEquipo.push({
    nadador_id: nadador.id,
    nombre_completo: nadador.nombre_completo,
    posicion_equipo: posicionNadador,
    posicion_categoria: Math.max(1, posicionNadador - Math.floor(Math.random() * 2)), // Categoría = mejor o igual posición
    mejor_tiempo: mejorTiempoNadador,
    promedio_ultimos_3: mejorTiempoNadador * (1 + (Math.random() * 0.06 - 0.03)), // ±3% variación
    tendencia: tendenciaNadador,
    total_participaciones: Math.floor(Math.random() * 8) + 5,
    ultima_competencia: COMPETENCIAS_MOCK[Math.floor(Math.random() * COMPETENCIAS_MOCK.length)],
    categoria: nadador.categoria_actual
  });
  
  // Generar otros nadadores del equipo
  for (let i = 0; i < nadadores.length; i++) {
    const nombre = nadadores[i];
    const posicion = i < posicionNadador - 1 ? i + 1 : i + 2; // Posiciones antes y después del nadador actual
    const tiempoVariacion = (Math.random() - 0.5) * 0.2; // ±10% variación respecto al nadador actual
    const mejorTiempo = mejorTiempoNadador * (1 + tiempoVariacion);
    
    // Determinar categoría basada en variación de nombre (simulación)
    const categorias = ['11-12', '13-14', '15-16', '17+'];
    const categoria = Math.random() > 0.6 ? nadador.categoria_actual : categorias[Math.floor(Math.random() * categorias.length)];
    
    rankingEquipo.push({
      nadador_id: 1000 + i, // IDs ficticios
      nombre_completo: nombre,
      posicion_equipo: posicion,
      posicion_categoria: Math.floor(Math.random() * Math.min(4, totalNadadoresEquipo)) + 1,
      mejor_tiempo: mejorTiempo,
      promedio_ultimos_3: mejorTiempo * (1 + (Math.random() * 0.08 - 0.04)), // ±4% variación
      tendencia: (Math.random() - 0.5) * 3, // -1.5 a +1.5 segundos
      total_participaciones: Math.floor(Math.random() * 10) + 3,
      ultima_competencia: COMPETENCIAS_MOCK[Math.floor(Math.random() * COMPETENCIAS_MOCK.length)],
      categoria: categoria
    });
  }
  
  // Ordenar por posición
  rankingEquipo.sort((a, b) => a.posicion_equipo - b.posicion_equipo);
  
  // Calcular estadísticas del equipo
  const tiempos = rankingEquipo.map(n => n.mejor_tiempo);
  const mejorTiempoEquipo = Math.min(...tiempos);
  const promedioEquipo = tiempos.reduce((sum, t) => sum + t, 0) / tiempos.length;
  const nadadorMasParticipaciones = rankingEquipo.reduce((prev, current) => 
    prev.total_participaciones > current.total_participaciones ? prev : current
  );

  return {
    prueba_seleccionada: pruebaFavorita,
    curso_seleccionado: cursoPreferido,
    categoria_filtro: 'Todas',
    rama_filtro: nadador.rama,
    ranking: rankingEquipo,
    posicion_nadador_actual: posicionNadador,
    estadisticas: {
      total_participantes: totalNadadoresEquipo,
      mejor_tiempo_equipo: mejorTiempoEquipo,
      promedio_equipo: promedioEquipo,
      nadador_mas_participaciones: nadadorMasParticipaciones.nombre_completo
    }
  };
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function getBaseTiempo(prueba: string, rama: string, categoria: string): number {
  // Tiempos base realistas en segundos (simplificado)
  const base = {
    '50 Libre': rama === 'F' ? 30 : 26,
    '100 Libre': rama === 'F' ? 65 : 56,
    '200 Libre': rama === 'F' ? 140 : 120,
    '400 Libre': rama === 'F' ? 300 : 260,
    '100 Espalda': rama === 'F' ? 75 : 65,
    '100 Pecho': rama === 'F' ? 85 : 75,
    '100 Mariposa': rama === 'F' ? 80 : 70,
    '200 Combinado Individual': rama === 'F' ? 160 : 140
  }[prueba] || (rama === 'F' ? 70 : 60);

  // Ajustar por categoría
  const factor = categoria === '11-12' ? 1.3 : 
                 categoria === '13-14' ? 1.15 : 
                 categoria === '15-16' ? 1.05 : 1.0;

  return base * factor;
}

function generateFechaReciente(): string {
  const fecha = new Date();
  const diasAtras = Math.floor(Math.random() * 180); // Últimos 6 meses
  fecha.setDate(fecha.getDate() - diasAtras);
  return fecha.toISOString().split('T')[0];
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useNadadorAnalytics(nadador?: Nadador) {
  // Generar datos memo para consistencia
  const mockData = useMemo(() => {
    if (!nadador) return null;

    const data: NadadorAnalytics = {
      mejores_marcas: generateMejoresMarcas(nadador),
      evolucion_temporal: generateEvolucionTemporal(nadador), 
      distribucion_estilos: generateDistribucionEstilos(nadador),
      registros_recientes: generateRegistrosRecientes(nadador),
      ranking_intra_equipo: generateRankingIntraEquipo(nadador),
      estadisticas_generales: {
        total_competencias: Math.floor(Math.random() * 8) + 5,
        total_pruebas: Math.floor(Math.random() * 25) + 15,
        mejor_lugar_promedio: Math.round((Math.random() * 3 + 2) * 10) / 10, // 2.0 - 5.0
        eventos_ultimo_mes: Math.floor(Math.random() * 4) + 1
      }
    };

    return data;
  }, [nadador?.id, nadador?.nombre_completo]);

  return useQuery<NadadorAnalytics | null>({
    queryKey: ['nadadorAnalytics', nadador?.id],
    queryFn: async (): Promise<NadadorAnalytics | null> => {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 600));
      return mockData;
    },
    enabled: !!nadador,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Types ya exportados arriba en sus definiciones
