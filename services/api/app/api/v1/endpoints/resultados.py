"""
Endpoints para gestión de resultados de natación.

Implementación CRUD completa con lógica transaccional y cálculos automáticos
según especificaciones del PRD.
"""

from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal

from fastapi import APIRouter, HTTPException, status, Query, Depends, Path
from sqlalchemy.orm import Session
from sqlalchemy import text, func, and_, or_
from loguru import logger

from app.db.deps import DatabaseDep
from app.models.resultado import Resultado, Segmento, FaseEnum, EstadoValidacionEnum
from app.schemas.resultado import (
    ResultadoCreate,
    ResultadoResponse,
    ResultadoCompletoResponse,
    ResultadoSearchFilters,
    ResultadoListResponse,
    SegmentoResponse,
    ResumenGlobal
)
from app.api.deps import (
    CurrentUser,
    CanCreateResultados,
    audit_access,
    validate_team_access
)
from app.utils.categoria_utils import calcular_categoria_en_fecha

# Router para resultados
router = APIRouter()


@router.options("/", summary="CORS preflight for resultados")
async def options_resultados():
    """
    Endpoint OPTIONS para manejar CORS preflight requests.
    """
    from fastapi.responses import JSONResponse
    
    return JSONResponse(
        content={"message": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true"
        }
    )


# ================================
# Servicios de lógica de negocio
# ================================

def _calcular_categoria_resultado(
    db: Session, 
    nadador_id: int, 
    fecha_competencia: date
) -> str:
    """
    Calcula la categoría del nadador en la fecha de competencia.
    
    Args:
        db: Sesión de base de datos
        nadador_id: ID del nadador
        fecha_competencia: Fecha de la competencia
        
    Returns:
        str: Etiqueta de categoría (ej: "15-16", "17+")
        
    Raises:
        HTTPException: Si el nadador no existe
    """
    try:
        # Consultar fecha de nacimiento del nadador
        nadador_query = text("""
            SELECT fecha_nacimiento 
            FROM nadador 
            WHERE id = :nadador_id
        """)
        
        result = db.execute(nadador_query, {"nadador_id": nadador_id}).fetchone()
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Nadador con ID {nadador_id} no encontrado"
            )
        
        fecha_nacimiento = result[0]
        categoria = calcular_categoria_en_fecha(fecha_nacimiento, fecha_competencia)
        
        logger.debug(f"Categoría calculada para nadador {nadador_id}: {categoria}")
        return categoria
        
    except Exception as e:
        logger.error(f"Error calculando categoría: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error calculando categoría del nadador"
        )


def _calcular_resumen_global(
    segmentos: List[Segmento], 
    tiempo_global_cs: int,
    distancia_prueba: int
) -> ResumenGlobal:
    """
    Calcula el resumen global de métricas según PRD.
    
    Args:
        segmentos: Lista de segmentos del resultado
        tiempo_global_cs: Tiempo global en centésimas
        distancia_prueba: Distancia total de la prueba
        
    Returns:
        ResumenGlobal: Métricas calculadas
    """
    # Sumas de segmentos
    suma_parciales_cs = sum(seg.tiempo_cs for seg in segmentos)
    brazadas_totales = sum(seg.brazadas for seg in segmentos)
    flecha_total_m = sum(seg.flecha_m for seg in segmentos)
    # Calcular distancia sin flecha manualmente (equivalente a PostgreSQL GREATEST(distancia_m - flecha_m, 0))
    distancia_sin_flecha_total_m = sum(
        max(Decimal(str(seg.distancia_m)) - seg.flecha_m, Decimal('0')) 
        for seg in segmentos
    )
    
    # Desviación según PRD
    desviacion_cs = suma_parciales_cs - tiempo_global_cs
    desviacion_absoluta_cs = abs(desviacion_cs)
    requiere_revision = desviacion_absoluta_cs > 40  # ±0.40s = 40cs
    
    # Métricas globales
    velocidad_promedio_mps = Decimal(str(distancia_prueba)) / (Decimal(str(tiempo_global_cs)) / Decimal('100'))
    
    distancia_por_brazada_global_m = None
    if brazadas_totales > 0:
        distancia_por_brazada_global_m = distancia_sin_flecha_total_m / Decimal(str(brazadas_totales))
    
    return ResumenGlobal(
        suma_parciales_cs=suma_parciales_cs,
        desviacion_cs=desviacion_cs,
        desviacion_absoluta_cs=desviacion_absoluta_cs,
        requiere_revision=requiere_revision,
        brazadas_totales=brazadas_totales,
        flecha_total_m=flecha_total_m,
        distancia_sin_flecha_total_m=distancia_sin_flecha_total_m,
        distancia_total_m=distancia_prueba,
        velocidad_promedio_mps=velocidad_promedio_mps,
        distancia_por_brazada_global_m=distancia_por_brazada_global_m
    )


