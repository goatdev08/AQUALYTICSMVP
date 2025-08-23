"""
Endpoints para gestión de competencias.

Implementación CRUD completa con filtros por fecha/curso y RBAC según PRD.
- Entrenadores (RW): pueden crear/editar competencias
- Atletas (R): solo pueden ver competencias de su equipo
"""

from typing import List, Optional
from datetime import date

from fastapi import APIRouter, HTTPException, status, Query, Depends, Path  # type: ignore
from sqlalchemy.orm import Session
from sqlalchemy import text, func, and_, or_
from loguru import logger  # type: ignore

from app.db.deps import DatabaseDep
from app.models.competencia import Competencia, CursoEnum
from app.schemas.competencia import (
    CompetenciaCreate,
    CompetenciaUpdate,
    CompetenciaResponse,
    CompetenciaSearchFilters,
    CompetenciaListResponse,
    CompetenciaSelector
)
from app.api.deps import (
    CurrentUser,
    CanCreateCompetencias,
    CanEditCompetencias,
    CanDelete,
    audit_access,
    validate_team_access
)

# Router para competencias
router = APIRouter()


# ================================
# Servicios de base de datos
# ================================

def _build_competencia_query(
    db: Session, 
    equipo_id: int, 
    filters: CompetenciaSearchFilters
):
    """
    Construye la query base para búsqueda de competencias con filtros.
    
    Args:
        db: Sesión de base de datos
        equipo_id: ID del equipo para filtrar
        filters: Filtros de búsqueda
        
    Returns:
        Query: Query de SQLAlchemy configurada con filtros
    """
    query = db.query(Competencia).filter(Competencia.equipo_id == equipo_id)
    
    # Filtro por curso
    if filters.curso:
        query = query.filter(Competencia.curso == filters.curso)
    
    # Búsqueda por nombre (coincidencia parcial)
    if filters.nombre and len(filters.nombre.strip()) >= 2:
        search_term = f"%{filters.nombre.strip()}%"
        query = query.filter(Competencia.nombre.ilike(search_term))
    
    # Búsqueda por sede (coincidencia parcial)
    if filters.sede and len(filters.sede.strip()) >= 2:
        search_term = f"%{filters.sede.strip()}%"
        query = query.filter(Competencia.sede.ilike(search_term))
    
    # Filtros por fechas usando operaciones de daterange
    if filters.fecha_desde:
        # Competencias que no terminen antes de fecha_desde
        query = query.filter(
            text(f"upper(rango_fechas) >= '{filters.fecha_desde}'")
        )
    
    if filters.fecha_hasta:
        # Competencias que no inicien después de fecha_hasta
        query = query.filter(
            text(f"lower(rango_fechas) <= '{filters.fecha_hasta}'")
        )
    
    # Filtro por competencias próximas
    if filters.solo_proximas:
        hoy = date.today()
        query = query.filter(
            text(f"lower(rango_fechas) >= '{hoy}'")
        )
    
    # Filtro por competencias activas
    if filters.solo_activas:
        hoy = date.today()
        query = query.filter(
            text(f"'{hoy}' <@ rango_fechas")  # Operador <@ verifica si fecha está dentro del rango
        )
    
    # Ordenar por fecha de inicio (más próximas primero)
    query = query.order_by(text("lower(rango_fechas)"))
    
    return query


def _create_competencia_response(competencia: Competencia) -> CompetenciaResponse:
    """
    Convierte modelo Competencia a CompetenciaResponse con campos calculados.
    
    Args:
        competencia: Instancia del modelo Competencia
        
    Returns:
        CompetenciaResponse: Response con campos calculados
    """
    return CompetenciaResponse(
        id=competencia.id,
        equipo_id=competencia.equipo_id,
        nombre=competencia.nombre,
        curso=competencia.curso,
        sede=competencia.sede,
        fecha_inicio=competencia.get_fecha_inicio(),
        fecha_fin=competencia.get_fecha_fin(),
        created_at=competencia.created_at,
        updated_at=competencia.updated_at
    )


