"""
Modelos de base de datos para AquaLytics API.

Exporta todos los modelos de SQLModel utilizados en la aplicación.
"""

from .catalogos import Prueba
from .user import Usuario
from .nadador import Nadador
from .competencia import Competencia

__all__ = [
    # Modelos de catálogos
    "Prueba",
    # Modelos de usuario
    "Usuario",
    # Modelos de nadadores
    "Nadador",
    # Modelos de competencias
    "Competencia",
]
