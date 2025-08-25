"""
Esquemas para endpoints de análisis y comparaciones.

Define los modelos de datos para análisis de rendimiento,
comparaciones entre resultados y filtros avanzados.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import date
from enum import Enum


class EstiloEnum(str, Enum):
    """Estilos de natación válidos."""
    LIBRE = "Libre"
    ESPALDA = "Espalda"
    PECHO = "Pecho"
    MARIPOSA = "Mariposa"
    COMBINADO = "Combinado"


class CursoEnum(str, Enum):
    """Cursos válidos."""
    SC = "SC"  # Short Course (25m)
    LC = "LC"  # Long Course (50m)


class RamaEnum(str, Enum):
    """Ramas válidas."""
    F = "F"  # Femenino
    M = "M"  # Masculino


class AnaliticaFilters(BaseModel):
    """Filtros avanzados para endpoints de análisis."""
    
    # Filtros de prueba
    prueba_id: Optional[int] = Field(
        None, 
        description="ID específico de prueba",
        gt=0
    )
    
    estilo: Optional[EstiloEnum] = Field(
        None,
        description="Filtrar por estilo de natación"
    )
    
    distancia: Optional[int] = Field(
        None,
        description="Filtrar por distancia (metros)",
        gt=0
    )
    
    curso: Optional[CursoEnum] = Field(
        None,
        description="Filtrar por curso (SC/LC)"
    )
    
    # Filtros de nadador
    nadador_id: Optional[int] = Field(
        None,
        description="ID específico de nadador",
        gt=0
    )
    
    rama: Optional[RamaEnum] = Field(
        None,
        description="Filtrar por rama (F/M)"
    )
    
    # Filtros temporales
    fecha_desde: Optional[date] = Field(
        None,
        description="Fecha inicio del rango (YYYY-MM-DD)"
    )
    
    fecha_hasta: Optional[date] = Field(
        None,
        description="Fecha fin del rango (YYYY-MM-DD)"
    )
    
    # Filtros de competencia
    competencia_id: Optional[int] = Field(
        None,
        description="ID específico de competencia",
        gt=0
    )
    
    @validator('fecha_hasta')
    def validate_fecha_rango(cls, fecha_hasta, values):
        """Validar que fecha_hasta sea posterior a fecha_desde."""
        fecha_desde = values.get('fecha_desde')
        if fecha_desde and fecha_hasta and fecha_hasta < fecha_desde:
            raise ValueError('fecha_hasta debe ser posterior a fecha_desde')
        return fecha_hasta


class SegmentoPromedio(BaseModel):
    """Información de promedio por segmento."""
    
    indice: int = Field(description="Índice del segmento")
    tiempo_promedio: str = Field(description="Tiempo promedio formateado (MM:SS.CC)")
    tiempo_promedio_cs: int = Field(description="Tiempo promedio en centésimas")
    brazadas_promedio: float = Field(description="Promedio de brazadas")
    flecha_promedio_m: float = Field(description="Promedio de distancia de flecha (m)")
    dist_sin_flecha_promedio_m: float = Field(description="Promedio de distancia sin flecha (m)")
    registros_en_promedio: int = Field(description="Número de registros incluidos en el promedio")
    prueba: Dict[str, Any] = Field(description="Información de la prueba")


class MetadatosPromedio(BaseModel):
    """Metadatos de la consulta de promedios."""
    
    filtros_aplicados: Dict[str, Any] = Field(description="Filtros aplicados en la consulta")
    total_segmentos: int = Field(description="Total de segmentos en la respuesta")
    total_registros_analizados: int = Field(description="Total de registros incluidos en el análisis")
    equipo_id: int = Field(description="ID del equipo analizado")


class PromedioEquipoResponse(BaseModel):
    """Respuesta del endpoint de promedio de equipo."""
    
    segmentos_promedio: List[SegmentoPromedio] = Field(description="Promedios por segmento")
    metadatos: MetadatosPromedio = Field(description="Metadatos de la consulta")


class SegmentoComparacion(BaseModel):
    """Datos de un segmento para comparación."""
    
    tiempo: str = Field(description="Tiempo formateado (MM:SS.CC)")
    tiempo_cs: int = Field(description="Tiempo en centésimas")
    brazadas: Optional[int] = Field(description="Número de brazadas")
    flecha_m: Optional[float] = Field(description="Distancia de flecha (m)")
    dist_sin_flecha_m: Optional[float] = Field(description="Distancia sin flecha (m)")


class DiferenciasSegmento(BaseModel):
    """Diferencias entre segmentos."""
    
    tiempo_cs: int = Field(description="Diferencia de tiempo en centésimas")
    tiempo_formateado: str = Field(description="Diferencia de tiempo formateada (+/-MM:SS.CC)")
    brazadas: int = Field(description="Diferencia en brazadas")
    flecha_m: float = Field(description="Diferencia en distancia de flecha")
    mejora: bool = Field(description="True si el resultado2 es mejor (menor tiempo)")


class ComparacionSegmento(BaseModel):
    """Comparación detallada de un segmento."""
    
    indice: int = Field(description="Índice del segmento")
    resultado1: SegmentoComparacion = Field(description="Datos del primer resultado")
    resultado2: SegmentoComparacion = Field(description="Datos del segundo resultado")
    diferencias: DiferenciasSegmento = Field(description="Diferencias calculadas")


class ResultadoComparacion(BaseModel):
    """Información de un resultado para comparación."""
    
    id: int = Field(description="ID del resultado")
    tiempo_global: str = Field(description="Tiempo global formateado")
    tiempo_global_cs: int = Field(description="Tiempo global en centésimas")
    fecha_registro: str = Field(description="Fecha de registro (ISO)")
    competencia: str = Field(description="Nombre de la competencia")


class ComparacionGlobal(BaseModel):
    """Comparación global entre dos resultados."""
    
    diferencia_cs: int = Field(description="Diferencia en centésimas")
    diferencia_formateada: str = Field(description="Diferencia formateada (+/-MM:SS.CC)")
    diferencia_porcentaje: float = Field(description="Diferencia porcentual")
    mejora: bool = Field(description="True si el resultado2 es mejor")
    resultado_mas_reciente: int = Field(description="Número del resultado más reciente (1 o 2)")


class ResumenComparacion(BaseModel):
    """Resumen de la comparación."""
    
    total_segmentos_comparados: int = Field(description="Total de segmentos comparados")
    segmentos_mejorados: int = Field(description="Segmentos donde hubo mejora")
    segmentos_empeorados: int = Field(description="Segmentos donde hubo empeoramiento")


class NadadorInfo(BaseModel):
    """Información básica del nadador."""
    
    id: int = Field(description="ID del nadador")
    nombre: str = Field(description="Nombre completo")
    rama: str = Field(description="Rama (F/M)")


class PruebaInfo(BaseModel):
    """Información básica de la prueba."""
    
    id: int = Field(description="ID de la prueba")
    estilo: str = Field(description="Estilo de natación")
    distancia: int = Field(description="Distancia en metros")
    curso: str = Field(description="Curso (SC/LC)")


class ComparacionResponse(BaseModel):
    """Respuesta del endpoint de comparación entre resultados."""
    
    nadador: NadadorInfo = Field(description="Información del nadador")
    prueba: PruebaInfo = Field(description="Información de la prueba")
    resultado1: ResultadoComparacion = Field(description="Primer resultado")
    resultado2: ResultadoComparacion = Field(description="Segundo resultado")
    comparacion_global: ComparacionGlobal = Field(description="Comparación global")
    comparacion_segmentos: List[ComparacionSegmento] = Field(description="Comparación por segmentos")
    resumen: ResumenComparacion = Field(description="Resumen de la comparación")