def _convert_create_to_model(competencia_create: CompetenciaCreate, equipo_id: int) -> Competencia:
    """
    Convierte CompetenciaCreate a modelo Competencia con rango_fechas formateado.
    
    Args:
        competencia_create: Datos de creación
        equipo_id: ID del equipo del usuario
        
    Returns:
        Competencia: Instancia del modelo lista para insertar
    """
    # Formatear rango_fechas en formato PostgreSQL
    rango_fechas = f"[{competencia_create.fecha_inicio},{competencia_create.fecha_fin}]"
    
    return Competencia(
        equipo_id=equipo_id,
        nombre=competencia_create.nombre,
        curso=competencia_create.curso,
        sede=competencia_create.sede,
        rango_fechas=rango_fechas
    )


# ================================
# Endpoints CRUD
# ================================

@router.post("/", response_model=CompetenciaResponse, status_code=status.HTTP_201_CREATED)
async def crear_competencia(
    competencia: CompetenciaCreate,
    db: DatabaseDep,
    current_user: CurrentUser,
    _can_create: CanCreateCompetencias
):
    """
    Crear una nueva competencia (solo entrenadores).
    
    Requiere permisos de creación (rol entrenador).
    Valida todos los campos obligatorios y rangos de fechas.
    """
    try:
        audit_access(current_user, "competencia", "create_attempt")
        
        logger.info(f"Creando competencia - Datos recibidos: {competencia.model_dump()}")
        logger.info(f"Usuario: {current_user.email}, Equipo: {current_user.equipo_id}")
        
        # Validaciones adicionales de negocio
        duracion = (competencia.fecha_fin - competencia.fecha_inicio).days
        if duracion > 30:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="La duración de la competencia no puede exceder 30 días"
            )
        
        # Verificar que no existe otra competencia con el mismo nombre en fechas similares
        # Construir ranges válidos de PostgreSQL para la comparación
        fecha_inicio_range = f"'[{competencia.fecha_inicio},{competencia.fecha_inicio}]'"
        fecha_fin_range = f"'[{competencia.fecha_fin},{competencia.fecha_fin}]'"
        
        competencia_existente = db.query(Competencia).filter(
            and_(
                Competencia.equipo_id == current_user.equipo_id,
                Competencia.nombre.ilike(competencia.nombre.strip()),
                text(f"{fecha_inicio_range} && rango_fechas OR {fecha_fin_range} && rango_fechas")
            )
        ).first()
        
        if competencia_existente:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Ya existe una competencia con el mismo nombre en fechas similares"
            )
        
        # Crear instancia del modelo
        logger.info("Convirtiendo schema a modelo...")
        db_competencia = _convert_create_to_model(competencia, current_user.equipo_id)
        logger.info(f"Modelo creado: {db_competencia}")
        
        # Guardar en base de datos
        logger.info("Agregando competencia a la sesión de DB...")
        db.add(db_competencia)
        logger.info("Haciendo commit...")
        db.commit()
        logger.info("Haciendo refresh...")
        db.refresh(db_competencia)
        
        logger.info(f"Competencia creada: ID={db_competencia.id}, nombre={db_competencia.nombre}")
        return _create_competencia_response(db_competencia)
        
    except HTTPException:
        raise
    except ValueError as e:
        # Manejar errores de validación de Pydantic
        db.rollback()
        logger.warning(f"Error de validación al crear competencia: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error creando competencia: {str(e)}")
        logger.error(f"Tipo de error: {type(e).__name__}")
        logger.error(f"Datos de competencia: {competencia.model_dump() if 'competencia' in locals() else 'N/A'}")
        # Para debugging, mostrar el traceback completo
        import traceback
        logger.error(f"Traceback completo: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al crear la competencia"
        )


