"""
Esquemas Pydantic para la API de AquaLytics.

Exporta todos los modelos de datos utilizados en la aplicación.
"""

from .auth import (
    AuthError,
    HealthResponse,
    JWTPayload,
    TokenInfo,
    UserRole,
    Usuario,
    UsuarioResponse,
)
from .catalogos import (
    CatalogoPruebasResponse,
    EstiloNatacion,
    Prueba,
    PruebaResponse,
    TipoCurso,
)
from .nadador import (
    NadadorBase,
    NadadorCreate,
    NadadorUpdate,
    NadadorResponse,
    NadadorSearchFilters,
    NadadorListResponse,
)
from .competencia import (
    CompetenciaBase,
    CompetenciaCreate,
    CompetenciaUpdate,
    CompetenciaResponse,
    CompetenciaListResponse,
    CompetenciaSearchFilters,
    CompetenciaSelector,
    CursoEnum,
)

__all__ = [
    # Autenticación
    "AuthError",
    "HealthResponse", 
    "JWTPayload",
    "TokenInfo",
    "UserRole",
    "Usuario",
    "UsuarioResponse",
    # Catálogos
    "CatalogoPruebasResponse",
    "EstiloNatacion",
    "Prueba",
    "PruebaResponse",
    "TipoCurso",
    # Nadadores
    "NadadorBase",
    "NadadorCreate", 
    "NadadorUpdate",
    "NadadorResponse",
    "NadadorSearchFilters",
    "NadadorListResponse",
    # Competencias
    "CompetenciaBase",
    "CompetenciaCreate",
    "CompetenciaUpdate", 
    "CompetenciaResponse",
    "CompetenciaListResponse",
    "CompetenciaSearchFilters",
    "CompetenciaSelector",
    "CursoEnum",
]
