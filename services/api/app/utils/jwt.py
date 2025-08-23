"""
Utilidades para validación de tokens JWT de Supabase.

Maneja la validación, decodificación y extracción de información de tokens JWT.
"""

import logging
from datetime import datetime
from typing import Optional

import jwt
from fastapi import HTTPException, status
from loguru import logger

from app.core.config import settings
from app.schemas.auth import JWTPayload, TokenInfo

# Algoritmos JWT soportados por Supabase
SUPABASE_JWT_ALGORITHMS = ["HS256"]


class JWTValidationError(Exception):
    """
    Error personalizado para validación de JWT.
    """
    def __init__(self, message: str, details: Optional[str] = None):
        self.message = message
        self.details = details
        super().__init__(self.message)


class SupabaseJWTValidator:
    """
    Validador de tokens JWT de Supabase.
    
    Maneja la validación y decodificación de tokens JWT usando la clave secreta
    de Supabase configurada en las variables de entorno.
    """

    def __init__(self):
        """
        Inicializa el validador con la configuración de Supabase.
        """
        self.jwt_secret = settings.SUPABASE_JWT_SECRET
        self.supabase_url = settings.SUPABASE_URL
        self.algorithms = SUPABASE_JWT_ALGORITHMS

        if not self.jwt_secret:
            logger.warning("⚠️ SUPABASE_JWT_SECRET no configurado - JWT validation disabled")
            
        if not self.supabase_url:
            logger.warning("⚠️ SUPABASE_URL no configurado - usando valores por defecto")

    def _get_expected_issuer(self) -> str:
        """
        Obtiene el issuer esperado basado en la URL de Supabase.
        
        Returns:
            str: Issuer esperado (ej: "https://proyecto.supabase.co/auth/v1")
        """
        if self.supabase_url:
            # Remover trailing slash si existe
            base_url = self.supabase_url.rstrip('/')
            return f"{base_url}/auth/v1"
        
        return "supabase"  # Fallback para desarrollo

    def validate_token(self, token: str) -> TokenInfo:
        """
        Valida un token JWT de Supabase y extrae la información.
        
        Args:
            token: Token JWT a validar (sin prefijo "Bearer ")
            
        Returns:
            TokenInfo: Información extraída del token validado
            
        Raises:
            JWTValidationError: Si el token es inválido
        """
        if not self.jwt_secret:
            raise JWTValidationError(
                "JWT validation not configured",
                "SUPABASE_JWT_SECRET not set in environment"
            )

        try:
            # Decodificar el token con validación completa
            payload = jwt.decode(
                token,
                self.jwt_secret,
                algorithms=self.algorithms,
                audience="authenticated",  # Supabase usa "authenticated" como audience
                issuer=self._get_expected_issuer(),
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_aud": True,
                    "verify_iss": True,
                }
            )
            
            # Validar estructura del payload
            jwt_payload = JWTPayload(**payload)
            
            # Extraer información relevante
            token_info = TokenInfo(
                user_id=jwt_payload.sub,
                email=jwt_payload.email,
                is_valid=True,
                expires_at=datetime.fromtimestamp(jwt_payload.exp)
            )
            
            return token_info
            
        except jwt.ExpiredSignatureError:
            raise JWTValidationError(
                "Token has expired",
                "The JWT token has exceeded its expiration time"
            )
            
        except jwt.InvalidAudienceError:
            raise JWTValidationError(
                "Invalid audience",
                "Token audience does not match expected value 'authenticated'"
            )
            
        except jwt.InvalidIssuerError:
            expected_issuer = self._get_expected_issuer()
            raise JWTValidationError(
                "Invalid issuer",
                f"Token issuer does not match expected issuer: {expected_issuer}"
            )
            
        except jwt.InvalidSignatureError:
            raise JWTValidationError(
                "Invalid token signature",
                "Token signature verification failed"
            )
            
        except jwt.DecodeError as e:
            raise JWTValidationError(
                "Token decode error",
                f"Failed to decode token: {str(e)}"
            )
            
        except jwt.InvalidTokenError as e:
            raise JWTValidationError(
                "Invalid token",
                f"Token validation failed: {str(e)}"
            )
            
        except Exception as e:
            logger.error(f"❌ Error inesperado validando JWT: {str(e)}")
            raise JWTValidationError(
                "Token validation error",
                f"Unexpected error: {str(e)}"
            )

    def extract_token_from_header(self, authorization: Optional[str]) -> Optional[str]:
        """
        Extrae el token JWT del header Authorization.
        
        Args:
            authorization: Header Authorization (ej: "Bearer <token>")
            
        Returns:
            str: Token JWT sin prefijo "Bearer ", None si no es válido
        """
        if not authorization:
            return None
            
        try:
            scheme, token = authorization.split(" ", 1)
            if scheme.lower() != "bearer":
                logger.warning(f"⚠️ Esquema de autorización inválido: {scheme}")
                return None
                
            return token.strip()
            
        except ValueError:
            logger.warning(f"⚠️ Formato de header Authorization inválido: {authorization}")
            return None


# Instancia global del validador
jwt_validator = SupabaseJWTValidator()


def validate_supabase_token(token: str) -> TokenInfo:
    """
    Función helper para validar tokens de Supabase.
    
    Args:
        token: Token JWT a validar
        
    Returns:
        TokenInfo: Información del token validado
        
    Raises:
        HTTPException: Si el token es inválido (401 Unauthorized)
    """
    try:
        return jwt_validator.validate_token(token)
        
    except JWTValidationError as e:
        logger.warning(f"⚠️ Token inválido: {e.message} - {e.details}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "invalid_token",
                "message": e.message,
                "detail": e.details
            },
            headers={"WWW-Authenticate": "Bearer"},
        )


def extract_token_from_auth_header(authorization: Optional[str]) -> str:
    """
    Extrae y valida token del header Authorization.
    
    Args:
        authorization: Header Authorization
        
    Returns:
        str: Token JWT válido
        
    Raises:
        HTTPException: Si el header es inválido o falta (401 Unauthorized)
    """
    token = jwt_validator.extract_token_from_header(authorization)
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "missing_token",
                "message": "Authorization header is missing or invalid",
                "detail": "Expected format: 'Bearer <token>'"
            },
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return token
