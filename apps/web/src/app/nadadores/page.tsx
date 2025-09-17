"use client";

/**
 * Página de Nadadores - Lista completa con filtros y búsqueda
 * 
 * Funcionalidades:
 * - Lista paginada de nadadores del equipo
 * - Búsqueda trigram en tiempo real (debounced)
 * - Filtros por rama (F/M) y categoría
 * - Acciones CRUD con RBAC (solo entrenadores crean/editan)
 * - DataTable responsive con estados de carga
 * - Resumen estadístico del equipo
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useNadadores } from '@/hooks/useNadadores';
import { 
  Button,  
  Alert, 
  AlertDescription,
  Progress,
  Checkbox
} from '@/components/ui';
import { ProtectedRoute, RoleGuard } from '@/components/auth';
import { AppLayout } from '@/components/layout';
import { NadadorSelector } from '@/components/nadadores';

// ============================================================================
// COMPONENTES DE FILTROS
// ============================================================================

interface FilterPanelProps {
  rama: 'F' | 'M' | '' | undefined;
  onRamaChange: (value: 'F' | 'M' | '' | undefined) => void;
  categoria: '11-12' | '13-14' | '15-16' | '17+' | '';
  onCategoriaChange: (value: '11-12' | '13-14' | '15-16' | '17+' | '') => void;
  isLoading?: boolean;
}

function FilterPanel({ 
  rama, 
  onRamaChange, 
  categoria, 
  onCategoriaChange,
  isLoading 
}: FilterPanelProps) {
  return (
    <div className="bg-card p-6 rounded-lg border shadow-sm space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Filtros de búsqueda</h3>
      
      {/* Búsqueda por nombre */}
      <div className="space-y-2">
        <label htmlFor="search" className="block text-sm font-medium text-foreground">
          Buscar por nombre
        </label>
        <NadadorSelector
          value={null} 
          onSelect={(nadador) => {
            if (nadador) {
              // Navegar al perfil seleccionado
              window.location.href = `/nadadores/${nadador.id}`;
            }
          }}
          placeholder="Buscar nadador instantáneo..."
          className="w-full"
          initialFilters={{ rama: rama as 'F' | 'M' | undefined, categoria: categoria as '11-12' | '13-14' | '15-16' | '17+' | undefined }}
          showFilters={false}
        />
        <p className="text-xs text-muted-foreground">
          Búsqueda inteligente instantánea desde el primer carácter.
        </p>
      </div>

      {/* Filtro por rama */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">
          Filtrar por rama
        </label>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center space-x-2">
            <Checkbox
              checked={rama === undefined}
              onCheckedChange={() => onRamaChange(undefined)}
              disabled={isLoading}
            />
            <span className="text-sm">Todas</span>
          </label>
          <label className="flex items-center space-x-2">
            <Checkbox
              checked={rama === 'F'}
              onCheckedChange={() => onRamaChange(rama === 'F' ? undefined : 'F')}
              disabled={isLoading}
            />
            <span className="text-sm">Femenino</span>
          </label>
          <label className="flex items-center space-x-2">
            <Checkbox
              checked={rama === 'M'}
              onCheckedChange={() => onRamaChange(rama === 'M' ? undefined : 'M')}
              disabled={isLoading}
            />
            <span className="text-sm">Masculino</span>
          </label>
        </div>
      </div>

      {/* Filtro por categoría */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">
          Filtrar por categoría
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: '' as const, label: 'Todas las categorías' },
            { value: '11-12' as const, label: 'Infantil A (11-12)' },
            { value: '13-14' as const, label: 'Infantil B (13-14)' },
            { value: '15-16' as const, label: 'Juvenil (15-16)' },
            { value: '17+' as const, label: 'Mayor (17+)' }
          ].map((option) => (
            <label key={option.value} className="flex items-center space-x-2">
              <Checkbox
                checked={categoria === option.value}
                onCheckedChange={() => onCategoriaChange(option.value as '11-12' | '13-14' | '15-16' | '17+' | '')}
                disabled={isLoading}
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE DE RESUMEN ESTADÍSTICO
// ============================================================================

interface SummaryCardProps {
  summary: {
    total: number;
    femeninos: number;
    masculinos: number;
    por_categoria: Record<string, number>;
  } | null;
  isLoading?: boolean;
}

function SummaryCard({ summary, isLoading }: SummaryCardProps) {
  if (isLoading) {
    return (
      <div className="bg-card p-6 rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4">Resumen del equipo</h3>
        <Progress value={50} className="w-full" />
        <p className="text-sm text-muted-foreground mt-2">Cargando estadísticas...</p>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="bg-card p-6 rounded-lg border shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-4">Resumen del equipo</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{summary.total}</div>
          <div className="text-sm text-muted-foreground">Total nadadores</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {summary.femeninos + summary.masculinos}
          </div>
          <div className="text-sm text-muted-foreground">Activos</div>
        </div>
      </div>

      {/* Distribución por rama */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-foreground mb-2">Por rama</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Femenino</span>
            <span className="text-sm font-medium">{summary.femeninos}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Masculino</span>
            <span className="text-sm font-medium">{summary.masculinos}</span>
          </div>
        </div>
      </div>

      {/* Distribución por categoría */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-2">Por categoría</h4>
        <div className="space-y-2">
          {Object.entries(summary.por_categoria).map(([cat, count]) => (
            <div key={cat} className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{cat} años</span>
              <span className="text-sm font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TABLA DE NADADORES
// ============================================================================

interface NadadoresTableProps {
  nadadores: Array<{
    id: number;
    nombre_completo: string;
    fecha_nacimiento: string;
    rama: 'F' | 'M';
    peso?: number;
    edad_actual: number;
    categoria_actual: string;
  }>;
  isLoading?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onViewProfile?: (id: number) => void;
}

function NadadoresTable({ 
  nadadores, 
  isLoading, 
  canEdit, 
  canDelete, 
  onEdit, 
  onDelete, 
  onViewProfile 
}: NadadoresTableProps) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border shadow-sm">
        <div className="p-6">
          <Progress value={33} className="w-full" />
          <p className="text-center text-muted-foreground mt-4">Cargando nadadores...</p>
        </div>
      </div>
    );
  }

  if (nadadores.length === 0) {
    return (
      <div className="bg-card rounded-lg border shadow-sm">
        <div className="p-12 text-center">
          <div className="text-gray-400 text-lg mb-2">🏊‍♀️</div>
          <h3 className="text-lg font-medium text-foreground mb-1">No hay nadadores</h3>
          <p className="text-muted-foreground">
            No se encontraron nadadores que coincidan con los filtros aplicados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Edad / Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Rama
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Peso
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-gray-200">
            {nadadores.map((nadador) => (
              <tr key={nadador.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-foreground">
                    {nadador.nombre_completo}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ID: {nadador.id}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-foreground">
                    {nadador.edad_actual} años
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Cat: {nadador.categoria_actual}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    nadador.rama === 'F' 
                      ? 'bg-pink-100 text-pink-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {nadador.rama === 'F' ? 'Femenino' : 'Masculino'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  {nadador.peso ? `${nadador.peso} kg` : '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewProfile?.(nadador.id)}
                  >
                    Ver perfil
                  </Button>
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit?.(nadador.id)}
                    >
                      Editar
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete?.(nadador.id)}
                    >
                      Eliminar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function NadadoresPage() {
  const router = useRouter();
  
  // Estados locales para filtros
  const [rama, setRama] = useState<'F' | 'M' | '' | undefined>(undefined);
  const [categoria, setCategoria] = useState<'11-12' | '13-14' | '15-16' | '17+' | ''>('');
  const [currentPage, setCurrentPage] = useState(0);
  
  // Configuración de filtros para la query
  const filters = useMemo(() => ({
    rama: rama || undefined,
    categoria: categoria || undefined as '11-12' | '13-14' | '15-16' | '17+' | undefined,
    limit: 20,
    offset: currentPage * 20,
  }), [rama, categoria, currentPage]);

  // Hook de nadadores con filtros
  const { 
    nadadores, 
    total, 
    hasMore, 
    isLoading, 
    isError, 
    error, 
    summary,
    permissions,
    mutations 
  } = useNadadores(filters);

  // Reset página cuando cambian filtros
  useEffect(() => {
    setCurrentPage(0);
  }, [rama, categoria]);

  // Manejadores de eventos
  const handleEdit = (id: number) => {
    router.push(`/nadadores/${id}/editar`);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este nadador?')) return;
    
    try {
      await mutations.delete.mutateAsync(id);
    } catch (err) {
      console.error('Error al eliminar nadador:', err);
    }
  };

  const handleViewProfile = (id: number) => {
    router.push(`/nadadores/${id}`);
  };

  const handleCreateNew = () => {
    router.push('/nadadores/nuevo');
  };

  // Manejo de paginación
  const handleNextPage = () => {
    if (hasMore) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 0) setCurrentPage(prev => prev - 1);
  };

  return (
    <ProtectedRoute>
      <AppLayout 
        title="Nadadores" 
        description="Gestiona los nadadores de tu equipo con búsqueda avanzada y filtros"
      >
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          
          {/* Action buttons */}
          <div className="flex justify-end mb-6">
            <RoleGuard allowedRoles={['entrenador']}>
              <Button onClick={handleCreateNew}>
                Agregar nadador
              </Button>
            </RoleGuard>
          </div>

          {/* Error handling */}
          {isError && (
            <Alert className="mb-6">
              <AlertDescription>
                Error al cargar nadadores: {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Panel lateral con filtros y resumen */}
            <div className="lg:col-span-1 space-y-6">
              <FilterPanel
                rama={rama}
                onRamaChange={setRama}
                categoria={categoria}
                onCategoriaChange={setCategoria}
                isLoading={isLoading}
              />
              
              <SummaryCard 
                summary={summary} 
                isLoading={isLoading} 
              />
            </div>

            {/* Contenido principal */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Información de resultados */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {!isLoading && (
                    <span>
                      Mostrando {nadadores.length} de {total} nadadores
                    </span>
                  )}
                </div>
                
                {/* Indicador de carga en tiempo real */}
                {isLoading && (
                  <div className="flex items-center space-x-2">
                    <Progress value={66} className="w-24" />
                    <span className="text-sm text-muted-foreground">Buscando...</span>
                  </div>
                )}
              </div>

              {/* Tabla de nadadores */}
              <NadadoresTable
                nadadores={nadadores}
                isLoading={isLoading}
                canEdit={permissions.canEdit}
                canDelete={permissions.canDelete}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewProfile={handleViewProfile}
              />

              {/* Paginación */}
              {(total > 20) && (
                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                  >
                    Anterior
                  </Button>
                  
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage + 1} de {Math.ceil(total / 20)}
                  </span>
                  
                  <Button
                    variant="outline"
                    onClick={handleNextPage}
                    disabled={!hasMore}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
