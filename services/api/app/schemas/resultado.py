"""
Esquemas Pydantic para endpoints de resultados.

Define los modelos de request/response para la gestión de resultados y segmentos
de natación según especificaciones del PRD.
"""

from datetime import date, datetime
from typing import Optional, List
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator, computed_field

# Importar enums desde models para evitar duplicación
from app.models.resultado import FaseEnum, EstadoValidacionEnum, EstiloSegmentoEnum


# ==========================================
# Esquemas para Segmento
# ==========================================

class SegmentoBase(BaseModel):
    """Esquema base para segmento según PRD."""
    
    indice: int = Field(
        ...,
        ge=1,
        description="Índice del segmento (1-based, >= 1)"
    )
    
    estilo_segmento: str = Field(
        ...,
        description="Estilo de natación para este segmento"
    )
    
    distancia_m: int = Field(
        ...,
        description="Distancia del segmento en metros (25 o 50)"
    )
    
    tiempo_cs: int = Field(
        ...,
        gt=0,
        description="Tiempo del segmento en centésimas de segundo"
    )
    
    brazadas: int = Field(
        ...,
        ge=0,
        description="Número de brazadas (>= 0)"
    )
    
    flecha_m: Decimal = Field(
        ...,
        ge=0,
        max_digits=4,
        decimal_places=1,
        description="Distancia de flecha en metros (1 decimal)"
    )

    @field_validator("distancia_m")
    @classmethod
    def validate_distancia(cls, v: int) -> int:
        """Validar que la distancia sea 25 o 50."""
        if v not in (25, 50):
            raise ValueError("La distancia debe ser 25 o 50 metros")
        return v

    @field_validator("tiempo_cs")
    @classmethod
    def validate_tiempo(cls, v: int) -> int:
        """Validar que el tiempo sea positivo."""
        if v <= 0:
            raise ValueError("El tiempo del segmento debe ser positivo")
        return v


class SegmentoCreate(SegmentoBase):
    """Esquema para crear un segmento."""
    pass


class SegmentoResponse(SegmentoBase):
    """Esquema de respuesta para segmento con campos calculados."""
    
    id: int = Field(description="Identificador único del segmento")
    resultado_id: int = Field(description="ID del resultado padre")
    
    # Campos calculados por PostgreSQL (opcionales para evitar errores de serialización)
    dist_sin_flecha_m: Optional[Decimal] = Field(
        default=None,
        description="Distancia sin flecha calculada automáticamente por PostgreSQL"
    )
    velocidad_mps: Optional[Decimal] = Field(
        default=None,
        description="Velocidad en m/s calculada automáticamente por PostgreSQL"
    )
    dist_por_brazada_m: Optional[Decimal] = Field(
        default=None,
        description="Distancia por brazada calculada automáticamente por PostgreSQL"
    )
    
    created_at: datetime = Field(description="Timestamp de creación")
    
    model_config = {"from_attributes": True}


# ==========================================
# Esquemas para Resultado
# ==========================================

class ResultadoBase(BaseModel):
    """Esquema base para resultado según PRD."""
    
    nadador_id: int = Field(
        ...,
        description="ID del nadador"
    )
    
    competencia_id: int = Field(
        ...,
        description="ID de la competencia"
    )
    
    prueba_id: int = Field(
        ...,
        description="ID de la prueba"
    )
    
    fase: str = Field(
        ...,
        description="Fase de la competencia"
    )
    
    fecha_registro: date = Field(
        ...,
        description="Fecha en que se registró el resultado"
    )
    
    tiempo_global_cs: int = Field(
        ...,
        gt=0,
        description="Tiempo global en centésimas de segundo"
    )
    
    tiempo_15m_cs: Optional[int] = Field(
        default=None,
        gt=0,
        description="Tiempo de 15m en centésimas (solo para pruebas de 50m)"
    )


class ResultadoCreate(ResultadoBase):
    """
    Esquema para crear un resultado completo con segmentos.
    
    Incluye toda la información necesaria para crear resultado + segmentos
    en una transacción según especificaciones del PRD.
    """
    
    segmentos: List[SegmentoCreate] = Field(
        ...,
        min_items=1,
        description="Lista de segmentos del resultado"
    )

    @field_validator("segmentos")
    @classmethod
    def validate_segmentos(cls, v: List[SegmentoCreate]) -> List[SegmentoCreate]:
        """Validar que los segmentos tengan índices consecutivos."""
        if not v:
            raise ValueError("Debe incluir al menos un segmento")
        
        # Ordenar por índice para validación
        segmentos_ordenados = sorted(v, key=lambda s: s.indice)
        
        # Validar índices consecutivos desde 1
        for i, segmento in enumerate(segmentos_ordenados, 1):
            if segmento.indice != i:
                raise ValueError(f"Los índices de segmentos deben ser consecutivos desde 1. Falta índice {i}")
        
        return v

    @field_validator("tiempo_15m_cs")
    @classmethod
    def validate_tiempo_15m(cls, v: Optional[int]) -> Optional[int]:
        """Validar que el tiempo de 15m sea positivo si está presente."""
        if v is not None and v <= 0:
            raise ValueError("El tiempo de 15m debe ser positivo")
        return v


