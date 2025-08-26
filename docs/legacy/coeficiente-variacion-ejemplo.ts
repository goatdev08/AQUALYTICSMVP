/**
 * Ejemplo práctico del cálculo del coeficiente de variación
 * para demostrar cómo se mide la consistencia en natación.
 */

interface EjemploNadador {
  nombre: string;
  tiemposSegmentos: number[]; // en centésimas de segundo
  descripcion: string;
}

// Ejemplos de diferentes tipos de nadadores
export const ejemplosNadadores: EjemploNadador[] = [
  {
    nombre: "Nadador Elite (Muy Consistente)",
    tiemposSegmentos: [2850, 2860, 2855, 2865, 2850, 2870, 2855, 2860], // CV ≈ 0.3%
    descripcion: "Mantiene ritmo casi perfecto, variación mínima entre segmentos"
  },
  {
    nombre: "Nadador Competitivo (Buena Consistencia)", 
    tiemposSegmentos: [2850, 2920, 2880, 2940, 2870, 2950, 2890, 2930], // CV ≈ 1.5%
    descripcion: "Ligeras variaciones pero mantiene un patrón estable"
  },
  {
    nombre: "Nadador en Desarrollo (Regular)",
    tiemposSegmentos: [2850, 2920, 2980, 3050, 2900, 2970, 3020, 3080], // CV ≈ 3.5%
    descripcion: "Variaciones moderadas, posible fatiga o técnica inconsistente"
  },
  {
    nombre: "Nadador Inconsistente (Problemático)",
    tiemposSegmentos: [2850, 2920, 2980, 3200, 2900, 3150, 3020, 3300], // CV ≈ 6.5%
    descripcion: "Gran variabilidad, problemas técnicos o de resistencia evidentes"
  }
];

/**
 * Calcula el coeficiente de variación y métricas relacionadas
 */
export function calcularCoeficienteVariacion(tiempos: number[]) {
  if (tiempos.length === 0) return null;

  // 1. Promedio
  const promedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;

  // 2. Varianza
  const varianza = tiempos.reduce((sum, t) => sum + Math.pow(t - promedio, 2), 0) / tiempos.length;

  // 3. Desviación estándar
  const desviacion = Math.sqrt(varianza);

  // 4. Coeficiente de variación (%)
  const cv = promedio > 0 ? (desviacion / promedio) * 100 : 0;

  // 5. Puntuación de consistencia (0-100)
  const puntuacionConsistencia = Math.max(0, 100 - cv * 10);

  // 6. Análisis adicional
  const rangoTiempos = Math.max(...tiempos) - Math.min(...tiempos);
  const tiempoMasRapido = Math.min(...tiempos);
  const tiempoMasLento = Math.max(...tiempos);

  return {
    promedio: promedio,
    promedioSegundos: promedio / 100,
    desviacion: desviacion,
    desviacionSegundos: desviacion / 100,
    coeficienteVariacion: cv,
    puntuacionConsistencia: puntuacionConsistencia,
    rangoTiempos: rangoTiempos,
    rangoSegundos: rangoTiempos / 100,
    tiempoMasRapido: tiempoMasRapido,
    tiempoMasLento: tiempoMasLento,
    diferenciaMayorSegmento: tiempoMasLento - tiempoMasRapido,
    clasificacion: getClasificacionConsistencia(cv)
  };
}

/**
 * Clasifica el nivel de consistencia basado en el CV
 */
function getClasificacionConsistencia(cv: number): {
  nivel: string;
  color: string;
  descripcion: string;
} {
  if (cv <= 2) {
    return {
      nivel: "Elite",
      color: "green",
      descripcion: "Consistencia excepcional, nivel profesional"
    };
  } else if (cv <= 4) {
    return {
      nivel: "Competitivo",
      color: "blue", 
      descripcion: "Buena consistencia, nivel competitivo sólido"
    };
  } else if (cv <= 6) {
    return {
      nivel: "En Desarrollo",
      color: "yellow",
      descripcion: "Consistencia regular, necesita refinamiento"
    };
  } else if (cv <= 8) {
    return {
      nivel: "Problemático",
      color: "orange",
      descripcion: "Poca consistencia, requiere trabajo técnico"
    };
  } else {
    return {
      nivel: "Crítico",
      color: "red",
      descripcion: "Muy inconsistente, problemas fundamentales"
    };
  }
}

/**
 * Genera un reporte detallado para un nadador
 */
export function generarReporteConsistencia(ejemplo: EjemploNadador) {
  const analisis = calcularCoeficienteVariacion(ejemplo.tiemposSegmentos);
  
  if (!analisis) return null;

  return {
    nadador: ejemplo.nombre,
    descripcion: ejemplo.descripcion,
    tiemposOriginales: ejemplo.tiemposSegmentos,
    tiemposEnSegundos: ejemplo.tiemposSegmentos.map(t => (t / 100).toFixed(2)),
    ...analisis,
    recomendaciones: getRecomendaciones(analisis.coeficienteVariacion)
  };
}

/**
 * Proporciona recomendaciones basadas en el CV
 */
function getRecomendaciones(cv: number): string[] {
  if (cv <= 2) {
    return [
      "Mantener el entrenamiento actual",
      "Enfocarse en velocidad y potencia",
      "Preparación para competencias de alto nivel"
    ];
  } else if (cv <= 4) {
    return [
      "Trabajar en series de ritmo controlado",
      "Mejorar la concentración durante la prueba",
      "Ajustar estrategia de carrera"
    ];
  } else if (cv <= 6) {
    return [
      "Enfocarse en técnica de nado",
      "Entrenamientos de resistencia aeróbica",
      "Practicar control de ritmo con metrónomo"
    ];
  } else if (cv <= 8) {
    return [
      "Revisar técnica fundamental",
      "Mejorar acondicionamiento físico base",
      "Trabajar en respiración y relajación"
    ];
  } else {
    return [
      "Evaluación técnica completa necesaria",
      "Programa de acondicionamiento básico",
      "Considerar entrenamiento personalizado",
      "Revisar aspectos nutricionales y de recuperación"
    ];
  }
}

// Función para demostrar todos los ejemplos
export function demostrarTodosLosEjemplos() {
  console.log("=".repeat(60));
  console.log("ANÁLISIS DE COEFICIENTE DE VARIACIÓN EN NATACIÓN");
  console.log("=".repeat(60));

  ejemplosNadadores.forEach((ejemplo, index) => {
    const reporte = generarReporteConsistencia(ejemplo);
    if (reporte) {
      console.log(`\n${index + 1}. ${reporte.nadador}`);
      console.log("-".repeat(50));
      console.log(`Descripción: ${reporte.descripcion}`);
      console.log(`Tiempos por segmento: ${reporte.tiemposEnSegundos.join("s, ")}s`);
      console.log(`Promedio: ${reporte.promedioSegundos.toFixed(2)}s`);
      console.log(`Desviación estándar: ${reporte.desviacionSegundos.toFixed(3)}s`);
      console.log(`Coeficiente de variación: ${reporte.coeficienteVariacion.toFixed(2)}%`);
      console.log(`Puntuación de consistencia: ${reporte.puntuacionConsistencia.toFixed(1)}/100`);
      console.log(`Clasificación: ${reporte.clasificacion.nivel} (${reporte.clasificacion.descripcion})`);
      console.log(`Rango de tiempos: ${reporte.rangoSegundos.toFixed(2)}s`);
      console.log("Recomendaciones:");
      reporte.recomendaciones.forEach(rec => console.log(`  • ${rec}`));
    }
  });
}
