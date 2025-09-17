### Mapa del Backend y Hallazgos (Tarea 8.7)

Este documento resume el mapeo del backend (DB, endpoints, servicios) y las mejoras aplicadas en la tarea 8.7, junto con recomendaciones operativas de bajo riesgo y alto valor.

### Resumen ejecutivo
- **Normalización temporal**: métrica/orden cronológico unificados en `fecha_registro` (compatibilidad: `created_at` mapea a `fecha_registro` en listados).
- **Índices nuevos creados** en `public.resultado` para acelerar actividad reciente y vistas por nadador:
  - `idx_resultado_estado_fecha_desc (estado_validacion, fecha_registro DESC)`
  - `idx_resultado_nadador_estado_fecha_desc (nadador_id, estado_validacion, fecha_registro DESC)`
  - `idx_resultado_fecha_valido_desc (fecha_registro DESC) WHERE estado_validacion='valido'` (parcial)
- **Performance actual**: tiempos muy bajos en dataset de desarrollo; índices listos para escalar.

### Base de datos (schema public)
- **Tablas**: `equipo`, `usuario`, `nadador`, `competencia`, `prueba`, `resultado`, `segmento`.
- **Vistas**: `resultado_agregado` (usada para métricas agregadas de resultados).

### Índices por tabla (relevantes)
- **competencia**: `competencia_pkey`, `idx_competencia_equipo_id`, `idx_competencia_rango_fechas_gist`, `idx_competencia_nombre_trgm`, `idx_competencia_curso`.
- **equipo**: `equipo_pkey`, `equipo_nombre_key`.
- **nadador**: `nadador_pkey`, `idx_nadador_equipo_id`, `idx_nadador_nombre_completo_gin`, `idx_nadador_rama`.
- **prueba**: `prueba_pkey`, `prueba_estilo_distancia_curso_key`, `idx_prueba_estilo`, `idx_prueba_distancia`, `idx_prueba_curso`.
- **resultado**: `resultado_pkey`, `resultado_nadador_id_competencia_id_prueba_id_fase_fecha_re_key`, `idx_resultado_capturado_por`, `idx_resultado_competencia_fecha`, `idx_resultado_prueba_tiempo`, `idx_resultado_nadador_prueba_tiempo`, `idx_resultado_estado_validacion`, `idx_resultado_fecha_registro`, y los **nuevos** tres índices listados arriba.
- **segmento**: `segmento_pkey`, `idx_segmento_resultado_indice`, `idx_segmento_resultado_estilo`.

### Endpoints FastAPI (rutas principales)
- `dashboard.py` ([archivo](mdc:services/api/app/api/v1/endpoints/dashboard.py))
  - `/dashboard/resumen`, `/dashboard/top5`, `/dashboard/distribucion-estilos`, `/dashboard/proximas-competencias`, `/dashboard/atletas-destacados`, `/dashboard/actividad-reciente`.
- `resultados.py` ([archivo](mdc:services/api/app/api/v1/endpoints/resultados.py))
  - `POST /resultados`, `GET /resultados/{id}`, `PATCH /resultados/{id}/revisar`, `GET /resultados`.
- `competencias.py`: CRUD + `/proximas` + `/search/typeahead`.
- `analitica.py`: `/promedio-equipo`, `/comparar`, `/nadador/{id}/resumen`.
- `nadadores.py`: CRUD + auxiliares.
- `catalogos.py`, `auth.py`: servicios de soporte.

### Servicios / Utils / Middleware
- `services/analitica_queries.py` (consultas compuestas optimizadas con `fecha_registro`).
- `utils/categoria_utils.py`, `utils/jwt.py`.
- `middleware/security.py` (logging de requests y seguridad).

### Normalización temporal aplicada (PRDv2)
- Todas las métricas y ordenamientos cronológicos usan **`fecha_registro`**.
- En `resultados.py` (listado), `sort_by=created_at` se **mapea a `r.fecha_registro`** para compatibilidad sin romper llamadas existentes.
- Endpoints de dashboard y analítica filtran por `estado_validacion='valido'` cuando corresponde y ordenan por `fecha_registro DESC`.

### Validación de performance (EXPLAIN ANALYZE)
- Actividad reciente (filtro `valido` + `ORDER BY fecha_registro DESC` + `LIMIT 10`): ~3.7ms.
- Top 5 (`ORDER BY tiempo_global_cs ASC` + `LIMIT 5`): ~0.22ms.
- Atletas destacados (COUNT DISTINCT últimos 30 días `valido`): ~0.17ms.
- Nota: Por el tamaño pequeño actual, el planner usa seq scans ligeros; a medida que crezca el volumen, utilizará los índices compuestos y el parcial creados.
- Referencia general: [analytics_performance_report.md](mdc:services/api/analytics_performance_report.md).

### Mejoras de alto valor y bajo riesgo
- **Documentación**: Añadir al README backend la política de índices y consultas canónicas (filtros y `ORDER BY`) con ejemplos de EXPLAIN.
- **Helper de formato de tiempos**: centralizar `mm:ss.cc` para evitar duplicación en varios endpoints.
- **Limpieza automática**: ejecutar `ruff --fix` para eliminar imports no usados en endpoints.
- **Operativa**: tras cargas masivas, ejecutar `ANALYZE` y revisar planes de `/dashboard/actividad-reciente`, `/dashboard/top5` y series por nadador.

### Cambios aplicados (ubicaciones)
- Índices creados en `public.resultado` (vía MCP Supabase).
- Normalización de orden temporal en `resultados.py` (mapeo de `created_at` → `fecha_registro`).

### Próximos pasos sugeridos (QA)
- Configurar infraestructura de testing (Playwright E2E en frontend; `pytest-asyncio` + `httpx` en backend).
- Crear matriz de criterios de aceptación y reporte de cobertura.