class ResultadoResponse(ResultadoBase):
    """Esquema de respuesta para resultado."""
    
    id: int = Field(description="Identificador único del resultado")
    
    categoria_label: str = Field(
        description="Etiqueta de categoría calculada automáticamente"
    )
    
    estado_validacion: str = Field(
        description="Estado de validación del resultado"
    )
    
    desviacion_parciales_cs: int = Field(
        description="Desviación entre suma de parciales y tiempo global"
    )
    
    capturado_por: int = Field(description="Usuario que capturó el resultado")
    
    created_at: datetime = Field(description="Timestamp de creación")
    updated_at: datetime = Field(description="Timestamp de última modificación")
    
    model_config = {"from_attributes": True}


# ==========================================
# Esquemas de respuesta completa
# ==========================================

class ResumenGlobal(BaseModel):
    """
    Resumen calculado de métricas globales según PRD.
    
    Incluye sumas y promedios derivados de los segmentos.
    """
    
    suma_parciales_cs: int = Field(
        description="Suma de todos los tiempos parciales en centésimas"
    )
    
    desviacion_cs: int = Field(
        description="Diferencia entre suma de parciales y tiempo global"
    )
    
    desviacion_absoluta_cs: int = Field(
        description="Valor absoluto de la desviación"
    )
    
    requiere_revision: bool = Field(
        description="True si la desviación excede ±40cs"
    )
    
    brazadas_totales: int = Field(
        description="Suma de todas las brazadas"
    )
    
    flecha_total_m: Decimal = Field(
        description="Suma de todas las flechas en metros"
    )
    
    distancia_sin_flecha_total_m: Decimal = Field(
        description="Suma de distancias sin flecha"
    )
    
    distancia_total_m: int = Field(
        description="Distancia total de la prueba"
    )
    
    velocidad_promedio_mps: Decimal = Field(
        description="Velocidad promedio global en m/s"
    )
    
    distancia_por_brazada_global_m: Optional[Decimal] = Field(
        description="Distancia por brazada global (si brazadas > 0)"
    )


class ResultadoCompletoResponse(BaseModel):
    """
    Respuesta completa para POST /resultados según PRD.
    
    Incluye resultado, segmentos y resumen calculado.
    """
    
    resultado: ResultadoResponse = Field(
        description="Información del resultado creado"
    )
    
    segmentos: List[SegmentoResponse] = Field(
        description="Lista de segmentos creados con campos calculados"
    )
    
    resumen_global: ResumenGlobal = Field(
        description="Resumen de métricas globales calculadas"
    )


# ==========================================
# Esquemas adicionales para filtros y listados
# ==========================================

class ResultadoSearchFilters(BaseModel):
    """Filtros para búsqueda de resultados según PRD."""
    
    nadador_id: Optional[int] = Field(default=None, description="Filtrar por nadador")
    competencia_id: Optional[int] = Field(default=None, description="Filtrar por competencia")
    prueba_id: Optional[int] = Field(default=None, description="Filtrar por prueba")
    rama: Optional[str] = Field(default=None, description="Filtrar por rama (F/M)")
    fecha_inicio: Optional[date] = Field(default=None, description="Fecha inicio del rango")
    fecha_fin: Optional[date] = Field(default=None, description="Fecha fin del rango")
    estado_validacion: Optional[str] = Field(default=None, description="Filtrar por estado")
    fase: Optional[str] = Field(default=None, description="Filtrar por fase")


class ResultadoListResponse(BaseModel):
    """Respuesta paginada para listado de resultados."""
    
    resultados: List[ResultadoResponse] = Field(description="Lista de resultados")
    total: int = Field(description="Total de resultados encontrados")
    page: int = Field(description="Página actual")
    size: int = Field(description="Tamaño de página")
    total_pages: int = Field(description="Total de páginas")

    @computed_field
    @property
    def has_next(self) -> bool:
        """Indica si hay más páginas."""
        return self.page < self.total_pages

    @computed_field
    @property
    def has_prev(self) -> bool:
        """Indica si hay página anterior."""
        return self.page > 1
