"""
Queries SQLAlchemy para analytics de nadadores individuales.

Implementa queries eficientes utilizando la vista resultado_agregado
y las tablas principales para generar analytics completos de nadadores.
"""

from typing import List, Optional, Dict, Any, Tuple
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import (
    text, func, desc, asc, and_, or_, case, 
    select, distinct, literal_column
)

from app.models import (
    Resultado, Nadador, Competencia, Prueba, Segmento
)


# ============================================================================
# FUNCIONES UTILITARIAS
# ============================================================================

def formatear_tiempo_cs(tiempo_cs: int) -> str:
    """
    Convierte tiempo en centésimas a formato MM:SS.CC.
    
    Args:
        tiempo_cs: Tiempo en centésimas de segundo
        
    Returns:
        str: Tiempo formateado (MM:SS.CC)
    """
    if tiempo_cs <= 0:
        return "00:00.00"
    
    minutos = tiempo_cs // 6000
    segundos = (tiempo_cs % 6000) // 100
    centesimas = tiempo_cs % 100
    return f"{minutos:02d}:{segundos:02d}.{centesimas:02d}"


def tiempo_cs_a_segundos(tiempo_cs: int) -> float:
    """
    Convierte tiempo en centésimas a segundos (float).
    
    Args:
        tiempo_cs: Tiempo en centésimas de segundo
        
    Returns:
        float: Tiempo en segundos
    """
    return tiempo_cs / 100.0


def aplicar_filtros_temporales(query, fecha_desde: Optional[date], fecha_hasta: Optional[date]):
    """
    Aplica filtros temporales a una query.
    
    Args:
        query: Query base de SQLAlchemy
        fecha_desde: Fecha inicio (opcional)
        fecha_hasta: Fecha fin (opcional)
        
    Returns:
        Query: Query con filtros temporales aplicados
    """
    if fecha_desde:
        query = query.filter(Resultado.fecha_registro >= fecha_desde)
    if fecha_hasta:
        query = query.filter(Resultado.fecha_registro <= fecha_hasta)
    return query


# ============================================================================
# QUERIES PRINCIPALES
# ============================================================================

def get_mejores_marcas(
    db: Session, 
    nadador_id: int, 
    equipo_id: int,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None
) -> List[Dict[str, Any]]:
    """
    Obtiene las mejores marcas personales de un nadador por prueba y curso.
    
    Args:
        db: Sesión de base de datos
        nadador_id: ID del nadador
        equipo_id: ID del equipo (para seguridad)
        fecha_desde: Fecha inicio del filtro (opcional)
        fecha_hasta: Fecha fin del filtro (opcional)
        
    Returns:
        List[Dict]: Lista de mejores marcas con información de prueba y competencia
    """
    # Query base para obtener el mejor tiempo por prueba y curso
    subquery = db.query(
        Resultado.prueba_id,
        Prueba.curso,
        func.min(Resultado.tiempo_global_cs).label("mejor_tiempo_cs")
    )\
    .join(Nadador, Resultado.nadador_id == Nadador.id)\
    .join(Prueba, Resultado.prueba_id == Prueba.id)\
    .filter(
        and_(
            Nadador.id == nadador_id,
            Nadador.equipo_id == equipo_id,
            Resultado.estado_validacion == 'valido'
        )
    )
    
    # Aplicar filtros temporales
    subquery = aplicar_filtros_temporales(subquery, fecha_desde, fecha_hasta)
    
    # Agrupar por prueba y curso
    subquery = subquery.group_by(Resultado.prueba_id, Prueba.curso).subquery()
    
    # Query principal para obtener detalles completos
    query = db.query(
        Prueba.estilo,
        Prueba.distancia,
        Prueba.curso,
        Resultado.tiempo_global_cs,
        Resultado.fecha_registro,
        Competencia.nombre.label("competencia"),
        Competencia.sede.label("lugar")
    )\
    .select_from(Resultado)\
    .join(Nadador, Resultado.nadador_id == Nadador.id)\
    .join(Prueba, Resultado.prueba_id == Prueba.id)\
    .join(Competencia, Resultado.competencia_id == Competencia.id)\
    .join(subquery, and_(
        Resultado.prueba_id == subquery.c.prueba_id,
        Prueba.curso == subquery.c.curso,
        Resultado.tiempo_global_cs == subquery.c.mejor_tiempo_cs
    ))\
    .filter(
        and_(
            Nadador.id == nadador_id,
            Nadador.equipo_id == equipo_id,
            Resultado.estado_validacion == 'valido'
        )
    )\
    .order_by(Resultado.tiempo_global_cs.asc())
    
    resultados = query.all()
    
    # Formatear respuesta
    marcas = []
    for r in resultados:
        prueba_nombre = f"{r.distancia} {r.estilo}"
        marcas.append({
            "prueba": prueba_nombre,
            "curso": r.curso,
            "tiempo": tiempo_cs_a_segundos(r.tiempo_global_cs),
            "tiempo_formateado": formatear_tiempo_cs(r.tiempo_global_cs),
            "fecha": r.fecha_registro.isoformat(),
            "competencia": r.competencia,
            "lugar": r.lugar or "N/A"
        })
    
    return marcas


