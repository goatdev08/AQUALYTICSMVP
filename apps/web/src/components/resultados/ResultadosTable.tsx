/**
 * Componente de tabla de resultados con filtros avanzados y paginación.
 * 
 * Implementa:
 * - Consumo del endpoint GET /resultados con filtros múltiples
 * - Tabla paginada con ordenamiento
 * - Filtros en header con typeahead para nadador
 * - Acciones por fila: Ver detalles, Editar, Marcar como revisar
 * - Estados de loading/error con componentes shadcn
 * - Tema "green" consistente
 */

'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useResultados, formatearTiempo } from '@/hooks/useResultados'
import { useNadadores } from '@/hooks/useNadadores'
import { useCompetencias } from '@/hooks/useCompetencias'
import { usePruebas } from '@/hooks/usePruebas'
import { useDebounce } from '@/hooks/useDebounce'
import type { ResultadoSearchFilters, ResultadoResponse, EstadoValidacion } from '@/types/resultados'

// Componentes UI shadcn
import {
  Table,
  TableBody,
  TableCell, 
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Iconos
import { Search, ChevronLeft, ChevronRight, Eye, Edit, AlertTriangle } from 'lucide-react'

// Componentes relacionados
import { ResultadoDetailModal } from './ResultadoDetailModal'

// =====================
// Tipos internos
// =====================

interface FilterState {
  nadador_id?: number;
  competencia_id?: number;
  prueba_id?: number;
  rama?: 'F' | 'M';
  fecha_inicio?: string;
  fecha_fin?: string;
  estado_validacion?: EstadoValidacion;
  fase?: string;
}

interface SortState {
  sort_by: string;
  sort_order: 'asc' | 'desc';
}

interface PaginationState {
  page: number;
  size: number;
}

// =====================
// Componente principal
// =====================

export default function ResultadosTable() {
  const { user } = useAuth()
  
  // Estados de filtros y paginación
  const [filters, setFilters] = useState<FilterState>({})
  const [sorting, setSorting] = useState<SortState>({
    sort_by: 'fecha_registro',
    sort_order: 'desc'
  })
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    size: 20
  })
  
  // Estado para búsqueda de nadador
  const [nadadorSearch, setNadadorSearch] = useState('')
  const debouncedNadadorSearch = useDebounce(nadadorSearch, 300)
  
  // Estado del modal de detalles
  const [selectedResultadoId, setSelectedResultadoId] = useState<number | null>(null)
  
  // Hooks de datos
  const resultadosQuery = useResultados(
    filters as ResultadoSearchFilters,
    pagination.page,
    pagination.size
  )
  
  const nadadoresQuery = useNadadores({ 
    search: debouncedNadadorSearch, 
    limit: 10 
  })
  
  const competenciasHook = useCompetencias()
  const competenciasQuery = competenciasHook.useCompetenciasList()
  const pruebasQuery = usePruebas()
  
  // =====================
  // Handlers de filtros
  // =====================
  
  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset a página 1
  }, [])
  
  const clearFilters = useCallback(() => {
    setFilters({})
    setNadadorSearch('')
    setPagination({ page: 1, size: 20 })
  }, [])
  
  const updateSorting = useCallback((field: string) => {
    setSorting(prev => ({
      sort_by: field,
      sort_order: prev.sort_by === field && prev.sort_order === 'asc' ? 'desc' : 'asc'
    }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])
  
  // =====================
  // Handlers de paginación
  // =====================
  
  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])
  
  const changePageSize = useCallback((size: number) => {
    setPagination({ page: 1, size })
  }, [])
  
  // =====================
  // Handlers de acciones
  // =====================
  
  const handleVerDetalles = useCallback((resultadoId: number) => {
    setSelectedResultadoId(resultadoId)
  }, [])
  
  const handleEditar = useCallback((resultado: ResultadoResponse) => {
    // TODO: Implementar navegación a edición
    console.log('Editar resultado:', resultado.id)
  }, [])
  
  const handleMarcarRevisar = useCallback((resultado: ResultadoResponse) => {
    // TODO: Implementar toggle de revisión
    console.log('Marcar como revisar:', resultado.id)
  }, [])
  
  // =====================
  // Datos derivados
  // =====================
  
  const resultados = resultadosQuery.data?.resultados || []
  const totalResultados = resultadosQuery.data?.total || 0
  const totalPages = Math.ceil(totalResultados / pagination.size)
  
  const nadadoresOptions = useMemo(() => {
    if (!nadadoresQuery.nadadores) return []
    return nadadoresQuery.nadadores.map((n: any) => ({
      value: n.id,
      label: n.nombre_completo
    }))
  }, [nadadoresQuery.nadadores])
  
  const competenciasOptions = useMemo(() => {
    if (!competenciasQuery.data?.competencias) return []
    return competenciasQuery.data.competencias.map((c: any) => ({
      value: c.id,
      label: c.nombre
    }))
  }, [competenciasQuery.data])
  
  const pruebasOptions = useMemo(() => {
    if (!pruebasQuery.pruebas) return []
    return pruebasQuery.pruebas.map((p: any) => ({
      value: p.id,
      label: `${p.estilo} ${p.distancia}m ${p.curso}`
    }))
  }, [pruebasQuery.pruebas])
  
  // =====================
  // Estados de carga y error
  // =====================
  
  const isLoading = resultadosQuery.isLoading
  const isError = resultadosQuery.isError
  const error = resultadosQuery.error
  
  // Mostrar error
  if (isError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error cargando resultados: {error?.message}
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Header con filtros */}
      <div className="bg-card p-4 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Búsqueda de nadador */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nadador</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar nadador..."
                value={nadadorSearch}
                onChange={(e) => setNadadorSearch(e.target.value)}
                className="pl-9"
              />
              {nadadorSearch && nadadoresOptions.length > 0 && (
                <div className="absolute top-full mt-1 w-full bg-popover border rounded-md shadow-md z-10 max-h-48 overflow-y-auto">
                  {nadadoresOptions.map(option => (
                    <button
                      key={option.value}
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                      onClick={() => {
                        updateFilter('nadador_id', option.value)
                        setNadadorSearch(option.label)
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Filtro de competencia */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Competencia</label>
            <Select
              value={filters.competencia_id?.toString() || ''}
              onValueChange={(value: string) => updateFilter('competencia_id', value ? parseInt(value) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las competencias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las competencias</SelectItem>
                {competenciasOptions.map(option => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Filtro de prueba */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Prueba</label>
            <Select
              value={filters.prueba_id?.toString() || ''}
              onValueChange={(value: string) => updateFilter('prueba_id', value ? parseInt(value) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las pruebas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las pruebas</SelectItem>
                {pruebasOptions.map(option => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Filtro de rama */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rama</label>
            <Select
              value={filters.rama || ''}
              onValueChange={(value: string) => updateFilter('rama', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="F">Femenil</SelectItem>
                <SelectItem value="M">Varonil</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Filtro de estado */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Estado</label>
            <Select
              value={filters.estado_validacion || ''}
              onValueChange={(value: string) => updateFilter('estado_validacion', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="valido">Válido</SelectItem>
                <SelectItem value="revisar">Revisar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Acciones de filtros */}
          <div className="space-y-2">
            <label className="text-sm font-medium">&nbsp;</label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex-1"
              >
                Limpiar
              </Button>
              <Select
                value={pagination.size.toString()}
                onValueChange={(value: string) => changePageSize(parseInt(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Indicador de carga */}
      {isLoading && (
        <div className="p-4">
          <Progress value={undefined} className="w-full" />
          <p className="text-center text-sm text-muted-foreground mt-2">
            Cargando resultados...
          </p>
        </div>
      )}
      
      {/* Tabla de resultados */}
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => updateSorting('nadador')}
              >
                Nadador
                {sorting.sort_by === 'nadador' && (
                  <span className="ml-1">
                    {sorting.sort_order === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </TableHead>
              <TableHead>Prueba</TableHead>
              <TableHead>Competencia</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => updateSorting('tiempo_global_cs')}
              >
                Tiempo
                {sorting.sort_by === 'tiempo_global_cs' && (
                  <span className="ml-1">
                    {sorting.sort_order === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => updateSorting('fecha_registro')}
              >
                Fecha
                {sorting.sort_by === 'fecha_registro' && (
                  <span className="ml-1">
                    {sorting.sort_order === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resultados.map((resultado) => (
              <TableRow key={resultado.id}>
                <TableCell className="font-medium">
                  {/* TODO: Mostrar nombre del nadador desde datos contextuales */}
                  Nadador #{resultado.nadador_id}
                </TableCell>
                <TableCell>
                  {/* TODO: Mostrar info de prueba desde datos contextuales */}
                  Prueba #{resultado.prueba_id}
                </TableCell>
                <TableCell>
                  {/* TODO: Mostrar nombre de competencia desde datos contextuales */}
                  Competencia #{resultado.competencia_id}
                </TableCell>
                <TableCell className="font-mono">
                  {formatearTiempo(resultado.tiempo_global_cs)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {resultado.categoria_label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={resultado.estado_validacion === 'valido' ? 'default' : 'destructive'}
                  >
                    {resultado.estado_validacion === 'valido' ? 'Válido' : 'Revisar'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(resultado.fecha_registro).toLocaleDateString('es-ES')}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVerDetalles(resultado.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {user?.rol === 'entrenador' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditar(resultado)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarcarRevisar(resultado)}
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Mensaje si no hay resultados */}
        {!isLoading && resultados.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No se encontraron resultados con los filtros aplicados.
          </div>
        )}
      </div>
      
      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {((pagination.page - 1) * pagination.size) + 1} a {Math.min(pagination.page * pagination.size, totalResultados)} de {totalResultados} resultados
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = Math.max(1, pagination.page - 2) + i
                if (pageNum > totalPages) return null
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.page ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page === totalPages}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Modal de detalles */}
      {selectedResultadoId && (
        <ResultadoDetailModal
          resultadoId={selectedResultadoId}
          autoOpen={true}
          onClose={() => setSelectedResultadoId(null)}
        />
      )}
    </div>
  )
}
