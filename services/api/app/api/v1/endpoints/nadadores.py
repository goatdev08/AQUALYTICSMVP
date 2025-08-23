"""
Endpoints para gestión de nadadores.

Implementación CRUD completa con búsqueda trigram, filtros y RBAC según PRD.
- Entrenadores (RW): pueden crear/editar/eliminar nadadores
- Atletas (R): solo pueden ver nadadores de su equipo
"""

from typing import List, Optional
from datetime import date

from fastapi import APIRouter, HTTPException, status, Query, Depends # type: ignore
from sqlalchemy.orm import Session
from sqlalchemy import text, func, and_, or_
from loguru import logger # type: ignore

from app.db.deps import DatabaseDep
from app.models.nadador import Nadador
from app.schemas.nadador import (
    NadadorCreate,
    NadadorUpdate,
    NadadorResponse,
    NadadorSearchFilters,
    NadadorListResponse
)
from app.utils.categoria_utils import aplicar_filtro_categoria_optimizado
from app.api.deps import (
    CurrentUser,
    CanCreateNadadores,
    CanEditNadadores,
    CanDelete,
    audit_access,
    validate_team_access
)

# Router para nadadores
router = APIRouter()


# ================================
# Servicios de base de datos
# ================================

def _build_nadador_query(
    db: Session, 
    equipo_id: int, 
    filters: NadadorSearchFilters
):
    """
    Construye la query base para búsqueda de nadadores con filtros.
    
    Args:
        db: Sesión de base de datos
        equipo_id: ID del equipo para filtrar
        filters: Filtros de búsqueda
        
    Returns:
        Query: Query de SQLAlchemy configurada con filtros
    """
    query = db.query(Nadador).filter(Nadador.equipo_id == equipo_id)
    
    # Filtro por rama
    if filters.rama:
        query = query.filter(Nadador.rama == filters.rama)
    
    # Búsqueda trigram por nombre
    if filters.search and len(filters.search.strip()) >= 2:
        # Usar búsqueda trigram con similarity
        query = query.filter(
            func.similarity(Nadador.nombre_completo, filters.search.strip()) > 0.2
        ).order_by(
            func.similarity(Nadador.nombre_completo, filters.search.strip()).desc()
        )
    else:
        # Orden alfabético por defecto
        query = query.order_by(Nadador.nombre_completo)
    
    # Filtro por categoría (optimizado con utilidades)
    if filters.categoria:
        query = aplicar_filtro_categoria_optimizado(query, filters.categoria)
    
    return query


def _create_nadador_response(nadador: Nadador) -> NadadorResponse:
    """
    Convierte modelo Nadador a NadadorResponse con campos calculados.
    
    Args:
        nadador: Instancia del modelo Nadador
        
    Returns:
        NadadorResponse: Response con campos calculados
    """
    return NadadorResponse(
        id=nadador.id,
        equipo_id=nadador.equipo_id,
        nombre_completo=nadador.nombre_completo,
        fecha_nacimiento=nadador.fecha_nacimiento,
        rama=nadador.rama,
        peso=nadador.peso,
        edad_actual=nadador.edad_actual,
        categoria_actual=nadador.categoria_actual
    )


# ================================
# Endpoints CRUD
# ================================

@router.get(
    "/",
    response_model=NadadorListResponse,
    summary="Listar nadadores con filtros",
    description="Lista nadadores del equipo con búsqueda trigram, filtros y paginación",
    tags=["nadadores"]
)
async def list_nadadores(
    current_user: CurrentUser,
    db: DatabaseDep,
    search: Optional[str] = Query(None, description="Búsqueda por nombre (trigram)"),
    rama: Optional[str] = Query(None, description="Filtrar por rama: F o M"),
    categoria: Optional[str] = Query(None, description="Filtrar por categoría"),
    limit: int = Query(default=50, le=100, ge=1, description="Límite de resultados"),
    offset: int = Query(default=0, ge=0, description="Offset para paginación")
) -> NadadorListResponse:
    """
    Lista nadadores del equipo con filtros avanzados.
    
    **RBAC:** Ambos roles pueden leer nadadores de su equipo.
    **Búsqueda:** Usa índice trigram para búsqueda eficiente por nombre.
    """
    # Auditoría de acceso
    audit_access(current_user, "nadadores", "list")
    
    try:
        # Crear filtros
        filters = NadadorSearchFilters(
            search=search,
            rama=rama,
            categoria=categoria,
            limit=limit,
            offset=offset
        )
        
        # Construir query con filtros
        query = _build_nadador_query(db, current_user.equipo_id, filters)
        
        # Obtener total count (antes de paginación)
        total = query.count()
        
        # Aplicar paginación
        nadadores = query.offset(offset).limit(limit).all()
        
        # Convertir a response objects
        items = [_create_nadador_response(n) for n in nadadores]
        
        logger.info(
            f"✅ Listado de nadadores: {len(items)} de {total} total "
            f"(usuario: {current_user.email}, filtros: {filters.dict(exclude_none=True)})"
        )
        
        return NadadorListResponse(
            items=items,
            total=total,
            limit=limit,
            offset=offset,
            has_more=(offset + limit) < total
        )
        
    except Exception as e:
        logger.error(f"❌ Error al listar nadadores: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "database_error",
                "message": "Error al obtener lista de nadadores",
                "detail": str(e)
            }
        )


