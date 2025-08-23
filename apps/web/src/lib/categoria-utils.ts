/**
 * Utilidades para cálculo y manejo de categorías de nadadores
 */

export interface CategoriaInfo {
  codigo: string;
  nombre: string;
  descripcion: string;
  edadMinima: number;
  edadMaxima?: number;
}

/**
 * Definición de categorías oficiales según PRD
 */
export const CATEGORIAS: Record<string, CategoriaInfo> = {
  '11-12': {
    codigo: '11-12',
    nombre: 'Infantil A',
    descripcion: 'Nadadores de 11 y 12 años',
    edadMinima: 11,
    edadMaxima: 12
  },
  '13-14': {
    codigo: '13-14',
    nombre: 'Infantil B', 
    descripcion: 'Nadadores de 13 y 14 años',
    edadMinima: 13,
    edadMaxima: 14
  },
  '15-16': {
    codigo: '15-16',
    nombre: 'Juvenil',
    descripcion: 'Nadadores de 15 y 16 años',
    edadMinima: 15,
    edadMaxima: 16
  },
  '17+': {
    codigo: '17+',
    nombre: 'Mayor',
    descripcion: 'Nadadores de 17 años en adelante',
    edadMinima: 17
  }
};

/**
 * Lista ordenada de categorías por edad
 */
export const CATEGORIAS_ORDENADAS = Object.values(CATEGORIAS);

/**
 * Calcula la edad de una persona en una fecha específica
 */
export function calcularEdad(fechaNacimiento: Date, fechaReferencia: Date = new Date()): number {
  const edad = fechaReferencia.getFullYear() - fechaNacimiento.getFullYear();
  const mesAjuste = fechaReferencia.getMonth() - fechaNacimiento.getMonth();
  const diaAjuste = fechaReferencia.getDate() - fechaNacimiento.getDate();
  
  // Ajustar si aún no ha cumplido años en la fecha de referencia
  if (mesAjuste < 0 || (mesAjuste === 0 && diaAjuste < 0)) {
    return edad - 1;
  }
  
  return edad;
}

/**
 * Determina la categoría según la edad
 */
export function obtenerCategoriaPorEdad(edad: number): string {
  if (edad <= 12) return '11-12';
  if (edad <= 14) return '13-14';
  if (edad <= 16) return '15-16';
  return '17+';
}

/**
 * Calcula la categoría de un nadador en una fecha específica
 */
export function calcularCategoria(fechaNacimiento: Date, fechaCompetencia: Date = new Date()): string {
  const edad = calcularEdad(fechaNacimiento, fechaCompetencia);
  return obtenerCategoriaPorEdad(edad);
}

/**
 * Obtiene información detallada de una categoría
 */
export function getInfoCategoria(codigoCategoria: string): CategoriaInfo | null {
  return CATEGORIAS[codigoCategoria] || null;
}

/**
 * Obtiene el nombre display de una categoría
 */
export function getNombreCategoria(codigoCategoria: string): string {
  const info = getInfoCategoria(codigoCategoria);
  return info ? `${info.nombre} (${info.codigo})` : codigoCategoria;
}

/**
 * Valida si una categoría existe
 */
export function esCategoriaValida(categoria: string): boolean {
  return categoria in CATEGORIAS;
}

/**
 * Obtiene la siguiente categoría por edad (para proyecciones)
 */
export function getSiguienteCategoria(categoriaActual: string): string | null {
  const orden = ['11-12', '13-14', '15-16', '17+'];
  const indiceActual = orden.indexOf(categoriaActual);
  
  if (indiceActual === -1 || indiceActual === orden.length - 1) {
    return null; // No hay siguiente o categoría inválida
  }
  
  return orden[indiceActual + 1];
}

/**
 * Calcula cuándo un nadador cambiará de categoría
 */
export function calcularProximoCambioCategoria(fechaNacimiento: Date): {
  fechaCambio: Date;
  categoriaActual: string;
  categoriaSiguiente: string;
} | null {
  const hoy = new Date();
  const edadActual = calcularEdad(fechaNacimiento, hoy);
  const categoriaActual = obtenerCategoriaPorEdad(edadActual);
  const categoriaSiguiente = getSiguienteCategoria(categoriaActual);
  
  if (!categoriaSiguiente) {
    return null; // Ya está en la categoría mayor
  }
  
  // Calcular la fecha del siguiente cumpleaños que cause cambio de categoría
  let proximoCumpleanos = new Date(fechaNacimiento);
  
  if (categoriaActual === '11-12') {
    // Cambia a 13-14 cuando cumpla 13
    proximoCumpleanos.setFullYear(fechaNacimiento.getFullYear() + 13);
  } else if (categoriaActual === '13-14') {
    // Cambia a 15-16 cuando cumpla 15  
    proximoCumpleanos.setFullYear(fechaNacimiento.getFullYear() + 15);
  } else if (categoriaActual === '15-16') {
    // Cambia a 17+ cuando cumpla 17
    proximoCumpleanos.setFullYear(fechaNacimiento.getFullYear() + 17);
  }
  
  return {
    fechaCambio: proximoCumpleanos,
    categoriaActual,
    categoriaSiguiente
  };
}

/**
 * Agrupa nadadores por categoría
 */
export function agruparPorCategoria<T extends { categoria_actual: string }>(
  nadadores: T[]
): Record<string, T[]> {
  return nadadores.reduce((grupos, nadador) => {
    const categoria = nadador.categoria_actual;
    if (!grupos[categoria]) {
      grupos[categoria] = [];
    }
    grupos[categoria].push(nadador);
    return grupos;
  }, {} as Record<string, T[]>);
}

/**
 * Obtiene estadísticas de categorías de una lista de nadadores
 */
export function getEstadisticasCategorias<T extends { categoria_actual: string }>(
  nadadores: T[]
): {
  total: number;
  porCategoria: Record<string, number>;
  categoriaConMasNadadores: string;
  categoriaConMenosNadadores: string;
} {
  const grupos = agruparPorCategoria(nadadores);
  const porCategoria = Object.keys(grupos).reduce((stats, categoria) => {
    stats[categoria] = grupos[categoria].length;
    return stats;
  }, {} as Record<string, number>);
  
  const categorias = Object.keys(porCategoria);
  const cantidades = Object.values(porCategoria);
  
  return {
    total: nadadores.length,
    porCategoria,
    categoriaConMasNadadores: categorias[cantidades.indexOf(Math.max(...cantidades))],
    categoriaConMenosNadadores: categorias[cantidades.indexOf(Math.min(...cantidades))]
  };
}
