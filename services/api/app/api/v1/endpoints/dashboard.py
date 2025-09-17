"""
Endpoints del Dashboard.

Implementa los endpoints del dashboard según PRD:
- GET /dashboard/resumen: KPIs principales
- GET /dashboard/top5: Top 5 por prueba/rama
- GET /dashboard/distribucion-estilos: Distribución por estilo
- GET /dashboard/proximas-competencias: Próximas competencias
- GET /dashboard/atletas-destacados: Atletas con mejores mejoras recientes
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import text, func, desc, and_, or_
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta

from app.api.deps import CurrentUser
from app.db.deps import get_db
from app.models import (
    Resultado, Nadador, Competencia, Prueba, Segmento
)

# Router para endpoints del dashboard
router = APIRouter()


@router.get("/resumen")
async def get_dashboard_resumen(
    current_user: CurrentUser,
    db: Session = Depends(get_db)
):
    """
    GET /dashboard/resumen - KPIs principales del dashboard.
    
    Retorna métricas clave según PRD:
    - Total de nadadores del equipo
    - Total de competencias del equipo  
    - Total de registros (resultados) del equipo
    - PBs recientes (últimos 30 días)
    
    Args:
        current_user: Usuario autenticado
        db: Sesión de base de datos
        
    Returns:
        dict: KPIs del dashboard
    """
    try:
        equipo_id = current_user.equipo_id
        fecha_limite = datetime.now() - timedelta(days=30)
        
        # KPI 1: Total nadadores del equipo
        total_nadadores = db.query(func.count(Nadador.id))\
            .filter(Nadador.equipo_id == equipo_id)\
            .scalar()
        
        # KPI 2: Total competencias del equipo
        total_competencias = db.query(func.count(Competencia.id))\
            .filter(Competencia.equipo_id == equipo_id)\
            .scalar()
        
        # KPI 3: Total registros (resultados) del equipo
        total_registros = db.query(func.count(Resultado.id))\
            .join(Nadador, Resultado.nadador_id == Nadador.id)\
            .filter(Nadador.equipo_id == equipo_id)\
            .scalar()
        
        # KPI 4: PBs recientes (últimos 30 días) usando fecha_registro según PRDv2
        # Para simplificar MVP, contamos resultados recientes válidos
        pbs_recientes = db.query(func.count(Resultado.id))\
            .join(Nadador, Resultado.nadador_id == Nadador.id)\
            .filter(
                and_(
                    Nadador.equipo_id == equipo_id,
                    Resultado.fecha_registro >= fecha_limite,
                    Resultado.estado_validacion == 'valido'
                )
            )\
            .scalar()
        
        return {
            "total_nadadores": total_nadadores or 0,
            "total_competencias": total_competencias or 0,
            "total_registros": total_registros or 0,
            "pbs_recientes": pbs_recientes or 0
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo KPIs del dashboard: {str(e)}"
        )


@router.get("/top5")
async def get_dashboard_top5(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    estilo: Optional[str] = Query(None, description="Filtrar por estilo"),
    distancia: Optional[int] = Query(None, description="Filtrar por distancia"),
    curso: Optional[str] = Query(None, description="Filtrar por curso (SC/LC)"),
    rama: Optional[str] = Query(None, description="Filtrar por rama (F/M)")
):
    """
    GET /dashboard/top5 - Top 5 resultados por prueba/rama.
    
    Retorna los 5 mejores tiempos con filtros opcionales.
    
    Args:
        current_user: Usuario autenticado
        db: Sesión de base de datos
        estilo: Filtro opcional por estilo
        distancia: Filtro opcional por distancia
        curso: Filtro opcional por curso
        rama: Filtro opcional por rama
        
    Returns:
        list: Top 5 resultados con información completa
    """
    try:
        equipo_id = current_user.equipo_id
        
        # Query base
        query = db.query(
            Resultado.id,
            Resultado.tiempo_global_cs,
            Resultado.fecha_registro,
            Nadador.nombre_completo,
            Nadador.rama,
            Prueba.estilo,
            Prueba.distancia,
            Prueba.curso,
            Competencia.nombre.label("competencia_nombre")
        )\
        .join(Nadador, Resultado.nadador_id == Nadador.id)\
        .join(Prueba, Resultado.prueba_id == Prueba.id)\
        .join(Competencia, Resultado.competencia_id == Competencia.id)\
        .filter(Nadador.equipo_id == equipo_id)
        
        # Aplicar filtros opcionales
        if estilo:
            query = query.filter(Prueba.estilo == estilo)
        if distancia:
            query = query.filter(Prueba.distancia == distancia)
        if curso:
            query = query.filter(Prueba.curso == curso)
        if rama:
            query = query.filter(Nadador.rama == rama)
        
        # Ordenar por mejor tiempo (menor) y limitar a 5
        resultados = query\
            .order_by(Resultado.tiempo_global_cs.asc())\
            .limit(5)\
            .all()
        
        # Formatear respuesta
        top5 = []
        for resultado in resultados:
            # Convertir centésimas a formato mm:ss.cc
            tiempo_cs = resultado.tiempo_global_cs
            minutos = tiempo_cs // 6000
            segundos = (tiempo_cs % 6000) // 100
            centesimas = tiempo_cs % 100
            tiempo_formateado = f"{minutos:02d}:{segundos:02d}.{centesimas:02d}"
            
            top5.append({
                "id": resultado.id,
                "nadador": resultado.nombre_completo,
                "rama": resultado.rama,
                "prueba": f"{resultado.estilo} {resultado.distancia}m {resultado.curso}",
                "tiempo": tiempo_formateado,
                "tiempo_cs": resultado.tiempo_global_cs,
                "competencia": resultado.competencia_nombre,
                "fecha": resultado.fecha_registro.isoformat()
            })
        
        return top5
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo top 5: {str(e)}"
        )


@router.get("/distribucion-estilos")
async def get_distribucion_estilos(
    current_user: CurrentUser,
    db: Session = Depends(get_db)
):
    """
    GET /dashboard/distribucion-estilos - Distribución por estilo.
    
    Retorna la distribución de resultados por estilo de natación.
    
    Args:
        current_user: Usuario autenticado
        db: Sesión de base de datos
        
    Returns:
        list: Distribución con labels y counts
    """
    try:
        equipo_id = current_user.equipo_id
        
        # Query para contar resultados por estilo
        distribucion = db.query(
            Prueba.estilo,
            func.count(Resultado.id).label("count")
        )\
        .join(Resultado, Prueba.id == Resultado.prueba_id)\
        .join(Nadador, Resultado.nadador_id == Nadador.id)\
        .filter(Nadador.equipo_id == equipo_id)\
        .group_by(Prueba.estilo)\
        .order_by(desc("count"))\
        .all()
        
        # Formatear para chart
        data = []
        for estilo, count in distribucion:
            data.append({
                "label": estilo,
                "value": count
            })
        
        return data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo distribución de estilos: {str(e)}"
        )


@router.get("/proximas-competencias")
async def get_proximas_competencias(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    dias: int = Query(30, description="Días hacia adelante para buscar"),
    limite: int = Query(5, description="Número máximo de competencias a retornar", ge=1, le=20)
):
    """
    GET /dashboard/proximas-competencias - Próximas competencias.
    
    Retorna competencias próximas del equipo en el rango especificado.
    
    Args:
        current_user: Usuario autenticado
        db: Sesión de base de datos
        dias: Días hacia adelante para buscar
        
    Returns:
        list: Próximas competencias
    """
    try:
        equipo_id = current_user.equipo_id
        fecha_inicio = date.today()
        fecha_fin = fecha_inicio + timedelta(days=dias)
        
        # Primero obtener el total para metadatos
        count_query = """
        SELECT COUNT(*) as total
        FROM competencia 
        WHERE equipo_id = :equipo_id 
        AND rango_fechas && daterange(:fecha_inicio, :fecha_fin, '[]')
        """
        
        count_result = db.execute(text(count_query), {
            "equipo_id": equipo_id,
            "fecha_inicio": fecha_inicio,
            "fecha_fin": fecha_fin
        })
        
        total_competencias = count_result.fetchone().total
        
        # Query usando daterange con límite según PRDv2
        query_text = """
        SELECT 
            id,
            nombre,
            curso,
            rango_fechas,
            sede,
            lower(rango_fechas) as fecha_inicio,
            upper(rango_fechas) as fecha_fin
        FROM competencia 
        WHERE equipo_id = :equipo_id 
        AND rango_fechas && daterange(:fecha_inicio, :fecha_fin, '[]')
        ORDER BY lower(rango_fechas) ASC
        LIMIT :limite
        """
        
        result = db.execute(text(query_text), {
            "equipo_id": equipo_id,
            "fecha_inicio": fecha_inicio,
            "fecha_fin": fecha_fin,
            "limite": limite
        })
        
        competencias = []
        for row in result:
            competencias.append({
                "id": row.id,
                "nombre": row.nombre,
                "curso": row.curso,
                "sede": row.sede,
                "fecha_inicio": row.fecha_inicio.isoformat() if row.fecha_inicio else None,
                "fecha_fin": row.fecha_fin.isoformat() if row.fecha_fin else None,
                "dias_restantes": (row.fecha_inicio - fecha_inicio).days if row.fecha_inicio else 0
            })
        
        # Retornar con metadatos según PRDv2
        return {
            "data": competencias,
            "total": total_competencias,
            "mostradas": len(competencias),
            "hay_mas": total_competencias > limite
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo próximas competencias: {str(e)}"
        )


@router.get("/atletas-destacados")
async def get_atletas_destacados(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    dias: int = Query(30, description="Días hacia atrás para buscar mejoras"),
    limite: int = Query(5, description="Número máximo de atletas a retornar", ge=1, le=20)
):
    """
    GET /dashboard/atletas-destacados - Atletas con mejores mejoras recientes.
    
    Identifica atletas con mejoras porcentuales significativas en los últimos días.
    Para MVP, retorna atletas con más registros recientes como proxy.
    
    Args:
        current_user: Usuario autenticado
        db: Sesión de base de datos
        dias: Días hacia atrás para analizar
        
    Returns:
        list: Atletas destacados con métricas
    """
    try:
        equipo_id = current_user.equipo_id
        fecha_limite = datetime.now() - timedelta(days=dias)
        
        # Obtener total de atletas con al menos 1 registro (más flexible para MVP)
        count_total = db.query(func.count(func.distinct(Nadador.id)))\
            .join(Resultado, Nadador.id == Resultado.nadador_id)\
            .filter(
                and_(
                    Nadador.equipo_id == equipo_id,
                    Resultado.fecha_registro >= fecha_limite,
                    Resultado.estado_validacion == 'valido'
                )
            )\
            .scalar() or 0
        
        # Para MVP: atletas con más registros recientes válidos usando fecha_registro según PRDv2
        try:
            atletas = db.query(
                Nadador.id,
                Nadador.nombre_completo,
                Nadador.rama,
                func.count(Resultado.id).label("registros_recientes"),
                func.min(Resultado.tiempo_global_cs).label("mejor_tiempo"),
                func.avg(Resultado.tiempo_global_cs).label("tiempo_promedio")
            )\
            .join(Resultado, Nadador.id == Resultado.nadador_id)\
            .filter(
                and_(
                    Nadador.equipo_id == equipo_id,
                    Resultado.fecha_registro >= fecha_limite,
                    Resultado.estado_validacion == 'valido'
                )
            )\
            .group_by(Nadador.id, Nadador.nombre_completo, Nadador.rama)\
            .having(func.count(Resultado.id) >= 1)\
            .order_by(desc("registros_recientes"))\
            .limit(limite)\
            .all()
        except Exception as db_error:
            print(f"Error en consulta de atletas destacados: {str(db_error)}")
            atletas = []
        
        destacados = []
        for atleta in atletas:
            try:
                # Formatear mejor tiempo con validación
                if atleta.mejor_tiempo is not None:
                    tiempo_cs = int(atleta.mejor_tiempo)
                    minutos = tiempo_cs // 6000
                    segundos = (tiempo_cs % 6000) // 100
                    centesimas = tiempo_cs % 100
                    mejor_tiempo_formateado = f"{minutos:02d}:{segundos:02d}.{centesimas:02d}"
                else:
                    mejor_tiempo_formateado = "Sin tiempo"
                
                # Validar tiempo promedio
                tiempo_promedio = round(float(atleta.tiempo_promedio), 2) if atleta.tiempo_promedio is not None else 0.0
                
                destacados.append({
                    "id": atleta.id,
                    "nombre": atleta.nombre_completo or "Nombre no disponible",
                    "rama": atleta.rama or "N/A",
                    "registros_recientes": atleta.registros_recientes or 0,
                    "mejor_tiempo": mejor_tiempo_formateado,
                    "tiempo_promedio": tiempo_promedio,
                    "metrica": f"{atleta.registros_recientes or 0} registros recientes"
                })
            except Exception as e:
                # Log el error pero continúa con otros atletas
                print(f"Error procesando atleta {atleta.id}: {str(e)}")
                continue
        
        # Retornar con metadatos según PRDv2
        return {
            "data": destacados,
            "total": count_total,
            "mostradas": len(destacados),
            "hay_mas": count_total > limite
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo atletas destacados: {str(e)}"
        )


@router.get("/actividad-reciente")
async def get_actividad_reciente(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    limite: int = Query(20, description="Número máximo de registros a retornar", ge=1, le=100)
):
    """
    GET /dashboard/actividad-reciente - Últimos registros válidos del equipo.
    
    Retorna la actividad reciente del equipo basada en resultados válidos
    ordenados por fecha_registro descendente según PRDv2.
    
    Args:
        current_user: Usuario autenticado
        db: Sesión de base de datos
        limite: Número máximo de registros (1-100)
        
    Returns:
        list: Actividad reciente con información completa
    """
    try:
        equipo_id = current_user.equipo_id
        
        # Primero obtener total para metadatos
        total_actividad = db.query(func.count(Resultado.id))\
            .join(Nadador, Resultado.nadador_id == Nadador.id)\
            .filter(
                and_(
                    Nadador.equipo_id == equipo_id,
                    Resultado.estado_validacion == 'valido'
                )
            )\
            .scalar()
        
        # Query para actividad reciente usando fecha_registro según PRDv2
        # Filtrando por estado_validacion='valido' y usando índices apropiados
        actividad = db.query(
            Resultado.id,
            Resultado.tiempo_global_cs,
            Resultado.fecha_registro,
            Resultado.estado_validacion,
            Nadador.nombre_completo,
            Nadador.rama,
            Prueba.estilo,
            Prueba.distancia,
            Prueba.curso,
            Competencia.nombre.label("competencia_nombre")
        )\
        .join(Nadador, Resultado.nadador_id == Nadador.id)\
        .join(Prueba, Resultado.prueba_id == Prueba.id)\
        .join(Competencia, Resultado.competencia_id == Competencia.id)\
        .filter(
            and_(
                Nadador.equipo_id == equipo_id,
                Resultado.estado_validacion == 'valido'
            )
        )\
        .order_by(Resultado.fecha_registro.desc())\
        .limit(limite)\
        .all()
        
        # Formatear respuesta similar al formato top5 pero para actividad
        actividad_reciente = []
        for registro in actividad:
            # Convertir centésimas a formato mm:ss.cc
            tiempo_cs = registro.tiempo_global_cs
            minutos = tiempo_cs // 6000
            segundos = (tiempo_cs % 6000) // 100
            centesimas = tiempo_cs % 100
            tiempo_formateado = f"{minutos:02d}:{segundos:02d}.{centesimas:02d}"
            
            actividad_reciente.append({
                "id": registro.id,
                "nadador": registro.nombre_completo,
                "rama": registro.rama,
                "prueba": f"{registro.estilo} {registro.distancia}m {registro.curso}",
                "tiempo": tiempo_formateado,
                "tiempo_cs": registro.tiempo_global_cs,
                "competencia": registro.competencia_nombre,
                "fecha": registro.fecha_registro.isoformat(),
                "estado_validacion": registro.estado_validacion,
                "tipo_actividad": "Resultado registrado"
            })
        
        # Retornar con metadatos según PRDv2
        return {
            "data": actividad_reciente,
            "total": total_actividad or 0,
            "mostradas": len(actividad_reciente),
            "hay_mas": (total_actividad or 0) > limite
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo actividad reciente: {str(e)}"
        )
