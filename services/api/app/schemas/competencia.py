"""
Esquemas Pydantic para endpoints de competencias.

Define los modelos de request/response para la gestión de competencias de natación.
"""

from datetime import date, datetime
from typing import Optional, List
from enum import Enum

from pydantic import BaseModel, Field, field_validator, computed_field # type: ignore


class CursoEnum(str, Enum):
    """Enumeración para tipos de curso según el PRD."""
    SC = "SC"  # Short Course (25m)
    LC = "LC"  # Long Course (50m)


class CompetenciaBase(BaseModel):
    """Esquema base para competencia según PRD."""
    
    nombre: str = Field(
        ..., 
        min_length=3,
        max_length=255,
        description="Nombre de la competencia (mínimo 3 caracteres, máximo 255)"
    )
    
    curso: CursoEnum = Field(
        ...,
        description="Tipo de curso: SC (25m) o LC (50m)"
    )
    
    sede: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Sede o lugar de la competencia (opcional, máximo 255 caracteres)"
    )
    
    # Fechas separadas para facilidad de uso en frontend
    fecha_inicio: date = Field(
        ...,
        description="Fecha de inicio de la competencia"
    )
    
    fecha_fin: date = Field(
        ...,
        description="Fecha de fin de la competencia"
    )
    
    @field_validator('nombre')
    @classmethod
    def validate_nombre(cls, v: str) -> str:
        """Valida el nombre de la competencia."""
        if not v or not v.strip():
            raise ValueError('El nombre de la competencia es obligatorio')
        
        nombre_limpio = v.strip()
        
        # Validar longitud después de limpiar espacios
        if len(nombre_limpio) < 3:
            raise ValueError('El nombre debe tener al menos 3 caracteres válidos')
        if len(nombre_limpio) > 255:
            raise ValueError('El nombre no puede exceder 255 caracteres')
            
        # Validar caracteres permitidos: letras, números, espacios, guiones, puntos, acentos
        import re
        patron_valido = re.compile(r'^[a-zA-ZáéíóúüÁÉÍÓÚÜñÑ0-9\s\-_\.()]+$')
        if not patron_valido.match(nombre_limpio):
            raise ValueError('El nombre contiene caracteres no válidos. Solo se permiten letras, números, espacios, guiones, puntos y paréntesis')
            
        return nombre_limpio
    
    @field_validator('sede')
    @classmethod
    def validate_sede(cls, v: Optional[str]) -> Optional[str]:
        """Valida la sede si se proporciona."""
        if v is None or v == '':
            return None
            
        sede_limpia = v.strip()
        if len(sede_limpia) == 0:
            return None
            
        if len(sede_limpia) > 255:
            raise ValueError('La sede no puede exceder 255 caracteres')
            
        # Mismas validaciones que el nombre para sede
        import re
        patron_valido = re.compile(r'^[a-zA-ZáéíóúüÁÉÍÓÚÜñÑ0-9\s\-_\.(),]+$')
        if not patron_valido.match(sede_limpia):
            raise ValueError('La sede contiene caracteres no válidos. Solo se permiten letras, números, espacios, guiones, puntos, comas y paréntesis')
            
        return sede_limpia
    
    @field_validator('fecha_inicio')
    @classmethod 
    def validate_fecha_inicio(cls, v: date) -> date:
        """Valida la fecha de inicio de la competencia."""
        from datetime import date, timedelta
        
        # Permitir fechas hasta 6 años atrás para registros históricos
        hoy = date.today()
        fecha_minima = hoy - timedelta(days=365*6)
        if v < fecha_minima:
            raise ValueError('La fecha de inicio no puede ser anterior a 6 años (para registros históricos)')
            
        # No permitir fechas muy lejanas (más de 5 años)
        fecha_maxima = hoy + timedelta(days=365*5)
        if v > fecha_maxima:
            raise ValueError('La fecha de inicio no puede ser más de 5 años en el futuro')
            
        return v
    
    @field_validator('fecha_fin')
    @classmethod
    def validate_fecha_fin(cls, v: date, info) -> date:
        """Valida la fecha de fin de la competencia."""
        from datetime import date, timedelta
        
        # Validar que no sea muy lejana
        hoy = date.today()
        fecha_maxima = hoy + timedelta(days=365*5)
        if v > fecha_maxima:
            raise ValueError('La fecha de fin no puede ser más de 5 años en el futuro')
        
        # Validar que sea posterior o igual a la fecha de inicio
        if hasattr(info.data, 'fecha_inicio') and info.data.get('fecha_inicio'):
            fecha_inicio = info.data['fecha_inicio']
            if v < fecha_inicio:
                raise ValueError('La fecha de fin no puede ser anterior a la fecha de inicio')
                
            # Validar duración máxima (no más de 30 días)
            duracion = (v - fecha_inicio).days
            if duracion > 30:
                raise ValueError('La duración de la competencia no puede exceder 30 días')
                
        return v