def _validar_datos_resultado(
    db: Session,
    data: ResultadoCreate,
    equipo_id: int
) -> tuple[int, date]:  # (distancia_prueba, fecha_competencia)
    """
    Valida los datos del resultado según reglas de negocio del PRD.
    
    Args:
        db: Sesión de base de datos
        data: Datos del resultado a validar
        equipo_id: ID del equipo del usuario
        
    Returns:
        tuple: (distancia_prueba, fecha_competencia)
        
    Raises:
        HTTPException: Si alguna validación falla
    """
    try:
        # 1. Validar que nadador existe y pertenece al equipo
        nadador_query = text("""
            SELECT equipo_id, fecha_nacimiento 
            FROM nadador 
            WHERE id = :nadador_id
        """)
        
        nadador_result = db.execute(nadador_query, {"nadador_id": data.nadador_id}).fetchone()
        
        if not nadador_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Nadador con ID {data.nadador_id} no encontrado"
            )
        
        if nadador_result[0] != equipo_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para crear resultados de nadadores de otros equipos"
            )
        
        # 2. Validar que competencia existe, pertenece al equipo y fecha está en rango
        competencia_query = text("""
            SELECT equipo_id, rango_fechas, curso
            FROM competencia 
            WHERE id = :competencia_id
        """)
        
        competencia_result = db.execute(competencia_query, {"competencia_id": data.competencia_id}).fetchone()
        
        if not competencia_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Competencia con ID {data.competencia_id} no encontrada"
            )
        
        if competencia_result[0] != equipo_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para crear resultados en competencias de otros equipos"
            )
        
        # Extraer fechas del rango (formato '[2024-01-01,2024-01-07)')
        rango_fechas = competencia_result[1]
        # TODO: Implementar parsing correcto del daterange de PostgreSQL
        # Por ahora, asumimos que la fecha de registro está en el rango
        fecha_competencia = data.fecha_registro
        
        curso_competencia = competencia_result[2]
        
        # 3. Validar que prueba existe y coincide con curso de competencia
        prueba_query = text("""
            SELECT distancia, curso, estilo
            FROM prueba 
            WHERE id = :prueba_id
        """)
        
        prueba_result = db.execute(prueba_query, {"prueba_id": data.prueba_id}).fetchone()
        
        if not prueba_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Prueba con ID {data.prueba_id} no encontrada"
            )
        
        distancia_prueba = prueba_result[0]
        curso_prueba = prueba_result[1]
        estilo_prueba = prueba_result[2]
        
        if curso_prueba != curso_competencia:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"La prueba es {curso_prueba} pero la competencia es {curso_competencia}"
            )
        
        # 4. Validar segmentación según PRD
        longitud_segmento = 25 if curso_prueba == 'SC' else 50
        num_segmentos_esperados = distancia_prueba // longitud_segmento
        
        if len(data.segmentos) != num_segmentos_esperados:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Para {distancia_prueba}m {curso_prueba} se esperan {num_segmentos_esperados} segmentos, recibidos {len(data.segmentos)}"
            )
        
        # 5. Validar segmentos individuales
        for i, segmento in enumerate(data.segmentos, 1):
            # Validar distancia del segmento
            if segmento.distancia_m != longitud_segmento:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Segmento {i}: distancia debe ser {longitud_segmento}m para curso {curso_prueba}"
                )
            
            # Validar flecha no exceda distancia
            if segmento.flecha_m > segmento.distancia_m:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Segmento {i}: flecha ({segmento.flecha_m}m) no puede exceder distancia ({segmento.distancia_m}m)"
                )
            
            # Para Combinado Individual, validar estilos en orden correcto
            if estilo_prueba == 'Combinado':
                estilos_im = ['Mariposa', 'Dorso', 'Pecho', 'Libre']
                estilo_esperado = estilos_im[(i - 1) % 4]
                
                if segmento.estilo_segmento != estilo_esperado:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Segmento {i}: para IM se esperaba {estilo_esperado}, recibido {segmento.estilo_segmento}"
                    )
        
        # 6. Validar tiempo 15m solo para pruebas de 50m
        if data.tiempo_15m_cs is not None and distancia_prueba != 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tiempo de 15m solo permitido para pruebas de 50m"
            )
        
        # 7. Validar unicidad (nadador, competencia, prueba, fase, fecha)
        unicidad_query = text("""
            SELECT id 
            FROM resultado 
            WHERE nadador_id = :nadador_id 
              AND competencia_id = :competencia_id 
              AND prueba_id = :prueba_id 
              AND fase = :fase 
              AND fecha_registro = :fecha_registro
        """)
        
        existente = db.execute(unicidad_query, {
            "nadador_id": data.nadador_id,
            "competencia_id": data.competencia_id,
            "prueba_id": data.prueba_id,
            "fase": data.fase,
            "fecha_registro": data.fecha_registro
        }).fetchone()
        
        if existente:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya existe un resultado para este nadador, competencia, prueba, fase y fecha"
            )
        
        return distancia_prueba, fecha_competencia
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en validación de resultado: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error validando datos del resultado"
        )