@router.get("/", response_model=CompetenciaListResponse)
async def listar_competencias(
    db: DatabaseDep,
    current_user: CurrentUser,
    # Filtros de búsqueda
    nombre: Optional[str] = Query(None, description="Filtrar por nombre (coincidencia parcial)"),
    curso: Optional[CursoEnum] = Query(None, description="Filtrar por tipo de curso"),
    sede: Optional[str] = Query(None, description="Filtrar por sede (coincidencia parcial)"),
    fecha_desde: Optional[date] = Query(None, description="Competencias que terminen después de esta fecha"),
    fecha_hasta: Optional[date] = Query(None, description="Competencias que inicien antes de esta fecha"),
    solo_proximas: Optional[bool] = Query(None, description="Solo competencias próximas"),
    solo_activas: Optional[bool] = Query(None, description="Solo competencias en curso"),
    # Paginación
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(10, ge=1, le=100, description="Elementos por página")
):
    """
    Obtener lista paginada de competencias con filtros.
    
    Accesible para todos los usuarios autenticados (solo ven competencias de su equipo).
    """
    try:
        audit_access(current_user, "competencia", "list_attempt")
        
        # Construir filtros
        filters = CompetenciaSearchFilters(
            nombre=nombre,
            curso=curso,
            sede=sede,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            solo_proximas=solo_proximas,
            solo_activas=solo_activas
        )
        
        # Query base con filtros
        query = _build_competencia_query(db, current_user.equipo_id, filters)
        
        # Total de registros (para paginación)
        total = query.count()
        
        # Aplicar paginación
        offset = (page - 1) * limit
        competencias = query.offset(offset).limit(limit).all()
        
        # Convertir a response
        competencias_response = [
            _create_competencia_response(comp) for comp in competencias
        ]
        
        # Calcular si hay más páginas
        has_more = (offset + len(competencias)) < total
        
        return CompetenciaListResponse(
            competencias=competencias_response,
            total=total,
            page=page,
            limit=limit,
            has_more=has_more
        )
        
    except Exception as e:
        logger.error(f"Error listando competencias: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al obtener las competencias"
        )


@router.get("/proximas", response_model=List[CompetenciaResponse])
async def obtener_proximas_competencias(
    db: DatabaseDep,
    current_user: CurrentUser,
    limit: int = Query(5, ge=1, le=20, description="Número máximo de competencias próximas"),
    fecha_desde: Optional[date] = Query(None, description="Fecha desde la cual buscar (por defecto hoy)")
):
    """
    Obtener competencias próximas para dashboard.
    
    Retorna las próximas competencias ordenadas por fecha de inicio.
    """
    try:
        audit_access(current_user, "competencia", "list_proximas_attempt")
        
        fecha_referencia = fecha_desde or date.today()
        
        # Query para competencias próximas
        query = db.query(Competencia).filter(
            and_(
                Competencia.equipo_id == current_user.equipo_id,
                text(f"lower(rango_fechas) >= '{fecha_referencia}'")
            )
        ).order_by(text("lower(rango_fechas)")).limit(limit)
        
        competencias = query.all()
        
        return [_create_competencia_response(comp) for comp in competencias]
        
    except Exception as e:
        logger.error(f"Error obteniendo próximas competencias: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al obtener próximas competencias"
        )


@router.get("/{competencia_id}", response_model=CompetenciaResponse)
async def obtener_competencia(
    db: DatabaseDep,
    current_user: CurrentUser,
    competencia_id: int = Path(..., description="ID de la competencia")
):
    """
    Obtener detalle de una competencia específica.
    
    Solo se pueden ver competencias del mismo equipo.
    """
    try:
        audit_access(current_user, "competencia", "get_attempt", competencia_id)
        
        # Buscar competencia
        competencia = db.query(Competencia).filter(
            and_(
                Competencia.id == competencia_id,
                Competencia.equipo_id == current_user.equipo_id
            )
        ).first()
        
        if not competencia:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Competencia no encontrada"
            )
        
        return _create_competencia_response(competencia)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo competencia {competencia_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al obtener la competencia"
        )