class CompetenciaCreate(CompetenciaBase):
    """Esquema para crear una competencia."""
    
    # El equipo_id se toma del usuario autenticado, no del request
    pass


class CompetenciaUpdate(BaseModel):
    """Esquema para actualizar una competencia (campos opcionales)."""
    
    nombre: Optional[str] = Field(
        None,
        min_length=3, 
        max_length=255,
        description="Nuevo nombre de la competencia"
    )
    
    curso: Optional[CursoEnum] = Field(
        None,
        description="Nuevo tipo de curso"
    )
    
    sede: Optional[str] = Field(
        None,
        max_length=255,
        description="Nueva sede de la competencia"
    )
    
    fecha_inicio: Optional[date] = Field(
        None,
        description="Nueva fecha de inicio"
    )
    
    fecha_fin: Optional[date] = Field(
        None,
        description="Nueva fecha de fin"
    )
    
    @field_validator('nombre')
    @classmethod
    def validate_nombre(cls, v: Optional[str]) -> Optional[str]:
        """Valida el nombre si se proporciona en la actualización."""
        if v is None:
            return None
            
        if not v or not v.strip():
            raise ValueError('El nombre de la competencia no puede estar vacío')
        
        nombre_limpio = v.strip()
        
        # Validar longitud después de limpiar espacios
        if len(nombre_limpio) < 3:
            raise ValueError('El nombre debe tener al menos 3 caracteres válidos')
        if len(nombre_limpio) > 255:
            raise ValueError('El nombre no puede exceder 255 caracteres')
            
        # Validar caracteres permitidos
        import re
        patron_valido = re.compile(r'^[a-zA-ZáéíóúüÁÉÍÓÚÜñÑ0-9\s\-_\.()]+$')
        if not patron_valido.match(nombre_limpio):
            raise ValueError('El nombre contiene caracteres no válidos. Solo se permiten letras, números, espacios, guiones, puntos y paréntesis')
            
        return nombre_limpio
    
    @field_validator('sede')
    @classmethod
    def validate_sede(cls, v: Optional[str]) -> Optional[str]:
        """Valida la sede si se proporciona en la actualización."""
        if v is None or v == '':
            return None
            
        sede_limpia = v.strip()
        if len(sede_limpia) == 0:
            return None
            
        if len(sede_limpia) > 255:
            raise ValueError('La sede no puede exceder 255 caracteres')
            
        import re
        patron_valido = re.compile(r'^[a-zA-ZáéíóúüÁÉÍÓÚÜñÑ0-9\s\-_\.(),]+$')
        if not patron_valido.match(sede_limpia):
            raise ValueError('La sede contiene caracteres no válidos. Solo se permiten letras, números, espacios, guiones, puntos, comas y paréntesis')
            
        return sede_limpia
    
    @field_validator('fecha_inicio')
    @classmethod
    def validate_fecha_inicio(cls, v: Optional[date]) -> Optional[date]:
        """Valida la fecha de inicio si se proporciona en la actualización."""
        if v is None:
            return None
            
        from datetime import date, timedelta
        
        # Para actualizaciones, permitir fechas hasta 6 años atrás (registros históricos)
        hoy = date.today()
        fecha_minima = hoy - timedelta(days=365*6)
        if v < fecha_minima:
            raise ValueError('La fecha de inicio no puede ser anterior a 6 años (para registros históricos)')
            
        # No permitir fechas muy lejanas
        fecha_maxima = hoy + timedelta(days=365*5)
        if v > fecha_maxima:
            raise ValueError('La fecha de inicio no puede ser más de 5 años en el futuro')
            
        return v
    
    @field_validator('fecha_fin')
    @classmethod
    def validate_fecha_fin(cls, v: Optional[date], info) -> Optional[date]:
        """Valida la fecha de fin si se proporciona en la actualización."""
        if v is None:
            return None
            
        from datetime import date, timedelta
        
        # Validar que no sea muy lejana
        hoy = date.today()
        fecha_maxima = hoy + timedelta(days=365*5)
        if v > fecha_maxima:
            raise ValueError('La fecha de fin no puede ser más de 5 años en el futuro')
        
        # Validar que sea posterior o igual a la fecha de inicio si ambas están presentes
        if hasattr(info.data, 'fecha_inicio') and info.data.get('fecha_inicio'):
            fecha_inicio = info.data['fecha_inicio']
            if v < fecha_inicio:
                raise ValueError('La fecha de fin no puede ser anterior a la fecha de inicio')
                
            # Validar duración máxima
            duracion = (v - fecha_inicio).days
            if duracion > 30:
                raise ValueError('La duración de la competencia no puede exceder 30 días')
                
        return v


