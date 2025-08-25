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
        
        # KPI 4: PBs recientes (últimos 30 días)
        # Para simplificar MVP, contamos resultados recientes
        pbs_recientes = db.query(func.count(Resultado.id))\
            .join(Nadador, Resultado.nadador_id == Nadador.id)\
            .filter(
                and_(
                    Nadador.equipo_id == equipo_id,
                    Resultado.created_at >= fecha_limite
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
    dias: int = Query(30, description="Días hacia adelante para buscar")
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
        
        # Query usando daterange - buscamos competencias que se solapen con nuestro rango
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
        LIMIT 10
        """
        
        result = db.execute(text(query_text), {
            "equipo_id": equipo_id,
            "fecha_inicio": fecha_inicio,
            "fecha_fin": fecha_fin
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
        
        return competencias
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo próximas competencias: {str(e)}"
        )


@router.get("/atletas-destacados")
async def get_atletas_destacados(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    dias: int = Query(30, description="Días hacia atrás para buscar mejoras")
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
        
        # Para MVP: atletas con más registros recientes
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
                Resultado.created_at >= fecha_limite
            )
        )\
        .group_by(Nadador.id, Nadador.nombre_completo, Nadador.rama)\
        .having(func.count(Resultado.id) >= 2)\
        .order_by(desc("registros_recientes"))\
        .limit(5)\
        .all()
        
        destacados = []
        for atleta in atletas:
            # Formatear mejor tiempo
            tiempo_cs = int(atleta.mejor_tiempo)
            minutos = tiempo_cs // 6000
            segundos = (tiempo_cs % 6000) // 100
            centesimas = tiempo_cs % 100
            mejor_tiempo_formateado = f"{minutos:02d}:{segundos:02d}.{centesimas:02d}"
            
            destacados.append({
                "id": atleta.id,
                "nombre": atleta.nombre_completo,
                "rama": atleta.rama,
                "registros_recientes": atleta.registros_recientes,
                "mejor_tiempo": mejor_tiempo_formateado,
                "tiempo_promedio": round(float(atleta.tiempo_promedio), 2),
                "metrica": f"{atleta.registros_recientes} registros recientes"
            })
        
        return destacados
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo atletas destacados: {str(e)}"
        )
