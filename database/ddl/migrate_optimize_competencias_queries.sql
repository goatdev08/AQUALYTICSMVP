-- Migration: Optimize competencias queries
-- 
-- This migration creates additional indexes for better performance
-- on competencia table queries, particularly for date range operations.
-- 
-- Author: Task Master AI - Subtask 15.7
-- Date: 2025-01-23

-- ============================================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- ============================================================================

-- Create composite GIST index for queries that filter by both equipo_id and date ranges
-- This will improve performance for duplicate checks and filtered listings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_competencia_equipo_fechas_gist 
ON competencia USING GIST (equipo_id, rango_fechas);

-- Create partial index for upcoming competitions queries (most common use case)
-- This only indexes competitions that haven't ended yet, making it smaller and faster
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_competencia_proximas_optimized
ON competencia (equipo_id, lower(rango_fechas)) 
WHERE upper(rango_fechas) >= CURRENT_DATE;

-- ============================================================================
-- QUERY PERFORMANCE ANALYSIS
-- ============================================================================

-- Test query performance for próximas competencias (most used endpoint)
-- EXPLAIN (ANALYZE, BUFFERS) 
-- SELECT id, equipo_id, nombre, curso, rango_fechas, sede 
-- FROM competencia 
-- WHERE equipo_id = ? 
--   AND upper(rango_fechas) >= CURRENT_DATE
-- ORDER BY lower(rango_fechas) 
-- LIMIT ?;

-- Test query performance for duplicate detection (used in create/update)
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT id FROM competencia 
-- WHERE equipo_id = ?
--   AND nombre ILIKE ?
--   AND (?::daterange && rango_fechas OR ?::daterange && rango_fechas);

-- ============================================================================
-- EXISTING INDEXES (for reference)
-- ============================================================================
-- 
-- Already exists: idx_competencia_rango_fechas_gist (GIST on rango_fechas)
-- Already exists: idx_competencia_equipo_id (BTREE on equipo_id)  
-- Already exists: idx_competencia_curso (BTREE on curso)
-- 
-- These existing indexes are already providing good performance for:
-- - Date range overlap operations (&&, <@, @>)
-- - Equipo-based filtering 
-- - Course-based filtering
-- 
-- ============================================================================

-- Verify index usage with EXPLAIN ANALYZE on your most common queries
-- Monitor query performance in production and adjust as needed