class CompetenciaResponse(CompetenciaBase):
    """Esquema de respuesta para competencias."""
    
    id: int = Field(description="ID único de la competencia")
    equipo_id: int = Field(description="ID del equipo organizador")
    
    # Campos calculados
    @computed_field
    @property
    def rango_fechas(self) -> str:
        """Genera el rango de fechas en formato PostgreSQL daterange."""
        return f"[{self.fecha_inicio},{self.fecha_fin}]"
    
    @computed_field
    @property
    def duracion_dias(self) -> int:
        """Calcula la duración de la competencia en días."""
        return (self.fecha_fin - self.fecha_inicio).days + 1
    
    @computed_field
    @property
    def es_proxima(self) -> bool:
        """Indica si la competencia es próxima (inicia después de hoy)."""
        return self.fecha_inicio >= date.today()
    
    @computed_field
    @property
    def es_activa(self) -> bool:
        """Indica si la competencia está en curso."""
        hoy = date.today()
        return self.fecha_inicio <= hoy <= self.fecha_fin
    
    @computed_field
    @property  
    def estado(self) -> str:
        """Estado calculado de la competencia."""
        hoy = date.today()
        if hoy < self.fecha_inicio:
            return "proxima"
        elif self.fecha_inicio <= hoy <= self.fecha_fin:
            return "en_curso"
        else:
            return "finalizada"
    
    # Timestamps
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CompetenciaListResponse(BaseModel):
    """Esquema de respuesta para listas paginadas de competencias."""
    
    competencias: List[CompetenciaResponse] = Field(description="Lista de competencias")
    total: int = Field(description="Total de competencias que coinciden con los filtros")
    page: int = Field(description="Página actual")
    limit: int = Field(description="Elementos por página")
    has_more: bool = Field(description="Indica si hay más páginas disponibles")


class CompetenciaSearchFilters(BaseModel):
    """Filtros para búsqueda de competencias."""
    
    nombre: Optional[str] = Field(
        None,
        description="Búsqueda por nombre (coincidencia parcial)"
    )
    
    curso: Optional[CursoEnum] = Field(
        None,
        description="Filtrar por tipo de curso"
    )
    
    sede: Optional[str] = Field(
        None,
        description="Filtrar por sede (coincidencia parcial)"
    )
    
    fecha_desde: Optional[date] = Field(
        None,
        description="Competencias que inicien después de esta fecha"
    )
    
    fecha_hasta: Optional[date] = Field(
        None,
        description="Competencias que terminen antes de esta fecha"
    )
    
    solo_proximas: Optional[bool] = Field(
        None,
        description="Solo mostrar competencias próximas (que no han iniciado)"
    )
    
    solo_activas: Optional[bool] = Field(
        None,
        description="Solo mostrar competencias activas (en curso)"
    )


class CompetenciaSelector(BaseModel):
    """Esquema simplificado para selector de competencias (typeahead)."""
    
    id: int = Field(description="ID de la competencia")
    nombre: str = Field(description="Nombre de la competencia")
    curso: CursoEnum = Field(description="Tipo de curso")
    fecha_inicio: date = Field(description="Fecha de inicio")
    fecha_fin: date = Field(description="Fecha de fin")
    estado: str = Field(description="Estado de la competencia")

    class Config:
        from_attributes = True
