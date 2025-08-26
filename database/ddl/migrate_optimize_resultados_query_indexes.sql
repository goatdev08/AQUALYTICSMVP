-- =======================================================================
-- Optimización de índices compuestos para queries de resultados
-- =======================================================================
--
-- Análisis de patrones de query del endpoint GET /resultados:
-- 1. Filtro por equipo (siempre presente a través de nadador)
-- 2. Filtros comunes: nadador_id, competencia_id, prueba_id, fecha_registro, estado_validacion, fase
-- 3. Joins frecuentes: resultado -> nadador, competencia, prueba
-- 4. Ordenamiento: fecha_registro (default), tiempo_global_cs, nombre_completo
-- 5. Paginación: LIMIT/OFFSET
--
-- Índices existentes analizados:
-- ✅ idx_resultado_nadador_prueba_tiempo (nadador_id, prueba_id, tiempo_global_cs)
-- ✅ idx_resultado_competencia_fecha (competencia_id, fecha_registro)  
-- ✅ idx_resultado_estado_validacion (estado_validacion)
-- ✅ idx_resultado_fecha_registro (fecha_registro)
--

BEGIN;

-- =======================================================================
-- ÍNDICE 1: Filtros combinados más frecuentes
-- =======================================================================
-- Optimiza queries que combinan nadador + rango de fechas + estado
-- Patrón: WHERE nadador_id = X AND fecha_registro BETWEEN A AND B AND estado_validacion = Y
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resultado_nadador_fecha_estado 
ON resultado (nadador_id, fecha_registro DESC, estado_validacion)
INCLUDE (tiempo_global_cs, fase, competencia_id, prueba_id);

-- =======================================================================  
-- ÍNDICE 2: Filtros por competencia + fase con ordenamiento
-- =======================================================================
-- Optimiza queries específicas de competencias con fases
-- Patrón: WHERE competencia_id = X AND fase = Y ORDER BY tiempo_global_cs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resultado_competencia_fase_tiempo
ON resultado (competencia_id, fase, tiempo_global_cs ASC)
INCLUDE (nadador_id, fecha_registro, estado_validacion);

-- =======================================================================
-- ÍNDICE 3: Filtros temporales con estado y ordenamiento
-- =======================================================================  
-- Optimiza queries de listados por fecha con filtro de estado
-- Patrón: WHERE fecha_registro >= X AND estado_validacion = Y ORDER BY fecha_registro DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resultado_fecha_estado_desc
ON resultado (fecha_registro DESC, estado_validacion)
INCLUDE (nadador_id, competencia_id, prueba_id, tiempo_global_cs);

-- =======================================================================
-- ÍNDICE 4: Filtros por prueba + estado para rankings
-- =======================================================================
-- Optimiza queries de mejores tiempos por prueba
-- Patrón: WHERE prueba_id = X AND estado_validacion = 'valido' ORDER BY tiempo_global_cs ASC  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resultado_prueba_estado_tiempo
ON resultado (prueba_id, estado_validacion, tiempo_global_cs ASC)
INCLUDE (nadador_id, competencia_id, fecha_registro, categoria_label);

-- =======================================================================
-- ÍNDICE 5: Soporte para paginación eficiente con filtros complejos
-- =======================================================================
-- Índice para queries con múltiples filtros y paginación
-- Cubre el patrón más común del endpoint: equipo -> nadador + filtros + ordenamiento
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resultado_multi_filter_pagination
ON resultado (fecha_registro DESC, estado_validacion, competencia_id)
INCLUDE (id, nadador_id, prueba_id, tiempo_global_cs, fase, categoria_label);

-- =======================================================================
-- ESTADÍSTICAS Y MANTENIMIENTO
-- =======================================================================

-- Actualizar estadísticas de la tabla para el query planner
ANALYZE resultado;

-- Crear comentarios descriptivos para documentación
COMMENT ON INDEX idx_resultado_nadador_fecha_estado IS 
'Optimiza filtros combinados: nadador + rango fechas + estado validación';

COMMENT ON INDEX idx_resultado_competencia_fase_tiempo IS 
'Optimiza consultas específicas por competencia y fase con ordenamiento por tiempo';

COMMENT ON INDEX idx_resultado_fecha_estado_desc IS 
'Optimiza listados cronológicos con filtro de estado de validación';

COMMENT ON INDEX idx_resultado_prueba_estado_tiempo IS 
'Optimiza rankings y mejores tiempos por prueba con estado válido';

COMMENT ON INDEX idx_resultado_multi_filter_pagination IS 
'Soporte para paginación eficiente con filtros complejos del endpoint principal';

COMMIT;

-- =======================================================================
-- VERIFICACIÓN Y REPORTE
-- =======================================================================

-- Mostrar resumen de índices creados
SELECT 
    schemaname,
    tablename, 
    indexname,
    CASE 
        WHEN indexname LIKE 'idx_resultado_nadador_fecha_estado%' THEN '✅ Nuevo: Filtros nadador+fecha+estado'
        WHEN indexname LIKE 'idx_resultado_competencia_fase_tiempo%' THEN '✅ Nuevo: Competencia+fase+tiempo'  
        WHEN indexname LIKE 'idx_resultado_fecha_estado_desc%' THEN '✅ Nuevo: Fecha+estado con order DESC'
        WHEN indexname LIKE 'idx_resultado_prueba_estado_tiempo%' THEN '✅ Nuevo: Prueba+estado+tiempo para rankings'
        WHEN indexname LIKE 'idx_resultado_multi_filter_pagination%' THEN '✅ Nuevo: Multi-filtros para paginación'
        ELSE '📋 Existente'
    END as status,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_indexes pi
JOIN pg_class pc ON pc.relname = pi.indexname  
WHERE tablename = 'resultado'
ORDER BY indexname;
