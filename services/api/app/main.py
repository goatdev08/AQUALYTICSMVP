"""
AquaLytics API - Sistema de análisis de resultados de natación

FastAPI application factory y configuración principal.
"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.api.v1.api import api_router
from app.core.config import settings
from app.middleware import (
    security_headers_middleware,
    cors_preflight_middleware,
    request_logging_middleware
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Lifecycle manager para FastAPI.

    Maneja startup y shutdown events de la aplicación.
    """
    # Startup
    logger.info("🏊‍♂️ Iniciando AquaLytics API...")
    logger.info(f"🌐 Entorno: {settings.ENVIRONMENT}")
    logger.info(f"🔧 Debug: {settings.DEBUG}")

    yield

    # Shutdown
    logger.info("👋 Cerrando AquaLytics API...")


def create_application() -> FastAPI:
    """
    Factory para crear la aplicación FastAPI.

    Returns:
        FastAPI: Instancia configurada de la aplicación
    """
    app = FastAPI(
        title="AquaLytics API",
        description="Sistema de análisis de resultados de natación - MVP",
        version="0.1.0",
        openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.DEBUG else None,
        docs_url=f"{settings.API_V1_STR}/docs" if settings.DEBUG else None,
        redoc_url=f"{settings.API_V1_STR}/redoc" if settings.DEBUG else None,
        lifespan=lifespan,
    )

    # Configurar CORS estricto para producción
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,  # Usar la propiedad que devuelve lista
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=[
            "Accept",
            "Accept-Language", 
            "Content-Language",
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "Cache-Control",
        ],
        expose_headers=["X-Total-Count", "X-Request-ID", "X-Response-Time-Ms"],  # Para paginación y debugging
        max_age=600,  # Cache preflight requests por 10 min
    )

    # Middlewares personalizados de seguridad (orden importa)
    app.middleware("http")(request_logging_middleware)  # Primero: logging
    app.middleware("http")(security_headers_middleware)  # Segundo: headers de seguridad
    app.middleware("http")(cors_preflight_middleware)  # Tercero: CORS personalizado
    
    # Incluir routers de API
    app.include_router(api_router, prefix=settings.API_V1_STR)

    return app


# Instancia global de la aplicación
app = create_application()


@app.get("/")
async def root():
    """
    Health check endpoint.

    Returns:
        dict: Información básica de la API
    """
    return {
        "message": "🏊‍♂️ AquaLytics API - Sistema de análisis de natación",
        "version": "0.1.0",
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health")
async def health_check():
    """
    Health check básico y rápido.
    
    Para monitoreo de servicios externos (Render, Fly.io, etc).
    Responde rápidamente sin verificaciones complejas.

    Returns:
        dict: Estado básico de la aplicación
    """
    return {
        "status": "healthy",
        "version": "0.1.0",
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.get("/health/detailed")  
async def detailed_health_check():
    """
    Health check detallado con verificaciones de dependencias.
    
    Incluye verificación de base de datos y otros servicios críticos.
    Útil para debugging y monitoreo interno.

    Returns:
        dict: Estado detallado de la aplicación y dependencias
    """
    from datetime import datetime, timezone
    
    health_data = {
        "status": "healthy",
        "version": "0.1.0", 
        "environment": settings.ENVIRONMENT,
        "debug": settings.DEBUG,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "checks": {
            "api": {"status": "healthy", "response_time_ms": 0},
            "database": {"status": "unknown", "response_time_ms": None},
            "cors": {"status": "configured", "origins": len(settings.cors_origins)},
        }
    }
    
    # Verificar conexión a base de datos
    try:
        start_time = datetime.now(timezone.utc)
        # Intentar una query simple usando el dependency
        from app.db.deps import get_db
        from sqlalchemy import text
        
        db_gen = get_db()
        db = next(db_gen)
        try:
            result = db.execute(text("SELECT 1"))
            result.fetchone()
        finally:
            db.close()
        
        end_time = datetime.now(timezone.utc) 
        response_time = int((end_time - start_time).total_seconds() * 1000)
        
        health_data["checks"]["database"] = {
            "status": "healthy",
            "response_time_ms": response_time
        }
        
    except Exception as e:
        health_data["status"] = "degraded"
        health_data["checks"]["database"] = {
            "status": "unhealthy", 
            "error": str(e)[:100],  # Limitar longitud del error
            "response_time_ms": None
        }
        
    # Determinar status general
    db_healthy = health_data["checks"]["database"]["status"] == "healthy"
    
    if not db_healthy:
        health_data["status"] = "degraded"
        
    return health_data


@app.get("/ready")
async def readiness_check():
    """
    Readiness check para Kubernetes/container orchestration.
    
    Verifica que la aplicación está lista para recibir tráfico.
    Diferente de health: ready = puede procesar requests.

    Returns:
        dict: Estado de preparación de la aplicación
    """
    from datetime import datetime, timezone
    
    try:
        # Verificar que la configuración esencial esté presente
        if not settings.DATABASE_URL:
            raise ValueError("DATABASE_URL not configured")
            
        # Verificar que los endpoints críticos estén montados
        routes = [route.path for route in app.routes]
        critical_routes = ["/health", f"{settings.API_V1_STR}/auth", f"{settings.API_V1_STR}/resultados"]
        
        missing_routes = [route for route in critical_routes if route not in routes]
        if missing_routes:
            raise ValueError(f"Critical routes missing: {missing_routes}")
            
        return {
            "status": "ready",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "0.1.0"
        }
        
    except Exception as e:
        return {
            "status": "not_ready",
            "error": str(e)[:100],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "0.1.0"
        }