def get_evolucion_temporal(
    db: Session, 
    nadador_id: int, 
    equipo_id: int,
    limite: int = 20,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None
) -> List[Dict[str, Any]]:
    """
    Obtiene la evolución temporal de tiempos de un nadador.
    
    Args:
        db: Sesión de base de datos
        nadador_id: ID del nadador
        equipo_id: ID del equipo
        limite: Número máximo de registros a retornar
        fecha_desde: Fecha inicio del filtro (opcional)
        fecha_hasta: Fecha fin del filtro (opcional)
        
    Returns:
        List[Dict]: Lista de puntos de evolución temporal
    """
    query = db.query(
        Resultado.fecha_registro,
        Prueba.estilo,
        Prueba.distancia,
        Resultado.tiempo_global_cs,
        Competencia.nombre.label("competencia")
    )\
    .select_from(Resultado)\
    .join(Nadador, Resultado.nadador_id == Nadador.id)\
    .join(Prueba, Resultado.prueba_id == Prueba.id)\
    .join(Competencia, Resultado.competencia_id == Competencia.id)\
    .filter(
        and_(
            Nadador.id == nadador_id,
            Nadador.equipo_id == equipo_id,
            Resultado.estado_validacion == 'valido'
        )
    )
    
    # Aplicar filtros temporales
    query = aplicar_filtros_temporales(query, fecha_desde, fecha_hasta)
    
    # Ordenar por fecha y limitar
    resultados = query.order_by(Resultado.fecha_registro.desc()).limit(limite).all()
    
    # Formatear respuesta
    evolucion = []
    for r in resultados:
        prueba_nombre = f"{r.distancia} {r.estilo}"
        evolucion.append({
            "fecha": r.fecha_registro.isoformat(),
            "prueba": prueba_nombre,
            "tiempo": tiempo_cs_a_segundos(r.tiempo_global_cs),
            "tiempo_formateado": formatear_tiempo_cs(r.tiempo_global_cs),
            "competencia": r.competencia
        })
    
    # Devolver en orden cronológico (más antiguo primero)
    return list(reversed(evolucion))


