"""
Esquemas Pydantic para catálogos del sistema.

Define los modelos de datos para pruebas de natación y otros catálogos.
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


# === Enums ===
class EstiloNatacion(str, Enum):
    """Estilos de natación oficiales según PRD."""
    LIBRE = "Libre"
    DORSO = "Dorso"
    PECHO = "Pecho"
    MARIPOSA = "Mariposa"
    COMBINADO = "Combinado"


class TipoCurso(str, Enum):
    """Tipos de curso según PRD."""
    SC = "SC"  # Short Course (25m)
    LC = "LC"  # Long Course (50m)


# === Modelos ===
class Prueba(BaseModel):
    """
    Modelo de prueba de natación según la tabla 'prueba' del PRD.
    
    Representa una prueba oficial con estilo, distancia y curso.
    """
    id: int = Field(description="ID único de la prueba")
    estilo: EstiloNatacion = Field(description="Estilo de natación")
    distancia: int = Field(description="Distancia en metros", ge=50, le=1500)
    curso: TipoCurso = Field(description="Tipo de curso (SC/LC)")
    created_at: Optional[datetime] = Field(default=None, description="Fecha de creación")

    class Config:
        """Configuración del modelo."""
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "estilo": "Libre",
                "distancia": 100,
                "curso": "SC",
                "created_at": "2024-01-15T10:30:00Z"
            }
        }


class PruebaResponse(BaseModel):
    """
    Respuesta simplificada para una prueba individual.
    
    Formato optimizado para el frontend y dropdown components.
    """
    id: int = Field(description="ID único de la prueba")
    nombre: str = Field(description="Nombre completo de la prueba (ej: '100m Libre SC')")
    estilo: EstiloNatacion = Field(description="Estilo de natación")
    distancia: int = Field(description="Distancia en metros")
    curso: TipoCurso = Field(description="Tipo de curso")

    class Config:
        """Configuración del modelo."""
        json_schema_extra = {
            "example": {
                "id": 1,
                "nombre": "100m Libre SC",
                "estilo": "Libre",
                "distancia": 100,
                "curso": "SC"
            }
        }


class CatalogoPruebasResponse(BaseModel):
    """
    Respuesta del endpoint GET /catalogos/pruebas.
    
    Contiene todas las pruebas disponibles según especificaciones del PRD.
    """
    pruebas: List[PruebaResponse] = Field(
        description="Lista completa de pruebas de natación oficiales"
    )
    total: int = Field(description="Número total de pruebas disponibles")
    estilos_disponibles: List[EstiloNatacion] = Field(
        description="Lista de estilos únicos disponibles"
    )
    cursos_disponibles: List[TipoCurso] = Field(
        description="Lista de cursos únicos disponibles"
    )

    class Config:
        """Configuración del modelo."""
        json_schema_extra = {
            "example": {
                "pruebas": [
                    {
                        "id": 1,
                        "nombre": "50m Libre SC",
                        "estilo": "Libre",
                        "distancia": 50,
                        "curso": "SC"
                    },
                    {
                        "id": 2,
                        "nombre": "100m Libre SC", 
                        "estilo": "Libre",
                        "distancia": 100,
                        "curso": "SC"
                    }
                ],
                "total": 35,
                "estilos_disponibles": ["Libre", "Dorso", "Pecho", "Mariposa", "Combinado"],
                "cursos_disponibles": ["SC", "LC"]
            }
        }
