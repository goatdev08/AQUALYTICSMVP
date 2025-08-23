"""
Modelo de base de datos para competencias.

Define la tabla 'competencia' con campos requeridos según el PRD y soporte
para rangos de fechas con índice GIST para consultas eficientes.
"""

from datetime import datetime, date
from typing import Optional, Any
from enum import Enum

from sqlmodel import SQLModel, Field
from pydantic import field_validator


class CursoEnum(str, Enum):
    """Enumeración para tipos de curso según el PRD."""
    SC = "SC"  # Short Course (25m)
    LC = "LC"  # Long Course (50m)


class Competencia(SQLModel, table=True):
    """
    Modelo para la tabla 'competencia'.
    
    Almacena información de competencias de natación con soporte para
    rangos de fechas y consultas eficientes mediante índice GIST.
    """
    
    __tablename__ = "competencia"

    # Campos principales - coinciden EXACTAMENTE con la tabla de Supabase
    id: int = Field(primary_key=True, description="Identificador único de la competencia")
    
    equipo_id: int = Field(
        index=True,
        description="Referencia al equipo organizador"
    )
    
    nombre: str = Field(
        min_length=2,
        max_length=255,
        description="Nombre de la competencia"
    )
    
    curso: CursoEnum = Field(
        description="Tipo de curso: SC (25m) o LC (50m)"
    )
    
    # Nota: daterange se maneja como string en SQLModel, se convierte en el endpoint
    rango_fechas: str = Field(
        description="Rango de fechas de la competencia (formato daterange de PostgreSQL)"
    )
    
    sede: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Sede o lugar de la competencia (opcional)"
    )

    # Timestamps
    created_at: Optional[datetime] = Field(default=None)
    updated_at: Optional[datetime] = Field(default=None)

    def __repr__(self) -> str:
        """Representación string de la competencia."""
        return f"<Competencia(id={self.id}, nombre='{self.nombre}', curso='{self.curso}')>"

    @field_validator('rango_fechas')
    @classmethod
    def validate_rango_fechas(cls, v: str) -> str:
        """
        Valida que el rango de fechas tenga formato correcto de PostgreSQL daterange.
        
        Formatos válidos:
        - '[2024-01-15,2024-01-20)'
        - '[2024-01-15,2024-01-20]'
        - '(2024-01-15,2024-01-20]'
        
        Args:
            v: String con el rango de fechas
            
        Returns:
            str: Rango de fechas validado
            
        Raises:
            ValueError: Si el formato no es válido
        """
        if not v:
            raise ValueError("El rango de fechas es requerido")
        
        # Validación básica del formato daterange
        if not (v.startswith(('[', '(')) and v.endswith((']', ')'))):
            raise ValueError("El rango de fechas debe tener formato PostgreSQL daterange: '[inicio,fin]'")
        
        # Extraer fechas para validación adicional
        inner = v[1:-1]  # Remover brackets
        try:
            fecha_inicio_str, fecha_fin_str = inner.split(',', 1)
            
            # Validar que las fechas sean parseables
            fecha_inicio = date.fromisoformat(fecha_inicio_str.strip())
            fecha_fin = date.fromisoformat(fecha_fin_str.strip())
            
            # Validar que el inicio no sea posterior al fin
            if fecha_inicio > fecha_fin:
                raise ValueError("La fecha de inicio no puede ser posterior a la fecha de fin")
                
        except ValueError as e:
            if "Invalid isoformat string" in str(e):
                raise ValueError("Las fechas deben tener formato ISO (YYYY-MM-DD)")
            raise e
        except Exception:
            raise ValueError("Error al parsear el rango de fechas")
        
        return v

    def get_fecha_inicio(self) -> date:
        """
        Extrae la fecha de inicio del rango de fechas.
        
        Returns:
            date: Fecha de inicio de la competencia
        """
        # Manejar tanto string como objeto DateRange de PostgreSQL
        if isinstance(self.rango_fechas, str):
            # Formato string: "[2024-12-16,2024-12-21]"
            inner = self.rango_fechas[1:-1]  # Remover brackets
            fecha_inicio_str = inner.split(',')[0].strip()
            return date.fromisoformat(fecha_inicio_str)
        else:
            # Objeto DateRange de psycopg2
            return self.rango_fechas.lower
    
    def get_fecha_fin(self) -> date:
        """
        Extrae la fecha de fin del rango de fechas.
        
        Returns:
            date: Fecha de fin de la competencia
        """
        # Manejar tanto string como objeto DateRange de PostgreSQL
        if isinstance(self.rango_fechas, str):
            # Formato string: "[2024-12-16,2024-12-21]"
            inner = self.rango_fechas[1:-1]  # Remover brackets  
            fecha_fin_str = inner.split(',')[1].strip()
            return date.fromisoformat(fecha_fin_str)
        else:
            # Objeto DateRange de psycopg2
            return self.rango_fechas.upper

    def is_proxima(self, fecha_referencia: Optional[date] = None) -> bool:
        """
        Determina si la competencia es próxima (inicia después de la fecha de referencia).
        
        Args:
            fecha_referencia: Fecha de referencia (por defecto hoy)
            
        Returns:
            bool: True si la competencia es próxima
        """
        if fecha_referencia is None:
            fecha_referencia = date.today()
            
        return self.get_fecha_inicio() >= fecha_referencia

    def is_activa(self, fecha_referencia: Optional[date] = None) -> bool:
        """
        Determina si la competencia está activa (en curso).
        
        Args:
            fecha_referencia: Fecha de referencia (por defecto hoy)
            
        Returns:
            bool: True si la competencia está en curso
        """
        if fecha_referencia is None:
            fecha_referencia = date.today()
            
        return self.get_fecha_inicio() <= fecha_referencia <= self.get_fecha_fin()