def get_distribucion_estilos(
    db: Session, 
    nadador_id: int, 
    equipo_id: int,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None
) -> List[Dict[str, Any]]:
    """
    Obtiene la distribución de pruebas por estilo para un nadador.
    
    Args:
        db: Sesión de base de datos
        nadador_id: ID del nadador
        equipo_id: ID del equipo
        fecha_desde: Fecha inicio del filtro (opcional)
        fecha_hasta: Fecha fin del filtro (opcional)
        
    Returns:
        List[Dict]: Distribución por estilos con estadísticas
    """
    # Query para obtener estadísticas por estilo
    query = db.query(
        Prueba.estilo,
        func.count(Resultado.id).label("pruebas_nadadas"),
        func.min(Resultado.tiempo_global_cs).label("mejor_tiempo_cs"),
        func.avg(Resultado.tiempo_global_cs).label("promedio_cs")
    )\
    .select_from(Resultado)\
    .join(Nadador, Resultado.nadador_id == Nadador.id)\
    .join(Prueba, Resultado.prueba_id == Prueba.id)\
    .filter(
        and_(
            Nadador.id == nadador_id,
            Nadador.equipo_id == equipo_id,
            Resultado.estado_validacion == 'valido'
        )
    )
    
    # Aplicar filtros temporales
    query = aplicar_filtros_temporales(query, fecha_desde, fecha_hasta)
    
    # Agrupar por estilo
    resultados = query.group_by(Prueba.estilo).all()
    
    # Calcular total para porcentajes
    total_pruebas = sum(r.pruebas_nadadas for r in resultados)
    
    # Formatear respuesta
    distribucion = []
    for r in resultados:
        # Usar distancia genérica para simplificar (se puede mejorar después)
        prueba_ref = f"{r.estilo} (varias distancias)"
        
        porcentaje = (r.pruebas_nadadas / total_pruebas * 100) if total_pruebas > 0 else 0
        
        distribucion.append({
            "estilo": r.estilo,
            "pruebas_nadadas": r.pruebas_nadadas,
            "mejor_tiempo": tiempo_cs_a_segundos(r.mejor_tiempo_cs),
            "mejor_tiempo_formateado": formatear_tiempo_cs(r.mejor_tiempo_cs),
            "prueba_mejor_tiempo": prueba_ref,
            "promedio": tiempo_cs_a_segundos(int(r.promedio_cs)),
            "promedio_formateado": formatear_tiempo_cs(int(r.promedio_cs)),
            "prueba_promedio": prueba_ref,
            "porcentaje": round(porcentaje, 1)
        })
    
    # Ordenar por número de pruebas nadadas (descendente)
    return sorted(distribucion, key=lambda x: x["pruebas_nadadas"], reverse=True)


def get_registros_recientes(
    db: Session, 
    nadador_id: int, 
    equipo_id: int,
    limite: int = 10,
    dias_limite: int = 90
) -> List[Dict[str, Any]]:
    """
    Obtiene los registros más recientes de un nadador.
    
    Args:
        db: Sesión de base de datos
        nadador_id: ID del nadador
        equipo_id: ID del equipo
        limite: Número máximo de registros
        dias_limite: Límite de días hacia atrás
        
    Returns:
        List[Dict]: Lista de registros recientes
    """
    fecha_limite = datetime.now().date() - timedelta(days=dias_limite)
    
    query = db.query(
        Resultado.id,
        Resultado.fecha_registro,
        Competencia.nombre.label("competencia"),
        Prueba.estilo,
        Prueba.distancia,
        Resultado.tiempo_global_cs
    )\
    .join(Nadador, Resultado.nadador_id == Nadador.id)\
    .join(Prueba, Resultado.prueba_id == Prueba.id)\
    .join(Competencia, Resultado.competencia_id == Competencia.id)\
    .filter(
        and_(
            Nadador.id == nadador_id,
            Nadador.equipo_id == equipo_id,
            Resultado.estado_validacion == 'valido',
            Resultado.fecha_registro >= fecha_limite
        )
    )\
    .order_by(Resultado.fecha_registro.desc())\
    .limit(limite)
    
    resultados = query.all()
    
    # Formatear respuesta
    registros = []
    for r in resultados:
        prueba_nombre = f"{r.distancia} {r.estilo}"
        registros.append({
            "id": r.id,
            "fecha": r.fecha_registro.isoformat(),
            "competencia": r.competencia,
            "prueba": prueba_nombre,
            "tiempo": tiempo_cs_a_segundos(r.tiempo_global_cs),
            "tiempo_formateado": formatear_tiempo_cs(r.tiempo_global_cs),
            "lugar": None,  # TODO: Implementar cuando tengamos datos de posiciones
            "puntaje": None  # TODO: Implementar cuando tengamos sistema de puntajes
        })
    
    return registros


