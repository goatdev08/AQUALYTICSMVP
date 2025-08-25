"""
Endpoints de Análisis y Comparaciones.

Implementa los endpoints de análisis según PRD tarea 19:
- GET /analitica/promedio-equipo: Promedios de equipo por segmento
- GET /analitica/comparar: Comparación entre registros del mismo nadador
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import text, func, desc, and_, or_, case
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta

from app.api.deps import CurrentUser
from app.db.deps import get_db
from app.models import (
    Resultado, Nadador, Competencia, Prueba, Segmento
)
from app.schemas.analitica import (
    AnaliticaFilters, PromedioEquipoResponse, ComparacionResponse
)

# Router para endpoints de análisis
router = APIRouter()


def apply_analitica_filters(query, filters: AnaliticaFilters, base_joins_applied: bool = False):
    """
    Aplica filtros de análisis a una query de SQLAlchemy de manera consistente.
    
    Args:
        query: Query base de SQLAlchemy
        filters: Filtros de análisis a aplicar
        base_joins_applied: Si los JOINs básicos ya están aplicados
        
    Returns:
        Query: Query con filtros aplicados
    """
    # Filtros de prueba
    if filters.prueba_id:
        query = query.filter(Resultado.prueba_id == filters.prueba_id)
    
    if filters.estilo:
        query = query.filter(Prueba.estilo == filters.estilo.value)
    
    if filters.distancia:
        query = query.filter(Prueba.distancia == filters.distancia)
    
    if filters.curso:
        query = query.filter(Prueba.curso == filters.curso.value)
    
    # Filtros de nadador
    if filters.nadador_id:
        query = query.filter(Nadador.id == filters.nadador_id)
    
    if filters.rama:
        query = query.filter(Nadador.rama == filters.rama.value)
    
    # Filtros temporales
    if filters.fecha_desde:
        query = query.filter(Resultado.fecha_registro >= filters.fecha_desde)
    
    if filters.fecha_hasta:
        query = query.filter(Resultado.fecha_registro <= filters.fecha_hasta)
    
    # Filtros de competencia
    if filters.competencia_id:
        query = query.filter(Resultado.competencia_id == filters.competencia_id)
    
    return query


@router.get("/promedio-equipo", response_model=PromedioEquipoResponse)
async def get_promedio_equipo(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    filters: AnaliticaFilters = Depends()
):
    """
    GET /analitica/promedio-equipo - Promedios de equipo por segmento.
    
    Calcula promedios del equipo por segmento con filtros opcionales.
    Incluye análisis por prueba, curso, rama y rango de fechas.
    
    Args:
        current_user: Usuario autenticado
        db: Sesión de base de datos
        filters: Filtros de análisis
        
    Returns:
        PromedioEquipoResponse: Promedios por segmento con metadatos
    """
    try:
        equipo_id = current_user.equipo_id
        
        # Query base para promedios por segmento
        query = db.query(
            Segmento.indice,
            func.avg(Segmento.tiempo_cs).label("tiempo_promedio_cs"),
            func.avg(Segmento.brazadas).label("brazadas_promedio"),
            func.avg(Segmento.flecha_m).label("flecha_promedio_m"),
            func.avg(Segmento.dist_sin_flecha_m).label("dist_sin_flecha_promedio_m"),
            func.count(Segmento.id).label("total_registros"),
            Prueba.estilo,
            Prueba.distancia,
            Prueba.curso
        )\
        .join(Resultado, Segmento.resultado_id == Resultado.id)\
        .join(Nadador, Resultado.nadador_id == Nadador.id)\
        .join(Prueba, Resultado.prueba_id == Prueba.id)\
        .filter(Nadador.equipo_id == equipo_id)
        
        # Aplicar filtros usando función de utilidad
        query = apply_analitica_filters(query, filters, base_joins_applied=True)
        
        # Agrupar por índice de segmento y datos de prueba
        resultados = query\
            .group_by(
                Segmento.indice, 
                Prueba.estilo, 
                Prueba.distancia, 
                Prueba.curso
            )\
            .order_by(Segmento.indice.asc())\
            .all()
        
        # Formatear respuesta por segmento
        segmentos_promedio = []
        total_registros_analizados = 0
        
        for resultado in resultados:
            # Formatear tiempo promedio
            tiempo_cs = int(resultado.tiempo_promedio_cs) if resultado.tiempo_promedio_cs else 0
            minutos = tiempo_cs // 6000
            segundos = (tiempo_cs % 6000) // 100
            centesimas = tiempo_cs % 100
            tiempo_formateado = f"{minutos:02d}:{segundos:02d}.{centesimas:02d}"
            
            segmentos_promedio.append({
                "indice": resultado.indice,
                "tiempo_promedio": tiempo_formateado,
                "tiempo_promedio_cs": int(resultado.tiempo_promedio_cs) if resultado.tiempo_promedio_cs else 0,
                "brazadas_promedio": round(float(resultado.brazadas_promedio), 1) if resultado.brazadas_promedio else 0,
                "flecha_promedio_m": round(float(resultado.flecha_promedio_m), 2) if resultado.flecha_promedio_m else 0,
                "dist_sin_flecha_promedio_m": round(float(resultado.dist_sin_flecha_promedio_m), 2) if resultado.dist_sin_flecha_promedio_m else 0,
                "registros_en_promedio": resultado.total_registros,
                "prueba": {
                    "estilo": resultado.estilo,
                    "distancia": resultado.distancia,
                    "curso": resultado.curso
                }
            })
            
            total_registros_analizados += resultado.total_registros
        
        # Metadatos de la consulta
        metadatos = {
            "filtros_aplicados": {
                "prueba_id": filters.prueba_id,
                "estilo": filters.estilo.value if filters.estilo else None,
                "distancia": filters.distancia,
                "curso": filters.curso.value if filters.curso else None,
                "nadador_id": filters.nadador_id,
                "rama": filters.rama.value if filters.rama else None,
                "fecha_desde": filters.fecha_desde.isoformat() if filters.fecha_desde else None,
                "fecha_hasta": filters.fecha_hasta.isoformat() if filters.fecha_hasta else None,
                "competencia_id": filters.competencia_id
            },
            "total_segmentos": len(segmentos_promedio),
            "total_registros_analizados": total_registros_analizados,
            "equipo_id": equipo_id
        }
        
        return {
            "segmentos_promedio": segmentos_promedio,
            "metadatos": metadatos
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculando promedios de equipo: {str(e)}"
        )


@router.get("/comparar", response_model=ComparacionResponse)
async def comparar_resultados(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    resultado1_id: int = Query(..., description="ID del primer resultado a comparar", gt=0),
    resultado2_id: int = Query(..., description="ID del segundo resultado a comparar", gt=0)
):
    """
    GET /analitica/comparar - Comparación entre dos registros del mismo nadador.
    
    Compara dos resultados del mismo nadador y prueba, mostrando diferencias
    por segmento y métricas globales.
    
    Args:
        current_user: Usuario autenticado
        db: Sesión de base de datos
        resultado1_id: ID del primer resultado
        resultado2_id: ID del segundo resultado
        
            Returns:
        ComparacionResponse: Comparación detallada entre los dos resultados
    """
    try:
        equipo_id = current_user.equipo_id
        
        # Validar que ambos resultados existen y pertenecen al equipo
        resultado1 = db.query(Resultado)\
            .join(Nadador, Resultado.nadador_id == Nadador.id)\
            .filter(
                and_(
                    Resultado.id == resultado1_id,
                    Nadador.equipo_id == equipo_id
                )
            )\
            .first()
        
        if not resultado1:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Resultado {resultado1_id} no encontrado o no pertenece al equipo"
            )
        
        resultado2 = db.query(Resultado)\
            .join(Nadador, Resultado.nadador_id == Nadador.id)\
            .filter(
                and_(
                    Resultado.id == resultado2_id,
                    Nadador.equipo_id == equipo_id
                )
            )\
            .first()
        
        if not resultado2:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Resultado {resultado2_id} no encontrado o no pertenece al equipo"
            )
        
        # Validar que son del mismo nadador y misma prueba
        if resultado1.nadador_id != resultado2.nadador_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Los resultados deben ser del mismo nadador"
            )
        
        if resultado1.prueba_id != resultado2.prueba_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Los resultados deben ser de la misma prueba"
            )
        
        # Obtener información adicional
        nadador = db.query(Nadador).filter(Nadador.id == resultado1.nadador_id).first()
        prueba = db.query(Prueba).filter(Prueba.id == resultado1.prueba_id).first()
        competencia1 = db.query(Competencia).filter(Competencia.id == resultado1.competencia_id).first()
        competencia2 = db.query(Competencia).filter(Competencia.id == resultado2.competencia_id).first()
        
        # Obtener segmentos de ambos resultados
        segmentos1 = db.query(Segmento)\
            .filter(Segmento.resultado_id == resultado1_id)\
            .order_by(Segmento.indice.asc())\
            .all()
        
        segmentos2 = db.query(Segmento)\
            .filter(Segmento.resultado_id == resultado2_id)\
            .order_by(Segmento.indice.asc())\
            .all()
        
        # Comparar tiempos globales
        diferencia_global_cs = resultado2.tiempo_global_cs - resultado1.tiempo_global_cs
        diferencia_global_porcentaje = (diferencia_global_cs / resultado1.tiempo_global_cs) * 100 if resultado1.tiempo_global_cs > 0 else 0
        
        # Formatear tiempos globales
        def formatear_tiempo(tiempo_cs):
            minutos = tiempo_cs // 6000
            segundos = (tiempo_cs % 6000) // 100
            centesimas = tiempo_cs % 100
            return f"{minutos:02d}:{segundos:02d}.{centesimas:02d}"
        
        # Comparar segmentos
        comparacion_segmentos = []
        
        # Crear diccionarios por índice para comparar
        segmentos1_dict = {s.indice: s for s in segmentos1}
        segmentos2_dict = {s.indice: s for s in segmentos2}
        
        # Obtener todos los índices únicos
        indices = sorted(set(segmentos1_dict.keys()) | set(segmentos2_dict.keys()))
        
        for indice in indices:
            seg1 = segmentos1_dict.get(indice)
            seg2 = segmentos2_dict.get(indice)
            
            if seg1 and seg2:
                # Ambos segmentos existen
                diff_tiempo = seg2.tiempo_cs - seg1.tiempo_cs
                diff_brazadas = seg2.brazadas - seg1.brazadas if seg1.brazadas and seg2.brazadas else 0
                diff_flecha = seg2.flecha_m - seg1.flecha_m if seg1.flecha_m and seg2.flecha_m else 0
                
                comparacion_segmentos.append({
                    "indice": indice,
                    "resultado1": {
                        "tiempo": formatear_tiempo(seg1.tiempo_cs),
                        "tiempo_cs": seg1.tiempo_cs,
                        "brazadas": seg1.brazadas,
                        "flecha_m": seg1.flecha_m,
                        "dist_sin_flecha_m": seg1.dist_sin_flecha_m
                    },
                    "resultado2": {
                        "tiempo": formatear_tiempo(seg2.tiempo_cs),
                        "tiempo_cs": seg2.tiempo_cs,
                        "brazadas": seg2.brazadas,
                        "flecha_m": seg2.flecha_m,
                        "dist_sin_flecha_m": seg2.dist_sin_flecha_m
                    },
                    "diferencias": {
                        "tiempo_cs": diff_tiempo,
                        "tiempo_formateado": f"+{formatear_tiempo(abs(diff_tiempo))}" if diff_tiempo > 0 else f"-{formatear_tiempo(abs(diff_tiempo))}" if diff_tiempo < 0 else "00:00.00",
                        "brazadas": diff_brazadas,
                        "flecha_m": round(diff_flecha, 2) if diff_flecha else 0,
                        "mejora": diff_tiempo < 0  # True si resultado2 es mejor (menor tiempo)
                    }
                })
        
        # Respuesta estructurada
        return {
            "nadador": {
                "id": nadador.id,
                "nombre": nadador.nombre_completo,
                "rama": nadador.rama
            },
            "prueba": {
                "id": prueba.id,
                "estilo": prueba.estilo,
                "distancia": prueba.distancia,
                "curso": prueba.curso
            },
            "resultado1": {
                "id": resultado1.id,
                "tiempo_global": formatear_tiempo(resultado1.tiempo_global_cs),
                "tiempo_global_cs": resultado1.tiempo_global_cs,
                "fecha_registro": resultado1.fecha_registro.isoformat(),
                "competencia": competencia1.nombre if competencia1 else "N/A"
            },
            "resultado2": {
                "id": resultado2.id,
                "tiempo_global": formatear_tiempo(resultado2.tiempo_global_cs),
                "tiempo_global_cs": resultado2.tiempo_global_cs,
                "fecha_registro": resultado2.fecha_registro.isoformat(),
                "competencia": competencia2.nombre if competencia2 else "N/A"
            },
            "comparacion_global": {
                "diferencia_cs": diferencia_global_cs,
                "diferencia_formateada": f"+{formatear_tiempo(abs(diferencia_global_cs))}" if diferencia_global_cs > 0 else f"-{formatear_tiempo(abs(diferencia_global_cs))}" if diferencia_global_cs < 0 else "00:00.00",
                "diferencia_porcentaje": round(diferencia_global_porcentaje, 2),
                "mejora": diferencia_global_cs < 0,
                "resultado_mas_reciente": 2 if resultado2.fecha_registro > resultado1.fecha_registro else 1
            },
            "comparacion_segmentos": comparacion_segmentos,
            "resumen": {
                "total_segmentos_comparados": len(comparacion_segmentos),
                "segmentos_mejorados": len([s for s in comparacion_segmentos if s["diferencias"]["mejora"]]),
                "segmentos_empeorados": len([s for s in comparacion_segmentos if not s["diferencias"]["mejora"] and s["diferencias"]["tiempo_cs"] != 0])
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error comparando resultados: {str(e)}"
        )
