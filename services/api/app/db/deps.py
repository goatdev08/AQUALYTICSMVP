"""
Dependencias de base de datos para FastAPI.

Proporciona sesiones de base de datos y dependencias relacionadas.
"""

from collections.abc import Generator
from typing import Annotated

from fastapi import Depends, HTTPException, status # type: ignore
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker
from loguru import logger # type: ignore

from app.core.config import settings


# Crear engine de SQLAlchemy
engine = create_engine(
    settings.DATABASE_URL,
    # Configuración para PostgreSQL/Supabase
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Verificar conexiones antes de usar
    pool_recycle=300,    # Reciclar conexiones cada 5 minutos
    echo=settings.DEBUG,  # Log SQL queries en debug
)

# Crear sessionmaker
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency para obtener sesión de base de datos.
    
    Yields:
        Session: Sesión de SQLAlchemy
        
    Raises:
        HTTPException: Si hay error de conexión a base de datos
    """
    db = SessionLocal()
    try:
        # Test de conexión básico
        db.execute(text("SELECT 1"))
        yield db
        
    except SQLAlchemyError as e:
        logger.error(f"❌ Error de base de datos: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "database_error",
                "message": "Database connection failed",
                "detail": "Please try again later"
            }
        )
        
    except HTTPException:
        # Re-lanzar HTTPException de dependencias de autenticación
        raise
        
    except Exception as e:
        logger.error(f"❌ Error inesperado en sesión DB: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "internal_error", 
                "message": "Internal server error",
                "detail": "An unexpected error occurred"
            }
        )
        
    finally:
        db.close()


# Tipo anotado para inyección de dependencia
DatabaseDep = Annotated[Session, Depends(get_db)]
