"""
Esquemas Pydantic para autenticación y usuarios.

Define los modelos de datos para JWT validation, usuarios y respuestas de auth.
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# === Enums y Tipos ===
class UserRole(str, Enum):
    """Roles de usuario según PRD."""
    ENTRENADOR = "entrenador"  # RW: acceso completo
    ATLETA = "atleta"         # R: solo lectura


# === Modelos de JWT ===
class JWTPayload(BaseModel):
    """
    Payload del JWT de Supabase.
    
    Representa la información contenida en el token JWT.
    """
    sub: str = Field(description="ID del usuario en Supabase Auth")
    email: str = Field(description="Email del usuario")
    aud: str = Field(description="Audiencia del token (authenticated)")
    iss: str = Field(description="Emisor del token (supabase)")
    iat: int = Field(description="Timestamp de emisión")
    exp: int = Field(description="Timestamp de expiración")
    role: Optional[str] = Field(default="authenticated", description="Rol en Supabase")


class TokenInfo(BaseModel):
    """
    Información extraída del token JWT validado.
    """
    user_id: str = Field(description="ID del usuario en Supabase Auth")
    email: str = Field(description="Email del usuario")
    is_valid: bool = Field(description="Si el token es válido")
    expires_at: datetime = Field(description="Fecha de expiración")


# === Modelos de Usuario ===
class Usuario(BaseModel):
    """
    Modelo de usuario según la tabla 'usuario' del PRD.
    
    Combina información de Supabase Auth con datos del equipo.
    Corregido para coincidir exactamente con la estructura real de la tabla.
    """
    id: int = Field(description="ID único del usuario en tabla local")
    auth_user_id: Optional[UUID] = Field(description="ID del usuario en Supabase Auth")
    email: EmailStr = Field(description="Email del usuario")
    rol: UserRole = Field(description="Rol del usuario (entrenador/atleta)")
    equipo_id: int = Field(description="ID del equipo al que pertenece")
    created_at: Optional[datetime] = Field(default=None, description="Fecha de creación")
    updated_at: Optional[datetime] = Field(default=None, description="Fecha de última actualización")

    class Config:
        """Configuración del modelo."""
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 2,
                "auth_user_id": "a2c4b960-9f6a-4626-9b23-343f1ee4eed1",
                "email": "entrenador@equipo.com",
                "rol": "entrenador",
                "equipo_id": 1,
                "created_at": "2024-01-15T10:30:00Z"
            }
        }


class UsuarioResponse(BaseModel):
    """
    Respuesta con información del usuario actual.
    
    Usado por endpoint /me según especificaciones del PRD.
    """
    usuario: Usuario = Field(description="Información completa del usuario")
    rol: UserRole = Field(description="Rol del usuario")
    equipo_id: int = Field(description="ID del equipo")
    permisos: dict[str, bool] = Field(description="Permisos según rol")

    class Config:
        """Configuración del modelo."""
        json_schema_extra = {
            "example": {
                "usuario": {
                    "id": 2,
                    "auth_user_id": "a2c4b960-9f6a-4626-9b23-343f1ee4eed1",
                    "email": "entrenador@equipo.com",
                    "rol": "entrenador",
                    "equipo_id": 1
                },
                "rol": "entrenador",
                "equipo_id": 1,
                "permisos": {
                    "crear_competencias": True,
                    "editar_nadadores": True,
                    "registrar_resultados": True,
                    "ver_dashboard": True
                }
            }
        }


# === Modelos de Request/Response ===
class AuthError(BaseModel):
    """
    Error de autenticación.
    """
    error: str = Field(description="Tipo de error")
    message: str = Field(description="Mensaje descriptivo del error")
    detail: Optional[str] = Field(default=None, description="Detalles adicionales del error")

    class Config:
        """Configuración del modelo."""
        json_schema_extra = {
            "example": {
                "error": "invalid_token",
                "message": "El token JWT proporcionado es inválido o ha expirado",
                "detail": "Token expired at 2024-01-15T10:30:00Z"
            }
        }


class HealthResponse(BaseModel):
    """
    Respuesta de health check con información de autenticación.
    """
    status: str = Field(description="Estado del servicio")
    auth_configured: bool = Field(description="Si la autenticación está configurada")
    supabase_connected: bool = Field(description="Si la conexión con Supabase está activa")
