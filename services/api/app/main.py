"""
AquaLytics API - Sistema de análisis de resultados de natación

FastAPI application factory y configuración principal.
"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.api.v1.api import api_router
from app.core.config import settings


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

    # Configurar CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
        allow_headers=["*"],
    )

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
    Health check detallado.

    Returns:
        dict: Estado detallado de la aplicación
    """
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "debug": settings.DEBUG,
        "version": "0.1.0",
    }
