/**
 * Demostración del cálculo del coeficiente de variación
 */

// Ejemplos de diferentes tipos de nadadores
const ejemplosNadadores = [
  {
    nombre: "Nadador Elite (Muy Consistente)",
    tiempos: [2850, 2860, 2855, 2865, 2850, 2870, 2855, 2860],
    descripcion: "Mantiene ritmo casi perfecto, variación mínima entre segmentos"
  },
  {
    nombre: "Nadador Competitivo (Buena Consistencia)", 
    tiempos: [2850, 2920, 2880, 2940, 2870, 2950, 2890, 2930],
    descripcion: "Ligeras variaciones pero mantiene un patrón estable"
  },
  {
    nombre: "Nadador en Desarrollo (Regular)",
    tiempos: [2850, 2920, 2980, 3050, 2900, 2970, 3020, 3080],
    descripcion: "Variaciones moderadas, posible fatiga o técnica inconsistente"
  },
  {
    nombre: "Nadador Inconsistente (Problemático)",
    tiempos: [2850, 2920, 2980, 3200, 2900, 3150, 3020, 3300],
    descripcion: "Gran variabilidad, problemas técnicos o de resistencia evidentes"
  }
];

function calcularCV(tiempos) {
  // 1. Promedio
  const promedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;

  // 2. Varianza
  const varianza = tiempos.reduce((sum, t) => sum + Math.pow(t - promedio, 2), 0) / tiempos.length;

  // 3. Desviación estándar
  const desviacion = Math.sqrt(varianza);

  // 4. Coeficiente de variación (%)
  const cv = promedio > 0 ? (desviacion / promedio) * 100 : 0;

  // 5. Puntuación de consistencia (0-100)
  const puntuacion = Math.max(0, 100 - cv * 10);

  return {
    promedio,
    promedioSeg: promedio / 100,
    desviacion,
    desviacionSeg: desviacion / 100,
    cv,
    puntuacion,
    clasificacion: cv <= 2 ? 'Elite' : cv <= 4 ? 'Competitivo' : cv <= 6 ? 'En Desarrollo' : 'Problemático'
  };
}

console.log("=".repeat(80));
console.log("ANÁLISIS DE COEFICIENTE DE VARIACIÓN EN NATACIÓN");
console.log("=".repeat(80));

ejemplosNadadores.forEach((ejemplo, index) => {
  const analisis = calcularCV(ejemplo.tiempos);
  const tiemposSeg = ejemplo.tiempos.map(t => (t/100).toFixed(2));
  
  console.log(`\n${index + 1}. ${ejemplo.nombre}`);
  console.log("-".repeat(60));
  console.log(`Descripción: ${ejemplo.descripcion}`);
  console.log(`Tiempos: ${tiemposSeg.join("s, ")}s`);
  console.log(`Promedio: ${analisis.promedioSeg.toFixed(2)}s`);
  console.log(`Desviación: ${analisis.desviacionSeg.toFixed(3)}s`);
  console.log(`Coeficiente de Variación: ${analisis.cv.toFixed(2)}%`);
  console.log(`Puntuación Consistencia: ${analisis.puntuacion.toFixed(1)}/100`);
  console.log(`Clasificación: ${analisis.clasificacion}`);
  
  // Mostrar el cálculo paso a paso para el primer ejemplo
  if (index === 0) {
    console.log("\n📊 CÁLCULO PASO A PASO (Primer ejemplo):");
    console.log(`1. Tiempos: [${ejemplo.tiempos.join(", ")}] centésimas`);
    console.log(`2. Promedio: (${ejemplo.tiempos.join(" + ")}) ÷ ${ejemplo.tiempos.length} = ${analisis.promedio.toFixed(2)} cs`);
    
    const diferencias = ejemplo.tiempos.map(t => Math.pow(t - analisis.promedio, 2));
    console.log(`3. Diferencias²: [${diferencias.map(d => d.toFixed(1)).join(", ")}]`);
    console.log(`4. Varianza: ${diferencias.reduce((a,b) => a+b, 0).toFixed(1)} ÷ ${ejemplo.tiempos.length} = ${(analisis.desviacion * analisis.desviacion).toFixed(2)}`);
    console.log(`5. Desviación: √${(analisis.desviacion * analisis.desviacion).toFixed(2)} = ${analisis.desviacion.toFixed(2)} cs`);
    console.log(`6. CV: (${analisis.desviacion.toFixed(2)} ÷ ${analisis.promedio.toFixed(2)}) × 100 = ${analisis.cv.toFixed(2)}%`);
    console.log(`7. Puntuación: 100 - (${analisis.cv.toFixed(2)} × 10) = ${analisis.puntuacion.toFixed(1)} puntos`);
  }
});

console.log("\n" + "=".repeat(80));
console.log("INTERPRETACIÓN DE RESULTADOS:");
console.log("=".repeat(80));
console.log("CV ≤ 2%:  Elite - Consistencia excepcional");
console.log("CV 2-4%:  Competitivo - Buena consistencia"); 
console.log("CV 4-6%:  En Desarrollo - Consistencia regular");
console.log("CV 6-8%:  Problemático - Poca consistencia");
console.log("CV > 8%:  Crítico - Muy inconsistente");
console.log("\n💡 La fórmula actual: Puntuación = 100 - (CV × 10)");
console.log("   Esto significa que cada 1% de CV reduce 10 puntos la puntuación.");