@router.post(
    "/",
    response_model=NadadorResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nadador",
    description="Crea un nuevo nadador. SOLO ENTRENADORES.",
    tags=["nadadores"]
)
async def create_nadador(
    nadador_data: NadadorCreate,
    current_user: CanCreateNadadores,
    db: DatabaseDep
) -> NadadorResponse:
    """
    Crea un nuevo nadador asociado al equipo del entrenador.
    
    **RBAC:** Solo entrenadores pueden crear nadadores.
    """
    # Auditoría de acceso
    audit_access(current_user, "nadadores", "create")
    
    try:
        # Crear nuevo nadador
        nuevo_nadador = Nadador(
            equipo_id=current_user.equipo_id,  # Asociar al equipo del entrenador
            **nadador_data.dict()
        )
        
        # Guardar en base de datos
        db.add(nuevo_nadador)
        db.commit()
        db.refresh(nuevo_nadador)
        
        logger.info(
            f"✅ Nadador creado: {nuevo_nadador.nombre_completo} "
            f"(ID: {nuevo_nadador.id}, por: {current_user.email})"
        )
        
        return _create_nadador_response(nuevo_nadador)
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error al crear nadador: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "database_error",
                "message": "Error al crear nadador",
                "detail": str(e)
            }
        )


@router.get(
    "/{nadador_id}",
    response_model=NadadorResponse,
    summary="Obtener nadador por ID",
    description="Obtiene un nadador específico validando acceso por equipo",
    tags=["nadadores"]
)
async def get_nadador(
    nadador_id: int,
    current_user: CurrentUser,
    db: DatabaseDep
) -> NadadorResponse:
    """
    Obtiene un nadador específico por ID.
    
    **RBAC:** Ambos roles pueden ver, pero solo de su equipo.
    """
    # Auditoría de acceso
    audit_access(current_user, "nadadores", "read", nadador_id)
    
    try:
        # Buscar nadador
        nadador = db.query(Nadador).filter(Nadador.id == nadador_id).first()
        
        if not nadador:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": "nadador_not_found",
                    "message": f"Nadador con ID {nadador_id} no encontrado"
                }
            )
        
        # Validar acceso por equipo
        validate_team_access(current_user, nadador.equipo_id, f"nadador {nadador_id}")
        
        logger.info(f"✅ Nadador consultado: {nadador.nombre_completo} (por: {current_user.email})")
        
        return _create_nadador_response(nadador)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error al obtener nadador {nadador_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "database_error",
                "message": "Error al obtener nadador",
                "detail": str(e)
            }
        )


@router.patch(
    "/{nadador_id}",
    response_model=NadadorResponse,
    summary="Actualizar nadador",
    description="Actualiza un nadador existente. SOLO ENTRENADORES.",
    tags=["nadadores"]
)
async def update_nadador(
    nadador_id: int,
    nadador_data: NadadorUpdate,
    current_user: CanEditNadadores,
    db: DatabaseDep
) -> NadadorResponse:
    """
    Actualiza un nadador existente.
    
    **RBAC:** Solo entrenadores pueden editar nadadores de su equipo.
    """
    # Auditoría de acceso
    audit_access(current_user, "nadadores", "update", nadador_id)
    
    try:
        # Buscar nadador existente
        nadador = db.query(Nadador).filter(Nadador.id == nadador_id).first()
        
        if not nadador:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": "nadador_not_found",
                    "message": f"Nadador con ID {nadador_id} no encontrado"
                }
            )
        
        # Validar acceso por equipo
        validate_team_access(current_user, nadador.equipo_id, f"nadador {nadador_id}")
        
        # Actualizar campos proporcionados
        update_data = nadador_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(nadador, field, value)
        
        # Guardar cambios
        db.commit()
        db.refresh(nadador)
        
        logger.info(
            f"✅ Nadador actualizado: {nadador.nombre_completo} "
            f"(ID: {nadador_id}, por: {current_user.email})"
        )
        
        return _create_nadador_response(nadador)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error al actualizar nadador {nadador_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "database_error", 
                "message": "Error al actualizar nadador",
                "detail": str(e)
            }
        )