def get_ranking_intra_equipo(
    db: Session, 
    nadador_id: int, 
    equipo_id: int,
    prueba_nombre: Optional[str] = None,
    curso: Optional[str] = None
) -> Dict[str, Any]:
    """
    Obtiene el ranking intra-equipo para un nadador.
    
    Args:
        db: Sesión de base de datos
        nadador_id: ID del nadador
        equipo_id: ID del equipo
        prueba_nombre: Prueba específica para ranking (ej: "100 Libre")
        curso: Curso específico (SC/LC)
        
    Returns:
        Dict: Datos completos del ranking
    """
    # Si no se especifica prueba, usar la más común del nadador
    if not prueba_nombre:
        prueba_query = db.query(
            Prueba.estilo,
            Prueba.distancia,
            func.count(Resultado.id).label("count")
        )\
        .join(Resultado, Prueba.id == Resultado.prueba_id)\
        .join(Nadador, Resultado.nadador_id == Nadador.id)\
        .filter(
            and_(
                Nadador.id == nadador_id,
                Nadador.equipo_id == equipo_id,
                Resultado.estado_validacion == 'valido'
            )
        )\
        .group_by(Prueba.estilo, Prueba.distancia)\
        .order_by(desc("count"))\
        .first()
        
        if prueba_query:
            prueba_nombre = f"{prueba_query.distancia} {prueba_query.estilo}"
        else:
            prueba_nombre = "100 Libre"  # Fallback
    
    # Parsear prueba_nombre para obtener distancia y estilo
    try:
        partes = prueba_nombre.split(" ", 1)
        distancia = int(partes[0])
        estilo = partes[1]
    except (ValueError, IndexError):
        distancia = 100
        estilo = "Libre"
    
    # Query para obtener mejores tiempos de cada nadador del equipo
    subquery = db.query(
        Nadador.id.label("nadador_id"),
        Nadador.nombre_completo,
        func.min(Resultado.tiempo_global_cs).label("mejor_tiempo_cs"),
        func.avg(Resultado.tiempo_global_cs).label("promedio_cs"),
        func.count(Resultado.id).label("total_participaciones")
    )\
    .join(Resultado, Nadador.id == Resultado.nadador_id)\
    .join(Prueba, Resultado.prueba_id == Prueba.id)\
    .filter(
        and_(
            Nadador.equipo_id == equipo_id,
            Prueba.distancia == distancia,
            Prueba.estilo == estilo,
            Resultado.estado_validacion == 'valido'
        )
    )
    
    if curso:
        subquery = subquery.filter(Prueba.curso == curso)
    
    ranking_data = subquery.group_by(
        Nadador.id, Nadador.nombre_completo
    ).order_by(
        func.min(Resultado.tiempo_global_cs).asc()
    ).all()
    
    # Crear ranking con posiciones
    ranking = []
    posicion_nadador_actual = None
    
    for i, r in enumerate(ranking_data, 1):
        if r.nadador_id == nadador_id:
            posicion_nadador_actual = i
            
        # Calcular tendencia (simplificado - diferencia últimos 3 vs anteriores)
        tendencia = 0.0  # TODO: Implementar cálculo real de tendencia
        
        ranking.append({
            "nadador_id": r.nadador_id,
            "nombre_completo": r.nombre_completo,
            "posicion_equipo": i,
            "posicion_categoria": i,  # TODO: Implementar por categoría
            "mejor_tiempo": tiempo_cs_a_segundos(r.mejor_tiempo_cs),
            "mejor_tiempo_formateado": formatear_tiempo_cs(r.mejor_tiempo_cs),
            "promedio_ultimos_3": tiempo_cs_a_segundos(int(r.promedio_cs)),
            "promedio_formateado": formatear_tiempo_cs(int(r.promedio_cs)),
            "tendencia": tendencia,
            "total_participaciones": r.total_participaciones,
            "ultima_competencia": "N/A",  # TODO: Implementar
            "categoria": "General"  # TODO: Implementar categorías
        })
    
    # Calcular estadísticas del equipo
    if ranking:
        tiempos = [r["mejor_tiempo"] for r in ranking]
        mejor_tiempo_equipo = min(tiempos)
        promedio_equipo = sum(tiempos) / len(tiempos)
        nadador_mas_participaciones = max(ranking, key=lambda x: x["total_participaciones"])
        
        estadisticas = {
            "total_participantes": len(ranking),
            "mejor_tiempo_equipo": mejor_tiempo_equipo,
            "mejor_tiempo_equipo_formateado": formatear_tiempo_cs(int(mejor_tiempo_equipo * 100)),
            "promedio_equipo": promedio_equipo,
            "promedio_equipo_formateado": formatear_tiempo_cs(int(promedio_equipo * 100)),
            "nadador_mas_participaciones": nadador_mas_participaciones["nombre_completo"]
        }
    else:
        estadisticas = {
            "total_participantes": 0,
            "mejor_tiempo_equipo": 0,
            "mejor_tiempo_equipo_formateado": "00:00.00",
            "promedio_equipo": 0,
            "promedio_equipo_formateado": "00:00.00",
            "nadador_mas_participaciones": "N/A"
        }
    
    return {
        "prueba_seleccionada": prueba_nombre,
        "curso_seleccionado": curso or "Todos",
        "categoria_filtro": "Todas",
        "rama_filtro": "Todas",  # TODO: Implementar filtro por rama
        "ranking": ranking,
        "posicion_nadador_actual": posicion_nadador_actual,
        "estadisticas": estadisticas
    }