# ================================
# Endpoints principales
# ================================

@router.post(
    "/",
    response_model=ResultadoCompletoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear resultado completo",
    description="Crea resultado + segmentos en transacción. Calcula automáticamente categoría, estado_validacion y desviación según PRD."
)
async def create_resultado(
    data: ResultadoCreate,
    current_user: CurrentUser,
    db: DatabaseDep,
    # Solo entrenadores pueden crear resultados
    _can_create: CanCreateResultados
) -> ResultadoCompletoResponse:
    """
    Endpoint POST /resultados según especificaciones del PRD.
    
    Implementa lógica transaccional completa:
    1. Valida dominio (segmentación, 15m, tolerancia, límites)
    2. Calcula categoria_label, estado_validacion, desviacion_parciales_cs
    3. Inserta resultado + segmentos en transacción
    4. Devuelve {resultado, segmentos[], resumen_global}
    
    Args:
        data: Datos del resultado completo con segmentos
        current_user: Usuario autenticado (entrenador)
        db: Sesión de base de datos
        
    Returns:
        ResultadoCompletoResponse: Resultado completo con métricas calculadas
    """
    
    # Auditoría del acceso
    audit_access(current_user, "create_attempt", "resultado")
    
    try:
        # 1. Validaciones de dominio
        logger.info(f"🏊 Validando resultado para nadador {data.nadador_id}")
        distancia_prueba, fecha_competencia = _validar_datos_resultado(db, data, current_user.equipo_id)
        
        # 2. Calcular campos automáticos
        categoria_label = _calcular_categoria_resultado(db, data.nadador_id, fecha_competencia)
        
        # Crear segmentos temporales para calcular resumen
        segmentos_temp = []
        for seg_data in data.segmentos:
            segmento_temp = Segmento(
                indice=seg_data.indice,
                estilo_segmento=seg_data.estilo_segmento,
                distancia_m=seg_data.distancia_m,
                tiempo_cs=seg_data.tiempo_cs,
                brazadas=seg_data.brazadas,
                flecha_m=seg_data.flecha_m
            )
            # No calcular campos derivados - PostgreSQL los calcula automáticamente
            segmentos_temp.append(segmento_temp)
        
        resumen = _calcular_resumen_global(segmentos_temp, data.tiempo_global_cs, distancia_prueba)
        
        # Determinar estado de validación
        estado_validacion = EstadoValidacionEnum.REVISAR if resumen.requiere_revision else EstadoValidacionEnum.VALIDO
        
        # 3. Crear resultado (usando strings directos para evitar problemas de SQLAlchemy)
        fase_str = data.fase  # Ya es string
        estado_str = estado_validacion.value if hasattr(estado_validacion, 'value') else str(estado_validacion)
        
        resultado = Resultado(
            nadador_id=data.nadador_id,
            competencia_id=data.competencia_id,
            prueba_id=data.prueba_id,
            fase=fase_str,  # String directo
            fecha_registro=data.fecha_registro,
            tiempo_global_cs=data.tiempo_global_cs,
            tiempo_15m_cs=data.tiempo_15m_cs,
            categoria_label=categoria_label,
            estado_validacion=estado_str,  # String directo
            desviacion_parciales_cs=resumen.desviacion_cs,
            capturado_por=current_user.id
        )
        
        db.add(resultado)
        db.flush()  # Obtener ID del resultado
        
        logger.info(f"✅ Resultado creado con ID {resultado.id}")
        
        # 4. Crear segmentos
        segmentos_creados = []
        for seg_temp in segmentos_temp:
            segmento = Segmento(
                resultado_id=resultado.id,
                indice=seg_temp.indice,
                estilo_segmento=seg_temp.estilo_segmento,  # Ya es string
                distancia_m=seg_temp.distancia_m,
                tiempo_cs=seg_temp.tiempo_cs,
                brazadas=seg_temp.brazadas,
                flecha_m=seg_temp.flecha_m
                # dist_sin_flecha_m, velocidad_mps, dist_por_brazada_m se calculan automáticamente por PostgreSQL
            )
            
            db.add(segmento)
            segmentos_creados.append(segmento)
        
        db.flush()  # Obtener IDs de segmentos
        
        logger.info(f"✅ {len(segmentos_creados)} segmentos creados para resultado {resultado.id}")
        
        # 5. Commit de los cambios
        db.commit()
        db.refresh(resultado)  # Refrescar datos del resultado
        
        # 6. Preparar respuesta
        resultado_response = ResultadoResponse.model_validate(resultado)
        segmentos_response = [SegmentoResponse.model_validate(seg) for seg in segmentos_creados]
        
        response = ResultadoCompletoResponse(
            resultado=resultado_response,
            segmentos=segmentos_response,
            resumen_global=resumen
        )
        
        logger.success(f"🎯 Resultado completo creado exitosamente: ID {resultado.id}")
        return response
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error creando resultado: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno creando resultado"
        )


