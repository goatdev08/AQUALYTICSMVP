# 📊 Analytics API Documentation

## Resumen General

La API de Analytics de AquaLytics proporciona endpoints especializados para el análisis de rendimiento de nadadores y equipos. Todos los endpoints requieren autenticación y aplican filtros de equipo automáticamente.

## 🔐 Autenticación

Todos los endpoints requieren autenticación mediante Bearer Token:

```http
Authorization: Bearer <supabase_access_token>
```

## 📋 Endpoints Disponibles

### 1. Analytics de Nadador Individual

**Endpoint:** `GET /api/v1/analitica/nadador/{nadador_id}/resumen`

**Descripción:** Obtiene analytics completos para un nadador específico, incluyendo mejores marcas, evolución temporal, distribución por estilos, registros recientes, ranking intra-equipo y estadísticas generales.

#### Parámetros

- **Path Parameter:**
  - `nadador_id` (int): ID del nadador a consultar

- **Query Parameters (opcionales):**
  - `fecha_desde` (date): Fecha inicio para análisis histórico (YYYY-MM-DD)
  - `fecha_hasta` (date): Fecha fin para análisis histórico (YYYY-MM-DD)
  - `prueba_ranking` (string): Prueba específica para calcular ranking
  - `curso_ranking` (string): Curso para ranking ("SC" o "LC")
  - `limite_registros_recientes` (int): Límite de registros recientes (1-50, default: 10)
  - `limite_evolucion` (int): Límite de puntos en evolución temporal (1-100, default: 20)

#### Ejemplo de Solicitud

```http
GET /api/v1/analitica/nadador/9/resumen?fecha_desde=2024-01-01&limite_registros_recientes=5
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

#### Ejemplo de Respuesta (200 OK)

```json
{
  "nadador_id": 9,
  "nombre_completo": "Abraham Cabrera Gonzalez",
  "mejores_marcas": [
    {
      "prueba": "50 Mariposa",
      "curso": "SC",
      "tiempo": 27.45,
      "tiempo_formateado": "00:27.45",
      "fecha": "2025-05-20",
      "competencia": "Estatal de Verano 2025",
      "lugar": "Centro Acuático Olímpico"
    }
  ],
  "evolucion_temporal": [
    {
      "fecha": "2025-05-20",
      "prueba": "50 Mariposa SC",
      "tiempo": 27.45,
      "tiempo_formateado": "00:27.45",
      "competencia": "Estatal de Verano 2025"
    }
  ],
  "distribucion_estilos": [
    {
      "estilo": "Mariposa",
      "pruebas_nadadas": 1,
      "mejor_tiempo": 27.45,
      "mejor_tiempo_formateado": "00:27.45",
      "prueba_mejor_tiempo": "Prueba general",
      "promedio": 27.45,
      "promedio_formateado": "00:27.45",
      "prueba_promedio": "Prueba general",
      "porcentaje": 100.0
    }
  ],
  "registros_recientes": [
    {
      "id": 9,
      "fecha": "2025-05-20",
      "competencia": "Estatal de Verano 2025",
      "prueba": "50 Mariposa SC",
      "tiempo": 27.45,
      "tiempo_formateado": "00:27.45",
      "lugar": 1,
      "puntaje": null
    }
  ],
  "ranking_intra_equipo": {
    "prueba_seleccionada": "50 Mariposa",
    "curso_seleccionado": "SC",
    "categoria_filtro": null,
    "rama_filtro": null,
    "ranking": [
      {
        "nadador_id": 9,
        "nombre_completo": "Abraham Cabrera Gonzalez",
        "posicion_equipo": 1,
        "posicion_categoria": 1,
        "mejor_tiempo": 27.45,
        "mejor_tiempo_formateado": "00:27.45",
        "promedio_ultimos_3": 27.45,
        "promedio_formateado": "00:27.45",
        "tendencia": 0.0,
        "total_participaciones": 1,
        "ultima_competencia": "Estatal de Verano 2025",
        "categoria": "Juvenil A"
      }
    ],
    "posicion_nadador_actual": 1,
    "estadisticas": {
      "total_participantes": 1,
      "mejor_tiempo_equipo": 27.45,
      "mejor_tiempo_equipo_formateado": "00:27.45",
      "promedio_equipo": 27.45,
      "promedio_equipo_formateado": "00:27.45",
      "nadador_mas_participaciones": "Abraham Cabrera Gonzalez"
    }
  },
  "estadisticas_generales": {
    "total_competencias": 1,
    "total_pruebas": 1,
    "mejor_lugar_promedio": 1.0,
    "eventos_ultimo_mes": 1
  }
}
```

#### Códigos de Error

- **401 Unauthorized:** Token de autenticación inválido o ausente
- **403 Forbidden:** El nadador no pertenece al equipo del usuario
- **404 Not Found:** Nadador no encontrado
- **422 Unprocessable Entity:** Parámetros de query inválidos

### 2. Promedio de Equipo por Segmentos

**Endpoint:** `GET /api/v1/analitica/promedio-equipo`

**Descripción:** Calcula promedios de tiempo, brazadas, flecha y distancia sin flecha por segmento para todo el equipo, con filtros opcionales.

#### Query Parameters (opcionales)

- `prueba_id` (int): ID específico de prueba
- `estilo` (string): Filtrar por estilo ("Libre", "Espalda", "Pecho", "Mariposa", "Combinado")
- `distancia` (int): Filtrar por distancia en metros
- `curso` (string): Filtrar por curso ("SC", "LC")
- `nadador_id` (int): ID específico de nadador
- `rama` (string): Filtrar por rama ("F", "M")
- `fecha_desde` (date): Fecha inicio del rango
- `fecha_hasta` (date): Fecha fin del rango
- `competencia_id` (int): ID específico de competencia

#### Ejemplo de Solicitud

```http
GET /api/v1/analitica/promedio-equipo?estilo=Libre&distancia=100&curso=SC
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

