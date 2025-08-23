/**
 * Utilidades de conversión de tiempo para AquaLytics.
 * 
 * Maneja la conversión entre formato UI (mm:ss.cc) y centésimas de segundo (integer)
 * según especificaciones del PRD.
 */

/**
 * Convierte un string de tiempo en formato mm:ss.cc a centésimas de segundo.
 * 
 * Formato esperado: mm:ss.cc donde:
 * - mm: minutos (00-99)
 * - ss: segundos (00-59) 
 * - cc: centésimas (00-99)
 * 
 * Fórmula según PRD: cs = mm*6000 + ss*100 + cc
 * 
 * @param timeString - Tiempo en formato "mm:ss.cc" (ej: "1:23.45")
 * @returns Tiempo en centésimas de segundo como integer
 * 
 * @throws Error si el formato es inválido
 * 
 * @example
 * ```ts
 * parseTimeToCs("1:23.45") // Returns 8345
 * parseTimeToCs("0:30.00") // Returns 3000
 * parseTimeToCs("2:05.50") // Returns 12550
 * ```
 */
export function parseTimeToCs(timeString: string): number {
  if (!timeString || typeof timeString !== 'string') {
    throw new Error('Tiempo debe ser un string válido')
  }

  // Regex para validar formato mm:ss.cc (permite m:ss.cc también)
  const timeRegex = /^(\d{1,2}):([0-5]\d)\.(\d{2})$/
  const match = timeString.match(timeRegex)
  
  if (!match) {
    throw new Error(`Formato de tiempo inválido: "${timeString}". Use formato mm:ss.cc (ej: "1:23.45")`)
  }

  const minutes = parseInt(match[1], 10)
  const seconds = parseInt(match[2], 10)
  const centiseconds = parseInt(match[3], 10)

  // Validaciones adicionales
  if (minutes < 0 || minutes > 99) {
    throw new Error(`Minutos deben estar entre 00-99: ${minutes}`)
  }
  
  if (seconds < 0 || seconds > 59) {
    throw new Error(`Segundos deben estar entre 00-59: ${seconds}`)
  }
  
  if (centiseconds < 0 || centiseconds > 99) {
    throw new Error(`Centésimas deben estar entre 00-99: ${centiseconds}`)
  }

  // Fórmula según PRD: cs = mm*6000 + ss*100 + cc
  const totalCs = minutes * 6000 + seconds * 100 + centiseconds
  
  return totalCs
}

/**
 * Convierte centésimas de segundo a formato de tiempo mm:ss.cc.
 * 
 * Aplica zero-padding a minutos, segundos y centésimas para formato consistente.
 * 
 * @param centiseconds - Tiempo en centésimas de segundo
 * @returns String en formato "mm:ss.cc" con zero-padding
 * 
 * @throws Error si las centésimas son negativas
 * 
 * @example
 * ```ts
 * formatCsToTime(8345)  // Returns "01:23.45"
 * formatCsToTime(3000)  // Returns "00:30.00" 
 * formatCsToTime(12550) // Returns "02:05.50"
 * ```
 */
export function formatCsToTime(centiseconds: number): string {
  if (typeof centiseconds !== 'number') {
    throw new Error('Centésimas debe ser un número válido')
  }

  if (centiseconds < 0) {
    throw new Error(`Centésimas no pueden ser negativas: ${centiseconds}`)
  }

  if (!Number.isInteger(centiseconds)) {
    throw new Error(`Centésimas debe ser un entero: ${centiseconds}`)
  }

  // Calcular componentes usando división entera
  const totalSeconds = Math.floor(centiseconds / 100)
  const remainingCs = centiseconds % 100
  
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  // Aplicar zero-padding según PRD
  const mmPadded = minutes.toString().padStart(2, '0')
  const ssPadded = seconds.toString().padStart(2, '0')  
  const ccPadded = remainingCs.toString().padStart(2, '0')

  return `${mmPadded}:${ssPadded}.${ccPadded}`
}

/**
 * Valida si un string tiene formato de tiempo válido mm:ss.cc.
 * 
 * @param timeString - String a validar
 * @returns true si el formato es válido, false si no
 * 
 * @example
 * ```ts
 * isValidTimeFormat("1:23.45") // Returns true
 * isValidTimeFormat("1:23")    // Returns false
 * isValidTimeFormat("1:60.00") // Returns false (segundos > 59)
 * ```
 */
export function isValidTimeFormat(timeString: string): boolean {
  try {
    parseTimeToCs(timeString)
    return true
  } catch {
    return false
  }
}

/**
 * Convierte segundos decimales a centésimas de segundo.
 * 
 * Útil para convertir desde APIs que manejan segundos con decimales.
 * 
 * @param seconds - Segundos como número decimal
 * @returns Centésimas de segundo como integer
 * 
 * @example
 * ```ts
 * secondsToCs(83.45) // Returns 8345
 * secondsToCs(30.0)  // Returns 3000
 * ```
 */
export function secondsToCs(seconds: number): number {
  if (typeof seconds !== 'number' || seconds < 0) {
    throw new Error('Segundos debe ser un número no negativo')
  }
  
  return Math.round(seconds * 100)
}

/**
 * Convierte centésimas de segundo a segundos decimales.
 * 
 * @param centiseconds - Centésimas de segundo
 * @returns Segundos como número decimal
 * 
 * @example
 * ```ts
 * csToSeconds(8345) // Returns 83.45
 * csToSeconds(3000) // Returns 30.0
 * ```
 */
export function csToSeconds(centiseconds: number): number {
  if (typeof centiseconds !== 'number' || centiseconds < 0) {
    throw new Error('Centésimas debe ser un número no negativo')
  }
  
  return centiseconds / 100
}
