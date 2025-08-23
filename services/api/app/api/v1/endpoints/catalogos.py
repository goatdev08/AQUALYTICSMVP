"""
Endpoints para catálogos del sistema.

Proporciona acceso a los catálogos de referencia como pruebas de natación.
Según PRD, tanto entrenadores como atletas tienen acceso de lectura a catálogos.
"""

from typing import List

from fastapi import APIRouter, HTTPException, status, Query
from sqlalchemy.orm import Session
from loguru import logger

from app.api.deps import DatabaseDep, CurrentUser
from app.models.catalogos import Prueba
from app.schemas.catalogos import (
    CatalogoPruebasResponse,
    PruebaResponse,
    EstiloNatacion,
    TipoCurso
)

# Router para catálogos
router = APIRouter()


@router.get(
    "/pruebas",
    response_model=CatalogoPruebasResponse,
    summary="Obtener catálogo de pruebas de natación",
    description="Retorna el catálogo completo de pruebas de natación oficiales según PRD. Acceso libre para todos los usuarios autenticados.",
    tags=["catálogos"]
)
async def get_pruebas_catalog(
    db: DatabaseDep,
    current_user: CurrentUser,
    estilo: EstiloNatacion = Query(None, description="Filtrar por estilo específico"),
    distancia: int = Query(None, ge=50, le=1500, description="Filtrar por distancia específica"),
    curso: TipoCurso = Query(None, description="Filtrar por tipo de curso")
) -> CatalogoPruebasResponse:
    """
    Obtiene el catálogo completo de pruebas de natación.
    
    **Acceso:** Tanto entrenadores como atletas pueden consultar el catálogo.
    
    **Filtros opcionales:**
    - estilo: Libre, Dorso, Pecho, Mariposa, Combinado
    - distancia: 50, 100, 200, 400, 800, 1500 metros
    - curso: SC (25m) o LC (50m)
    
    Returns:
        CatalogoPruebasResponse: Catálogo completo con metadata
    """
    try:
        logger.info(f"🏊 Usuario {current_user.email} consultando catálogo de pruebas")
        
        # Construir query base
        query = db.query(Prueba)
        
        # Aplicar filtros opcionales
        if estilo:
            query = query.filter(Prueba.estilo == estilo.value)
            logger.debug(f"Filtrando por estilo: {estilo.value}")
            
        if distancia:
            query = query.filter(Prueba.distancia == distancia)
            logger.debug(f"Filtrando por distancia: {distancia}m")
            
        if curso:
            query = query.filter(Prueba.curso == curso.value)
            logger.debug(f"Filtrando por curso: {curso.value}")
        
        # Ejecutar query ordenada por estilo, distancia, curso
        pruebas_db = query.order_by(
            Prueba.estilo,
            Prueba.distancia,
            Prueba.curso
        ).all()
        
        logger.info(f"📊 Encontradas {len(pruebas_db)} pruebas en catálogo")
        
        # Si no hay pruebas (filtros muy restrictivos o BD vacía)
        if not pruebas_db:
            logger.warning("⚠️ No se encontraron pruebas con los filtros aplicados")
            return CatalogoPruebasResponse(
                pruebas=[],
                total=0,
                estilos_disponibles=[],
                cursos_disponibles=[]
            )
        
        # Convertir a esquemas de respuesta
        pruebas_response = []
        for prueba in pruebas_db:
            prueba_response = PruebaResponse(
                id=prueba.id,
                nombre=prueba.nombre_completo,  # Usa property del modelo
                estilo=EstiloNatacion(prueba.estilo),
                distancia=prueba.distancia,
                curso=TipoCurso(prueba.curso)
            )
            pruebas_response.append(prueba_response)
        
        # Obtener metadatos únicos de las pruebas encontradas
        estilos_unicos = list(set([prueba.estilo for prueba in pruebas_db]))
        cursos_unicos = list(set([prueba.curso for prueba in pruebas_db]))
        
        # Convertir a enums
        estilos_disponibles = [EstiloNatacion(estilo) for estilo in estilos_unicos]
        cursos_disponibles = [TipoCurso(curso) for curso in cursos_unicos]
        
        # Crear respuesta completa
        catalogo_response = CatalogoPruebasResponse(
            pruebas=pruebas_response,
            total=len(pruebas_response),
            estilos_disponibles=sorted(estilos_disponibles, key=lambda x: x.value),
            cursos_disponibles=sorted(cursos_disponibles, key=lambda x: x.value)
        )
        
        logger.success(f"✅ Catálogo de pruebas enviado exitosamente a {current_user.email}")
        return catalogo_response
        
    except HTTPException:
        # Re-lanzar HTTPException de dependencias (auth, db)
        raise
        
    except Exception as e:
        logger.error(f"❌ Error inesperado obteniendo catálogo de pruebas: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "catalog_error",
                "message": "Error obteniendo catálogo de pruebas",
                "detail": "Por favor intenta de nuevo más tarde"
            }
        )


@router.get(
    "/pruebas/{prueba_id}",
    response_model=PruebaResponse,
    summary="Obtener prueba específica",
    description="Obtiene una prueba específica por ID. Acceso libre para todos los usuarios autenticados.",
    tags=["catálogos"]
)
async def get_prueba_by_id(
    prueba_id: int,
    db: DatabaseDep,
    current_user: CurrentUser
) -> PruebaResponse:
    """
    Obtiene una prueba específica por ID.
    
    **Acceso:** Tanto entrenadores como atletas pueden consultar pruebas individuales.
    
    Args:
        prueba_id: ID único de la prueba
        
    Returns:
        PruebaResponse: Información de la prueba solicitada
        
    Raises:
        HTTPException 404: Si la prueba no existe
    """
    try:
        logger.info(f"🔍 Usuario {current_user.email} consultando prueba ID {prueba_id}")
        
        # Buscar prueba por ID
        prueba = db.query(Prueba).filter(Prueba.id == prueba_id).first()
        
        if not prueba:
            logger.warning(f"⚠️ Prueba ID {prueba_id} no encontrada")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": "prueba_not_found",
                    "message": f"Prueba con ID {prueba_id} no encontrada",
                    "detail": "Verifica el ID de la prueba"
                }
            )
        
        # Convertir a esquema de respuesta
        prueba_response = PruebaResponse(
            id=prueba.id,
            nombre=prueba.nombre_completo,
            estilo=EstiloNatacion(prueba.estilo),
            distancia=prueba.distancia,
            curso=TipoCurso(prueba.curso)
        )
        
        logger.success(f"✅ Prueba '{prueba.nombre_completo}' enviada a {current_user.email}")
        return prueba_response
        
    except HTTPException:
        # Re-lanzar HTTPException conocidas
        raise
        
    except Exception as e:
        logger.error(f"❌ Error inesperado obteniendo prueba ID {prueba_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "prueba_error",
                "message": f"Error obteniendo prueba ID {prueba_id}",
                "detail": "Por favor intenta de nuevo más tarde"
            }
        )