def get_estadisticas_generales(
    db: Session, 
    nadador_id: int, 
    equipo_id: int
) -> Dict[str, Any]:
    """
    Obtiene estadísticas generales de un nadador.
    
    Args:
        db: Sesión de base de datos
        nadador_id: ID del nadador
        equipo_id: ID del equipo
        
    Returns:
        Dict: Estadísticas generales
    """
    # Contar competencias únicas
    total_competencias = db.query(func.count(distinct(Resultado.competencia_id)))\
        .join(Nadador, Resultado.nadador_id == Nadador.id)\
        .filter(
            and_(
                Nadador.id == nadador_id,
                Nadador.equipo_id == equipo_id,
                Resultado.estado_validacion == 'valido'
            )
        ).scalar() or 0
    
    # Contar pruebas totales
    total_pruebas = db.query(func.count(Resultado.id))\
        .join(Nadador, Resultado.nadador_id == Nadador.id)\
        .filter(
            and_(
                Nadador.id == nadador_id,
                Nadador.equipo_id == equipo_id,
                Resultado.estado_validacion == 'valido'
            )
        ).scalar() or 0
    
    # Eventos del último mes
    fecha_limite = datetime.now().date() - timedelta(days=30)
    eventos_ultimo_mes = db.query(func.count(Resultado.id))\
        .join(Nadador, Resultado.nadador_id == Nadador.id)\
        .filter(
            and_(
                Nadador.id == nadador_id,
                Nadador.equipo_id == equipo_id,
                Resultado.estado_validacion == 'valido',
                Resultado.fecha_registro >= fecha_limite
            )
        ).scalar() or 0
    
    return {
        "total_competencias": total_competencias,
        "total_pruebas": total_pruebas,
        "mejor_lugar_promedio": 3.5,  # TODO: Implementar cuando tengamos datos de posiciones
        "eventos_ultimo_mes": eventos_ultimo_mes
    }
