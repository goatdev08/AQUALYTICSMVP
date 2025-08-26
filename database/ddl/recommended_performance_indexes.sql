-- =============================================================================
-- ÍNDICES DE RENDIMIENTO RECOMENDADOS - ANALYTICS BACKEND
-- Tarea 5.3: Implement Database Schema Changes
-- Fecha: 2025-08-26
-- Autor: AI Assistant
-- =============================================================================

-- NOTA: Estos índices fueron identificados durante el profiling de rendimiento
-- (Subtareas 5.1 y 5.2) como optimizaciones futuras para cuando el dataset crezca.
-- Actualmente NO son necesarios debido al excelente rendimiento ya logrado.

-- =============================================================================
-- 1. ÍNDICE OPTIMIZADO PARA SEGMENTOS (FUTURO)
-- =============================================================================

-- Índice compuesto para optimizar consultas de promedios por equipo
-- BENEFICIO: Evita heap lookups en agregaciones de segmentos
-- CUÁNDO APLICAR: Cuando tabla 'segmento' supere 10,000 registros
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_segmento_optimized_promedio
ON segmento (indice, tiempo_cs, brazadas, flecha_m, dist_sin_flecha_m)
INCLUDE (resultado_id);

COMMENT ON INDEX idx_segmento_optimized_promedio IS 
'Índice optimizado para consultas de promedios de equipo por segmento. 
Incluye campos de agregación y resultado_id como INCLUDE para evitar heap lookups.
APLICAR CUANDO: tabla segmento > 10K registros.';

-- =============================================================================
-- 2. ÍNDICE PARCIAL PARA RESULTADOS VÁLIDOS (FUTURO)
-- =============================================================================

-- Índice parcial para consultas de resultados válidos por nadador y equipo
-- BENEFICIO: Reduce tamaño del índice filtrando solo registros válidos
-- CUÁNDO APLICAR: Cuando tabla 'resultado' supere 5,000 registros
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resultado_nadador_equipo_optimized  
ON resultado (nadador_id, prueba_id, estado_validacion, fecha_registro)
WHERE estado_validacion = 'valido';

COMMENT ON INDEX idx_resultado_nadador_equipo_optimized IS 
'Índice parcial optimizado para consultas de resultados válidos por nadador y equipo. 
Incluye filtro WHERE para reducir tamaño del índice.
APLICAR CUANDO: tabla resultado > 5K registros.';

-- =============================================================================
-- 3. ÍNDICE PARA EVOLUCIÓN TEMPORAL (FUTURO)
-- =============================================================================

-- Índice optimizado para consultas de evolución temporal por nadador
-- BENEFICIO: Mejora ORDER BY fecha_registro DESC en consultas de evolución
-- CUÁNDO APLICAR: Cuando las consultas de evolución superen 100ms
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resultado_temporal_evolution
ON resultado (nadador_id, fecha_registro DESC, tiempo_global_cs)
WHERE estado_validacion = 'valido';

COMMENT ON INDEX idx_resultado_temporal_evolution IS 
'Índice optimizado para consultas de evolución temporal por nadador.
Soporta ORDER BY fecha_registro DESC eficientemente.
APLICAR CUANDO: consultas de evolución > 100ms.';

-- =============================================================================
-- 4. VISTA MATERIALIZADA PARA ESTADÍSTICAS DE EQUIPO (FUTURO)
-- =============================================================================

-- Vista materializada para estadísticas frecuentemente consultadas
-- BENEFICIO: Pre-calcula agregaciones costosas, actualización programada
-- CUÁNDO APLICAR: Cuando el endpoint de promedios supere 1000ms consistentemente

-- NOTA: Esta vista requiere un job de actualización programada (ej: cada 6 horas)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_estadisticas_equipo AS
SELECT 
    n.equipo_id,
    p.estilo,
    p.distancia,
    p.curso,
    s.indice,
    AVG(s.tiempo_cs) as tiempo_promedio_cs,
    AVG(s.brazadas) as brazadas_promedio,
    AVG(s.flecha_m) as flecha_promedio_m,
    AVG(s.dist_sin_flecha_m) as dist_sin_flecha_promedio_m,
    COUNT(s.id) as total_registros,
    MAX(r.fecha_registro) as ultima_actualizacion