#### Ejemplo de Respuesta (200 OK)

```json
{
  "segmentos_promedio": [
    {
      "indice": 1,
      "tiempo_promedio": "00:28.50",
      "tiempo_promedio_cs": 2850,
      "brazadas_promedio": 15.5,
      "flecha_promedio_m": 12.3,
      "dist_sin_flecha_promedio_m": 12.7,
      "registros_en_promedio": 25,
      "prueba": {
        "estilo": "Libre",
        "distancia": 100,
        "curso": "SC"
      }
    }
  ],
  "metadatos": {
    "filtros_aplicados": {
      "estilo": "Libre",
      "distancia": 100,
      "curso": "SC"
    },
    "total_segmentos": 4,
    "total_registros_analizados": 100,
    "equipo_id": 1
  }
}
```

### 3. Comparación entre Resultados

**Endpoint:** `GET /api/v1/analitica/comparar`

**Descripción:** Compara dos resultados del mismo nadador y prueba, mostrando diferencias por segmento y globales.

#### Query Parameters

- `resultado1_id` (int, requerido): ID del primer resultado
- `resultado2_id` (int, requerido): ID del segundo resultado

#### Ejemplo de Solicitud

```http
GET /api/v1/analitica/comparar?resultado1_id=15&resultado2_id=23
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

## 🔍 Modelos de Datos

### NadadorAnalytics

Modelo principal para analytics de nadador individual.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nadador_id` | int | ID del nadador |
| `nombre_completo` | string | Nombre completo del nadador |
| `mejores_marcas` | MejorMarca[] | Mejores marcas personales |
| `evolucion_temporal` | EvolucionTiempo[] | Evolución temporal de tiempos |
| `distribucion_estilos` | DistribucionEstilo[] | Distribución por estilos |
| `registros_recientes` | RegistroReciente[] | Registros más recientes |
| `ranking_intra_equipo` | RankingData | Ranking dentro del equipo |
| `estadisticas_generales` | EstadisticasGenerales | Estadísticas generales |

### MejorMarca

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `prueba` | string | Nombre de la prueba |
| `curso` | string | Curso de la prueba ("SC"/"LC") |
| `tiempo` | float | Tiempo en segundos |
| `tiempo_formateado` | string | Tiempo formateado (MM:SS.CC) |
| `fecha` | string | Fecha del registro |
| `competencia` | string | Nombre de la competencia |
| `lugar` | string | Lugar de la competencia |

### EstadisticasGenerales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `total_competencias` | int | Total de competencias participadas |
| `total_pruebas` | int | Total de pruebas nadadas |
| `mejor_lugar_promedio` | float | Promedio de lugares obtenidos |
| `eventos_ultimo_mes` | int | Eventos participados en el último mes |

## 🚨 Manejo de Errores

### Errores Comunes

#### 401 Unauthorized
```json
{
  "detail": {
    "error": "invalid_token",
    "message": "Token decode error",
    "detail": "Token has expired"
  }
}
```

#### 403 Forbidden
```json
{
  "detail": "El nadador no pertenece a tu equipo"
}
```

#### 404 Not Found
```json
{
  "detail": "Nadador no encontrado"
}
```

#### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["query", "fecha_hasta"],
      "msg": "fecha_hasta debe ser posterior a fecha_desde",
      "type": "value_error"
    }
  ]
}
```

## ⚡ Optimizaciones y Rendimiento

### Cacheo
- Los resultados de analytics se pueden cachear por 5-10 minutos
- Usar `staleTime` en React Query para optimizar requests

### Filtros Recomendados
- Usar filtros de fecha para limitar el dataset en análisis históricos
- Aplicar filtros de prueba específica para mejor rendimiento
- Limitar registros recientes a 10-20 para UX óptima

### Límites de Rate
- 100 requests por minuto por usuario
- Timeout de 30 segundos por request

## 🧪 Testing

### Casos de Prueba Recomendados

1. **Nadador sin datos:**
   - Verificar respuesta vacía pero válida
   - Confirmar estructura de respuesta

2. **Nadador con datos limitados:**
   - Verificar cálculos con pocos registros
   - Confirmar rankings con un solo participante

3. **Filtros de fecha:**
   - Probar rangos válidos e inválidos
   - Verificar comportamiento con fechas futuras

4. **Autorización:**
   - Probar acceso entre equipos
   - Verificar tokens expirados

### Herramientas de Testing

- **Swagger UI:** Disponible en `/docs` para testing interactivo
- **Postman Collection:** Exportar desde Swagger para automatización
- **Pytest:** Tests unitarios en `tests/test_analitica.py`

## 📈 Métricas y Monitoreo

### Métricas Clave
- Latencia promedio por endpoint (objetivo: <500ms)
- Rate de errores (objetivo: <1%)
- Uso de memoria durante cálculos complejos

### Logs Importantes
- Consultas SQL lentas (>1 segundo)
- Errores de autorización
- Requests con datasets muy grandes

## 🔄 Versionado

**Versión Actual:** v1

### Cambios Futuros Planeados
- Agregación de métricas de consistencia (coeficiente de variación)
- Comparaciones multi-nadador
- Analytics de competencias específicas
- Exportación de datos en CSV/Excel

---

**Nota:** Esta documentación se actualiza con cada release. Para la versión más reciente, consultar `/docs` en el servidor de desarrollo o producción.
