"""
Dependencias de FastAPI para autenticación y autorización.

Proporciona dependencies para validar JWT, obtener usuario actual, verificar roles
y implementar control de acceso basado en roles (RBAC).
"""

from typing import Annotated, Optional, Union
from datetime import datetime

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from loguru import logger

from app.db.deps import DatabaseDep
from app.models.user import Usuario
from app.schemas.auth import UserRole, UsuarioResponse
from app.utils.jwt import extract_token_from_auth_header, validate_supabase_token


async def get_current_user(
    db: DatabaseDep,
    authorization: Annotated[Optional[str], Header()] = None,
) -> Usuario:
    """
    Dependency para obtener el usuario actual desde JWT.
    
    Valida el token JWT de Supabase y busca el usuario en la base de datos local.
    
    Args:
        db: Sesión de base de datos
        authorization: Header Authorization con el token JWT
        
    Returns:
        Usuario: Usuario actual validado
        
    Raises:
        HTTPException: Si el token es inválido o el usuario no existe (401)
    """
    # Extraer token del header Authorization
    token = extract_token_from_auth_header(authorization)
    
    # Validar token JWT con Supabase
    token_info = validate_supabase_token(token)
    
    # Buscar usuario en base de datos por auth_user_id
    user = db.query(Usuario).filter(
        Usuario.auth_user_id == token_info.user_id
    ).first()
    
    if not user:
        logger.warning(f"⚠️ Usuario no encontrado en BD local: {token_info.user_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "user_not_found",
                "message": "User not found in local database",
                "detail": f"Auth user ID {token_info.user_id} not registered in local system"
            },
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar que el email coincida (seguridad adicional)
    if user.email != token_info.email:
        logger.error(f"❌ Email mismatch: DB={user.email}, JWT={token_info.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "email_mismatch",
                "message": "Email mismatch between token and database",
                "detail": "User data inconsistency detected"
            },
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_current_trainer(
    current_user: Annotated[Usuario, Depends(get_current_user)],
) -> Usuario:
    """
    Dependency para verificar que el usuario actual sea un entrenador.
    
    Requiere que el usuario tenga rol "entrenador" según las especificaciones del PRD.
    
    Args:
        current_user: Usuario actual (de get_current_user)
        
    Returns:
        Usuario: Usuario entrenador validado
        
    Raises:
        HTTPException: Si el usuario no es entrenador (403 Forbidden)
    """
    if not current_user.is_trainer:
        logger.warning(f"⚠️ Acceso de entrenador denegado para: {current_user.email} (rol: {current_user.rol})")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "insufficient_permissions",
                "message": "Trainer role required",
                "detail": f"User role '{current_user.rol}' does not have trainer permissions"
            }
        )
    
    logger.debug(f"✅ Entrenador validado: {current_user.email}")
    return current_user


def create_user_response(user: Usuario) -> UsuarioResponse:
    """
    Crea la respuesta estructurada con información del usuario.
    
    Utilizada por el endpoint /me según especificaciones del PRD.
    
    Args:
        user: Usuario de la base de datos
        
    Returns:
        UsuarioResponse: Respuesta estructurada con información del usuario
    """
    return UsuarioResponse(
        usuario={
            "id": user.id,
            "auth_user_id": user.auth_user_id,
            "email": user.email,
            "rol": user.rol,
            "equipo_id": user.equipo_id,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
        },
        rol=UserRole(user.rol),
        equipo_id=user.equipo_id,
        permisos=user.permissions
    )


# ================================
# RBAC Dependencies - Control de acceso basado en roles
# ================================

def audit_access(user: Usuario, resource: str, action: str, resource_id: Optional[Union[int, str]] = None):
    """
    Registra accesos para auditoría de seguridad.
    
    Args:
        user: Usuario que realiza la acción
        resource: Recurso al que se accede (competencias, nadadores, etc.)
        action: Acción realizada (create, read, update, delete)
        resource_id: ID específico del recurso (opcional)
    """
    logger.info(
        f"🔍 AUDIT: User {user.email} ({user.rol}) performed {action} on {resource}"
        + (f" (ID: {resource_id})" if resource_id else "")
        + f" | Team: {user.equipo_id}"
    )


