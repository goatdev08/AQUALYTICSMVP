'use client';

/**
 * Página de Listado de Resultados - AquaLytics
 * 
 * Página principal para visualizar y filtrar resultados con:
 * - Integración completa con AppLayout
 * - Tabla de resultados con filtros avanzados persistentes
 * - Paginación y ordenamiento optimizados  
 * - Estados de loading/error elegantes
 * - Tema verde consistente
 */

import { ProtectedRoute } from '@/components/auth';
import { AppLayout } from '@/components/layout';
import ResultadosTable from '@/components/resultados/ResultadosTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Table2, Filter, BarChart3, Search } from 'lucide-react';

function ResultadosContent() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header descriptivo */}
      <div className="space-y-2 pb-2">
        <h2 className="text-lg font-medium text-muted-foreground">
          Listado de Resultados
        </h2>
        <p className="text-sm text-muted-foreground/80">
          Explora, filtra y analiza todos los resultados de competencias
        </p>
      </div>

      {/* Funcionalidades destacadas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Search className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Búsqueda Avanzada</p>
            <p className="text-xs text-muted-foreground">Por nadador, competencia</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
          <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Filtros Persistentes</p>
            <p className="text-xs text-muted-foreground">Mantiene preferencias</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
          <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
            <Table2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Ordenamiento</p>
            <p className="text-xs text-muted-foreground">Por tiempo, fecha, nadador</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800">
          <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Análisis Rápido</p>
            <p className="text-xs text-muted-foreground">Ver detalles, editar</p>
          </div>
        </div>
      </div>

      {/* Tabla principal en card */}
      <Card className="rounded-xl shadow-sm border border-border/50">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Table2 className="h-5 w-5 text-primary" />
            Resultados de Competencias
          </CardTitle>
          <CardDescription className="text-sm">
            Visualiza, filtra y gestiona todos los resultados registrados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative">
            <ResultadosTable />
          </div>
        </CardContent>
      </Card>

      {/* Instrucciones rápidas */}
      <Card className="rounded-xl shadow-sm border-dashed border-2 border-muted-foreground/20 bg-muted/20">
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">💡 Consejos de Uso</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="space-y-2">
                <p><strong>🔍 Búsqueda:</strong> Escribe el nombre del nadador para filtrar en tiempo real</p>
                <p><strong>📊 Ordenamiento:</strong> Haz click en los headers para ordenar por columna</p>
              </div>
              <div className="space-y-2">
                <p><strong>⚙️ Filtros:</strong> Usa los selectores para filtrar por competencia, prueba, rama</p>
                <p><strong>👁️ Detalles:</strong> Click en "Ver detalles" para análisis completo con segmentos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResultadosPage() {
  return (
    <ProtectedRoute>
      <AppLayout 
        title="Resultados" 
        description="Listado completo con filtros avanzados y análisis"
      >
        <ResultadosContent />
      </AppLayout>
    </ProtectedRoute>
  );
}