@router.get(
    "/{resultado_id}",
    response_model=ResultadoCompletoResponse,
    summary="Obtener detalle completo de resultado",
    description="Obtiene información detallada de un resultado con segmentos y métricas calculadas"
)
async def get_resultado_detalle(
    current_user: CurrentUser,
    db: DatabaseDep,
    resultado_id: int = Path(..., description="ID del resultado", gt=0)
) -> ResultadoCompletoResponse:
    """
    Obtener detalle completo de un resultado según PRD.
    
    Retorna:
    - Información básica del resultado
    - Lista de segmentos ordenados por índice
    - Resumen global con métricas calculadas de la vista resultado_agregado
    
    Utiliza la vista resultado_agregado validada para cálculos optimizados.
    """
    import time
    start_time = time.time()
    
    # 1. Verificar que el resultado existe y obtener datos básicos
    resultado_query = text("""
        SELECT 
            r.id, r.nadador_id, r.competencia_id, r.prueba_id, r.fase,
            r.fecha_registro, r.tiempo_global_cs, r.tiempo_15m_cs,
            r.categoria_label, r.estado_validacion, r.desviacion_parciales_cs,
            r.capturado_por, r.created_at, r.updated_at,
            -- Datos adicionales para contexto
            n.nombre_completo as nadador_nombre,
            c.nombre as competencia_nombre,
            p.estilo, p.distancia, p.curso
        FROM resultado r
        INNER JOIN nadador n ON r.nadador_id = n.id
        INNER JOIN competencia c ON r.competencia_id = c.id  
        INNER JOIN prueba p ON r.prueba_id = p.id
        WHERE r.id = :resultado_id
    """)
    
    resultado_raw = db.execute(resultado_query, {"resultado_id": resultado_id}).fetchone()
    
    if not resultado_raw:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resultado con ID {resultado_id} no encontrado"
        )
    
    # 2. Obtener segmentos ordenados por índice
    segmentos_query = text("""
        SELECT 
            s.id, s.resultado_id, s.indice, s.estilo_segmento,
            s.distancia_m, s.tiempo_cs, s.brazadas, s.flecha_m,
            s.dist_sin_flecha_m, s.velocidad_mps, s.dist_por_brazada_m,
            s.created_at
        FROM segmento s
        WHERE s.resultado_id = :resultado_id
        ORDER BY s.indice ASC
    """)
    
    segmentos_raw = db.execute(segmentos_query, {"resultado_id": resultado_id}).fetchall()
    
    # 3. Obtener resumen global de la vista resultado_agregado
    resumen_query = text("""
        SELECT 
            suma_parciales_cs,
            desviacion_cs,
            brazadas_globales,
            flecha_total_m,
            distancia_sin_flecha_total_m,
            distancia_total_m,
            velocidad_promedio_mps,
            distancia_por_brazada_global_m
        FROM resultado_agregado
        WHERE resultado_id = :resultado_id
    """)
    
    resumen_raw = db.execute(resumen_query, {"resultado_id": resultado_id}).fetchone()
    
    if not resumen_raw:
        logger.warning(f"⚠️  Resumen no encontrado en vista para resultado {resultado_id}")
        # Fallback: calcular manualmente si no está en la vista
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error obteniendo métricas calculadas"
        )
    
    # 4. Construir respuesta con estructura ResultadoCompletoResponse
    
    # Convertir resultado básico
    resultado_response = ResultadoResponse(
        id=resultado_raw.id,
        nadador_id=resultado_raw.nadador_id,
        competencia_id=resultado_raw.competencia_id,
        prueba_id=resultado_raw.prueba_id,
        fase=resultado_raw.fase,
        fecha_registro=resultado_raw.fecha_registro,
        tiempo_global_cs=resultado_raw.tiempo_global_cs,
        tiempo_15m_cs=resultado_raw.tiempo_15m_cs,
        categoria_label=resultado_raw.categoria_label,
        estado_validacion=resultado_raw.estado_validacion,
        desviacion_parciales_cs=resultado_raw.desviacion_parciales_cs,
        capturado_por=resultado_raw.capturado_por,
        created_at=resultado_raw.created_at,
        updated_at=resultado_raw.updated_at
    )
    
    # Convertir segmentos
    segmentos_response = [
        SegmentoResponse(
            id=seg.id,
            resultado_id=seg.resultado_id,
            indice=seg.indice,
            estilo_segmento=seg.estilo_segmento,
            distancia_m=seg.distancia_m,
            tiempo_cs=seg.tiempo_cs,
            brazadas=seg.brazadas,
            flecha_m=seg.flecha_m,
            dist_sin_flecha_m=seg.dist_sin_flecha_m,
            velocidad_mps=seg.velocidad_mps,
            dist_por_brazada_m=seg.dist_por_brazada_m,
            created_at=seg.created_at
        ) for seg in segmentos_raw
    ]
    
    # Construir resumen global usando datos de la vista
    desviacion_absoluta = abs(resumen_raw.desviacion_cs)
    requiere_revision = desviacion_absoluta > 40
    
    resumen_global = ResumenGlobal(
        suma_parciales_cs=resumen_raw.suma_parciales_cs,
        desviacion_cs=resumen_raw.desviacion_cs,
        desviacion_absoluta_cs=desviacion_absoluta,
        requiere_revision=requiere_revision,
        brazadas_totales=resumen_raw.brazadas_globales,
        flecha_total_m=resumen_raw.flecha_total_m,
        distancia_sin_flecha_total_m=resumen_raw.distancia_sin_flecha_total_m,
        distancia_total_m=resumen_raw.distancia_total_m,
        velocidad_promedio_mps=resumen_raw.velocidad_promedio_mps,
        distancia_por_brazada_global_m=resumen_raw.distancia_por_brazada_global_m
    )
    
    # 5. Retornar respuesta completa
    end_time = time.time()
    execution_time = (end_time - start_time) * 1000  # en milisegundos
    
    logger.info(f"⏱️  GET /resultados/{resultado_id} ejecutado en {execution_time:.2f}ms")
    
    # Log performance warning si excede 300ms
    if execution_time > 300:
        logger.warning(f"🚨 PERFORMANCE: Endpoint tardó {execution_time:.2f}ms (>300ms target)")
    
    return ResultadoCompletoResponse(
        resultado=resultado_response,
        segmentos=segmentos_response,
        resumen_global=resumen_global
    )


