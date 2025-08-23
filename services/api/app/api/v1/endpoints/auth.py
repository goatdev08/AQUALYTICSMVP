"""
Endpoints de autenticación y usuario.

Maneja endpoints relacionados con autenticación y gestión de usuarios según PRD.
"""

from fastapi import APIRouter, status
from loguru import logger

from app.api.deps import CurrentUser, create_user_response
from app.schemas.auth import UsuarioResponse

# Router para endpoints de autenticación
router = APIRouter()


@router.get(
    "/me",
    response_model=UsuarioResponse,
    status_code=status.HTTP_200_OK,
    summary="Obtener información del usuario actual",
    description="Retorna información completa del usuario autenticado, incluyendo rol y permisos según PRD",
    response_description="Información del usuario con rol y permisos",
    tags=["autenticación"]
)
async def get_current_user_info(
    current_user: CurrentUser,
) -> UsuarioResponse:
    """
    Endpoint GET /me según especificaciones del PRD.
    
    Retorna información del usuario autenticado incluyendo:
    - Datos básicos del usuario
    - Rol (entrenador/atleta)  
    - ID del equipo
    - Permisos específicos según el rol
    
    Args:
        current_user: Usuario actual (inyectado por dependency)
        
    Returns:
        UsuarioResponse: Información estructurada del usuario
    """
    logger.debug(f"📋 Solicitando información de usuario: {current_user.email}")
    
    # Crear respuesta estructurada usando helper function
    user_response = create_user_response(current_user)
    
    logger.debug(f"✅ Información de usuario enviada para: {current_user.email} (rol: {current_user.rol})")
    
    return user_response


@router.get(
    "/health/auth",
    status_code=status.HTTP_200_OK,
    summary="Health check de autenticación",
    description="Verifica el estado del sistema de autenticación",
    tags=["health", "autenticación"]
)
async def auth_health_check():
    """
    Health check específico para el sistema de autenticación.
    
    Verifica que:
    - La configuración de JWT esté presente
    - Supabase esté configurado correctamente
    - El sistema de autenticación esté funcionando
    
    Returns:
        dict: Estado del sistema de autenticación
    """
    from app.core.config import settings
    from app.utils.jwt import jwt_validator
    
    # Verificar configuración básica
    auth_configured = bool(settings.SUPABASE_JWT_SECRET)
    supabase_configured = bool(settings.SUPABASE_URL)
    
    status_ok = auth_configured and supabase_configured
    
    result = {
        "status": "healthy" if status_ok else "degraded",
        "auth_configured": auth_configured,
        "supabase_configured": supabase_configured,
        "jwt_validator_ready": jwt_validator is not None,
    }
    
    if not status_ok:
        logger.warning("⚠️ Sistema de autenticación con configuración incompleta")
        result["warnings"] = []
        
        if not auth_configured:
            result["warnings"].append("SUPABASE_JWT_SECRET not configured")
            
        if not supabase_configured:
            result["warnings"].append("SUPABASE_URL not configured")
    
    logger.debug(f"🏥 Health check de autenticación: {result['status']}")
    
    return result
