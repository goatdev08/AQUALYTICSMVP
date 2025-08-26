"""
Middleware de seguridad para AquaLytics API.

Implementa headers de seguridad y validaciones adicionales para producción.
"""

from datetime import datetime, timezone
from typing import Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from loguru import logger

from app.core.config import settings


async def security_headers_middleware(request: Request, call_next: Callable) -> Response:
    """
    Middleware que agrega headers de seguridad a todas las respuestas.
    
    Headers implementados:
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: DENY  
    - X-XSS-Protection: 1; mode=block
    - Referrer-Policy: strict-origin-when-cross-origin
    - Permissions-Policy: Restringe acceso a features del browser
    - Strict-Transport-Security: Solo HTTPS (en producción)
    - X-API-Version: Versión de la API
    - X-Request-ID: ID único de request para tracking
    
    Args:
        request: Request de FastAPI
        call_next: Siguiente middleware en la cadena
        
    Returns:
        Response: Response con headers de seguridad agregados
    """
    # Generar request ID único para logging/debugging
    request_id = f"req_{int(datetime.now(timezone.utc).timestamp() * 1000000)}"
    
    # Agregar request_id al contexto de logging
    logger.bind(request_id=request_id)
    
    # Procesar request
    response = await call_next(request)
    
    # Headers de seguridad básicos (aplicar a todas las responses)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-API-Version"] = "0.1.0"
    response.headers["X-Request-ID"] = request_id
    
    # Permissions Policy - restringir acceso a features del browser
    permissions_policy = (
        "camera=(), "
        "microphone=(), "
        "geolocation=(), "
        "payment=(), "
        "usb=(), "
        "magnetometer=(), "
        "accelerometer=(), "
        "gyroscope=()"
    )
    response.headers["Permissions-Policy"] = permissions_policy
    
    # HSTS solo en producción con HTTPS
    if (settings.ENVIRONMENT == "production" and 
        request.url.scheme == "https"):
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    # Content Security Policy para respuestas HTML (docs, redoc)
    if "text/html" in response.headers.get("content-type", ""):
        csp_policy = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data: https:; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "
            "base-uri 'self'"
        )
        response.headers["Content-Security-Policy"] = csp_policy
    
    return response


async def cors_preflight_middleware(request: Request, call_next: Callable) -> Response:
    """
    Middleware personalizado para manejar CORS preflight requests.
    
    Proporciona control más granular sobre CORS que el middleware por defecto.
    
    Args:
        request: Request de FastAPI
        call_next: Siguiente middleware en la cadena
        
    Returns:
        Response: Response con headers CORS apropiados
    """
    # Verificar si es un preflight request (OPTIONS)
    if request.method == "OPTIONS":
        origin = request.headers.get("origin")
        
        # Verificar si el origin está permitido
        if origin and origin in settings.cors_origins:
            return JSONResponse(
                content={},  # Contenido vacío para preflight requests
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "Accept, Authorization, Content-Type, X-Requested-With, Cache-Control",
                    "Access-Control-Allow-Credentials": "true",
                    "Access-Control-Max-Age": "600",  # 10 minutos
                    "Vary": "Origin",
                }
            )
        else:
            # Origin no permitido
            logger.warning(f"🚫 CORS: Origin no permitido: {origin}")
            return JSONResponse(
                status_code=403,
                content={
                    "error": "cors_forbidden",
                    "message": "Origin not allowed",
                    "detail": f"Origin '{origin}' is not in the allowed origins list"
                }
            )
    
    # Para requests no-OPTIONS, continuar con el procesamiento normal
    response = await call_next(request)
    
    # Agregar headers CORS a la response si es necesario
    origin = request.headers.get("origin")
    if origin and origin in settings.cors_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Vary"] = "Origin"
        
        # Para responses de API, agregar headers útiles para el frontend
        if request.url.path.startswith("/api/"):
            # Exponer headers útiles para paginación y debugging
            response.headers["Access-Control-Expose-Headers"] = "X-Total-Count, X-Request-ID"
    
    return response


async def request_logging_middleware(request: Request, call_next: Callable) -> Response:
    """
    Middleware para logging de requests en producción.
    
    Registra información básica de cada request para monitoreo y debugging.
    No registra información sensible.
    
    Args:
        request: Request de FastAPI
        call_next: Siguiente middleware en la cadena
        
    Returns:
        Response: Response procesada
    """
    start_time = datetime.now(timezone.utc)
    
    # Información básica del request (sin datos sensibles)
    request_info = {
        "method": request.method,
        "path": request.url.path,
        "user_agent": request.headers.get("user-agent", "unknown")[:100],  # Limitar longitud
        "origin": request.headers.get("origin"),
        "ip": getattr(request.client, "host", "unknown") if request.client else "unknown"
    }
    
    # Procesar request
    try:
        response = await call_next(request)
        
        # Calcular tiempo de respuesta
        end_time = datetime.now(timezone.utc)
        response_time_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Log para requests lentos (>1000ms) o errores
        if response_time_ms > 1000 or response.status_code >= 400:
            if response.status_code >= 400:
                logger.warning(
                    f"🔍 {request_info['method']} {request_info['path']} - "
                    f"{response.status_code} - {response_time_ms}ms"
                )
            else:
                logger.info(
                    f"🔍 {request_info['method']} {request_info['path']} - "
                    f"{response.status_code} - {response_time_ms}ms"
                )
        
        # Agregar tiempo de respuesta al header para debugging
        response.headers["X-Response-Time-Ms"] = str(response_time_ms)
        
        return response
        
    except Exception as e:
        end_time = datetime.now(timezone.utc)
        response_time_ms = int((end_time - start_time).total_seconds() * 1000)
        
        logger.error(
            f"❌ {request_info['method']} {request_info['path']} - "
            f"ERROR: {str(e)[:100]} - {response_time_ms}ms"
        )
        raise