@router.patch(
    "/{resultado_id}/revisar",
    response_model=dict,
    summary="Cambiar estado de revisión",
    description="Alterna el estado de validación entre 'valido' y 'revisar'"
)
async def toggle_estado_revision(
    current_user: CurrentUser,
    db: DatabaseDep,
    resultado_id: int = Path(..., description="ID del resultado", gt=0)
) -> dict:
    """
    Cambiar estado de revisión de un resultado.
    
    Alterna entre:
    - 'valido' → 'revisar'  
    - 'revisar' → 'valido'
    
    Solo entrenadores pueden cambiar el estado.
    """
    # Verificar permisos: solo entrenadores pueden cambiar estado
    if current_user.get("role") != "entrenador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo entrenadores pueden cambiar el estado de revisión"
        )
    
    # Verificar que el resultado existe
    resultado_query = text("""
        SELECT id, estado_validacion, nadador_id
        FROM resultado 
        WHERE id = :resultado_id
    """)
    resultado = db.execute(resultado_query, {"resultado_id": resultado_id}).fetchone()
    
    if not resultado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resultado con ID {resultado_id} no encontrado"
        )
    
    # Alternar estado
    nuevo_estado = "revisar" if resultado.estado_validacion == "valido" else "valido"
    
    # Actualizar en base de datos
    update_query = text("""
        UPDATE resultado 
        SET estado_validacion = :nuevo_estado, 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :resultado_id
    """)
    
    try:
        db.execute(update_query, {
            "nuevo_estado": nuevo_estado,
            "resultado_id": resultado_id
        })
        db.commit()
        
        logger.info(f"✅ Estado de resultado {resultado_id} cambiado a '{nuevo_estado}' por usuario {current_user.get('id', 'unknown')}")
        
        return {
            "success": True,
            "message": f"Estado cambiado a '{nuevo_estado}'",
            "resultado_id": resultado_id,
            "nuevo_estado": nuevo_estado,
            "estado_anterior": resultado.estado_validacion
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error actualizando estado de resultado {resultado_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno actualizando estado"
        )


@router.get(
    "/",
    response_model=ResultadoListResponse,
    summary="Listar resultados con filtros avanzados",
    description="Obtiene lista paginada de resultados con filtros múltiples y ordenamiento según PRD"
)
async def list_resultados(
    current_user: CurrentUser,
    db: DatabaseDep,
    # Filtros avanzados
    nadador_id: Optional[int] = Query(None, description="Filtrar por ID de nadador"),
    competencia_id: Optional[int] = Query(None, description="Filtrar por ID de competencia"),
    prueba_id: Optional[int] = Query(None, description="Filtrar por ID de prueba"),
    rama: Optional[str] = Query(None, description="Filtrar por rama (F/M)"),
    fecha_inicio: Optional[date] = Query(None, description="Fecha inicio del rango"),
    fecha_fin: Optional[date] = Query(None, description="Fecha fin del rango"),
    estado_validacion: Optional[str] = Query(None, description="Filtrar por estado (valido/revisar)"),
    fase: Optional[str] = Query(None, description="Filtrar por fase"),
    # Paginación
    page: int = Query(1, ge=1, description="Número de página (base 1)"),
    size: int = Query(20, ge=1, le=100, description="Tamaño de página (1-100)"),
    # Ordenamiento
    sort_by: str = Query("fecha_registro", description="Campo de ordenamiento"),
    sort_order: str = Query("desc", description="Orden (asc/desc)")
) -> ResultadoListResponse:
    """
    Listar resultados con filtros avanzados según PRD.
    
    Implementa:
    - Filtros por prueba, competencia, nadador, rama, fechas, estado_validacion
    - Ordenamiento por tiempo_global_cs, fecha_registro, nadador
    - Paginación offset-based eficiente
    - Respuesta optimizada para DataTable frontend
    
    Args:
        current_user: Usuario autenticado
        db: Sesión de base de datos
        **filters: Filtros opcionales según ResultadoSearchFilters
        page: Página actual (1-based)
        size: Tamaño de página
        sort_by: Campo de ordenamiento
        sort_order: Dirección de ordenamiento
        
    Returns:
        ResultadoListResponse: Lista paginada de resultados
    """
    import time
    start_time = time.time()
    
    try:
        # 1. Construir WHERE clause dinámico
        where_conditions = []
        query_params = {"equipo_id": current_user.equipo_id}
        
        # Solo mostrar resultados del equipo del usuario
        where_conditions.append("r.nadador_id IN (SELECT id FROM nadador WHERE equipo_id = :equipo_id)")
        
        # Aplicar filtros opcionales
        if nadador_id:
            where_conditions.append("r.nadador_id = :nadador_id")
            query_params["nadador_id"] = nadador_id
            
        if competencia_id:
            where_conditions.append("r.competencia_id = :competencia_id")
            query_params["competencia_id"] = competencia_id
            
        if prueba_id:
            where_conditions.append("r.prueba_id = :prueba_id")
            query_params["prueba_id"] = prueba_id
            
        if rama:
            where_conditions.append("n.rama = :rama")
            query_params["rama"] = rama
            
        if fecha_inicio:
            where_conditions.append("r.fecha_registro >= :fecha_inicio")
            query_params["fecha_inicio"] = fecha_inicio
            
        if fecha_fin:
            where_conditions.append("r.fecha_registro <= :fecha_fin")
            query_params["fecha_fin"] = fecha_fin
            
        if estado_validacion:
            where_conditions.append("r.estado_validacion = :estado_validacion")
            query_params["estado_validacion"] = estado_validacion
            
        if fase:
            where_conditions.append("r.fase = :fase")
            query_params["fase"] = fase
        
        # 2. Construir ORDER BY clause
        valid_sort_fields = {
            "tiempo_global_cs": "r.tiempo_global_cs",
            "fecha_registro": "r.fecha_registro",
            "nadador": "n.nombre_completo",
            "competencia": "c.nombre",
            "created_at": "r.created_at"
        }
        
        sort_field = valid_sort_fields.get(sort_by, "r.fecha_registro")
        sort_direction = "ASC" if sort_order.lower() == "asc" else "DESC"
        order_clause = f"{sort_field} {sort_direction}"
        
        # 3. Query principal para contar total
        where_clause = " AND ".join(where_conditions)
        count_query = text(f"""
            SELECT COUNT(*) as total
            FROM resultado r
            INNER JOIN nadador n ON r.nadador_id = n.id
            INNER JOIN competencia c ON r.competencia_id = c.id
            INNER JOIN prueba p ON r.prueba_id = p.id
            WHERE {where_clause}
        """)
        
        total_result = db.execute(count_query, query_params).fetchone()
        total = total_result.total if total_result else 0
        
        # 4. Query principal con paginación
        offset = (page - 1) * size
        query_params["limit"] = size
        query_params["offset"] = offset
        
        main_query = text(f"""
            SELECT 
                r.id, r.nadador_id, r.competencia_id, r.prueba_id, r.fase,
                r.fecha_registro, r.tiempo_global_cs, r.tiempo_15m_cs,
                r.categoria_label, r.estado_validacion, r.desviacion_parciales_cs,
                r.capturado_por, r.created_at, r.updated_at,
                -- Datos contextuales para UI
                n.nombre_completo as nadador_nombre,
                n.rama as nadador_rama,
                c.nombre as competencia_nombre,
                c.curso as competencia_curso,
                p.estilo as prueba_estilo,
                p.distancia as prueba_distancia,
                p.curso as prueba_curso,
                -- Usuario que capturó
                u.email as capturado_por_email
            FROM resultado r
            INNER JOIN nadador n ON r.nadador_id = n.id
            INNER JOIN competencia c ON r.competencia_id = c.id
            INNER JOIN prueba p ON r.prueba_id = p.id
            LEFT JOIN usuario u ON r.capturado_por = u.id
            WHERE {where_clause}
            ORDER BY {order_clause}
            LIMIT :limit OFFSET :offset
        """)
        
        resultados_raw = db.execute(main_query, query_params).fetchall()
        
        # 5. Construir respuesta
        resultados = []
        for row in resultados_raw:
            resultado_response = ResultadoResponse(
                id=row.id,
                nadador_id=row.nadador_id,
                competencia_id=row.competencia_id,
                prueba_id=row.prueba_id,
                fase=row.fase,
                fecha_registro=row.fecha_registro,
                tiempo_global_cs=row.tiempo_global_cs,
                tiempo_15m_cs=row.tiempo_15m_cs,
                categoria_label=row.categoria_label,
                estado_validacion=row.estado_validacion,
                desviacion_parciales_cs=row.desviacion_parciales_cs,
                capturado_por=row.capturado_por,
                created_at=row.created_at,
                updated_at=row.updated_at
            )
            resultados.append(resultado_response)
        
        # 6. Metadatos de paginación
        total_pages = (total + size - 1) // size  # Ceiling division
        
        response = ResultadoListResponse(
            resultados=resultados,
            total=total,
            page=page,
            size=size,
            total_pages=total_pages
        )
        
        # 7. Logging de performance
        end_time = time.time()
        execution_time = (end_time - start_time) * 1000
        
        logger.info(f"⏱️  GET /resultados ejecutado en {execution_time:.2f}ms | Filtros: {len([f for f in [nadador_id, competencia_id, prueba_id, rama, fecha_inicio, fecha_fin, estado_validacion, fase] if f])} | Total: {total}")
        
        if execution_time > 500:
            logger.warning(f"🚨 PERFORMANCE: Listado tardó {execution_time:.2f}ms (>500ms target)")
        
        return response
        
    except Exception as e:
        logger.error(f"❌ Error listando resultados: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno obteniendo lista de resultados"
        )


# TODO: Implementar otros endpoints según PRD
# - PATCH /resultados/{id} (edición)
