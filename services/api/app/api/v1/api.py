"""
Router principal de API v1.

Incluye todos los routers de endpoints de la aplicación.
"""

from fastapi import APIRouter

# Importar routers de endpoints
from app.api.v1.endpoints import auth, catalogos, nadadores, competencias
from app.api.deps import CurrentUser, create_user_response
from app.schemas.auth import UsuarioResponse

# TODO: Importar otros endpoints cuando estén implementados
# from app.api.v1.endpoints import (
#     competencias,
#     resultados,
#     dashboard,
#     analitica,
#     catalogos,
# )

# Router principal de API v1
api_router = APIRouter()


# Health check específico de API
@api_router.get("/health")
async def api_health_check():
    """
    Health check específico de la API v1.

    Returns:
        dict: Estado de la API v1
    """
    return {"status": "healthy", "api_version": "v1"}


@api_router.get(
    "/me",
    response_model=UsuarioResponse,
    summary="Obtener información del usuario actual",
    description="Endpoint /me según PRD - retorna información del usuario autenticado",
    tags=["autenticación"]
)
async def get_me(current_user: CurrentUser) -> UsuarioResponse:
    """
    Endpoint GET /me según especificaciones del PRD.
    
    Retorna información completa del usuario autenticado:
    - Datos del usuario
    - Rol (entrenador/atleta)
    - ID del equipo
    - Permisos según rol
    
    Args:
        current_user: Usuario autenticado (inyectado por dependency)
        
    Returns:
        UsuarioResponse: Información estructurada según PRD
    """
    return create_user_response(current_user)


# Incluir routers implementados
api_router.include_router(auth.router, prefix="/auth", tags=["autenticación"])
api_router.include_router(catalogos.router, prefix="/catalogos", tags=["catálogos"])
api_router.include_router(nadadores.router, prefix="/nadadores", tags=["nadadores"])
api_router.include_router(competencias.router, prefix="/competencias", tags=["competencias"])

# TODO: Incluir otros routers cuando estén implementados
# api_router.include_router(resultados.router, prefix="/resultados", tags=["resultados"])
# api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
# api_router.include_router(analitica.router, prefix="/analitica", tags=["analítica"])
