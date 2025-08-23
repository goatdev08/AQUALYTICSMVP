"""
Modelo de base de datos para nadadores.

Define la tabla 'nadador' con campos requeridos según el PRD y búsqueda trigram.
"""

from datetime import datetime, date
from typing import Optional
from decimal import Decimal

from sqlmodel import SQLModel, Field


class Nadador(SQLModel, table=True):
    """
    Modelo para la tabla 'nadador'.
    
    Almacena información de nadadores registrados en equipos con soporte
    para búsqueda trigram por nombre_completo.
    """
    
    __tablename__ = "nadador"

    # Campos principales - coinciden EXACTAMENTE con la tabla de Supabase
    id: int = Field(primary_key=True, description="Identificador único del nadador")
    
    equipo_id: int = Field(
        index=True,
        description="Referencia al equipo al que pertenece"
    )
    
    nombre_completo: str = Field(
        description="Nombre completo del nadador (indexado con trigram para búsqueda)"
    )
    
    fecha_nacimiento: date = Field(
        description="Fecha de nacimiento para cálculo de categoría"
    )
    
    rama: str = Field(
        description="Rama de competencia: F (Femenil) o M (Masculino)"
    )
    
    peso: Optional[Decimal] = Field(
        default=None,
        description="Peso del nadador en kilogramos (opcional)"
    )

    # Timestamps - opcionales según la tabla real
    created_at: Optional[datetime] = Field(default=None)
    updated_at: Optional[datetime] = Field(default=None)

    def __repr__(self) -> str:
        """Representación string del nadador."""
        return f"<Nadador(id={self.id}, nombre='{self.nombre_completo}', rama='{self.rama}')>"

    @property
    def edad_actual(self) -> int:
        """
        Calcula la edad actual del nadador.
        
        Returns:
            int: Edad en años completos
        """
        from datetime import date
        today = date.today()
        return today.year - self.fecha_nacimiento.year - (
            (today.month, today.day) < (self.fecha_nacimiento.month, self.fecha_nacimiento.day)
        )
    
    def calcular_categoria(self, fecha_competencia: date) -> str:
        """
        Calcula la categoría del nadador basada en su edad a la fecha de competencia.
        
        Categorías según PRD: 11-12, 13-14, 15-16, 17+
        
        Args:
            fecha_competencia: Fecha de la competencia para calcular edad
            
        Returns:
            str: Categoría correspondiente ('11-12', '13-14', '15-16', '17+')
        """
        edad_en_competencia = fecha_competencia.year - self.fecha_nacimiento.year - (
            (fecha_competencia.month, fecha_competencia.day) < 
            (self.fecha_nacimiento.month, self.fecha_nacimiento.day)
        )
        
        if edad_en_competencia <= 12:
            return "11-12"
        elif edad_en_competencia <= 14:
            return "13-14"
        elif edad_en_competencia <= 16:
            return "15-16"
        else:
            return "17+"

    @property
    def categoria_actual(self) -> str:
        """
        Obtiene la categoría actual del nadador.
        
        Returns:
            str: Categoría actual basada en la fecha de hoy
        """
        from datetime import date
        return self.calcular_categoria(date.today())