@router.delete(
    "/{nadador_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar nadador",
    description="Elimina un nadador. SOLO ENTRENADORES.",
    tags=["nadadores"]
)
async def delete_nadador(
    nadador_id: int,
    current_user: CanDelete,
    db: DatabaseDep
) -> None:
    """
    Elimina un nadador (soft delete recomendado para integridad referencial).
    
    **RBAC:** Solo entrenadores pueden eliminar nadadores de su equipo.
    """
    # Auditoría de acceso
    audit_access(current_user, "nadadores", "delete", nadador_id)
    
    try:
        # Buscar nadador existente
        nadador = db.query(Nadador).filter(Nadador.id == nadador_id).first()
        
        if not nadador:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": "nadador_not_found",
                    "message": f"Nadador con ID {nadador_id} no encontrado"
                }
            )
        
        # Validar acceso por equipo
        validate_team_access(current_user, nadador.equipo_id, f"nadador {nadador_id}")
        
        # Verificar que no tenga resultados asociados
        # TODO: En implementación completa, verificar integridad referencial
        # con tabla de resultados para evitar eliminación si tiene datos históricos
        
        # Eliminar nadador
        db.delete(nadador)
        db.commit()
        
        logger.info(
            f"✅ Nadador eliminado: {nadador.nombre_completo} "
            f"(ID: {nadador_id}, por: {current_user.email})"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error al eliminar nadador {nadador_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "database_error",
                "message": "Error al eliminar nadador",
                "detail": str(e)
            }
        )


# ================================
# Endpoint de búsqueda rápida (typeahead)
# ================================

@router.get(
    "/search/typeahead",
    response_model=List[NadadorResponse],
    summary="Búsqueda rápida de nadadores",
    description="Búsqueda optimizada para typeahead/autocompletar",
    tags=["nadadores", "búsqueda"]
)
async def search_nadadores_typeahead(
    current_user: CurrentUser,
    db: DatabaseDep,
    q: str = Query(..., min_length=1, description="Término de búsqueda (min 1 char)"),
    limit: int = Query(default=10, le=20, ge=1, description="Máximo 20 resultados")
) -> List[NadadorResponse]:
    """
    Búsqueda rápida de nadadores para componentes typeahead.
    
    **Optimizada para:** Autocompletar, selección rápida
    **RBAC:** Solo nadadores del equipo del usuario
    """
    # Auditoría de acceso
    audit_access(current_user, "nadadores", "search")
    
    try:
        query_term = q.strip()
        query_lower = query_term.lower()
        
        # Lógica unificada: SIEMPRE combinar ILIKE + trigram en una sola query
        # para resultados consistentes que se "refinan" en lugar de "saltar"
        
        # Definir matching conditions
        similarity = func.similarity(func.lower(Nadador.nombre_completo), query_lower)
        ilike_match = Nadador.nombre_completo.ilike(f"%{query_term}%")
        exact_match = func.lower(Nadador.nombre_completo) == query_lower
        
        # Ajustar threshold de similarity según longitud de query
        # Más estricto para queries cortas para evitar ruido
        similarity_threshold = 0.3 if len(query_term) <= 2 else 0.15
        
        # Filtros: SIEMPRE incluir ambos ILIKE y trigram, pero con threshold ajustado
        nadadores = (
            db.query(Nadador)
            .filter(
                and_(
                    Nadador.equipo_id == current_user.equipo_id,
                    or_(
                        ilike_match,  # Coincidencias de substring (siempre incluidas)
                        similarity > similarity_threshold  # Coincidencias fuzzy (threshold ajustado)
                    )
                )
            )
            # Ordenar por prioridad: exact > ilike > similarity > alfabético
            .order_by(
                exact_match.desc(),  # Coincidencias exactas primero
                ilike_match.desc(),  # Luego coincidencias de substring 
                similarity.desc(),   # Luego fuzzy matches por relevancia
                Nadador.nombre_completo  # Finalmente alfabético
            )
            .limit(limit)
            .all()
        )
        
        results = [_create_nadador_response(n) for n in nadadores]
        
        logger.info(f"🔍 Búsqueda typeahead: '{q}' -> {len(results)} resultados")
        
        return results
        
    except Exception as e:
        logger.error(f"❌ Error en búsqueda typeahead: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "search_error",
                "message": "Error en búsqueda de nadadores",
                "detail": str(e)
            }
        )