"""
Modelos de base de datos para resultados y segmentos de natación.

Define las tablas 'resultado' y 'segmento' según las especificaciones del PRD
con validaciones de dominio y campos calculados automáticos.
"""

from datetime import datetime, date
from typing import Optional
from enum import Enum
from decimal import Decimal

from sqlmodel import SQLModel, Field, Relationship
from pydantic import field_validator


class FaseEnum(str, Enum):
    """Enumeración para fases de competencia según el PRD."""
    PRELIMINAR = "Preliminar"
    SEMIFINAL = "Semifinal"
    FINAL = "Final"


class EstadoValidacionEnum(str, Enum):
    """Enumeración para estado de validación según el PRD."""
    VALIDO = "valido"
    REVISAR = "revisar"


class EstiloSegmentoEnum(str, Enum):
    """Enumeración para estilos de segmento según el PRD."""
    LIBRE = "Libre"
    DORSO = "Dorso"
    PECHO = "Pecho"
    MARIPOSA = "Mariposa"


class Resultado(SQLModel, table=True):
    """
    Modelo para la tabla 'resultado'.
    
    Almacena resultados de competencias con validaciones de dominio
    según especificaciones del PRD.
    """
    
    __tablename__ = "resultado"

    # Campos principales - coinciden EXACTAMENTE con el esquema del PRD
    id: Optional[int] = Field(
        primary_key=True, 
        description="Identificador único del resultado"
    )
    
    nadador_id: int = Field(
        index=True,
        description="Referencia al nadador"
    )
    
    competencia_id: int = Field(
        index=True,
        description="Referencia a la competencia"
    )
    
    prueba_id: int = Field(
        index=True,
        description="Referencia a la prueba"
    )
    
    fase: str = Field(
        description="Fase de la competencia (Preliminar/Semifinal/Final)"
    )
    
    fecha_registro: date = Field(
        index=True,
        description="Fecha en que se registró el resultado"
    )
    
    tiempo_global_cs: int = Field(
        gt=0,
        description="Tiempo global en centésimas de segundo"
    )
    
    tiempo_15m_cs: Optional[int] = Field(
        default=None,
        gt=0,
        description="Tiempo de 15m en centésimas (solo para pruebas de 50m)"
    )
    
    categoria_label: str = Field(
        description="Etiqueta de categoría calculada automáticamente"
    )
    
    estado_validacion: str = Field(
        default="valido",
        description="Estado de validación del resultado"
    )
    
    desviacion_parciales_cs: int = Field(
        default=0,
        description="Desviación entre suma de parciales y tiempo global en centésimas"
    )
    
    capturado_por: int = Field(
        index=True,
        description="Usuario que capturó el resultado"
    )
    
    # Timestamps automáticos
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp de creación"
    )
    
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp de última modificación"
    )

    @field_validator("tiempo_global_cs")
    @classmethod
    def validate_tiempo_global(cls, v: int) -> int:
        """Validar que el tiempo global sea positivo."""
        if v <= 0:
            raise ValueError("El tiempo global debe ser positivo")
        return v

    @field_validator("tiempo_15m_cs")
    @classmethod
    def validate_tiempo_15m(cls, v: Optional[int]) -> Optional[int]:
        """Validar que el tiempo de 15m sea positivo si está presente."""
        if v is not None and v <= 0:
            raise ValueError("El tiempo de 15m debe ser positivo")
        return v


class Segmento(SQLModel, table=True):
    """
    Modelo para la tabla 'segmento'.
    
    Almacena datos de segmentos individuales con campos calculados
    automáticamente según especificaciones del PRD.
    """
    
    __tablename__ = "segmento"

    # Campos principales - coinciden EXACTAMENTE con el esquema del PRD
    id: Optional[int] = Field(
        primary_key=True,
        description="Identificador único del segmento"
    )
    
    resultado_id: int = Field(
        index=True,
        foreign_key="resultado.id",
        description="Referencia al resultado padre (CASCADE DELETE)"
    )
    
    indice: int = Field(
        ge=1,
        description="Índice del segmento (1-based, >= 1)"
    )
    
    estilo_segmento: str = Field(
        description="Estilo de natación para este segmento"
    )
    
    distancia_m: int = Field(
        description="Distancia del segmento en metros (25 o 50)"
    )
    
    tiempo_cs: int = Field(
        gt=0,
        description="Tiempo del segmento en centésimas de segundo"
    )
    
    brazadas: int = Field(
        ge=0,
        description="Número de brazadas (>= 0)"
    )
    
    flecha_m: Decimal = Field(
        ge=0,
        max_digits=4,
        decimal_places=1,
        description="Distancia de flecha en metros (1 decimal)"
    )
    
    # Campos calculados automáticamente por PostgreSQL (GENERATED ALWAYS AS)
    # NO incluimos estos campos en el modelo SQLModel para evitar conflictos con INSERT
    # PostgreSQL los calcula automáticamente según sus fórmulas definidas
    # dist_sin_flecha_m: GREATEST(distancia_m - flecha_m, 0)
    # velocidad_mps: distancia_m / (tiempo_cs / 100.0) 
    # dist_por_brazada_m: dist_sin_flecha_m / NULLIF(brazadas, 0)
    
    # Timestamps automáticos
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp de creación"
    )

    @field_validator("indice")
    @classmethod
    def validate_indice(cls, v: int) -> int:
        """Validar que el índice sea >= 1."""
        if v < 1:
            raise ValueError("El índice del segmento debe ser >= 1")
        return v

    @field_validator("tiempo_cs")
    @classmethod
    def validate_tiempo(cls, v: int) -> int:
        """Validar que el tiempo sea positivo."""
        if v <= 0:
            raise ValueError("El tiempo del segmento debe ser positivo")
        return v

    @field_validator("brazadas")
    @classmethod
    def validate_brazadas(cls, v: int) -> int:
        """Validar que las brazadas sean >= 0."""
        if v < 0:
            raise ValueError("Las brazadas deben ser >= 0")
        return v

    @field_validator("flecha_m")
    @classmethod 
    def validate_flecha(cls, v: Decimal) -> Decimal:
        """Validar que la flecha sea >= 0."""
        if v < 0:
            raise ValueError("La flecha debe ser >= 0")
        return v

    @field_validator("distancia_m")
    @classmethod
    def validate_distancia(cls, v: int) -> int:
        """Validar que la distancia sea 25 o 50."""
        if v not in (25, 50):
            raise ValueError("La distancia debe ser 25 o 50 metros")
        return v

    # Función calcular_campos_derivados() eliminada porque ahora PostgreSQL 
    # calcula automáticamente los campos derivados como GENERATED ALWAYS AS columns
