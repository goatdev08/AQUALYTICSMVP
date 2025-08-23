"""
Esquemas Pydantic para endpoints de nadadores.

Define los modelos de request/response para la gestión de nadadores.
"""

from datetime import date
from typing import Optional
from decimal import Decimal

from pydantic import BaseModel, Field, validator


class NadadorBase(BaseModel):
    """Esquema base para nadador según PRD."""
    
    nombre_completo: str = Field(
        ..., 
        min_length=2,
        max_length=255,
        description="Nombre completo del nadador (mínimo 2 caracteres)"
    )
    
    fecha_nacimiento: date = Field(
        ...,
        description="Fecha de nacimiento para cálculo de categoría"
    )
    
    rama: str = Field(
        ...,
        description="Rama de competencia: F (Femenil) o M (Masculino)"
    )
    
    peso: Optional[Decimal] = Field(
        default=None,
        gt=0,
        description="Peso del nadador en kilogramos (opcional, debe ser positivo)"
    )
    
    @validator('rama')
    def validate_rama(cls, v):
        """Valida que la rama sea F o M."""
        if v not in ['F', 'M']:
            raise ValueError('La rama debe ser F (Femenil) o M (Masculino)')
        return v
    
    @validator('fecha_nacimiento')
    def validate_fecha_nacimiento(cls, v):
        """Valida que la fecha de nacimiento no sea futura."""
        from datetime import date
        if v > date.today():
            raise ValueError('La fecha de nacimiento no puede ser futura')
        return v


class NadadorCreate(NadadorBase):
    """Esquema para crear nadador."""
    pass


class NadadorUpdate(BaseModel):
    """Esquema para actualizar nadador (campos opcionales)."""
    
    nombre_completo: Optional[str] = Field(
        None,
        min_length=2,
        max_length=255,
        description="Nombre completo del nadador"
    )
    
    fecha_nacimiento: Optional[date] = Field(
        None,
        description="Fecha de nacimiento"
    )
    
    rama: Optional[str] = Field(
        None,
        description="Rama de competencia: F o M"
    )
    
    peso: Optional[Decimal] = Field(
        None,
        gt=0,
        description="Peso del nadador en kilogramos"
    )
    
    @validator('rama')
    def validate_rama(cls, v):
        """Valida que la rama sea F o M si se proporciona."""
        if v is not None and v not in ['F', 'M']:
            raise ValueError('La rama debe ser F (Femenil) o M (Masculino)')
        return v
    
    @validator('fecha_nacimiento')
    def validate_fecha_nacimiento(cls, v):
        """Valida que la fecha de nacimiento no sea futura si se proporciona."""
        if v is not None:
            from datetime import date
            if v > date.today():
                raise ValueError('La fecha de nacimiento no puede ser futura')
        return v


class NadadorResponse(NadadorBase):
    """Esquema de respuesta para nadador."""
    
    id: int = Field(..., description="Identificador único del nadador")
    equipo_id: int = Field(..., description="ID del equipo al que pertenece")
    edad_actual: int = Field(..., description="Edad actual del nadador en años")
    categoria_actual: str = Field(..., description="Categoría actual del nadador")
    
    class Config:
        from_attributes = True  # Permite crear desde instancias SQLModel


class NadadorSearchFilters(BaseModel):
    """Filtros para búsqueda de nadadores."""
    
    search: Optional[str] = Field(
        None,
        description="Búsqueda por nombre (usa trigram similarity)"
    )
    
    rama: Optional[str] = Field(
        None,
        description="Filtrar por rama: F o M"
    )
    
    categoria: Optional[str] = Field(
        None,
        description="Filtrar por categoría: 11-12, 13-14, 15-16, 17+"
    )
    
    limit: int = Field(
        default=50,
        ge=1,
        le=100,
        description="Límite de resultados por página"
    )
    
    offset: int = Field(
        default=0,
        ge=0,
        description="Offset para paginación"
    )
    
    @validator('rama')
    def validate_rama(cls, v):
        """Valida que la rama sea F o M si se proporciona."""
        if v is not None and v not in ['F', 'M']:
            raise ValueError('La rama debe ser F o M')
        return v
    
    @validator('categoria')
    def validate_categoria(cls, v):
        """Valida que la categoría sea válida si se proporciona."""
        if v is not None and v not in ['11-12', '13-14', '15-16', '17+']:
            raise ValueError('La categoría debe ser: 11-12, 13-14, 15-16, 17+')
        return v


class NadadorListResponse(BaseModel):
    """Respuesta para listado paginado de nadadores."""
    
    items: list[NadadorResponse] = Field(..., description="Lista de nadadores")
    total: int = Field(..., description="Total de nadadores que coinciden con filtros")
    limit: int = Field(..., description="Límite aplicado")
    offset: int = Field(..., description="Offset aplicado")
    has_more: bool = Field(..., description="Indica si hay más páginas disponibles")