@router.patch("/{competencia_id}", response_model=CompetenciaResponse)
async def actualizar_competencia(
    competencia_update: CompetenciaUpdate,
    db: DatabaseDep,
    current_user: CurrentUser,
    _can_edit: CanEditCompetencias,
    competencia_id: int = Path(..., description="ID de la competencia")
):
    """
    Actualizar una competencia existente (solo entrenadores).
    
    Requiere permisos de edición (rol entrenador).
    Valida rangos de fechas cuando se actualiza solo una fecha.
    """
    try:
        audit_access(current_user, "competencia", "update_attempt", competencia_id)
        
        # Buscar competencia
        competencia = db.query(Competencia).filter(
            and_(
                Competencia.id == competencia_id,
                Competencia.equipo_id == current_user.equipo_id
            )
        ).first()
        
        if not competencia:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Competencia no encontrada"
            )
        
        # Aplicar actualizaciones
        update_data = competencia_update.dict(exclude_unset=True)
        
        # Validaciones adicionales para fechas cuando se actualiza parcialmente
        if 'fecha_inicio' in update_data or 'fecha_fin' in update_data:
            fecha_inicio_actual = competencia.get_fecha_inicio()
            fecha_fin_actual = competencia.get_fecha_fin()
            
            fecha_inicio = update_data.get('fecha_inicio', fecha_inicio_actual)
            fecha_fin = update_data.get('fecha_fin', fecha_fin_actual)
            
            # Validaciones de rango cuando se actualiza parcialmente
            if fecha_fin < fecha_inicio:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="La fecha de fin no puede ser anterior a la fecha de inicio"
                )
            
            # Validar duración máxima
            duracion = (fecha_fin - fecha_inicio).days
            if duracion > 30:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="La duración de la competencia no puede exceder 30 días"
                )
            
            # Formatear rango_fechas
            update_data['rango_fechas'] = f"[{fecha_inicio},{fecha_fin}]"
            
            # Remover fechas individuales ya que se almacena como rango
            update_data.pop('fecha_inicio', None)
            update_data.pop('fecha_fin', None)
        
        # Aplicar cambios
        for field, value in update_data.items():
            setattr(competencia, field, value)
        
        db.commit()
        db.refresh(competencia)
        
        logger.info(f"Competencia actualizada: ID={competencia.id}")
        return _create_competencia_response(competencia)
        
    except HTTPException:
        raise
    except ValueError as e:
        # Manejar errores de validación de Pydantic
        logger.warning(f"Error de validación al actualizar competencia {competencia_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error actualizando competencia {competencia_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al actualizar la competencia"
        )


# ================================
# Endpoints de utilidad
# ================================

@router.get("/search/typeahead", response_model=List[CompetenciaSelector])
async def typeahead_competencias(
    db: DatabaseDep,
    current_user: CurrentUser,
    q: str = Query(..., min_length=2, description="Término de búsqueda"),
    limit: int = Query(10, ge=1, le=50, description="Máximo resultados")
):
    """
    Búsqueda typeahead de competencias para selectors.
    
    Optimizada para componentes de búsqueda rápida.
    """
    try:
        audit_access(current_user, "competencia", "typeahead_attempt")
        
        search_term = f"%{q.strip()}%"
        
        # Query optimizada para typeahead
        competencias = db.query(Competencia).filter(
            and_(
                Competencia.equipo_id == current_user.equipo_id,
                Competencia.nombre.ilike(search_term)
            )
        ).order_by(text("lower(rango_fechas) DESC")).limit(limit).all()  # Más recientes primero
        
        # Convertir a selector format
        return [
            CompetenciaSelector(
                id=comp.id,
                nombre=comp.nombre,
                curso=comp.curso,
                fecha_inicio=comp.get_fecha_inicio(),
                fecha_fin=comp.get_fecha_fin(),
                estado="proxima" if comp.get_fecha_inicio() >= date.today() 
                       else ("en_curso" if comp.is_activa() else "finalizada")
            ) for comp in competencias
        ]
        
    except Exception as e:
        logger.error(f"Error en typeahead competencias: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor en búsqueda de competencias"
        )
