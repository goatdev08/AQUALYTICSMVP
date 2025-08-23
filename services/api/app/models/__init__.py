"""
Modelos de base de datos para AquaLytics API.

Exporta todos los modelos de SQLModel utilizados en la aplicación.
"""

from .catalogos import Prueba
from .user import Usuario
from .nadador import Nadador

__all__ = [
    # Modelos de catálogos
    "Prueba",
    # Modelos de usuario
    "Usuario",
    # Modelos de nadadores
    "Nadador",
]
