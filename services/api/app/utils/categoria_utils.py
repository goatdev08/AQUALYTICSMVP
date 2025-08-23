"""
Utilidades para cálculo y optimización de categorías de nadadores.

Funciones optimizadas para consultas de base de datos relacionadas con categorías.
"""

from datetime import date, datetime
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy import and_, or_
from sqlmodel import select

from ..models.nadador import Nadador


def calcular_rango_fechas_categoria(categoria: str, fecha_referencia: Optional[date] = None) -> Tuple[Optional[date], Optional[date]]:
    """
    Calcula el rango de fechas de nacimiento para una categoría específica.
    
    Optimización: En lugar de calcular categorías dinámicamente, filtramos por
    rangos de fecha de nacimiento que son más eficientes para la base de datos.
    
    Args:
        categoria: Código de categoría ('11-12', '13-14', '15-16', '17+')
        fecha_referencia: Fecha de referencia para cálculo (default: hoy)
    
    Returns:
        Tuple[fecha_minima, fecha_maxima]: Rango de fechas de nacimiento.
        None en fecha_maxima significa "sin límite superior"
    """
    if fecha_referencia is None:
        fecha_referencia = date.today()
    
    año_referencia = fecha_referencia.year
    
    if categoria == "11-12":
        # Nadadores de 11-12 años: nacidos entre hace 12 años y hace 11 años
        fecha_minima = date(año_referencia - 12, 1, 1)
        fecha_maxima = date(año_referencia - 11, 12, 31)
        return fecha_minima, fecha_maxima
        
    elif categoria == "13-14":
        # Nadadores de 13-14 años: nacidos entre hace 14 años y hace 13 años
        fecha_minima = date(año_referencia - 14, 1, 1)
        fecha_maxima = date(año_referencia - 13, 12, 31)
        return fecha_minima, fecha_maxima
        
    elif categoria == "15-16":
        # Nadadores de 15-16 años: nacidos entre hace 16 años y hace 15 años
        fecha_minima = date(año_referencia - 16, 1, 1)
        fecha_maxima = date(año_referencia - 15, 12, 31)
        return fecha_minima, fecha_maxima
        
    elif categoria == "17+":
        # Nadadores de 17+ años: nacidos antes de hace 17 años
        fecha_maxima = date(año_referencia - 17, 12, 31)
        return None, fecha_maxima
    
    # Categoría no válida
    return None, None


def aplicar_filtro_categoria_optimizado(query, categoria: str, fecha_referencia: Optional[date] = None):
    """
    Aplica filtro de categoría a una query SQLModel de forma optimizada.
    
    Utiliza rangos de fecha de nacimiento en lugar de cálculos dinámicos de edad,
    lo que es mucho más eficiente para la base de datos.
    
    Args:
        query: Query de SQLModel/SQLAlchemy
        categoria: Código de categoría
        fecha_referencia: Fecha de referencia para cálculo
    
    Returns:
        Query modificada con filtro aplicado
    """
    fecha_min, fecha_max = calcular_rango_fechas_categoria(categoria, fecha_referencia)
    
    if fecha_min is None and fecha_max is None:
        # Categoría inválida, no aplicar filtro
        return query
    
    if fecha_min is not None and fecha_max is not None:
        # Rango entre dos fechas (11-12, 13-14, 15-16)
        return query.filter(
            and_(
                Nadador.fecha_nacimiento >= fecha_min,
                Nadador.fecha_nacimiento <= fecha_max
            )
        )
    elif fecha_max is not None:
        # Solo fecha máxima (17+)
        return query.filter(Nadador.fecha_nacimiento <= fecha_max)
    elif fecha_min is not None:
        # Solo fecha mínima (caso teórico)
        return query.filter(Nadador.fecha_nacimiento >= fecha_min)
    
    return query


def calcular_categoria_por_edad(edad: int) -> str:
    """
    Determina la categoría según la edad calculada.
    
    Args:
        edad: Edad en años
    
    Returns:
        Código de categoría
    """
    if edad <= 12:
        return "11-12"
    elif edad <= 14:
        return "13-14"
    elif edad <= 16:
        return "15-16"
    else:
        return "17+"


def calcular_categoria_en_fecha(fecha_nacimiento: date, fecha_competencia: date) -> str:
    """
    Calcula la categoría de un nadador en una fecha específica.
    
    Args:
        fecha_nacimiento: Fecha de nacimiento del nadador
        fecha_competencia: Fecha de la competencia
    
    Returns:
        Código de categoría
    """
    edad = fecha_competencia.year - fecha_nacimiento.year - (
        (fecha_competencia.month, fecha_competencia.day) < 
        (fecha_nacimiento.month, fecha_nacimiento.day)
    )
    
    return calcular_categoria_por_edad(edad)


def obtener_estadisticas_categorias(nadadores: List[Nadador]) -> Dict[str, Any]:
    """
    Genera estadísticas de distribución de categorías.
    
    Args:
        nadadores: Lista de nadadores
    
    Returns:
        Diccionario con estadísticas
    """
    if not nadadores:
        return {
            "total": 0,
            "por_categoria": {},
            "categoria_mas_numerosa": None,
            "categoria_menos_numerosa": None,
            "promedio_edad": 0.0
        }
    
    # Contar por categoría
    contador_categorias = {}
    edades = []
    
    for nadador in nadadores:
        categoria = nadador.categoria_actual
        contador_categorias[categoria] = contador_categorias.get(categoria, 0) + 1
        edades.append(nadador.edad_actual)
    
    # Encontrar categorías con más y menos nadadores
    if contador_categorias:
        categoria_mas_numerosa = max(contador_categorias.items(), key=lambda x: x[1])
        categoria_menos_numerosa = min(contador_categorias.items(), key=lambda x: x[1])
    else:
        categoria_mas_numerosa = None
        categoria_menos_numerosa = None
    
    return {
        "total": len(nadadores),
        "por_categoria": contador_categorias,
        "categoria_mas_numerosa": categoria_mas_numerosa,
        "categoria_menos_numerosa": categoria_menos_numerosa,
        "promedio_edad": sum(edades) / len(edades) if edades else 0.0
    }


# Constantes útiles
CATEGORIAS_VALIDAS = ["11-12", "13-14", "15-16", "17+"]

NOMBRES_CATEGORIAS = {
    "11-12": "Infantil A (11-12 años)",
    "13-14": "Infantil B (13-14 años)",
    "15-16": "Juvenil (15-16 años)",
    "17+": "Mayor (17+ años)"
}


def validar_categoria(categoria: str) -> bool:
    """Valida si una categoría es válida."""
    return categoria in CATEGORIAS_VALIDAS


def obtener_nombre_categoria(categoria: str) -> str:
    """Obtiene el nombre descriptivo de una categoría."""
    return NOMBRES_CATEGORIAS.get(categoria, categoria)
