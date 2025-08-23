"""
Modelos de base de datos para catálogos del sistema.

Define las tablas para pruebas de natación y otros catálogos según el PRD.
"""

from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field


class Prueba(SQLModel, table=True):
    """
    Modelo para la tabla 'prueba'.
    
    Almacena el catálogo oficial de pruebas de natación según PRD.
    Coincide exactamente con la tabla existente en Supabase.
    """
    
    __tablename__ = "prueba"

    # Campos principales - deben coincidir EXACTAMENTE con la tabla de Supabase
    id: int = Field(primary_key=True, description="ID único de la prueba")
    
    estilo: str = Field(
        index=True,
        description="Estilo de natación (Libre, Dorso, Pecho, Mariposa, Combinado)"
    )
    
    distancia: int = Field(
        index=True,
        description="Distancia de la prueba en metros"
    )
    
    curso: str = Field(
        index=True,
        description="Tipo de curso: SC (25m) o LC (50m)"
    )

    # Timestamp
    created_at: Optional[datetime] = Field(default=None)

    def __repr__(self) -> str:
        """Representación string de la prueba."""
        return f"<Prueba(id={self.id}, nombre='{self.nombre_completo}')>"

    @property
    def nombre_completo(self) -> str:
        """
        Genera el nombre completo de la prueba.
        
        Returns:
            str: Nombre completo en formato "100m Libre SC"
        """
        return f"{self.distancia}m {self.estilo} {self.curso}"

    @property
    def es_combinado(self) -> bool:
        """
        Verifica si la prueba es de combinado individual (IM).
        
        Returns:
            bool: True si es combinado, False si es estilo simple
        """
        return self.estilo == "Combinado"

    @property
    def num_segmentos(self) -> int:
        """
        Calcula el número de segmentos según distancia y curso.
        
        Returns:
            int: Número de segmentos para esta prueba
        """
        longitud_segmento = 25 if self.curso == "SC" else 50
        return self.distancia // longitud_segmento