async def require_create_permission(
    current_user: Annotated[Usuario, Depends(get_current_user)],
) -> Usuario:
    """
    Dependency que requiere permisos de creación (POST).
    
    Solo entrenadores pueden crear nuevos recursos según PRD.
    """
    if not current_user.is_trainer:
        audit_access(current_user, "unknown", "create_denied")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "insufficient_permissions",
                "message": "Create permission required",
                "detail": f"User role '{current_user.rol}' does not have create permissions"
            }
        )
    
    return current_user


async def require_update_permission(
    current_user: Annotated[Usuario, Depends(get_current_user)],
) -> Usuario:
    """
    Dependency que requiere permisos de actualización (PATCH/PUT).
    
    Solo entrenadores pueden actualizar recursos según PRD.
    """
    if not current_user.is_trainer:
        audit_access(current_user, "unknown", "update_denied")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "insufficient_permissions", 
                "message": "Update permission required",
                "detail": f"User role '{current_user.rol}' does not have update permissions"
            }
        )
    
    return current_user


async def require_delete_permission(
    current_user: Annotated[Usuario, Depends(get_current_user)],
) -> Usuario:
    """
    Dependency que requiere permisos de eliminación (DELETE).
    
    Solo entrenadores pueden eliminar recursos según PRD.
    """
    if not current_user.is_trainer:
        audit_access(current_user, "unknown", "delete_denied")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "insufficient_permissions",
                "message": "Delete permission required", 
                "detail": f"User role '{current_user.rol}' does not have delete permissions"
            }
        )
    
    return current_user


def validate_team_access(user: Usuario, resource_team_id: int, resource_name: str = "resource"):
    """
    Valida que el usuario tenga acceso al equipo del recurso.
    
    Según PRD, usuarios solo pueden acceder a datos de su equipo.
    
    Args:
        user: Usuario actual
        resource_team_id: ID del equipo del recurso
        resource_name: Nombre del recurso para logging
        
    Raises:
        HTTPException: Si el usuario no tiene acceso al equipo (403)
    """
    if user.equipo_id != resource_team_id:
        audit_access(user, resource_name, "team_access_denied", resource_team_id)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "team_access_denied",
                "message": f"Access denied to {resource_name}",
                "detail": f"User team {user.equipo_id} cannot access team {resource_team_id} resources"
            }
        )


def create_permission_validator(permission_key: str):
    """
    Factory para crear validators de permisos específicos.
    
    Args:
        permission_key: Clave del permiso en user.permissions
        
    Returns:
        Función dependency que valida el permiso específico
    """
    async def validate_permission(
        current_user: Annotated[Usuario, Depends(get_current_user)],
    ) -> Usuario:
        permissions = current_user.permissions
        if not permissions.get(permission_key, False):
            audit_access(current_user, permission_key, "permission_denied")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "insufficient_permissions",
                    "message": f"Permission '{permission_key}' required",
                    "detail": f"User role '{current_user.rol}' does not have '{permission_key}' permission"
                }
            )
        return current_user
    
    return validate_permission


# ================================
# Pre-configured permission validators
# ================================

require_competencias_create = create_permission_validator("crear_competencias")
require_competencias_edit = create_permission_validator("editar_competencias") 
require_nadadores_create = create_permission_validator("crear_nadadores")
require_nadadores_edit = create_permission_validator("editar_nadadores")
require_resultados_create = create_permission_validator("registrar_resultados")
require_resultados_edit = create_permission_validator("editar_resultados")


# ================================
# Tipos anotados para inyección de dependencias
# ================================

# Básicos
CurrentUser = Annotated[Usuario, Depends(get_current_user)]
CurrentTrainer = Annotated[Usuario, Depends(get_current_trainer)]

# CRUD permissions  
CanCreate = Annotated[Usuario, Depends(require_create_permission)]
CanUpdate = Annotated[Usuario, Depends(require_update_permission)]
CanDelete = Annotated[Usuario, Depends(require_delete_permission)]

# Specific permission validators
CanCreateCompetencias = Annotated[Usuario, Depends(require_competencias_create)]
CanEditCompetencias = Annotated[Usuario, Depends(require_competencias_edit)]
CanCreateNadadores = Annotated[Usuario, Depends(require_nadadores_create)]
CanEditNadadores = Annotated[Usuario, Depends(require_nadadores_edit)]
CanCreateResultados = Annotated[Usuario, Depends(require_resultados_create)]
CanEditResultados = Annotated[Usuario, Depends(require_resultados_edit)]