FROM segmento s
JOIN resultado r ON s.resultado_id = r.id
JOIN nadador n ON r.nadador_id = n.id
JOIN prueba p ON r.prueba_id = p.id
WHERE r.estado_validacion = 'valido'
GROUP BY n.equipo_id, p.estilo, p.distancia, p.curso, s.indice;

-- Índice único para la vista materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_estadisticas_equipo_unique
ON mv_estadisticas_equipo (equipo_id, estilo, distancia, curso, indice);

COMMENT ON MATERIALIZED VIEW mv_estadisticas_equipo IS 
'Vista materializada para estadísticas de equipo pre-calculadas.
BENEFICIO: Reduce latencia de consultas de promedios a <50ms.
APLICAR CUANDO: endpoint promedios > 1000ms consistentemente.
ACTUALIZACIÓN: Programar REFRESH cada 6 horas.';

-- =============================================================================
-- 5. SCRIPT DE MANTENIMIENTO PARA VISTA MATERIALIZADA
-- =============================================================================

-- Función para actualizar la vista materializada
CREATE OR REPLACE FUNCTION refresh_estadisticas_equipo()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_estadisticas_equipo;
    
    -- Log de actualización
    INSERT INTO sistema_logs (evento, descripcion, fecha_hora)
    VALUES ('mv_refresh', 'Vista materializada mv_estadisticas_equipo actualizada', NOW());
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log de error
        INSERT INTO sistema_logs (evento, descripcion, fecha_hora)
        VALUES ('mv_refresh_error', 'Error actualizando mv_estadisticas_equipo: ' || SQLERRM, NOW());
        RAISE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_estadisticas_equipo() IS 
'Función para actualizar la vista materializada de estadísticas de equipo.
Incluye logging de éxito/error.
PROGRAMAR: Ejecutar cada 6 horas via cron o pg_cron.';

-- =============================================================================
-- 6. ÍNDICES DE MONITOREO (OPCIONAL)
-- =============================================================================

-- Índice para monitorear performance de queries
-- BENEFICIO: Facilita análisis de queries lentas por equipo
CREATE INDEX IF NOT EXISTS idx_resultado_performance_monitoring
ON resultado (equipo_id, fecha_registro, tiempo_global_cs)
WHERE estado_validacion = 'valido';

COMMENT ON INDEX idx_resultado_performance_monitoring IS 
'Índice para facilitar análisis de rendimiento y queries de monitoreo.
OPCIONAL: Solo si se implementa sistema de monitoreo avanzado.';

-- =============================================================================
-- 7. RESUMEN DE APLICACIÓN
-- =============================================================================

/*
RESUMEN DE CUÁNDO APLICAR ESTOS ÍNDICES:

INMEDIATO (No necesario actualmente):
- ❌ Ningún índice requiere aplicación inmediata
- ✅ Performance actual es excelente (<500ms promedio)

CORTO PLAZO (3-6 meses):
- idx_segmento_optimized_promedio: Cuando tabla segmento > 10K registros
- idx_resultado_nadador_equipo_optimized: Cuando tabla resultado > 5K registros

MEDIANO PLAZO (6-12 meses):
- idx_resultado_temporal_evolution: Cuando consultas evolución > 100ms
- mv_estadisticas_equipo: Cuando endpoint promedios > 1000ms consistentemente

LARGO PLAZO (12+ meses):
- idx_resultado_performance_monitoring: Si se implementa monitoreo avanzado

MÉTRICAS DE DECISIÓN:
- Monitorear latencia promedio mensualmente
- Aplicar índices solo cuando métricas superen umbrales definidos
- Medir impacto antes/después de cada optimización

NOTA IMPORTANTE:
Los índices adicionales tienen costo de mantenimiento (INSERT/UPDATE/DELETE).
Solo aplicar cuando el beneficio en SELECT supere el costo de mantenimiento.
*/

-- =============================================================================
-- FIN DEL ARCHIVO
-- =============================================================================
